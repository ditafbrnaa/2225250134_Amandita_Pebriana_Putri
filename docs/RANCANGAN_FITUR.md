# Rancangan Fitur Utama — VennBuster

Dokumen ini merinci **bagaimana** fitur di `PRD.md` dibangun: perilaku, komponen, model data, animasi, dan logika penilaian. Dokumen ini menjadi acuan teknis saat menulis kode.

---

## 1. Peta Fitur ↔ Temuan Wawancara ↔ Proses Literasi

| Fitur | Kode wawancara | Proses literasi (PISA) yang didukung |
|---|---|---|
| Interactive Highlighting (Venn Lab) | DS01, GL01, IL01 | Employ, Reasoning |
| Bilah Operasi + animasi ∩ ⇄ ∪ | IL01 | Employ |
| Daerah Luar / Komplemen | K03 | Formulate, Employ |
| Baki Semesta (penempatan anggota) | IL02, K03 | Formulate |
| Cek Total Semesta | GL02 | Interpret/Evaluate, Reasoning |
| Pembaca Soal Terintegrasi | EL02 | Formulate |
| Penyorot Kata Kunci + Segmenting | EL05 | Formulate |
| Mode Arsir | GL01 | Employ |
| Pretest/Posttest bertahap | — | Keempat proses (Soal 1–4) |

---

## 2. Venn Lab & Interactive Highlighting (fitur inti)

### 2.1 Model daerah berbasis *bitmask*

Setiap daerah direpresentasikan oleh **bitmask keanggotaan**: A = `1`, B = `2`, C = `4`.

| Mask | Daerah (2 himpunan) | Notasi | Kalimat sehari-hari |
|---|---|---|---|
| `0` | luar | (A ∪ B)ᶜ | "di dalam S, **bukan** anggota A **maupun** B" |
| `1` | A saja | A − B | "**hanya** A" |
| `2` | B saja | B − A | "**hanya** B" |
| `3` | irisan | A ∩ B | "A **dan juga** B (keduanya)" |

Untuk 3 himpunan, mask `0..7` menghasilkan 8 daerah.

**Operasi = predikat atas mask.** Sebuah ekspresi dievaluasi menjadi himpunan daerah yang menyala:

```js
// src/features/venn/lib/expression.js
const OPS = {
  'A∩B':   m => (m & 1) && (m & 2),
  'A∪B':   m => (m & 1) || (m & 2),
  'Aᶜ':    m => !(m & 1),
  'Bᶜ':    m => !(m & 2),
  'A−B':   m => (m & 1) && !(m & 2),
  'B−A':   m => (m & 2) && !(m & 1),
  '(A∪B)ᶜ': m => !(m & 1) && !(m & 2),
};
export const regionsFor = (expr, masks) => masks.filter(OPS[expr]);
```

Pada versi lanjutan, tambahkan *parser* kecil (∪, ∩, ᶜ, −, kurung) agar guru dapat menulis ekspresi bebas seperti `(A ∩ B)ᶜ ∪ C`. Logika ini **murni (pure)** dan wajib diuji dengan Vitest.

### 2.2 Geometri SVG (2 himpunan)

Setiap daerah digambar sebagai `<path>` tersendiri agar bisa diklik, diwarnai, dan dianimasikan secara independen. **Jangan** memakai dua `<circle>` bertumpuk dengan opacity, karena irisannya tidak bisa diklik sendiri.

Tata letak bawaan: `viewBox="0 0 400 280"`, S = persegi panjang, A pusat (150,140), B pusat (250,140), r = 90.
Titik potong: P₁ = (200, 65.17), P₂ = (200, 214.83).

```text
Irisan A∩B : M200,65.17 A90,90 0 0,1 200,214.83 A90,90 0 0,1 200,65.17 Z
A saja      : M200,65.17 A90,90 0 1,0 200,214.83 A90,90 0 0,1 200,65.17 Z
B saja      : M200,65.17 A90,90 0 1,1 200,214.83 A90,90 0 0,0 200,65.17 Z
Gabungan    : M200,65.17 A90,90 0 1,0 200,214.83 A90,90 0 1,0 200,65.17 Z
Luar        : <path d="(persegi S) (gabungan)" fill-rule="evenodd">
```

`geometry.js` harus menghitung titik potong secara umum dari (c₁, c₂, r₁, r₂) agar ukuran diagram bisa diubah. Nilai di atas dipakai sebagai *snapshot test*. Untuk 3 himpunan, gunakan `clipPath`/`mask` kombinatorik atau pustaka kecil penghitung busur. Opsi paling sederhana adalah menyimpan path 8 daerah untuk tata letak tetap.

