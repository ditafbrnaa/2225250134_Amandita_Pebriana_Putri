// Suara klik "pop" lembut, dibuat langsung dengan Web Audio API.
// Tanpa file audio → tetap jalan offline dan tidak menambah ukuran bundle.

let ctx = null;
let enabled = true;

/** Nyalakan/matikan semua suara (dari menu Pengaturan). */
export function setSoundEnabled(value) {
  enabled = Boolean(value);
}

export function isSoundEnabled() {
  return enabled;
}

function getContext() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/**
 * Bunyi "pop" pendek (±120 ms) dengan nada sedikit bervariasi agar tidak monoton.
 * @param {'pop'|'soft'} [kind]  'soft' untuk kotak centang/pilihan kecil.
 * @returns {boolean} true bila suara dimainkan.
 */
export function playClick(kind = 'pop') {
  if (!enabled) return false;
  const c = getContext();
  if (!c) return false;

  const t = c.currentTime;
  const base = kind === 'soft' ? 660 : 880;
  const start = base * (0.95 + Math.random() * 0.1);

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(start, t);
  osc.frequency.exponentialRampToValueAtTime(start / 2, t + 0.09);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(kind === 'soft' ? 0.1 : 0.16, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.13);
  return true;
}
