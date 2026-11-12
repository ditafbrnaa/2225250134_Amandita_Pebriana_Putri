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

export const shake = { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.3 } };
export const pop = { scale: [1, 1.06, 1], transition: { duration: 0.28 } };
