// Penjaga validitas tes: di mode ujian SEMUA bantuan (scaffold) wajib mati.

export const SCAFFOLD_KEYS = ['keywords', 'chunking', 'totalCheck', 'feedback', 'hints', 'notation', 'regionNames'];

/** @param {'learn'|'exam'} mode */
export function scaffoldsFor(mode) {
  const on = mode !== 'exam';
  return Object.freeze(Object.fromEntries(SCAFFOLD_KEYS.map((k) => [k, on])));
}

/** Melempar galat (saat pengembangan) jika ada scaffold yang bocor ke mode ujian. */
export function assertExamSafe(scaffolds) {
  const leaked = SCAFFOLD_KEYS.filter((k) => scaffolds[k]);
  if (leaked.length) throw new Error(`Scaffold aktif di mode ujian: ${leaked.join(', ')}`);
  return true;
}

/** Penanda daerah netral untuk kanvas coretan ujian (tidak menyebut notasi/nama daerah). */
export const NEUTRAL_TAGS = { 1: '①', 3: '②', 2: '③', 0: '④' };
