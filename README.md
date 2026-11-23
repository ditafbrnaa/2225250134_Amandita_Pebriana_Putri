# VennBuster

Aplikasi web + PWA interaktif untuk materi **Himpunan dan Diagram Venn (SMP)**, dirancang dari analisis beban kognitif siswa dan terintegrasi dengan instrumen pretest–posttest literasi matematika.

Akses langsung ke aplikasi: https://2225250134-amandita-pebriana-putri.vercel.app/

Versi online memakai backend di Vercel + Postgres (Neon): data siswa dan jawaban tes langsung tersimpan dan bisa dilihat di *Profil → Halaman guru* (satu tabel rekap semua siswa) tanpa deploy ulang. Siswa masuk cukup dengan nama, tanpa kode kelas. Cara menyiapkannya ada di bagian **3b**.
```
vennbuster/
├── frontend/   React + Vite + Tailwind v4 + Framer Motion (PWA)
├── backend/    FastAPI (SQLite di lokal, Postgres di Vercel) untuk kelas sungguhan & dasbor guru
├── api/        Pintu masuk fungsi serverless Vercel → backend/
├── analysis/   Skrip Python N-gain & uji statistik
└── docs/       PRD, rancangan fitur, struktur folder
```

## 1. Persiapan (sekali saja)

