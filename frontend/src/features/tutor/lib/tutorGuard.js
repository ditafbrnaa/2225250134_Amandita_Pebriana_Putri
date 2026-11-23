// Aturan kapan Tutor AI boleh dipakai. Logika murni (tanpa React) agar mudah diuji.

/** Tingkat petunjuk tertinggi (1 pemantik → 2 strategi → 3 langkah spesifik → 4 contoh serupa). */
export const MAX_HINT_LEVEL = 4;

export const RMT_PHASES = [
  { no: 1, name: 'Pahami Soal', desc: 'Pengembangan kognitif' },
  { no: 2, name: 'Gunakan Konsep', desc: 'Konten sebagai alat' },
  { no: 3, name: 'Cek & Refleksi', desc: 'Praktik' },
];

/**
 * @returns {{ open: boolean, reason?: 'no-backend'|'no-login'|'exam'|'before-pretest' }}
 * Tutor dikunci selama tes berlangsung dan sebelum pretest dikumpulkan (agar skor pretest murni).
 */
export function tutorAccess({ backendEnabled, profile, attempts = {}, examActive = false, unlockAll = false }) {
  if (!backendEnabled) return { open: false, reason: 'no-backend' };
  if (!profile?.token) return { open: false, reason: 'no-login' };
  const testRunning = examActive || Object.values(attempts).some((a) => a?.status === 'in_progress');
  if (testRunning) return { open: false, reason: 'exam' };
  if (!unlockAll && attempts.pre?.status !== 'submitted') return { open: false, reason: 'before-pretest' };
  return { open: true };
}

/** Tingkat petunjuk berikutnya (penghitung di-reset ke 0 oleh halaman saat tahap RMT naik). */
export function nextHintLevel(current) {
  return Math.min(current + 1, MAX_HINT_LEVEL);
}