### 2.3 Perilaku interaksi

| Aksi | Respons |
|---|---|
| Ketuk 1 daerah | Daerah menyala (spring), daerah lain meredup ke 35% opacity. Muncul *chip* notasi + kalimat + daftar anggota |
| Ketuk daerah yang sama | Batal pilih (kembali netral) |
| Ketuk daerah lain sambil mode *multi* aktif | Daerah ditambahkan, lalu aplikasi **menebak ekspresi** yang cocok ("Kamu memilih A ∪ B!") |
| Tekan tombol operasi | Warna **mengalir**: daerah lama memudar, daerah baru menyala berurutan (stagger 80 ms), dengan urutan A saja → irisan → B saja agar terlihat "gabungan = semua bagian" |
| Toggle ∩ ⇄ ∪ | Animasi transisi: irisan tetap menyala, lalu A saja & B saja "tumbuh" keluar dari irisan (dan sebaliknya) |
| Fokus keyboard (Tab) + Enter | Sama dengan ketuk (aksesibilitas) |
| Hover (desktop) | Garis tepi menebal + *tooltip* notasi |

Kartu simbol untuk IL01 (selalu muncul di samping simbol):
- **∪ = gabUngan** → "bentuknya seperti huruf **U**, seperti mangkuk yang menampung **semua**."
- **∩ = irisan** → "bentuknya seperti **atap/jembatan**, hanya bagian yang **dimiliki keduanya**."

### 2.4 Spesifikasi animasi (Framer Motion / `motion`)

| Elemen | Properti | Konfigurasi |
|---|---|---|
| Nyala daerah | `fill`, `fillOpacity` | `type: "spring", stiffness: 260, damping: 24` |
| Redup daerah lain | `fillOpacity` → 0.35 | `duration: 0.2` |
| Aliran operasi | urutan daerah | `staggerChildren: 0.08` |
| Arsiran (Mode Arsir) | `pattern` garis diagonal + `strokeDashoffset` | `duration: 0.45, ease: "easeOut"`, terlihat seperti diarsir pensil |
| Chip notasi | `layout`, `opacity`, `y` | `AnimatePresence` + `layoutId="notation-chip"` |
| Token Baki Semesta | `drag`, `layout` | `dragSnapToOrigin` jika dilepas di luar diagram; *snap* ke titik kosong daerah |
| Cek Total | penghitung angka | angka dijumlahkan per daerah, tiap daerah berkedip 1× |
| Benar / salah | `scale` [1, 1.06, 1] / `x` [0,-6,6,0] | ≤ 300 ms |

Aturan umum:
- Hanya menganimasikan `transform`, `opacity`, `fill`, dan `stroke`. Jangan menganimasikan `width/height/top/left`.
- Bungkus aplikasi dengan `<MotionConfig reducedMotion="user">`. Opsi "Kurangi animasi" di Pengaturan memaksa mode ini.
- **Animasi harus bermakna**: setiap animasi menjelaskan konsep (perpindahan daerah, penjumlahan). Tidak ada partikel/konfeti di tengah tugas.

### 2.5 Palet & aksesibilitas warna

| Token | Pemakaian | Saran warna |
|---|---|---|
| `--venn-a` | daerah A saja | biru `#3B82F6` |
| `--venn-b` | daerah B saja | oranye `#F59E0B` |
| `--venn-ab` | irisan | ungu `#8B5CF6` (campuran visual A+B) |
| `--venn-out` | luar | hijau-abu `#94A3B8` |
| `--venn-hl` | sorotan aktif | kuning `#FACC15` dengan garis tepi tebal |

Setiap daerah juga diberi **pola pembeda** (titik, garis miring, garis silang) dan label teks agar tetap terbaca oleh siswa buta warna. Validasi kontras dilakukan di mode terang dan gelap.

### 2.6 Komponen

```
features/venn/
  components/
    VennCanvas.jsx        // SVG wadah, menerima sets, mode, elements
    VennRegion.jsx        // <motion.path> satu daerah, a11y role="button"
    OperationBar.jsx      // tombol operasi + kartu simbol
    NotationChip.jsx      // notasi + kalimat + daftar anggota
    SemestaTray.jsx       // token anggota S + penghitung sisa
    ElementToken.jsx      // token yang bisa di-drag
    TotalChecker.jsx      // neraca Σ daerah vs n(S)
    ShadeChallenge.jsx    // Mode Arsir + Periksa
  lib/
    geometry.js           // titik potong, path daerah
    regions.js            // daftar mask, label, kalimat
    expression.js         // parser + evaluasi operasi
    placement.js          // validasi posisi token
  hooks/useVennState.js   // state lokal (Zustand slice)
```

