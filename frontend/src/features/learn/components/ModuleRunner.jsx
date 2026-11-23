import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore.js';
import { syncLearning } from '@/services/api.js';
import { availableHints, hintsUnlocked, isGraded } from '@/features/learn/lib/rmt.js';
import { STEP_COMPONENTS } from './Steps.jsx';
import RmtPhaseBar from './RmtPhaseBar.jsx';
import HintLadder from './HintLadder.jsx';
import MediationCard from './MediationCard.jsx';

const EMPTY = {};

/**
 * Menjalankan satu modul langkah demi langkah mengikuti tahapan RMT
 * (fungsi kognitif → pembentukan konsep → penerapan & refleksi), dengan mediasi MLE di awal/akhir,
 * bantuan bertingkat (ZPD), dan pencatatan bantuan untuk asesmen dinamis.
 * @param {{ module:object, moduleIndex:number }} props
 */
export default function ModuleRunner({ module, moduleIndex }) {
  const navigate = useNavigate();
  const saved = useAppStore((s) => s.progress[module.id]);
  const setModuleStep = useAppStore((s) => s.setModuleStep);
  const completeModule = useAppStore((s) => s.completeModule);
  const logStep = useAppStore((s) => s.logStep);
  const log = useAppStore((s) => s.rmtLog[module.id]) ?? EMPTY;
  // Modul yang sudah tamat sebelumnya hanya diulang: tidak dicatat lagi agar data asesmen tetap asli.
  const [tracking] = useState(() => !saved?.done);
  // Salinan lokal (dipakai juga saat modul diulang tanpa dicatat): { [step]: { wrong, hints } }
  const [local, setLocal] = useState({});

  const [index, setIndex] = useState(() => Math.min(saved?.step ?? 0, module.steps.length - 1));
  const [doneSteps, setDoneSteps] = useState(() => new Set(saved?.done ? module.steps.map((_, i) => i) : []));
  const [dir, setDir] = useState(1);

  const step = module.steps[index];
  const Step = STEP_COMPONENTS[step.type];
  const isLast = index === module.steps.length - 1;
  const canNext = doneSteps.has(index);

  const graded = isGraded(step);
  const logged = log[index] ?? { wrong: 0, hints: 0 };
  const entry = { wrong: Math.max(logged.wrong, local[index]?.wrong ?? 0), hints: Math.max(logged.hints, local[index]?.hints ?? 0) };
  const hints = graded ? availableHints(step, moduleIndex) : [];

  const markDone = useCallback(() => {
    setDoneSteps((s) => (s.has(index) ? s : new Set(s).add(index)));
    if (tracking && graded) {
      logStep(module.id, index, { type: 'solved' });
      syncLearning(module.id);
    }
  }, [index, tracking, graded, logStep, module.id]);

  const onMistake = useCallback(() => {
    if (!graded) return;
    setLocal((l) => ({ ...l, [index]: { hints: 0, ...l[index], wrong: (l[index]?.wrong ?? 0) + 1 } }));
    if (tracking) logStep(module.id, index, { type: 'mistake' });
  }, [index, tracking, graded, logStep, module.id]);

  const onHint = (level) => {
    setLocal((l) => ({ ...l, [index]: { wrong: 0, ...l[index], hints: level } }));
    if (tracking) logStep(module.id, index, { type: 'hint', level });
  };

  const go = (to) => {
    setDir(to > index ? 1 : -1);
    setIndex(to);
    setModuleStep(module.id, to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finish = () => {
    completeModule(module.id);
    if (tracking) syncLearning(module.id);
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
            Langkah {index + 1} / {module.steps.length}
          </span>
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-babyblue">
          <motion.div className="h-full rounded-full bg-linear-to-r from-pinky to-brand" transition={{ type: 'spring', stiffness: 120, damping: 18 }} animate={{ width: `${((index + (canNext ? 1 : 0.5)) / module.steps.length) * 100}%` }} />
        </div>
      </div>

      <RmtPhaseBar phase={step.phase ?? 1} cognitive={step.cognitive} />

      {index === 0 && <MediationCard kind="start" mediation={module.mediation} />}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          initial={{ opacity: 0, x: 40 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 * dir }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {Step ? (
            <Step step={step} onDone={markDone} onMistake={onMistake} moduleId={module.id} index={index} />
          ) : (
            <p>Tipe langkah tidak dikenal: {step.type}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {hints.length > 0 && !canNext && (
        <HintLadder
          key={index}
          hints={hints}
          revealed={Math.min(entry.hints, hints.length)}
          unlocked={hintsUnlocked(moduleIndex, entry.wrong)}
          onReveal={onHint}
        />
      )}

      {isLast && <MediationCard kind="end" mediation={module.mediation} log={log} />}

      <div className="safe-bottom sticky bottom-20 z-20 flex gap-2 rounded-3xl bg-white p-2 cartoon md:bottom-2">
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
