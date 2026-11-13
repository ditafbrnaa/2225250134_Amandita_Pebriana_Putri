# PRD — VennBuster

**Product Requirements Document**
Aplikasi Web & PWA Interaktif: Himpunan dan Diagram Venn untuk Siswa SMP

| Item | Isi |
|---|---|
| Nama produk | **VennBuster** |
| Versi dokumen | 1.0 (Perencanaan) |
| Penyusun | Amandita Pebriana Putri — S1 Pendidikan Matematika, Universitas Sultan Ageng Tirtayasa |
| Sasaran pengguna | Siswa SMP (materi Kelas VII: Himpunan & Diagram Venn), guru matematika, peneliti |
| Platform | Web (browser desktop/HP) + PWA yang dapat di-*install* di Android tanpa Play Store |
| Teknologi | React + Vite (JavaScript), Tailwind CSS, Framer Motion (`motion`), Python (FastAPI) |
| Dasar perancangan | (1) Laporan wawancara analisis beban kognitif siswa S01, 6 Nov 2026; (2) Instrumen Pretest–Posttest Literasi Matematika (4 soal) |

---

## 1. Latar Belakang

Wawancara dengan siswa kelas VIII (kode S01) menunjukkan bahwa siswa **sudah memahami irisan secara visual**, tetapi mengalami beban kognitif pada beberapa titik. Masalahnya bukan konsep yang terlalu sulit. Masalahnya ada pada **cara materi dan soal disajikan** (buku cetak, soal cerita panjang, simbol yang mirip). Siswa juga menyebutkan dua strategi yang membantunya: **mengarsir/mewarnai daerah** dan **mencocokkan total dengan himpunan semesta**. Siswa bahkan secara langsung meminta fitur visual interaktif yang warnanya berubah saat daerah diklik.

VennBuster dirancang untuk:
1. **Menekan beban ekstraneus** (*extraneous load*), misalnya dengan menyatukan teks dan diagram dalam satu layar dan menyorot kata kunci.
2. **Mengelola beban intrinsik** (*intrinsic load*), misalnya dengan pengenalan simbol bertahap, pendaftaran anggota yang terpandu, dan semesta yang selalu terlihat.
3. **Memperkuat beban germane** (*germane load*), misalnya dengan arsiran interaktif, *interactive highlighting*, dan pemeriksaan total mandiri.
4. **Menumbuhkembangkan literasi matematika** melalui empat proses PISA: *Mathematical Reasoning, Formulate, Employ, Interpret/Evaluate*.
5. **Mengukur dampaknya** melalui pretest–posttest yang terintegrasi di aplikasi.

## 2. Temuan Wawancara → Kebutuhan Produk

| Kode | Temuan (ringkas) | Jenis beban | Prinsip desain (CLT) | Kebutuhan fitur |
|---|---|---|---|---|
| K03 | Paham irisan, tetapi bingung menaruh elemen "bukan anggota A atau B" | K / IL | *Pre-training*, eksplorasi visual | Daerah **luar lingkaran** dapat diklik dan diberi label eksplisit "di dalam S, di luar A dan B"; latihan khusus komplemen |
| IL01 | Simbol ∩ dan ∪ mirip sehingga sering tertukar | IL | *Pre-training*, *dual coding* | **Kartu simbol** (simbol + kata + animasi daerah); setiap simbol selalu disertai teks "irisan/gabungan"; animasi transisi ∩ ⇄ ∪ |
| IL02 | Harus mendaftar semua anggota, lalu memikirkan posisinya; sering lupa anggota semesta | IL | Mengurangi *element interactivity*, *worked example* | **Baki Semesta** (*Semesta Tray*): semua anggota S terlihat sebagai token; penghitung "sisa token"; mode langkah demi langkah |
| EL02 | Diagram dan daftar anggota ada di halaman berbeda sehingga harus bolak-balik | EL | **Split-attention** → integrasi spasial | **Layout terintegrasi**: teks soal dan diagram selalu dalam satu layar (HP: diagram *sticky*); *linked highlighting* teks ⇄ daerah |
| EL05 | Kata jebakan ("hanya", "saja", "kecuali") terlewat pada soal cerita panjang | EL | **Signaling**, **segmenting** | **Penyorot kata kunci** + soal cerita dipecah per kalimat (*chunk*) |
| GL01 | Mewarnai/mengarsir daerah membuat konsep langsung jelas | GL | *Generative activity* | **Mode Arsir**: siswa mengetuk daerah untuk mengarsir dengan animasi arsiran |
| GL02 | Menjumlahkan semua angka di diagram lalu mencocokkannya dengan n(S) | GL | *Self-explanation*, *self-monitoring* | **Cek Total**: neraca n(S) yang terus diperbarui; siswa dapat menekan "Cek" untuk refleksi |
| DS01 | Ingin fitur visual yang warnanya berubah otomatis saat daerah irisan/gabungan diklik | K / GL | — | **Interactive Highlighting** (fitur inti, lihat §5.1) |

