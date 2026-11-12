# CLAUDE.md — Panduan Kerja untuk Claude Code

File ini dibaca otomatis oleh Claude Code di setiap sesi. Isinya adalah konteks proyek, perintah, konvensi, dan aturan yang **wajib** diikuti saat menulis kode VennBuster.

## 1. Konteks Proyek

**VennBuster** adalah aplikasi web + PWA interaktif untuk materi **Himpunan dan Diagram Venn (SMP Kelas VII)** yang bertujuan menumbuhkembangkan **literasi matematika**. Aplikasi dirancang dari hasil wawancara analisis beban kognitif siswa dan mengintegrasikan instrumen pretest–posttest literasi (4 soal, skor maks 24).

Baca sebelum mengerjakan fitur:
- `PRD.md` — kebutuhan dan prioritas (P0/P1/P2)
- `docs/RANCANGAN_FITUR.md` — spesifikasi teknis (geometri Venn, animasi, API, skor)
- `docs/STRUKTUR_FOLDER.md` — letak file

## 2. Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | React 19 + Vite, **JavaScript (bukan TypeScript)**, JSX, JSDoc untuk tipe penting |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), token warna CSS di `src/styles/index.css` |
| Animasi | Framer Motion, paket `motion` (`import { motion, AnimatePresence, MotionConfig } from "motion/react"`) |
| State | Zustand (global ringan), state lokal React |
| Rute | React Router |
| Offline | `vite-plugin-pwa` (Workbox) + Zustand `persist` (localStorage) — bisa ditingkatkan ke Dexie/IndexedDB bila data membesar |
| Uji | Vitest + React Testing Library; Playwright (E2E, opsional) |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2, Pydantic v2, Alembic, pytest |
| Analisis | pandas, scipy, openpyxl |

> Periksa versi terbaru saat inisialisasi. Jika API pustaka berbeda dari catatan ini, ikuti dokumentasi resmi lalu perbarui file ini.

## 3. Perintah

```bash
# Frontend
cd frontend
npm install
npm run dev          # server dev (http://localhost:5173)
npm run build        # build produksi + service worker
npm run preview      # uji PWA hasil build (SW hanya aktif di build/preview)
npm run test         # Vitest


# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest

# Analisis
cd analysis && python ngain.py data/rekap.csv
```

## 4. Konvensi Kode

- **Bahasa**: teks UI dalam **Bahasa Indonesia** yang ramah siswa SMP (kalimat pendek, sapaan "kamu"). Nama variabel/fungsi/komponen dalam **bahasa Inggris**. Komentar boleh Bahasa Indonesia.
- Komponen: `PascalCase.jsx`, satu komponen utama per file, *function component* + hooks.
- Logika murni (geometri, ekspresi himpunan, skor, tokenizer kata kunci) diletakkan di `features/*/lib/` **tanpa import React**, dan wajib disertai unit test.
- Import memakai alias `@/` → `src/`.
- Konten (soal, modul, kata kunci, simbol) berbentuk **data JSON** di `src/data/`. Jangan menulis teks soal langsung di JSX.
- Tailwind untuk tata letak; warna daerah Venn **hanya** dari token `--venn-*`.
- Notasi matematika memakai karakter Unicode: `∩ ∪ ᶜ − ∈ ∉ ⊂ ∅`. Gunakan `−` (minus), bukan tanda hubung, pada notasi.
- Python: format dengan `ruff`, *type hints* di semua fungsi publik.

## 5. Aturan Wajib (Jangan Dilanggar)

