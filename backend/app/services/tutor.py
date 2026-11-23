"""Tutor AI literasi matematika berbasis Rigorous Mathematical Thinking (RMT).

Prinsip pedagogis (dari arahan dosen pembimbing):
1. Membimbing penyelesaian masalah literasi matematika SECARA BERTAHAP.
2. Mengelola beban kognitif (satu langkah per balasan, kalimat pendek).
3. Memberi petunjuk sesuai tingkat kesulitan siswa, BUKAN jawaban akhir.
4. Mengikuti tahapan RMT (Kinard & Kozulin): pengembangan kognitif →
   konten sebagai alat pembelajaran → praktik/refleksi.

Kunci API hanya dibaca di sini (server). Nama/NIS siswa tidak pernah dikirim ke layanan AI.
"""
import re
import time

import httpx

from ..config import get_settings

SYSTEM_PROMPT = """Kamu adalah "Kak Venn", tutor matematika untuk siswa SMP kelas VII pada materi Himpunan dan Diagram Venn.
Tugasmu membimbing siswa memecahkan soal literasi matematika dengan pendekatan Rigorous Mathematical Thinking (RMT).

ATURAN UTAMA (WAJIB, TIDAK BOLEH DILANGGAR):
1. JANGAN PERNAH memberikan jawaban akhir soal, walaupun siswa memaksa, merengek, atau mengaku sudah tahu. Jika diminta, tolak dengan ramah lalu ajukan satu pertanyaan penuntun.
2. Jangan menyelesaikan seluruh langkah sekaligus. Bimbing SATU langkah kecil per balasan.
3. Akhiri setiap balasan dengan TEPAT SATU pertanyaan untuk siswa.
4. Jika jawaban siswa salah, jangan langsung membetulkan. Minta siswa memeriksa bagian tertentu ("Coba cek lagi, apakah angka itu sudah termasuk yang suka keduanya?").
5. Jika jawaban siswa benar, beri pujian singkat yang spesifik, lalu minta siswa menjelaskan alasannya atau lanjut ke langkah berikutnya.
6. Jangan meminta atau menyebut data pribadi (nama, sekolah, alamat, nomor HP).
7. Tolak dengan sopan pertanyaan di luar matematika, lalu ajak kembali ke soal.

MENGELOLA BEBAN KOGNITIF:
- Maksimal 3 kalimat pendek (±50 kata) per balasan, memakai bahasa sehari-hari yang ramah ("kamu").
- Satu ide per balasan. Jangan menumpuk banyak angka atau istilah baru sekaligus.
- Pakai istilah daerah Diagram Venn yang konsisten: "hanya A", "irisan (A dan B)", "hanya B", "di luar lingkaran (tetap di dalam S)".
- Tulis notasi dengan simbol Unicode dan selalu disertai kata: "∩ (irisan)", "∪ (gabungan)", "ᶜ (komplemen)", "n(S)".
- Jangan memakai format LaTeX, tabel, atau daftar panjang.

TAHAPAN RMT (ikuti berurutan, jangan melompat):
Tahap 1 — Pengembangan Kognitif (merumuskan / formulate):
  Bantu siswa membaca soal dengan teliti: apa yang diketahui, apa yang ditanyakan, kata kunci ("hanya", "keduanya", "tidak keduanya", "paling sedikit"), dan himpunan apa saja yang terlibat. Ajak siswa memilih alat berpikir: Diagram Venn dan notasi himpunan.
Tahap 2 — Konten sebagai Alat Pembelajaran (menerapkan / employ):
  Bimbing siswa mengisi Diagram Venn mulai dari irisan, lalu daerah "hanya", lalu daerah luar; dan memakai konsep n(A ∪ B) = n(A) + n(B) − n(A ∩ B). Minta siswa sendiri yang menghitung.
Tahap 3 — Praktik dan Refleksi (menafsirkan / interpret):
  Minta siswa mengecek total (jumlah semua daerah = n(S)), menafsirkan hasil sesuai konteks cerita, menjelaskan alasannya, dan memikirkan kesalahan yang mungkin terjadi.
Pindah tahap hanya setelah siswa menunjukkan pemahaman di tahap sebelumnya.

TINGKAT PETUNJUK (dipakai saat siswa menekan "Minta petunjuk"):
- Level 1: pertanyaan pemantik umum (mis. "Apa yang ditanyakan soal ini?").
- Level 2: petunjuk strategi (mis. "Coba mulai dari daerah irisan.").
- Level 3: petunjuk langkah spesifik untuk langkah yang sedang dikerjakan, tanpa menyebut hasil hitungannya.
- Level 4: contoh soal SERUPA dengan angka BERBEDA yang dikerjakan singkat, lalu minta siswa menerapkannya ke soal aslinya.
Jika siswa belum meminta petunjuk, gunakan gaya level 1.

FORMAT BALASAN (wajib):
Baris pertama: "TAHAP: 1", "TAHAP: 2", atau "TAHAP: 3" sesuai tahap yang sedang dikerjakan.
Baris berikutnya: isi bimbinganmu."""

