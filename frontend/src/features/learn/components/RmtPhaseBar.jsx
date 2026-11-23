import { useState } from 'react';
import { motion } from 'motion/react';
import { COGNITIVE_FUNCTIONS, RMT_PHASES } from '@/features/learn/lib/rmt.js';

/**
 * Penanda tahapan RMT (Fungsi kognitif → Pembentukan konsep → Penerapan) dan fungsi kognitif langkah ini.
 * Fungsi kognitif ditampilkan dengan dua komponennya: konseptual ("apa") dan tindakan ("bagaimana").
 * @param {{ phase:number, cognitive?:string }} props
 */
export default function RmtPhaseBar({ phase, cognitive }) {
  const [open, setOpen] = useState(false);
  const current = RMT_PHASES.find((p) => p.no === phase) ?? RMT_PHASES[0];
  const fn = cognitive ? COGNITIVE_FUNCTIONS[cognitive] : null;

  return (
    <div className="space-y-2 rounded-2xl border-2 border-line bg-white p-2">
      <ol className="grid grid-cols-3 gap-1" aria-label={`Tahap RMT ${current.no} dari ${RMT_PHASES.length}: ${current.name}`}>
        {RMT_PHASES.map((p) => {
          const state = p.no < phase ? 'past' : p.no === phase ? 'now' : 'next';
          return (
            <li key={p.no} aria-current={state === 'now' ? 'step' : undefined} className="space-y-1 text-center">
              <div className="h-2 overflow-hidden rounded-full bg-babyblue">
                <motion.div
                  className="h-full rounded-full bg-brand"
                  initial={false}
                  animate={{ scaleX: state === 'next' ? 0 : 1 }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className={`text-[11px] leading-tight ${state === 'now' ? 'font-extrabold text-violet-800' : 'text-ink/60'}`}>
                {state === 'past' ? '✔ ' : ''}
                {p.no}. {p.name}
              </p>
            </li>
          );
        })}
      </ol>
      {fn && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center gap-2 rounded-xl bg-sky-soft px-2 py-1 text-left text-sm"
          >
            <span aria-hidden="true">🧠</span>
            <span className="flex-1">
              Latih cara berpikir: <b>{fn.label}</b>
            </span>
            <span className="text-xs font-semibold text-violet-700">{open ? 'Tutup' : 'Apa itu?'}</span>
          </button>
          {open && (
            <dl className="mt-1 grid gap-1 px-2 text-sm">
              <div>
                <dt className="inline font-bold">Apa: </dt>
                <dd className="inline">{fn.what}</dd>
              </div>
              <div>
                <dt className="inline font-bold">Caranya: </dt>
                <dd className="inline">{fn.how}</dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
