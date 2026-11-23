// Logika Rigorous Mathematical Thinking (RMT) untuk modul belajar. Logika murni (tanpa React) agar mudah diuji.
//
// - ZPD (Vygotsky): bantuan diberikan bertingkat, lalu dikurangi bertahap dari modul ke modul (fading).
// - Dynamic assessment: yang dicatat bukan hanya benar/salah, tetapi BERAPA BANYAK bantuan yang dibutuhkan.
//   Logika yang sama ada di backend/app/services/rmt.py (untuk Dasbor Guru). Jaga keduanya tetap sama.
import rmt from '@/data/rmt.json';

export const RMT_PHASES = rmt.phases;
export const COGNITIVE_FUNCTIONS = rmt.cognitiveFunctions;
export const HINT_LEVEL_NAMES = rmt.hintLevels;

/** Tipe langkah yang punya jawaban benar/salah (dihitung dalam asesmen dinamis). */
export const GRADED_TYPES = ['quiz', 'fill', 'story', 'explore', 'shade', 'place'];

/** @param {{type:string, free?:boolean}} step */
export const isGraded = (step) => GRADED_TYPES.includes(step.type) && !step.free;

/**
 * Banyak tingkat petunjuk yang boleh dibuka di modul ini. Makin jauh modulnya, makin sedikit bantuannya
 * (Modul 1–2: 3 tingkat, Modul 3–4: 2 tingkat, Modul 5–6: 1 tingkat).
 * @param {number} moduleIndex indeks modul (mulai 0)
 */
export function hintBudget(moduleIndex) {
  if (moduleIndex <= 1) return 3;
  if (moduleIndex <= 3) return 2;
  return 1;
}

/**
 * Modul 1–2: petunjuk boleh dibuka kapan saja. Modul 3 dst.: siswa harus mencoba sendiri dulu (minimal 1 kali salah).
 * @param {number} moduleIndex
 * @param {number} wrong banyak percobaan salah pada langkah ini
 */
export function hintsUnlocked(moduleIndex, wrong) {
  return moduleIndex <= 1 || wrong >= 1;
}

/** Petunjuk yang tersedia untuk sebuah langkah, sudah dipotong sesuai jatah modul. */
export function availableHints(step, moduleIndex) {
  return (step.hints ?? []).slice(0, hintBudget(moduleIndex));
}

/**
 * Tingkat bantuan yang dibutuhkan untuk menyelesaikan satu langkah.
 * 0 = mandiri, 1 = bantuan ringan, 2 = bantuan banyak.
 * @param {{wrong?:number, hints?:number}} entry
 */
export function helpLevel({ wrong = 0, hints = 0 } = {}) {
  if (wrong === 0 && hints === 0) return 0;
  if (wrong <= 2 && hints <= 1) return 1;
  return 2;
}

/**
 * Ringkasan satu modul dari catatan langkahnya.
 * @param {Record<string, {wrong?:number, hints?:number, solved?:boolean}>} steps
 * @returns {{graded:number, mandiri:number, sedikit:number, banyak:number, hints:number, index:number|null}}
 */
export function moduleSummary(steps = {}) {
  const solved = Object.values(steps).filter((s) => s?.solved);
  const levels = solved.map(helpLevel);
  const count = (lv) => levels.filter((l) => l === lv).length;
  const index = solved.length ? levels.reduce((sum, l) => sum + (2 - l) / 2, 0) / solved.length : null;
  return {
    graded: solved.length,
    mandiri: count(0),
    sedikit: count(1),
    banyak: count(2),
    hints: solved.reduce((sum, s) => sum + (s.hints ?? 0), 0),
    index: index === null ? null : Math.round(index * 100) / 100,
  };
}

/** Label potensi belajar dari indeks kemandirian (0–1). */
export function potentialLabel(index) {
  if (index === null || index === undefined) return null;
  return rmt.potential.find((p) => index >= p.min).label;
}

/**
 * Tren kemandirian: modul terakhir − modul pertama yang sudah dikerjakan.
 * Positif = siswa makin mandiri setelah dibimbing (inti dynamic assessment).
 * @param {(number|null)[]} indices indeks kemandirian per modul, berurutan
 */
export function independenceTrend(indices) {
  const done = indices.filter((x) => x !== null && x !== undefined);
  if (done.length < 2) return null;
  return Math.round((done[done.length - 1] - done[0]) * 100) / 100;
}