Props utama `VennCanvas`:

```js
{
  sets: [{ id: 'A', label: 'Sepak Bola', members: [...] }, { id: 'B', ... }],
  universe: { label: 'Siswa kelas VIII', members: [...] } | { count: 40 },
  mode: 'explore' | 'operation' | 'shade' | 'place' | 'count' | 'exam',
  showCounts: boolean,        // tampilkan angka per daerah (soal kuantitatif)
  scaffolds: { notation: true, keywords: true, autoCheck: true }, // semua false di mode 'exam'
  onRegionSelect: (masks) => void,
}
```

---

## 3. Baki Semesta & Penempatan Anggota

1. Soal menyajikan S, A, dan B (mis. S = {1..10}, A = bilangan genap, B = bilangan prima).
2. Semua anggota S muncul sebagai token di baki bawah dengan judul "Semesta S — 10 anggota".
3. Siswa menyeret token ke daerah. `placement.js` menghitung mask yang benar untuk token tersebut.
4. Umpan balik:
   - Benar → token menetap dengan warna daerah.
   - Salah → token kembali ke posisi semula + petunjuk bertingkat (1: "Apakah 9 anggota A?" → 2: "9 bukan genap dan bukan prima, jadi letaknya di mana?" → 3: daerah luar disorot).
5. Selama baki belum kosong, label "Masih ada **n** anggota semesta yang belum ditempatkan" terus terlihat (IL02).
6. **Mode langkah demi langkah** (*worked example*): aplikasi memeragakan penempatan 2 token pertama, lalu siswa melanjutkan sendiri.

## 4. Cek Total Semesta

- Komponen `TotalChecker` menampilkan `9 + 6 + 6 + ? = 30`, yang terisi otomatis dari angka daerah.
- Tekan **"Cek Total"** → setiap daerah berkedip berurutan sambil angkanya "terbang" ke penjumlah.
- Hasil:
  - Σ = n(S) → "Pas! Semua anggota semesta sudah dihitung."
  - Σ ≠ n(S) → "Selisih **k**. Daerah mana yang belum terisi atau terhitung dua kali?"
- Di **mode ujian**, komponen ini disembunyikan. Siswa tetap bisa memeriksa secara manual di kanvas coretan.

## 5. Pembaca Soal Terintegrasi & Penyorot Kata Kunci

### 5.1 Tata letak (mengatasi *split-attention*)
- **≥ 768 px**: dua kolom (teks 45% | diagram 55%).
- **< 768 px**: diagram *sticky* di atas (tinggi ±40 vh), teks soal per potongan di bawahnya, dan tombol aksi di bagian paling bawah.
- Data angka dari teks ditampilkan **langsung di dalam daerah diagram** (integrasi spasial), bukan di tabel terpisah.

### 5.2 Kamus kata kunci (`src/data/keywords.json`)

| Kata/frasa | Daerah yang disorot | Penjelasan singkat |
|---|---|---|
| hanya …, … saja | A − B atau B − A | "Hanya satu, tidak termasuk irisan" |
| keduanya, sekaligus, dan juga | A ∩ B | "Masuk dua kelompok sekaligus" |
| tidak … keduanya, bukan … maupun | (A ∪ B)ᶜ | "Di luar kedua lingkaran, tetapi masih di S" |
| setidaknya satu, paling sedikit satu, atau | A ∪ B | "Semua bagian di dalam lingkaran" |
| kecuali, selain | komplemen terkait | "Semua di S **dikurangi** kelompok itu" |
| seluruh, semua siswa, jumlah total | S | "Himpunan semesta" |

Implementasi: *tokenizer* sederhana berbasis regex frasa (frasa terpanjang dicocokkan lebih dulu). Teks dirender sebagai `<mark>` interaktif. Mengetuk `<mark>` akan memanggil `onRegionSelect` pada `VennCanvas` (*linked highlighting* dua arah).

