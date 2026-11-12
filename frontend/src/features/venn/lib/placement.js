// Validasi penempatan anggota (token) ke daerah Diagram Venn + petunjuk bertingkat.
import { maskOf, describeRegion } from './regions.js';

/**
 * @param {number|string} value  anggota yang ditempatkan
 * @param {number} droppedMask   daerah tujuan
 * @param {{A:{label:string,members:any[]}, B:{label:string,members:any[]}}} sets
 * @param {number} attempt       percobaan ke-berapa untuk token ini (1, 2, 3, ...)
 */
export function checkPlacement(value, droppedMask, sets, attempt = 1) {
  const correctMask = maskOf(value, sets.A.members, sets.B.members);
  if (correctMask === droppedMask) return { ok: true, correctMask, hint: null };

  const a = sets.A.label;
  const b = sets.B.label;
  const inA = (correctMask & 1) !== 0;
  const inB = (correctMask & 2) !== 0;
  let hint;
  if (attempt <= 1) {
    hint = `Coba periksa lagi: apakah ${value} anggota ${a}? Apakah ${value} anggota ${b}?`;
  } else if (attempt === 2) {
    hint = `${value} ${inA ? 'adalah' : 'bukan'} anggota ${a} dan ${inB ? 'adalah' : 'bukan'} anggota ${b}.`;
    if (correctMask === 0) hint += ' Anggota semesta yang bukan anggota keduanya tetap berada di dalam kotak S, di luar kedua lingkaran.';
  } else {
    hint = `Letakkan ${value} di daerah "${describeRegion(correctMask, { A: a, B: b }).name}" (daerah yang berkedip).`;
  }
  return { ok: false, correctMask, hint };
}
