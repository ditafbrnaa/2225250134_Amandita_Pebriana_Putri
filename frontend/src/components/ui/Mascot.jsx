import { ChibiGirl, ChibiBoy } from './Chibi.jsx';

/**
 * Reaksi chibi kecil untuk status (memuat, hasil Cek Total, hasil tes).
 * happy/wow → Pinka, think/sleepy → Minto. Dekoratif; makna selalu ada di teks sebelahnya.
 * @param {{mood?: 'happy'|'think'|'wow'|'sleepy'|'cheer', size?: number, bounce?: boolean}} props
 *   bounce: melayang terus (hanya untuk layar memuat yang singkat).
 */
export default function Mascot({ mood = 'happy', size = 56, bounce = false }) {
  const width = size * 0.8;
  return mood === 'think' || mood === 'sleepy' ? (
    <ChibiBoy mood={mood} size={width} float={bounce} />
  ) : (
    <ChibiGirl mood={mood} size={width} float={bounce} />
  );
}