> **Catatan metodologis:** Temuan berasal dari **satu informan** (S01). Rekomendasinya: lakukan uji keterbacaan/uji coba terbatas (3–5 siswa) pada prototipe untuk memvalidasi temuan ini sebelum uji coba lapangan.

## 3. Tujuan & Sasaran Terukur

| Tujuan | Indikator keberhasilan |
|---|---|
| Literasi matematika meningkat | Rata-rata **N-gain ≥ 0,30** (kategori sedang, Hake) dari pretest ke posttest |
| Aplikasi mudah digunakan | Skor **SUS ≥ 70** dari siswa |
| Beban ekstraneus rendah | Angket beban kognitif (mis. skala Leppink/Paas) menunjukkan EL lebih rendah dibanding pembelajaran buku |
| Dapat dipakai di HP sekolah | PWA dapat di-*install*, berjalan **offline**, animasi stabil ±60 fps di Android kelas menengah ke bawah |
| Data penelitian valid | 100% jawaban pretest/posttest tersimpan, skor per tahapan dapat diekspor (CSV/XLSX) |

## 4. Persona Pengguna

1. **Siswa SMP (12–14 th)** — memakai HP Android milik sendiri atau orang tua, kuota terbatas, sinyal tidak stabil. Butuh tampilan sederhana, tombol besar, bahasa santai.
2. **Guru Matematika** — membuat kelas, memantau progres, menilai jawaban uraian (tahap penalaran), mengunduh rekap nilai.
3. **Peneliti (mahasiswa)** — membutuhkan data mentah pretest–posttest per tahap untuk analisis N-gain/uji-t.

## 5. Ruang Lingkup Fitur

Prioritas: **P0** = wajib untuk MVP, **P1** = penting, **P2** = opsional.

### 5.1 Venn Lab — Interactive Highlighting (P0, fitur inti)
- Diagram Venn SVG dengan **setiap daerah sebagai elemen terpisah yang bisa diklik**: A saja, B saja, A ∩ B, dan luar (S − (A ∪ B)). Opsional 3 himpunan (8 daerah).
- **Ketuk daerah** → daerah menyala dengan transisi warna mulus. Muncul *chip* notasi (mis. `A ∩ B`), kalimat bahasa sehari-hari ("anggota A **dan juga** B"), serta daftar anggotanya.
- **Bilah Operasi**: tombol `A ∩ B`, `A ∪ B`, `Aᶜ`, `Bᶜ`, `A − B`, `B − A`, `(A ∪ B)ᶜ`. Saat ditekan, warna **berpindah/mengalir** secara animatif dari daerah lama ke daerah baru (bukan langsung berganti).
- **Mode Bandingkan ∩ vs ∪**: dua diagram berdampingan atau satu diagram dengan *toggle* untuk mengatasi IL01.
- **Mode Arsir (GL01)**: siswa diberi ekspresi lalu mengarsir sendiri daerah yang dimaksud, kemudian menekan "Periksa" untuk mendapat umpan balik per daerah.
- Detail teknis: lihat `docs/RANCANGAN_FITUR.md` §2.

### 5.2 Baki Semesta & Penempatan Anggota (P0)
- Semua anggota S tampil sebagai token. Siswa **menyeret (drag)** atau **mengetuk lalu mengetuk daerah** untuk menempatkan token.
- Penghitung "Token belum ditempatkan: n" agar anggota semesta tidak terlupa (IL02).
- Token yang bukan anggota A maupun B harus diletakkan di daerah luar. Aplikasi memberi umpan balik khusus untuk kesalahan ini (K03).

### 5.3 Cek Total Semesta (P0)
- Neraca visual: Σ(isi semua daerah) vs n(S), diperbarui setiap ada perubahan.
- Tombol **"Cek Total"** memicu animasi penjumlahan per daerah satu per satu, lalu menampilkan ✔ atau selisih (GL02).

