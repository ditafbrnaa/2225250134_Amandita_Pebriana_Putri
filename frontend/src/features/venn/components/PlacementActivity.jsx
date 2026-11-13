import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import VennCanvas from './VennCanvas.jsx';
import SemestaTray from './SemestaTray.jsx';
import { checkPlacement } from '../lib/placement.js';
import { describeRegion, maskOf, FLOW_ORDER, REGION_NOTATION } from '../lib/regions.js';

/**
 * Menempatkan anggota semesta ke daerah Venn (IL02 & K03).
 * @param {{sets:{S:{label:string,members:any[]},A:{label:string,members:any[]},B:{label:string,members:any[]}}, onComplete?:()=>void}} props
 */
export default function PlacementActivity({ sets, onComplete }) {
  const initial = useMemo(
    () => sets.S.members.map((v, i) => ({ id: `t${i}-${v}`, value: v, mask: null, attempts: 0, shakeCount: 0 })),
    [sets],
  );
  const [tokens, setTokens] = useState(initial);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState(null);
  const [pulse, setPulse] = useState({ mask: null, key: 0 });
  const [shakeId, setShakeId] = useState(null);
  const labels = { A: sets.A.label, B: sets.B.label };

  const unplaced = tokens.filter((t) => t.mask === null);
  const finished = unplaced.length === 0;

  const place = (tokenId, mask) => {
    const token = tokens.find((t) => t.id === tokenId);
    if (!token || token.mask !== null) return;
    const res = checkPlacement(token.value, mask, sets, token.attempts + 1);
    if (res.ok) {
      const next = tokens.map((t) => (t.id === tokenId ? { ...t, mask } : t));
      setTokens(next);
      setSelectedId(null);
      setMessage({ ok: true, text: `✔ ${token.value} → ${describeRegion(mask, labels).name}` });
      if (next.every((t) => t.mask !== null)) onComplete?.();
    } else {
      setTokens((ts) => ts.map((t) => (t.id === tokenId ? { ...t, attempts: t.attempts + 1, shakeCount: t.shakeCount + 1 } : t)));
      setShakeId(tokenId);
      setMessage({ ok: false, text: res.hint });
      if (token.attempts + 1 >= 3) setPulse((p) => ({ mask: res.correctMask, key: p.key + 1 }));
    }
  };

  const demonstrate = () => {
    const t = unplaced[0];
    if (!t) return;
    const mask = maskOf(t.value, sets.A.members, sets.B.members);
    const inA = sets.A.members.includes(t.value);
    const inB = sets.B.members.includes(t.value);
    setTokens((ts) => ts.map((x) => (x.id === t.id ? { ...x, mask } : x)));
    setPulse((p) => ({ mask, key: p.key + 1 }));
    setMessage({
      ok: true,
      text: `Contoh: ${t.value} ${inA ? 'anggota' : 'bukan anggota'} ${labels.A} dan ${inB ? 'anggota' : 'bukan anggota'} ${labels.B}, jadi diletakkan di "${describeRegion(mask, labels).name}".`,
    });
  };

  const reset = () => {
    setTokens(initial);
    setMessage(null);
    setSelectedId(null);
  };

  const byRegion = (mask) => tokens.filter((t) => t.mask === mask).map((t) => t.value);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 text-sm cartoon">
        <p><b>S</b> = {sets.S.label}</p>
        <p><b className="text-blue-700">A</b> = {sets.A.label}</p>
        <p><b className="text-amber-700">B</b> = {sets.B.label}</p>
      </div>

      <VennCanvas
        labels={labels}
        tokens={tokens}
        pulseMask={pulse.mask}
        pulseKey={pulse.key}
        highlighted={[]}
        onRegionClick={(mask) => selectedId && place(selectedId, mask)}
        title="Diagram Venn tempat menaruh anggota"
      />

      <SemestaTray
        tokens={unplaced}
        total={sets.S.members.length}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDrop={place}
        shakeId={shakeId}
      />

      <AnimatePresence mode="wait">
        {message && (
          <motion.p
            key={message.text}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className={`rounded-xl px-3 py-2 text-sm ${message.ok ? 'border-2 border-line bg-mint text-emerald-900' : 'border-2 border-line bg-butter text-amber-900'}`}
          >
            {message.text}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {!finished && (
          <button type="button" className="btn btn-secondary" onClick={demonstrate}>
            Contohkan 1 langkah
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={reset}>
          Ulangi
        </button>
      </div>

      {finished && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border-2 border-line bg-mint p-3 text-sm text-emerald-950">
          <p className="mb-1 font-bold">🎉 Semua anggota semesta sudah ditempatkan!</p>
          {FLOW_ORDER.map((m) => (
            <p key={m} className="font-math">
              {REGION_NOTATION[m]} = {`{ ${byRegion(m).join(', ')} }`}
            </p>
          ))}
        </motion.div>
      )}
    </div>
  );
}
