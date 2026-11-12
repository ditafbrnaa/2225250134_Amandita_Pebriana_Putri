// Mesin ekspresi himpunan: mengubah teks seperti "(A ∪ B)ᶜ" menjadi predikat atas mask daerah.
// Tata bahasa (prioritas tinggi → rendah):  komplemen (ᶜ atau ')  >  ∩  >  ∪ dan − (asosiatif kiri)
import { MASKS } from './regions.js';

const SET_BITS = { A: 1, B: 2, C: 4 };

function tokenize(src) {
  const tokens = [];
  const s = src.replace(/\s+/g, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch in SET_BITS || ch === 'S') tokens.push({ t: 'set', v: ch });
    else if (ch === '∪' || ch === 'U' || ch === '+') tokens.push({ t: 'op', v: '∪' });
    else if (ch === '∩' || ch === '^' || ch === '&') tokens.push({ t: 'op', v: '∩' });
    else if (ch === '−' || ch === '-' || ch === '\\') tokens.push({ t: 'op', v: '−' });
    else if (ch === 'ᶜ' || ch === "'" || ch === '’') tokens.push({ t: 'comp' });
    else if (ch === '(' || ch === ')') tokens.push({ t: ch });
    else throw new Error(`Simbol tidak dikenal: "${ch}"`);
  }
  return tokens;
}

/**
 * Mengubah ekspresi menjadi fungsi (mask) => boolean.
 * @param {string} expr
 * @returns {(mask:number)=>boolean}
 */
export function parseExpression(expr) {
  const tokens = tokenize(expr);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseUnionDiff() {
    let left = parseIntersect();
    while (peek()?.t === 'op' && (peek().v === '∪' || peek().v === '−')) {
      const op = next().v;
      const right = parseIntersect();
      const l = left;
      left = op === '∪' ? (m) => l(m) || right(m) : (m) => l(m) && !right(m);
    }
    return left;
  }
  function parseIntersect() {
    let left = parsePostfix();
    while (peek()?.t === 'op' && peek().v === '∩') {
      next();
      const right = parsePostfix();
      const l = left;
      left = (m) => l(m) && right(m);
    }
    return left;
  }
  function parsePostfix() {
    let node = parseAtom();
    while (peek()?.t === 'comp') {
      next();
      const inner = node;
      node = (m) => !inner(m);
    }
    return node;
  }
  function parseAtom() {
    const tok = next();
    if (!tok) throw new Error('Ekspresi belum lengkap.');
    if (tok.t === 'set') {
      if (tok.v === 'S') return () => true;
      const bit = SET_BITS[tok.v];
      return (m) => (m & bit) !== 0;
    }
    if (tok.t === '(') {
      const inner = parseUnionDiff();
      if (next()?.t !== ')') throw new Error('Kurung tutup ")" hilang.');
      return inner;
    }
    throw new Error('Ekspresi tidak valid.');
  }

  const fn = parseUnionDiff();
  if (pos !== tokens.length) throw new Error('Ada simbol berlebih di akhir ekspresi.');
  return (m) => Boolean(fn(m));
}

/** Daftar mask yang termasuk dalam ekspresi. */
export function regionsFor(expr, masks = MASKS) {
  const fn = parseExpression(expr);
  return masks.filter(fn);
}

/** Operasi yang tersedia di Bilah Operasi. `word` selalu ditampilkan di samping simbol (IL01). */
export const OPERATIONS = [
  { id: 'A∩B', label: 'A ∩ B', word: 'irisan', hint: 'Anggota yang dimiliki A dan B sekaligus.' },
  { id: 'A∪B', label: 'A ∪ B', word: 'gabungan', hint: 'Semua anggota A atau B (minimal salah satu).' },
  { id: 'Aᶜ', label: 'Aᶜ', word: 'komplemen A', hint: 'Anggota semesta yang bukan anggota A.' },
  { id: 'Bᶜ', label: 'Bᶜ', word: 'komplemen B', hint: 'Anggota semesta yang bukan anggota B.' },
  { id: 'A−B', label: 'A − B', word: 'selisih', hint: 'Anggota A yang bukan anggota B (hanya A).' },
  { id: 'B−A', label: 'B − A', word: 'selisih', hint: 'Anggota B yang bukan anggota A (hanya B).' },
  { id: '(A∪B)ᶜ', label: '(A ∪ B)ᶜ', word: 'bukan keduanya', hint: 'Di dalam semesta, tetapi di luar A dan B.' },
];

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/** Menebak operasi yang cocok dengan daerah-daerah yang dipilih siswa. */
export function matchOperation(selectedMasks) {
  if (!selectedMasks.length) return null;
  if (selectedMasks.length === 4) return { id: 'S', label: 'S', word: 'semesta', hint: 'Seluruh anggota semesta.' };
  return OPERATIONS.find((op) => sameSet(regionsFor(op.id), selectedMasks)) ?? null;
}
