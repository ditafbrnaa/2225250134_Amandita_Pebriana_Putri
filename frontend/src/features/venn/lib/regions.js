// Data daerah Diagram Venn 2 himpunan berbasis bitmask (A = 1, B = 2).

export const MASKS = [0, 1, 2, 3];

/** Urutan "aliran" saat warna berpindah: A saja → irisan → B saja → luar. */
export const FLOW_ORDER = [1, 3, 2, 0];

/** Warna daerah (hex agar bisa diinterpolasi Framer Motion). Sama dengan token --color-venn-* di CSS. */
export const REGION_COLORS = {
  0: '#BFEAD6', // luar (mint pastel)
  1: '#9CC9FF', // A saja (biru bayi)
  2: '#FFC39B', // B saja (peach)
  3: '#C9A9FF', // irisan (lavender)
};
/** Versi lebih pekat untuk garis tepi & pendar (glow) tiap daerah. */
export const REGION_GLOW = {
  0: '#4FBF8F',
  1: '#4F8FEF',
  2: '#F08A4B',
  3: '#9B6BFF',
};
export const NEUTRAL_FILL = '#FFFFFF';
export const SHADE_COLOR = '#7C3AED';

/** Notasi formal tiap daerah. */
export const REGION_NOTATION = {
  0: '(A ∪ B)ᶜ',
  1: 'A − B',
  2: 'B − A',
  3: 'A ∩ B',
};

/**
 * Deskripsi daerah dengan nama himpunan sesuai konteks soal.
 * @param {number} mask
 * @param {{A?:string,B?:string}} labels
 */
export function describeRegion(mask, labels = {}) {
  const a = labels.A ?? 'A';
  const b = labels.B ?? 'B';
  switch (mask) {
    case 3:
      return { name: `Irisan ${a} dan ${b}`, short: 'Keduanya', sentence: `anggota ${a} dan juga anggota ${b} (keduanya sekaligus)` };
    case 1:
      return { name: `Hanya ${a}`, short: `Hanya ${a}`, sentence: `hanya anggota ${a}, bukan anggota ${b}` };
    case 2:
      return { name: `Hanya ${b}`, short: `Hanya ${b}`, sentence: `hanya anggota ${b}, bukan anggota ${a}` };
    default:
      return { name: `Bukan ${a} maupun ${b}`, short: 'Di luar keduanya', sentence: `anggota semesta S, tetapi bukan anggota ${a} maupun ${b}` };
  }
}

/** Mask yang benar untuk sebuah anggota, berdasarkan keanggotaan di A dan B. */
export function maskOf(value, setA = [], setB = []) {
  return (setA.includes(value) ? 1 : 0) | (setB.includes(value) ? 2 : 0);
}