### 5.4 Pembaca Soal Cerita Terintegrasi (P0)
- Teks soal dan diagram dalam **satu layar**. Desktop: berdampingan. HP: diagram *sticky* di atas dan teks dapat di-*scroll* di bawahnya (EL02).
- **Penyorot kata kunci** (EL05): `hanya`, `saja`, `kecuali`, `bukan`, `tidak … keduanya`, `sekaligus`, `keduanya`, `setidaknya`, `paling sedikit`, `atau`, `dan`. Mengetuk kata kunci menyorot daerah Venn yang dimaksud (*linked highlighting*).
- **Segmenting**: soal cerita ditampilkan per kalimat/potongan informasi dengan tombol "Lanjut".

### 5.5 Modul Belajar Literasi (P0)
Alur bertahap (*scaffolding → fading*):
1. **Kenali Simbol** — kartu ∈, ∉, S, ∩, ∪, ᶜ, − (pre-training).
2. **Eksplorasi Daerah** — Venn Lab bebas.
3. **Dari Cerita ke Diagram** (*Formulate*).
4. **Hitung dengan Prinsip Himpunan** (*Employ*) — n(A ∪ B) = n(A) + n(B) − n(A ∩ B).
5. **Masuk Akal Tidak?** (*Interpret/Evaluate*) — menilai kesimpulan orang lain.
6. **Beri Alasanmu** (*Reasoning*) — membandingkan dua cara penyelesaian.

Setiap modul berisi: contoh soal yang dikerjakan (*worked example*), latihan berpandu, lalu latihan mandiri (bantuan dikurangi).

### 5.6 Pretest & Posttest Literasi (P0)
- 4 soal sesuai instrumen (lihat `frontend/src/data/instrumen_literasi.json`).
- Jawaban **terstruktur per tahapan** sesuai kisi-kisi, sehingga skor per tahap dapat dihitung.
- **Mode ujian**: seluruh *scaffolding* (penyorot kata kunci, Cek Total otomatis, umpan balik) **dinonaktifkan** agar pengukuran valid. Siswa tetap boleh memakai kanvas Venn kosong sebagai "kertas coretan".
- Penilaian: tahap numerik dinilai otomatis, sedangkan tahap alasan/kesimpulan dinilai guru dengan rubrik di Dasbor Guru.
- Pretest wajib dikerjakan sebelum modul terbuka. Posttest terbuka setelah semua modul selesai (atau dibuka manual oleh guru).

### 5.7 Dasbor Guru (P1)
- Membuat kelas dan kode kelas, melihat daftar siswa dan progres modul.
- Antrian penilaian tahap uraian (rubrik + skor 0..maks tahap).
- Rekap pretest/posttest, N-gain per siswa dan per kelas, ekspor CSV/XLSX.

### 5.8 PWA & Offline (P0)
- *Installable* (manifest, ikon, *splash*), *service worker* (vite-plugin-pwa / Workbox).
- Seluruh materi dan soal tersedia offline. Jawaban disimpan di IndexedDB lalu **disinkronkan otomatis** saat online.
- Prompt "Pasang VennBuster" kustom di Android/Chrome, serta panduan *Add to Home Screen* untuk iOS.

### 5.9 Motivasi Ringan (P2)
- Lencana per modul dan bar progres. Gamifikasi **dibatasi** agar tidak menambah beban ekstraneus: tidak ada papan peringkat dan tidak ada animasi dekoratif di tengah tugas.

### Di luar ruang lingkup (v1)
- Aplikasi native/Play Store. Opsi lanjutan: membungkus PWA menjadi APK via **TWA/Bubblewrap**.
- Chat/forum, materi selain Himpunan, dan Venn lebih dari 3 himpunan.

## 6. Alur Pengguna Utama (Siswa)

```
Buka/Install → Masuk (kode kelas + nama/NIS) → Pretest (mode ujian)
  → Peta Belajar (Modul 1..6, terbuka bertahap) ⇄ Venn Lab (bebas kapan saja)
  → Posttest (mode ujian) → Halaman Hasil (skor + refleksi)
```

