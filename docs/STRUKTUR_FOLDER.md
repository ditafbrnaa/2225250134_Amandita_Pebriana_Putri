# Struktur Folder — VennBuster

Monorepo dengan tiga bagian: **frontend** (React + Vite PWA), **backend** (FastAPI), dan **analysis** (skrip Python untuk data penelitian).

```
vennbuster/
├── CLAUDE.md                     # Panduan untuk Claude Code saat menulis kode
├── PRD.md                        # Kebutuhan produk
├── README.md                     # Cara menjalankan proyek
├── .gitignore
├── .editorconfig
│
├── docs/
│   ├── RANCANGAN_FITUR.md        # Spesifikasi teknis fitur
│   ├── STRUKTUR_FOLDER.md        # (dokumen ini)
│   ├── sumber/                   # Laporan wawancara & instrumen asli (.docx/.pdf)
│   └── desain/                   # Wireframe, palet, aset Figma (ekspor)
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js            # React + Tailwind (@tailwindcss/vite) + vite-plugin-pwa
│   ├── eslint.config.js
│   ├── jsconfig.json             # alias "@/..." → src/
│   ├── scripts/
│   │   └── strip-keys.js         # salin instrumen dari backend, buang field kunci
│   ├── public/
│   │   ├── icons/                # icon-192.png, icon-512.png, maskable-512.png
│   │   ├── favicon.svg
│   │   └── robots.txt
│   └── src/
│       ├── main.jsx              # entry; registrasi service worker
│       ├── App.jsx               # MotionConfig, Router, layout
│       ├── app/
│       │   ├── router.jsx        # definisi rute + lazy loading
│       │   └── providers.jsx     # MotionConfig reducedMotion, QueryClient (opsional)
│       ├── pages/                # Halaman tipis yang merakit fitur
│       │   ├── HomePage.jsx
│       │   ├── JoinPage.jsx
│       │   ├── LabPage.jsx
│       │   ├── ModulePage.jsx
│       │   ├── TestPage.jsx
│       │   ├── TestResultPage.jsx
│       │   ├── SettingsPage.jsx
│       │   └── teacher/          # DashboardPage, GradingPage, ExportPage
│       ├── features/
│       │   ├── venn/             # ★ FITUR INTI
│       │   │   ├── components/   # VennCanvas, VennRegion, OperationBar, NotationChip,
│       │   │   │                 # SemestaTray, ElementToken, TotalChecker, ShadeChallenge
│       │   │   ├── lib/          # geometry.js, regions.js, expression.js, placement.js
│       │   │   ├── hooks/        # useVennState.js
│       │   │   └── __tests__/    # geometry.test.js, expression.test.js, placement.test.js
│       │   ├── story-reader/     # Pembaca soal terintegrasi + penyorot kata kunci
│       │   │   ├── components/   # StoryPanel, KeywordMark, ChunkStepper
│       │   │   └── lib/          # keywordTokenizer.js (+ test)
│       │   ├── learn/            # Modul belajar 1–6 (renderer berbasis JSON)
│       │   │   ├── components/   # ModuleShell, WorkedExample, FadedStep, Reflection
│       │   │   └── lib/          # moduleEngine.js
│       │   ├── assessment/       # Pretest/Posttest
│       │   │   ├── components/   # ExamShell, StageForm, StageInput, SubmitDialog, Timer
│       │   │   └── lib/          # scoring.js (cermin backend), examGuard.js (+ test)
│       │   ├── pwa/              # InstallPrompt, UpdateBanner, OfflineBadge
│       │   └── teacher/          # komponen dasbor guru
│       ├── components/ui/        # Button, Card, Chip, Modal, BottomNav, ProgressBar, Toast
│       ├── data/
│       │   ├── instrumen_literasi.public.json  # ★ 4 butir + struktur tahap, TANPA kunci
│       │   │                                   #   (dibuat oleh scripts/strip-keys.js)
│       │   ├── keywords.json             # kamus kata kunci → daerah Venn
│       │   ├── symbols.json              # kartu simbol ∩ ∪ ᶜ − ∈ ∉
│       │   └── modules/                  # m1-simbol.json … m6-alasan.json
│       ├── db/
│       │   ├── index.js          # skema Dexie (profile, progress, attempts, answers, syncQueue)
│       │   └── sync.js           # pengiriman ulang antrean saat online
│       ├── services/
│       │   └── api.js            # fetch wrapper ke /api/v1
│       ├── store/                # Zustand: useSessionStore, useSettingsStore
│       ├── hooks/                # useOnline, useMediaQuery, useReducedMotionPref
│       ├── styles/
│       │   └── index.css         # @import "tailwindcss"; token warna --venn-*
│       └── utils/                # format angka, id generator
│
├── backend/
│   ├── pyproject.toml            # atau requirements.txt
│   ├── .env.example              # DATABASE_URL, JWT_SECRET, CORS_ORIGINS
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, router include
│   │   ├── config.py
│   │   ├── database.py           # SQLAlchemy engine/session
│   │   ├── models.py             # Teacher, Classroom, Student, Attempt, Answer, ModuleProgress
│   │   ├── schemas.py            # Pydantic
│   │   ├── routers/
│   │   │   ├── students.py
│   │   │   ├── attempts.py
│   │   │   ├── progress.py
│   │   │   └── teacher.py
│   │   ├── services/
│   │   │   ├── scoring.py        # skor otomatis per tahap, N-gain
│   │   │   └── export.py         # CSV/XLSX
│   │   └── data/
│   │       └── instrumen_literasi.json  # salinan kunci (sumber kebenaran skor)
│   ├── alembic/                  # migrasi DB
│   └── tests/
│       ├── test_scoring.py
│       └── test_attempts.py
│
├── analysis/
│   ├── requirements.txt          # pandas, scipy, openpyxl
│   ├── ngain.py                  # N-gain per siswa & kelas
│   ├── uji_statistik.py          # normalitas (Shapiro-Wilk), uji-t berpasangan / Wilcoxon
│   └── data/                     # ekspor CSV dari dasbor (JANGAN di-commit, ada di .gitignore)
│
└── .github/workflows/
    └── ci.yml                    # lint + test frontend & backend
```

## Prinsip Penataan

1. **Feature-first**: kode dikelompokkan per fitur (`features/venn`, `features/assessment`), bukan per jenis file.
2. **Logika murni di `lib/`**: geometri, ekspresi, penilaian, dan *tokenizer* adalah fungsi tanpa React sehingga mudah diuji.
3. **Konten sebagai data**: soal, modul, kata kunci, dan simbol disimpan di `src/data/*.json`. Guru/peneliti dapat merevisi konten tanpa menyentuh komponen.
4. **Halaman tipis**: `pages/` hanya merakit fitur dan rute.
5. **Instrumen = sumber tunggal**: `backend/app/data/instrumen_literasi.json` (lengkap dengan kunci) adalah acuan skor resmi. Frontend hanya memuat versi `.public.json` hasil `frontend/scripts/strip-keys.js`, sehingga kunci tidak ikut ter-bundle (lihat `CLAUDE.md`). Untuk mode demo tanpa backend, skor dihitung lokal dari salinan kunci yang dimuat terpisah (`VITE_DEMO_MODE=true`).