### 5.3 Segmenting
Soal cerita dipecah menjadi potongan informasi (biasanya per kalimat). Setiap potongan yang selesai dibaca dapat "ditarik" menjadi angka di diagram (Formulate). Contoh untuk Soal 2: "15 siswa gemar soto" → siswa mengisi n(S) = 15 → aplikasi bertanya "Apakah 15 ini **hanya** soto atau termasuk yang gemar keduanya?"

---

## 6. Modul Belajar Literasi

| # | Modul | Proses PISA | Isi utama | Fitur yang dipakai |
|---|---|---|---|---|
| 1 | Kenali Simbol | — (pre-training) | ∈, ∉, S, ∩, ∪, ᶜ, −; kuis cocokkan simbol ↔ daerah | Kartu simbol, Venn Lab |
| 2 | Jelajah Daerah | Employ | Ketuk daerah, operasi, arsir | Interactive Highlighting, Mode Arsir |
| 3 | Dari Cerita ke Diagram | Formulate | Mengubah konteks nyata menjadi model himpunan | Pembaca terintegrasi, kata kunci, Baki Semesta |
| 4 | Hitung dengan Prinsip | Employ | n(A∪B) = n(A)+n(B)−n(A∩B), "bagian murni" | Venn kuantitatif, Cek Total |
| 5 | Masuk Akal Tidak? | Interpret/Evaluate | Menilai kesimpulan orang lain dengan data semesta | Cek Total, diagram pembanding |
| 6 | Beri Alasanmu | Reasoning | Membandingkan dua cara (penjumlahan langsung vs prinsip irisan), menulis alasan | Venn berdampingan, kotak alasan |

Pola setiap modul (**fading**):
1. **Contoh** — penyelesaian lengkap dengan animasi per tahap.
2. **Lengkapi** — sebagian tahap sudah terisi, siswa melengkapi sisanya.
3. **Mandiri** — tanpa isian, tetapi bantuan masih bisa dibuka.
4. **Refleksi** — "Apa kata kunci yang hampir kamu lewatkan?" (1 pertanyaan singkat).

Konten modul disimpan sebagai data JSON (`src/data/modules/*.json`) agar bisa ditambah tanpa mengubah kode.

---

## 7. Pretest & Posttest

### 7.1 Butir
Diambil dari `src/data/instrumen_literasi.json` (4 soal, masing-masing skor maks 6, total **24**):

| No | Indikator | Konteks | Kunci |
|---|---|---|---|
| 1 | Mathematical Reasoning | Sepak Bola & Basket, N = 40 | n(A ∩ B) = **5** |
| 2 | Formulating Situations Mathematically | Soto & Bakso, N = 30 | Tidak suka keduanya = **9** |
| 3 | Employing Concepts, Facts, Procedures | Jaket & Jas hujan, N = 25 | Cara siswa keliru; total = **23**, tidak membawa = **2** |
| 4 | Interpreting, Applying, Evaluating | TikTok & Instagram, N = 50 | Kesimpulan 15 **tidak wajar**; irisan = **5** |

### 7.2 Tampilan jawaban bertahap
Setiap soal menampilkan **formulir tahapan** sesuai kisi-kisi (judul tahap disamarkan agar tidak membocorkan jawaban, mis. "Langkah 1: Tuliskan informasi yang diketahui"). Jenis isian per tahap:

| Tipe isian | Contoh | Penilaian |
|---|---|---|
| `numeric` | "Banyak siswa yang menyukai setidaknya satu hobi = ___" | Otomatis (cocok dengan kunci, toleransi 0) |
| `equation` | "Tuliskan rumus/model yang kamu pakai" | Semi-otomatis: dicocokkan dengan pola yang diterima. Jika tidak cocok, masuk antrean guru |
| `choice` | "Apakah cara siswa tersebut tepat? (Ya/Tidak)" | Otomatis |
| `text` | "Berikan alasanmu" | **Manual** oleh guru (rubrik) |
| `venn` | Kanvas Venn kosong untuk mengisi angka per daerah | Otomatis per daerah (opsional sebagai bukti) |

### 7.3 Mode ujian (`mode: 'exam'`)
- Semua *scaffold* mati: kata kunci tidak disorot, tidak ada Cek Total, tidak ada umpan balik benar/salah, dan tidak ada petunjuk.
- Pengatur waktu opsional (ditentukan guru), navigasi antarsoal bebas, dan **autosave setiap perubahan tahap** ke IndexedDB.
- Konfirmasi sebelum mengumpulkan; jawaban terkunci setelah dikumpulkan.
- Diuji otomatis: *test* memastikan `scaffolds` bernilai `false` di semua komponen saat `mode === 'exam'`.

