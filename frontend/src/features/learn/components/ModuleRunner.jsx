import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore.js';
import { STEP_COMPONENTS } from './Steps.jsx';

/** Menjalankan satu modul langkah demi langkah (contoh → berpandu → mandiri → refleksi). */
export default function ModuleRunner({ module }) {
  const navigate = useNavigate();
  const saved = useAppStore((s) => s.progress[module.id]);
  const setModuleStep = useAppStore((s) => s.setModuleStep);
  const completeModule = useAppStore((s) => s.completeModule);

  const [index, setIndex] = useState(() => Math.min(saved?.step ?? 0, module.steps.length - 1));
  const [doneSteps, setDoneSteps] = useState(() => new Set(saved?.done ? module.steps.map((_, i) => i) : []));
  const [dir, setDir] = useState(1);

  const step = module.steps[index];
  const Step = STEP_COMPONENTS[step.type];
  const isLast = index === module.steps.length - 1;
  const canNext = doneSteps.has(index);

  const markDone = useCallback(() => setDoneSteps((s) => (s.has(index) ? s : new Set(s).add(index))), [index]);

  const go = (to) => {
    setDir(to > index ? 1 : -1);
    setIndex(to);
    setModuleStep(module.id, to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finish = () => {
    completeModule(module.id);
    navigate('/', { state: { finished: module.id } });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm font-semibold text-ink/60">
          <span>
            {module.icon} {module.process}
          </span>
          <span>
            {index + 1} / {module.steps.length}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10">
          <motion.div className="h-full rounded-full bg-violet-600" animate={{ width: `${((index + (canNext ? 1 : 0.5)) / module.steps.length) * 100}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          initial={{ opacity: 0, x: 40 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 * dir }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {Step ? <Step step={step} onDone={markDone} moduleId={module.id} index={index} /> : <p>Tipe langkah tidak dikenal: {step.type}</p>}
        </motion.div>
      </AnimatePresence>

      <div className="safe-bottom sticky bottom-16 z-20 flex gap-2 rounded-2xl bg-paper/90 py-2 backdrop-blur md:bottom-2">
        <button type="button" className="btn btn-ghost" onClick={() => go(index - 1)} disabled={index === 0}>
          ← Kembali
        </button>
        <div className="flex-1" />
        {isLast ? (
          <button type="button" className="btn btn-primary" onClick={finish} disabled={!canNext}>
            Selesai 🎉
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => go(index + 1)} disabled={!canNext}>
            Lanjut →
          </button>
        )}
      </div>
      {!canNext && <p className="text-center text-xs text-ink/60">Selesaikan aktivitas di atas untuk lanjut.</p>}
    </div>
  );
}
