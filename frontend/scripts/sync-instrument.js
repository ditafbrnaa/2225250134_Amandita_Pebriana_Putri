// Menyalin instrumen dari backend (sumber tunggal) ke frontend:
//  - instrumen.public.json : teks soal + struktur tahap, TANPA kunci & rubrik
//  - instrumen.keys.json   : kunci jawaban, hanya dimuat jika VITE_DEMO_MODE=true
// Jalankan: npm run sync-instrument  (setiap kali instrumen di backend berubah)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../backend/app/data/instrumen_literasi.json');
const outDir = resolve(here, '../src/data/generated');
mkdirSync(outDir, { recursive: true });

const full = JSON.parse(readFileSync(src, 'utf8'));

const pub = {
  ...full,
  items: full.items.map(({ needs_confirmation, ...item }) => ({
    ...item,
    stages: item.stages
      .filter((s) => s.input) // tahap tanpa tipe isian (belum dikonfirmasi) tidak ditampilkan
      .map(({ key, rubric, needs_confirmation: _n, ...stage }) => stage),
  })),
};

const keys = {};
for (const item of full.items) {
  for (const s of item.stages) {
    keys[`${item.no}.${s.no}`] = { key: s.key ?? null, score: s.score, input: s.input, scoring: s.scoring ?? 'auto' };
  }
}

writeFileSync(resolve(outDir, 'instrumen.public.json'), JSON.stringify(pub, null, 2));
writeFileSync(resolve(outDir, 'instrumen.keys.json'), JSON.stringify(keys, null, 2));
console.log('✔ Instrumen disinkronkan ke src/data/generated/');