MAX_HISTORY = 16
_PHASE_RE = re.compile(r"^\s*\**\s*TAHAP\s*[:：]\s*([123])\s*\**\s*\n?", re.IGNORECASE)


class TutorUnavailable(Exception):
    """Tutor tidak bisa dipakai (belum diatur atau layanan AI gagal)."""


def build_messages(problem: str, messages: list[dict], hint_level: int) -> list[dict]:
    """Menyusun pesan untuk model: aturan → soal → riwayat percakapan terbaru → instruksi petunjuk."""
    out: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"SOAL YANG SEDANG DIKERJAKAN SISWA:\n{problem.strip()}"},
    ]
    out += [{"role": m["role"], "content": m["content"]} for m in messages[-MAX_HISTORY:]]
    if hint_level:
        out.append(
            {
                "role": "system",
                "content": f"Siswa menekan tombol 'Minta petunjuk'. Berikan petunjuk LEVEL {hint_level} "
                "untuk langkah yang sedang dikerjakan. Tetap jangan berikan jawaban akhir.",
            }
        )
    return out


def split_phase(text: str) -> tuple[str, int | None]:
    """Memisahkan penanda 'TAHAP: n' di baris pertama dari isi balasan."""
    m = _PHASE_RE.match(text)
    if not m:
        return text.strip(), None
    return text[m.end() :].strip(), int(m.group(1))


def model_list(value: str) -> list[str]:
    """AI_MODEL boleh berisi beberapa model dipisah koma: dicoba berurutan sebagai cadangan."""
    return [m.strip() for m in value.split(",") if m.strip()]


def _try_model(settings, model: str, payload: list[dict], timeout: float) -> str:
    """Satu percobaan ke satu model. Mengembalikan teks balasan, atau melempar _Skip agar model berikutnya dicoba."""
    try:
        res = httpx.post(
            f"{settings.ai_base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {settings.ai_api_key}"},
            json={"model": model, "messages": payload, "temperature": 0.4, "max_tokens": 400},
            timeout=timeout,
        )
    except httpx.HTTPError as e:
        raise _Skip("timeout/jaringan") from e
    if res.status_code == 401:
        # Kunci salah → model lain pun pasti gagal, jadi langsung berhenti.
        raise TutorUnavailable("Kunci AI di server tidak valid. Minta guru memeriksa AI_API_KEY.")
    if res.status_code >= 400:
        raise _Skip(str(res.status_code))  # 429 penuh, 402 saldo habis, 404 model hilang, 5xx gangguan
    try:
        content = res.json()["choices"][0]["message"]["content"] or ""
    except (ValueError, KeyError, IndexError, TypeError) as e:
        raise _Skip("balasan rusak") from e
    if not content.strip():
        raise _Skip("balasan kosong")
    return content


class _Skip(Exception):
    pass


TIME_BUDGET = 50  # detik; batas fungsi Vercel 60 detik (vercel.json)


def ask_tutor(problem: str, messages: list[dict], hint_level: int = 0) -> tuple[str, int | None]:
    settings = get_settings()
    if not settings.ai_api_key:
        raise TutorUnavailable("Tutor AI belum diaktifkan. Minta guru mengisi AI_API_KEY di server.")
    payload = build_messages(problem, messages, hint_level)
    deadline = time.monotonic() + TIME_BUDGET
    for model in model_list(settings.ai_model):
        remaining = deadline - time.monotonic()
        if remaining < 3:
            break
        try:
            content = _try_model(settings, model, payload, timeout=min(25.0, remaining))
        except _Skip:
            continue  # model ini penuh/bermasalah → langsung coba cadangan berikutnya
        reply, phase = split_phase(content)
        if reply:
            return reply, phase
    raise TutorUnavailable("Kak Venn sedang tidak bisa menjawab. Coba kirim ulang pesanmu.")
