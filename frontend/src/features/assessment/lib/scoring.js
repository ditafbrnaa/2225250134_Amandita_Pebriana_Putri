// Penilaian pretest/posttest per tahap — cermin dari backend/app/services/scoring.py.
// Tahap numerik & pilihan dinilai otomatis; tahap uraian menunggu guru ("pending").
import instrument from '@/data/generated/instrumen.public.json';

/** Skor maksimum per soal menurut instrumen ({ 1: 6, ... }), total 24. */
const ITEM_MAX = Object.fromEntries(instrument.items.map((it) => [it.no, it.max_score]));

// ---------- Evaluator aritmetika kecil (tanpa eval) ----------
function evalArithmetic(src, x) {
  let i = 0;
  const peek = () => src[i];
  const expr = () => {
    let v = term();
    while (peek() === '+' || peek() === '-') v = src[i++] === '+' ? v + term() : v - term();
    return v;
  };
  const term = () => {
    let v = factor();
    while (peek() === '*' || peek() === '/') v = src[i++] === '*' ? v * factor() : v / factor();
    return v;
  };
  const factor = () => {
    const ch = peek();
    if (ch === '-') { i++; return -factor(); }
    if (ch === '+') { i++; return factor(); }
    if (ch === '(') { i++; const v = expr(); if (src[i++] !== ')') throw new Error('kurung'); return v; }
    if (ch === 'x') {
      i++;
      // perkalian implisit: 2x
      return x;
    }
    const m = /^\d+(?:\.\d+)?/.exec(src.slice(i));
    if (!m) throw new Error('angka');
    i += m[0].length;
    if (peek() === 'x') { i++; return Number(m[0]) * x; }
    return Number(m[0]);
  };
  const v = expr();
  if (i !== src.length) throw new Error('sisa');
  return v;
}

/** Menormalkan tulisan persamaan siswa. */
export function normalizeEquation(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[−–—]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/[:÷]/g, '/')
    .replace(/,/g, '.')
    .replace(/u/g, '∪');
}

/** Mencari solusi persamaan linear satu variabel (variabel apa pun / n(...) dianggap x). Null jika bukan persamaan linear sederhana. */
export function solveLinear(eq) {
  const s = normalizeEquation(eq).replace(/n\([^)]*\)/g, 'x').replace(/[a-z?∪∩]+/g, 'x');
  const parts = s.split('=');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !s.includes('x')) return null;
  if (!/^[0-9x+\-*/().=]+$/.test(s)) return null;
  try {
    const f = (x) => evalArithmetic(parts[0], x) - evalArithmetic(parts[1], x);
    const f0 = f(0);
    const slope = f(1) - f0;
    if (Math.abs(slope) < 1e-9) return null;
    const sol = -f0 / slope;
    return Math.abs(f(sol + 7) - (f0 + slope * (sol + 7))) < 1e-6 ? sol : null; // pastikan linear
  } catch {
    return null;
  }
}

const sides = (s) => s.split('=').map((p) => (/^[+-]/.test(p) ? p : `+${p}`).split(/(?=[+-])/).sort().join(''));
/** Kesetaraan bentuk rumus simbolik (urutan suku & sisi boleh ditukar). */
export function sameFormula(a, b) {
  const na = normalizeEquation(a);
  const nb = normalizeEquation(b);
  if (na === nb) return true;
  const [a1, a2] = sides(na);
  const [b1, b2] = sides(nb);
  if (a2 === undefined || b2 === undefined) return false;
  return (a1 === b1 && a2 === b2) || (a1 === b2 && a2 === b1);
}

const isBlank = (v) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (typeof v === 'object' && !v.choice && !v.text?.trim());

/**
 * Nilai satu tahap.
 * @returns {{score:number|null, max:number|null, status:'auto'|'pending'|'blank'|'unscored'}}
 */
export function scoreStage(value, k) {
  const max = k.score;
  if (max === null || max === undefined) return { score: null, max: null, status: 'unscored' };
  if (isBlank(value)) return { score: 0, max, status: 'blank' };

  switch (k.input) {
    case 'numeric':
      return { score: Number(String(value).replace(',', '.')) === Number(k.key) ? max : 0, max, status: 'auto' };
    case 'choice':
      return { score: value === k.key ? max : 0, max, status: 'auto' };
    case 'choice+text':
      return { score: value?.choice === k.key ? max : 0, max, status: 'auto' };
    case 'equation': {
      const keySol = solveLinear(k.key);
      if (keySol !== null) {
        const sol = solveLinear(value);
        if (sol !== null && Math.abs(sol - keySol) < 1e-9 && normalizeEquation(value).match(/\d+/g)?.length >= 2)
          return { score: max, max, status: 'auto' };
      } else if (sameFormula(value, k.key)) {
        return { score: max, max, status: 'auto' };
      }
      return { score: null, max, status: 'pending' }; // tidak cocok otomatis → guru yang menilai
    }
    default:
      return { score: null, max, status: 'pending' };
  }
}

/**
 * Nilai satu percobaan.
 * @param {Record<string, any>} answers  { "1.1": nilai }
 * @param {Record<string, object>} keys  isi instrumen.keys.json
 * @param {Record<number, number>} [itemMax]  skor maksimum per soal (default: max_score di instrumen)
 */
export function scoreAttempt(answers, keys, itemMax = ITEM_MAX) {
  const items = {};
  for (const [stageKey, k] of Object.entries(keys)) {
    const [itemNo, stageNo] = stageKey.split('.').map(Number);
    if (!k.input) continue; // tahap belum dikonfirmasi peneliti
    const r = scoreStage(answers[stageKey], k);
    items[itemNo] ??= { no: itemNo, stages: [], auto: 0, pending: 0, max: 0 };
    items[itemNo].stages.push({ no: stageNo, ...r });
    if (r.max) items[itemNo].max += r.max;
    if (r.status === 'pending') items[itemNo].pending += 1;
    else if (r.score) items[itemNo].auto += r.score;
  }
  const list = Object.values(items).sort((a, b) => a.no - b.no);
  // Skor maksimum mengikuti instrumen (6 per soal), bukan hanya jumlah tahap yang sudah punya soal.
  for (const it of list) if (itemMax[it.no] != null) it.max = itemMax[it.no];
  return {
    items: list,
    autoTotal: list.reduce((s, i) => s + i.auto, 0),
    pendingCount: list.reduce((s, i) => s + i.pending, 0),
    max: list.reduce((s, i) => s + i.max, 0),
  };
}

/** N-gain (Hake). */
export function nGain(pre, post, max) {
  if (max - pre === 0) return null;
  const g = (post - pre) / (max - pre);
  return { value: g, category: g >= 0.7 ? 'tinggi' : g >= 0.3 ? 'sedang' : 'rendah' };
}