## 7. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| Performa | First load < 3 detik di 4G; bundle JS awal < 250 KB gzip (*lazy-load* per rute); animasi hanya `transform`/`opacity`/`fill` |
| Responsif | Lebar 320 px – 1440 px; mendukung orientasi potret dan lanskap |
| Aksesibilitas | Target sentuh ≥ 44 px; kontras WCAG AA; **warna tidak menjadi satu-satunya penanda** (daerah juga diberi pola arsir + label); `prefers-reduced-motion` dihormati; daerah Venn dapat difokus dengan keyboard |
| Bahasa | Seluruh UI dalam Bahasa Indonesia yang ramah siswa |
| Privasi | Data minimal (nama/NIS + kode kelas); tanpa email atau nomor HP siswa; persetujuan guru/orang tua; data penelitian dapat dianonimkan saat ekspor |
| Keandalan | Tidak ada jawaban yang hilang saat offline atau jika aplikasi ditutup di tengah tes (autosave per tahap) |
| Kompatibilitas | Chrome Android ≥ 100, Safari iOS ≥ 16, Chrome/Edge/Firefox desktop terbaru |

## 8. Arsitektur Ringkas

```
[React + Vite PWA]  ── IndexedDB (Dexie): progres, jawaban, antrean sinkron
        │  REST/JSON (HTTPS)
        ▼
[FastAPI (Python)] ── SQLite (dev) / PostgreSQL (prod)
        │
        └── analysis/ (Python: N-gain, uji normalitas, uji-t berpasangan/Wilcoxon)
```
- Frontend dapat berjalan **tanpa backend** (mode demo/offline penuh) untuk uji coba awal.
- *Hosting* yang disarankan: frontend di Netlify/Vercel/GitHub Pages (wajib HTTPS untuk PWA); backend di Render/Railway/VPS kampus.

## 9. Rencana Rilis (Roadmap)

| Fase | Durasi | Keluaran |
|---|---|---|
| 0. Fondasi | 1 minggu | Repo, Vite + React + Tailwind + Motion, PWA dasar, routing, desain token |
| 1. Venn Lab | 2 minggu | Geometri daerah, Interactive Highlighting, Bilah Operasi, Mode Arsir, Cek Total, Baki Semesta + unit test |
| 2. Asesmen | 1,5 minggu | Mesin soal bertahap, mode ujian, autoscore, autosave offline |
| 3. Modul Literasi | 2 minggu | 6 modul, pembaca soal cerita + penyorot kata kunci |
| 4. Backend & Dasbor | 1,5 minggu | FastAPI, sinkronisasi, dasbor guru, rubrik, ekspor, skrip N-gain |
| 5. Uji & Poles | 1 minggu | Uji keterbacaan 3–5 siswa, validasi ahli media/materi, Lighthouse, perbaikan |

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| HP siswa lambat/memori kecil | Animasi ringan, *lazy-load*, uji di perangkat low-end, opsi "Kurangi animasi" |
| Siswa tidak punya kuota | Offline penuh setelah instalasi pertama; sinkronisasi menunggu Wi-Fi sekolah |
| Validitas tes terganggu oleh *scaffolding* | Mode ujian mematikan semua bantuan (diuji otomatis) |
| *Testing effect* karena butir pretest = posttest | Jeda waktu yang cukup; opsional menyiapkan butir paralel (angka/konteks berbeda, struktur sama) |
| Kisi-kisi skor tidak konsisten | Dikonfirmasi ke dosen sebelum implementasi (lihat §11) |
| Animasi berlebihan menambah beban ekstraneus | Aturan "animasi bermakna" (lihat `CLAUDE.md`), dan setiap animasi harus menjelaskan konsep |

## 11. Isu Terbuka (Perlu Dikonfirmasi)

1. ~~**Soal 2**: Tahap 6 tidak memiliki deskripsi.~~ **Diputuskan:** Tahap 6 dihapus, Tahap 2 berbobot 2 → 1 + 2 + 1 + 1 + 1 = 6.
2. ~~**Soal 3**: Tahap 5 (kesimpulan) tidak memiliki skor.~~ **Diputuskan:** Tahap 5 berbobot 1, Tahap 3 menjadi 1 → 1 + 2 + 1 + 1 + 1 = 6.
3. Apakah pretest dan posttest memakai butir yang **identik** atau **paralel**?
4. Rubrik skor parsial untuk tahap uraian (mis. tahap bernilai 2: kapan diberi 1?).
5. **Notasi Soal 2**: kisi-kisi memakai `n(S) = 15` untuk Soto, padahal `S` juga lazim dipakai untuk himpunan semesta. Ini berpotensi membingungkan (terkait temuan IL01). → Pertimbangkan `n(T)`/`n(P)` untuk Soto pada versi aplikasi (perlu persetujuan karena mengubah teks instrumen).
6. Kelas sasaran uji coba: VII (sedang belajar) atau VIII (pengulangan, seperti informan S01)?