1. **Isi instrumen tidak boleh diubah.** Teks soal, tahapan, dan skor di `backend/app/data/instrumen_literasi.json` berasal dari instrumen penelitian yang sudah divalidasi. Jangan memparafrasekan, "memperbaiki", atau mengubah angkanya. Bagian bertanda `"needs_confirmation"` menunggu keputusan peneliti, jadi jangan menebak nilainya.
2. **Mode ujian mematikan semua scaffold.** Jika `mode === 'exam'`: tidak ada penyorot kata kunci, tidak ada Cek Total, tidak ada umpan balik benar/salah, tidak ada petunjuk, dan tidak ada tebakan ekspresi. Aturan ini wajib ditegakkan oleh `examGuard.js` dan diuji.
3. **Kunci jawaban tidak masuk bundle produksi.** Frontend hanya memuat `instrumen_literasi.public.json`. Skor resmi dihitung di backend.
4. **Daerah Venn = `<path>` terpisah** (lihat RANCANGAN_FITUR §2.2). Jangan menggambar irisan dengan lingkaran transparan bertumpuk.
5. **Warna bukan satu-satunya penanda.** Setiap daerah punya pola/label teks, dan setiap simbol ∩/∪ selalu disertai kata "irisan"/"gabungan".
6. **Jawaban siswa tidak boleh hilang.** Autosave ke IndexedDB setiap perubahan tahap, sinkronkan lewat `syncQueue`, dan jangan memuat ulang service worker saat tes berlangsung.
7. **Privasi siswa (di bawah umur).** Jangan menambah field data pribadi selain nama/NIS/kode kelas. Jangan memasang analitik pihak ketiga.

## 6. Aturan Animasi (Framer Motion / CSS)

Prinsipnya: **animasi bermakna**. Setiap animasi harus membantu siswa memahami perubahan daerah atau perhitungan. Animasi tidak boleh menjadi dekorasi yang menambah beban ekstraneus.

- Bungkus aplikasi dengan `<MotionConfig reducedMotion="user">` dan sediakan toggle "Kurangi animasi" di Pengaturan.
- Hanya animasikan `transform`, `opacity`, `fill`, dan `stroke` (aman untuk 60 fps di HP low-end).
- Gunakan konfigurasi bersama dari `src/features/venn/lib/motion.js`:
  ```js
  export const regionSpring = { type: 'spring', stiffness: 260, damping: 24 };
  export const flowStagger  = { staggerChildren: 0.08 };
  export const quick        = { duration: 0.2 };
  ```
- Transisi operasi (∩ → ∪, dsb.) memakai **stagger berurutan** A saja → irisan → B saja, bukan pergantian serentak.
- Umpan balik ≤ 300 ms. Jangan ada animasi berulang tanpa henti di layar tugas.
- Arsiran memakai `<pattern>` SVG + `strokeDashoffset` agar terlihat "diarsir".

## 7. Interactive Highlighting — Ringkasan Implementasi

- Daerah diidentifikasi dengan **bitmask** (A=1, B=2, C=4). Operasi adalah predikat `mask => boolean` di `expression.js`.
- `VennRegion` = `motion.path` dengan `role="button"`, `tabIndex=0`, `aria-pressed`, `aria-label` (mis. "Daerah A irisan B, 5 anggota").
- Pemilihan daerah disimpan di `useVennState` (`selectedMasks: number[]`). Warna diturunkan dari state, bukan disetel manual per elemen.
- `onRegionSelect` mendukung *linked highlighting* dua arah dengan `StoryPanel` (kata kunci ⇄ daerah).

## 8. Definition of Done (setiap fitur)

- [ ] Sesuai spesifikasi di `docs/RANCANGAN_FITUR.md` dan prioritas di `PRD.md`
- [ ] Unit test untuk logika di `lib/` lulus; `npm run test` & `pytest` hijau
- [ ] Dicek pada lebar 360 px (HP) dan 1280 px (desktop)
- [ ] Dapat dioperasikan dengan keyboard; label ARIA ada; kontras AA
- [ ] Berfungsi saat offline (uji dengan `npm run preview` + DevTools → Offline)
- [ ] Mode reduced-motion diuji
- [ ] Tidak ada scaffold yang bocor ke mode ujian
- [ ] Teks UI berbahasa Indonesia, tanpa salah ketik notasi

## 9. Urutan Pengerjaan yang Disarankan

1. Fondasi: Vite + React + Tailwind + Motion + Router + PWA dasar.
2. `features/venn/lib` (geometry, regions, expression) + test.
3. `VennCanvas` + `VennRegion` + Interactive Highlighting + `OperationBar`.
4. Mode Arsir, Baki Semesta, Cek Total.
5. `story-reader` (kata kunci + segmenting).
6. `assessment` (mode ujian, StageForm, autosave Dexie).
7. Modul belajar 1–6 (renderer JSON).
8. Backend FastAPI + sinkronisasi + dasbor guru + ekspor.
9. Skrip `analysis/` (N-gain, uji statistik).

Kerjakan **satu langkah per sesi/PR**, jalankan test, lalu laporkan apa yang berubah.
