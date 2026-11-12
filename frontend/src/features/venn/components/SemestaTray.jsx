import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/** Mencari daerah Venn (elemen ber-atribut data-mask) di bawah titik layar. */
function maskAtPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const region = el?.closest?.('[data-mask]');
  return region ? Number(region.getAttribute('data-mask')) : null;
}

function Token({ token, selected, onSelect, onDrop, shakeKey }) {
  const ref = useRef(null);
  return (
    <motion.button
      ref={ref}
      type="button"
      layout
      drag
      dragSnapToOrigin
      dragElastic={0.6}
      whileDrag={{ scale: 1.2, zIndex: 50, boxShadow: '0 10px 24px rgba(30,27,75,.25)' }}
      whileTap={{ scale: 0.92 }}
      onDragStart={() => {
        if (ref.current) ref.current.style.pointerEvents = 'none';
      }}
      onDragEnd={(event, info) => {
        const x = event.clientX ?? info.point.x - window.scrollX;
        const y = event.clientY ?? info.point.y - window.scrollY;
        const mask = maskAtPoint(x, y);
        if (ref.current) ref.current.style.pointerEvents = '';
        if (mask !== null) onDrop(token.id, mask);
      }}
      onClick={() => onSelect(selected ? null : token.id)}
      initial={{ scale: 0 }}
      animate={shakeKey ? { scale: 1, x: [0, -6, 6, -4, 4, 0] } : { scale: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      aria-pressed={selected}
      aria-label={`Anggota ${token.value}${selected ? ', dipilih' : ''}`}
      className={`grid h-11 w-11 cursor-grab touch-none place-items-center rounded-full border-2 text-base font-extrabold active:cursor-grabbing ${
        selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-ink bg-white text-ink'
      }`}
    >
      {token.value}
    </motion.button>
  );
}

/**
 * Baki Semesta: semua anggota S yang belum ditempatkan. Bisa diseret ke daerah,
 * atau ketuk token lalu ketuk daerah.
 */
export default function SemestaTray({ tokens, total, selectedId, onSelect, onDrop, shakeId, label = 'Semesta S' }) {
  const remaining = tokens.length;
  return (
    <div className="rounded-2xl bg-white p-3 shadow-card">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-bold text-ink">
          {label} <span className="font-normal text-ink/60">({total} anggota)</span>
        </span>
        <motion.span
          key={remaining}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${remaining ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}
        >
          {remaining ? `Belum ditempatkan: ${remaining}` : 'Semua sudah ditempatkan ✔'}
        </motion.span>
      </div>
      <div className="flex min-h-11 flex-wrap gap-2">
        <AnimatePresence>
          {tokens.map((t) => (
            <Token
              key={t.id}
              token={t}
              selected={selectedId === t.id}
              onSelect={onSelect}
              onDrop={onDrop}
              shakeKey={shakeId === t.id ? t.shakeCount : 0}
            />
          ))}
        </AnimatePresence>
      </div>
      {remaining > 0 && (
        <p className="mt-2 text-xs text-ink/60">Seret angka ke daerah yang tepat, atau ketuk angka lalu ketuk daerahnya.</p>
      )}
    </div>
  );
}
