// Penyorot kata kunci (EL05) & pemecah soal cerita (segmenting).
import KEYWORDS from '@/data/keywords.json';

function buildRegex(entries) {
  // Setiap entri satu grup tangkap; pola di dalamnya hanya memakai grup (?:...).
  return new RegExp(entries.map((e) => `\\b(${e.pattern})\\b`).join('|'), 'gi');
}

/**
 * Memecah teks menjadi segmen biasa dan segmen kata kunci.
 * @returns {{text:string, keyword?:object}[]}
 */
export function tokenizeKeywords(text, entries = KEYWORDS) {
  const re = buildRegex(entries);
  const out = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const idx = m.slice(1).findIndex((g) => g !== undefined);
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], keyword: entries[idx] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/**
 * Memecah soal cerita menjadi potongan informasi: per kalimat, setelah titik dua,
 * dan sebelum klausa yang dimulai dengan angka ("…, ada 22 siswa …", "…, dan 5 siswa …").
 */
export function chunkStory(text) {
  return text
    .split(/(?<=[.:?!])\s+|,\s+(?=(?:dan\s+)?(?:ada\s+|sebanyak\s+)?\d)/)
    .map((s) => s.trim())
    .filter(Boolean);
}
