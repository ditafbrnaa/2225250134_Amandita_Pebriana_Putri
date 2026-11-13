// Konfigurasi animasi bersama. Prinsip: animasi harus bermakna (menjelaskan perubahan daerah/perhitungan).
import { FLOW_ORDER } from './regions.js';

export const regionSpring = { type: 'spring', stiffness: 260, damping: 24 };
export const quick = { duration: 0.2 };
export const FLOW_STEP = 0.08;

/** Jeda aliran warna untuk sebuah daerah yang baru menyala. */
export function flowDelay(mask, litMasks) {
  const order = FLOW_ORDER.filter((m) => litMasks.includes(m));
  const i = order.indexOf(mask);
  return i < 0 ? 0 : i * FLOW_STEP;
}

/** Masuk "menggemaskan": membesar sambil memantul lembut. */
export const bouncyIn = { type: 'spring', stiffness: 220, damping: 13, mass: 0.9 };
/** Mikro-interaksi tombol. */
export const tapSpring = { type: 'spring', stiffness: 500, damping: 17 };
export const buttonHover = { y: -2, scale: 1.03 };
export const buttonTap = { scale: 0.93, y: 1 };
/**
 * Melayang halus saat diam. Sengaja TERBATAS (beberapa siklus lalu diam) agar tidak ada
 * animasi berulang tanpa henti di layar tugas (CLAUDE.md §6).
 */
export const FLOAT_CYCLES = 3;
export const floatIdle = { y: [0, -4, 0, 3, 0] };
export const floatTransition = { duration: 5, ease: 'easeInOut', repeat: FLOAT_CYCLES - 1, delay: 0.8 };
/** Transisi halus antar soal/tab/hasil. */
export const pageFade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

export const shake = { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.3 } };
export const pop = { scale: [1, 1.06, 1], transition: { duration: 0.28 } };
