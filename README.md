# VennBuster

Aplikasi web + PWA interaktif untuk materi **Himpunan dan Diagram Venn (SMP)**, dirancang dari analisis beban kognitif siswa dan terintegrasi dengan instrumen pretest–posttest literasi matematika.

Akses langsung ke aplikasi: https://2225250134-amandita-pebriana-putri.vercel.app/
```
vennbuster/
├── frontend/   React + Vite + Tailwind v4 + Framer Motion (PWA)
├── backend/    FastAPI + SQLite (opsional, untuk kelas sungguhan & dasbor guru)
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

Alur kelas: Guru membuka *Profil → Halaman guru*, masuk dengan PIN, membuat kelas, lalu membagikan **kode kelas**. Siswa masuk dengan kode itu. Setelah tes, guru menilai langkah uraian di tab *Penilaian uraian* dan mengunduh CSV.

## 4. Analisis data penelitian

```bash
cd analysis
pip install -r requirements.txt
python ngain.py data/vennbuster_7A-VENN.csv     # CSV dari Dasbor Guru
```

Hasilnya berupa rekap pre/post/N-gain per siswa, rata-rata N-gain, uji Shapiro-Wilk, lalu uji-t berpasangan atau Wilcoxon, dan file `hasil_ngain.xlsx`.

## 5. Catatan penting

- **Skor maksimum saat ini 23, bukan 24.** Soal 2 tahap 6 dan Soal 3 tahap 5 belum punya deskripsi/bobot di kisi-kisi (lihat `PRD.md` §11). Setelah dikonfirmasi dosen, lengkapi `backend/app/data/instrumen_literasi.json` (isi `rubric`, `prompt`, `input`, `score`, dan hapus `needs_confirmation`), lalu jalankan `npm run sync-instrument`.
- Pretest tidak menampilkan skor kepada siswa agar tidak memengaruhi posttest (butirnya sama).
- Di mode ujian, seluruh bantuan (sorotan kata kunci, Cek Total, umpan balik) dimatikan oleh `examGuard.js` dan diuji otomatis.
- Perbedaan dari rancangan awal: penyimpanan offline memakai Zustand `persist` (localStorage) karena lebih sederhana dan cukup untuk 1 siswa per perangkat. Tabel database dibuat otomatis tanpa Alembic.