Pasang **Node.js 20+** (https://nodejs.org) dan **Python 3.11+** (https://python.org), lalu buka folder `vennbuster` di VS Code.

## 2. Menjalankan frontend (cukup ini untuk mencoba aplikasi)

```bash
cd frontend
npm install
cp .env.example .env        # Windows (PowerShell): copy .env.example .env
npm run dev
```

Buka http://localhost:5173. Tanpa backend, aplikasi berjalan dalam **mode demo/offline**: data tersimpan di browser dan skor pretest/posttest dihitung di perangkat.

- **Coba di HP (satu Wi-Fi):** jalankan `npm run dev`, lalu buka alamat `Network: http://192.168.x.x:5173` yang muncul di terminal.
- **Coba fitur PWA (install & offline):** `npm run build` lalu `npm run preview`. Service worker hanya aktif di hasil build. Fitur install di HP memerlukan **HTTPS**, jadi untuk uji di HP sungguhan, unggah folder `frontend/dist` ke Netlify/Vercel (gratis).
- **Uji coba cepat semua modul:** buka *Profil → Buka semua modul & posttest (mode demo)*.

```bash
npm run test               # 41 unit test: geometri Venn, ekspresi himpunan, kata kunci, skor, konten modul
npm run sync-instrument    # jalankan setiap kali backend/app/data/instrumen_literasi.json diubah
```

## 3. Menjalankan backend (untuk kelas sungguhan + Dasbor Guru)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # ganti SECRET_KEY dan TEACHER_PIN
uvicorn app.main:app --reload --port 8000
pytest                     # test penilaian + alur API lengkap
```

Dokumentasi API otomatis: http://localhost:8000/docs

Lalu hubungkan frontend: di `frontend/.env` isi `VITE_API_URL=http://localhost:8000`, dan untuk penelitian set `VITE_DEMO_MODE=false` agar **kunci jawaban tidak ikut terkirim ke HP siswa**. Jalankan ulang `npm run dev`.

### Alur pemakaian

**Dengan backend** (`VITE_API_URL` diisi):

1. Guru membuka menu *Profil* → **Halaman guru**, lalu masuk dengan `TEACHER_PIN`.
2. Siswa membuka aplikasi, menekan **Masuk**, lalu mengisi nama lengkap dan NIS/No. absen (opsional). Tidak ada kode kelas. Nama + NIS yang sama dianggap siswa yang sama.
3. Urutan belajar siswa: **Pretest → Modul 1–6 (berurutan) → Posttest**. Modul terbuka setelah pretest selesai, dan posttest terbuka setelah semua modul selesai.
4. Setelah PIN benar, *Dasbor Guru* langsung menampilkan **Rekap semua siswa** (satu tabel global: skor pre/post, N-gain, status) dan tombol unduh CSV seluruh jawaban. Tab **Penilaian uraian** dipakai untuk menilai tahap uraian.

**Tanpa backend** (mode demo, `VITE_API_URL` kosong): tombol *Halaman guru* tidak muncul. Siswa tetap masuk dengan nama, tetapi data hanya tersimpan di perangkat masing-masing. Skor pretest/posttest dihitung di perangkat dan tidak ada dasbor guru atau ekspor CSV.

## 3b. Backend online di Vercel (data siswa langsung masuk ke Dasbor Guru)

Backend ikut di project Vercel yang sama dengan frontend (`api/index.py` → FastAPI di `backend/`), datanya disimpan di Postgres gratis (Neon). Cukup diatur **sekali**. Setelah itu data siswa dan jawaban langsung tersimpan di database, dan kamu tinggal buka *Halaman guru* tanpa deploy ulang.

1. **Database:** di dashboard Vercel buka project → **Storage** → **Create Database** → pilih **Neon (Postgres)** → *Connect* ke project ini. Vercel otomatis menambahkan `DATABASE_URL`.
2. **Environment Variables** (Settings → Environment Variables, centang *Production*):
   | Nama | Isi |
   |---|---|
   | `SECRET_KEY` | teks acak panjang, mis. hasil `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `TEACHER_PIN` | PIN rahasia untuk masuk Dasbor Guru (jangan `123456`) |
   | `VITE_API_URL` | `/` |
   | `VITE_DEMO_MODE` | `false` (kunci jawaban tidak ikut ke HP siswa) |
3. **Root Directory** (Settings → Build and Deployment) harus **kosong** (akar repo), bukan `frontend`, karena `vercel.json` di akar yang mengatur build frontend dan fungsi backend.
4. Push ke GitHub (atau *Redeploy* di Vercel). Ini deploy terakhir yang dibutuhkan.
5. Cek: buka `https://<domain-kamu>/api/v1/health` → harus muncul `{"ok":true}`. Lalu *Profil → Halaman guru* → masuk dengan `TEACHER_PIN` → tabel rekap semua siswa langsung tampil.

Kalau `SECRET_KEY`/`TEACHER_PIN` masih bawaan atau `DATABASE_URL` belum diatur, backend sengaja menolak jalan agar data siswa tidak tersimpan di tempat yang tidak aman.

> Database dari versi lama (yang masih memakai kode kelas) tidak perlu dihapus. Saat menyala, backend otomatis membuat kolom kelas di tabel siswa menjadi opsional. Data siswa dan jawaban lama tetap muncul di tabel rekap.

> Catatan: siswa yang sudah membuka versi demo lama akan mendapat versi baru setelah menekan tombol pembaruan aplikasi. Mereka otomatis diminta **masuk ulang** dengan namanya, dan pretest versi demo di HP mereka dihapus agar dikerjakan ulang dan tercatat di server. Progres modul tetap tersimpan.

## 3c. Tutor AI "Kak Venn" (opsional)

Menu **Tutor** berisi chatbot yang membimbing siswa memecahkan soal literasi secara bertahap mengikuti **Rigorous Mathematical Thinking (RMT)**: *Pahami Soal → Gunakan Konsep → Cek & Refleksi*. Tutor memberi petunjuk bertingkat (pemantik → strategi → langkah → contoh serupa) dan **tidak memberikan jawaban akhir**. Aturannya ada di `backend/app/services/tutor.py`.

- Tutor **terkunci** sebelum pretest dikumpulkan dan selama pretest/posttest berlangsung (dicek di aplikasi *dan* di server).
- Nama/NIS siswa **tidak** dikirim ke layanan AI. Yang dikirim hanya teks soal dan isi percakapan.
- Soal latihan tutor ada di `frontend/src/data/tutorProblems.json` (bukan soal instrumen).

Cara mengaktifkan:
1. Daftar di **openrouter.ai** → *Keys* → *Create Key*, lalu salin kuncinya (`sk-or-...`).
2. Di Vercel → Settings → Environment Variables, tambahkan:
   | Nama | Isi |
   |---|---|
   | `AI_API_KEY` | kunci dari OpenRouter (**jangan** diawali `VITE_`, agar tidak ikut ke HP siswa) |
   | `AI_MODEL` | opsional. Bawaan `google/gemma-4-31b-it:free` (gratis). Untuk DeepSeek: `deepseek/deepseek-v4.1-flash` (perlu isi saldo) |
3. *Redeploy*.

Model gratis di OpenRouter dibatasi ±50 permintaan/hari per akun (naik ke ±1.000/hari setelah pernah isi saldo $10) dan bisa sibuk di jam ramai. Daftar model gratis bisa berubah sewaktu-waktu. Kalau tutor menampilkan pesan "Layanan AI menolak permintaan (404)", cek nama model di openrouter.ai/models lalu perbarui `AI_MODEL`.

## 4. Analisis data penelitian

```bash
cd analysis
pip install -r requirements.txt
python ngain.py data/vennbuster_7A-VENN.csv     # CSV dari Dasbor Guru
```

Hasilnya berupa rekap pre/post/N-gain per siswa, rata-rata N-gain, uji Shapiro-Wilk, lalu uji-t berpasangan atau Wilcoxon, dan file `hasil_ngain.xlsx`.

## 5. Catatan penting

- **Skor maksimum 24** (4 soal × 6). Instrumen ada di `backend/app/data/instrumen_literasi.json`. Setiap kali isinya diubah, jalankan `npm run sync-instrument` di folder `frontend`.
- Pretest tidak menampilkan skor kepada siswa agar tidak memengaruhi posttest (butirnya sama).
- Di mode ujian, seluruh bantuan (sorotan kata kunci, Cek Total, umpan balik) dimatikan oleh `examGuard.js` dan diuji otomatis.
- Perbedaan dari rancangan awal: penyimpanan offline memakai Zustand `persist` (localStorage) karena lebih sederhana dan cukup untuk 1 siswa per perangkat. Tabel database dibuat otomatis tanpa Alembic.