### 7.4 Logika skor (`backend/app/services/scoring.py`, cermin di frontend)
```
skor_soal  = Σ skor_tahap (tahap otomatis langsung; tahap manual menunggu guru)
skor_total = Σ skor_soal                      (maks 24)
nilai_100  = skor_total / 24 × 100
N-gain     = (post − pre) / (24 − pre)        (Hake: ≥0,7 tinggi; 0,3–0,7 sedang; <0,3 rendah)
```
Status percobaan: `in_progress` → `submitted` → `partially_scored` → `scored`.

---

## 8. Model Data

### 8.1 Frontend (IndexedDB via Dexie)
```
profile      { id, name, nis, classCode, joinedAt }
progress     { moduleId, step, status, updatedAt }
attempts     { id, type: 'pre'|'post', startedAt, submittedAt, status, synced }
answers      { attemptId, itemNo, stageNo, value, updatedAt }
syncQueue    { id, endpoint, payload, tries, createdAt }
settings     { reduceMotion, fontScale, theme }
```

### 8.2 Backend (SQLAlchemy)
```
Teacher(id, name, email, password_hash)
Classroom(id, teacher_id, name, code UNIQUE)
Student(id, classroom_id, name, nis, created_at)
Attempt(id, student_id, type, started_at, submitted_at, status)
Answer(id, attempt_id, item_no, stage_no, value_json, auto_score, manual_score, scored_by, scored_at)
ModuleProgress(id, student_id, module_id, step, status, updated_at)
```

### 8.3 API (FastAPI, prefix `/api/v1`)
| Metode | Endpoint | Keterangan |
|---|---|---|
| POST | `/students/join` | Masuk dengan `classCode` + nama/NIS → token sesi |
| GET | `/instrument` | Butir pretest/posttest (tanpa kunci jawaban) |
| POST | `/attempts` | Membuat percobaan pre/post |
| PUT | `/attempts/{id}/answers` | Upsert jawaban per tahap (idempoten, aman untuk sinkronisasi ulang) |
| POST | `/attempts/{id}/submit` | Kumpulkan dan jalankan skor otomatis |
| PUT | `/progress` | Sinkronkan progres modul |
| POST | `/auth/teacher/login` | Login guru (JWT) |
| GET | `/teacher/classes/{id}/summary` | Rekap pre/post/N-gain |
| GET | `/teacher/grading-queue` | Tahap uraian yang belum dinilai |
| PUT | `/teacher/answers/{id}/score` | Beri skor manual |
| GET | `/teacher/classes/{id}/export?format=csv\|xlsx` | Ekspor data penelitian |

Kunci jawaban **tidak pernah** dikirim ke klien di mode ujian. Penilaian akhir dilakukan di server. Frontend hanya menghitung skor sementara untuk mode offline, lalu server melakukan validasi ulang.

---

## 9. PWA & Offline

- `vite-plugin-pwa` dengan `registerType: 'autoUpdate'`. *Precache* aset build, font, ikon, dan JSON data.
- Strategi *runtime cache*: `/api/instrument` → *StaleWhileRevalidate*; `/api/*` lainnya → *NetworkOnly* + antrean `syncQueue` (dikirim ulang saat event `online` atau saat aplikasi dibuka).
- Manifest: `name: "VennBuster"`, `short_name: "VennBuster"`, `display: "standalone"`, `orientation: "any"`, `lang: "id"`, ikon 192/512 + `maskable`.
- Komponen `InstallPrompt`: menangkap `beforeinstallprompt` (Android/desktop Chrome) dan menampilkan panduan "Bagikan → Tambahkan ke Layar Utama" untuk iOS.
- Banner "Versi baru tersedia — muat ulang". Pembaruan **ditunda** selama siswa sedang mengerjakan tes.

## 10. Halaman & Navigasi

| Rute | Halaman |
|---|---|
| `/` | Beranda / Peta Belajar |
| `/masuk` | Masuk dengan kode kelas |
| `/tes/:type` | Pretest / Posttest (`pre` \| `post`) |
| `/tes/:type/hasil` | Ringkasan setelah mengumpulkan |
| `/modul/:id` | Modul belajar 1–6 |
| `/lab` | Venn Lab bebas |
| `/pengaturan` | Kurangi animasi, ukuran huruf, tema |
| `/guru/*` | Dasbor guru (rute terpisah, *lazy-loaded*) |

Navigasi bawah (HP): **Belajar · Lab · Tes · Profil**.
