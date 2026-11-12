import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import instrument from '@/data/generated/instrumen.public.json';
import modules from '@/data/modules.json';
import ExamItem from '@/features/assessment/components/ExamItem.jsx';
import { isAnswered } from '@/features/assessment/components/StageInput.jsx';
import { scaffoldsFor, assertExamSafe } from '@/features/assessment/lib/examGuard.js';
import { scoreAttempt } from '@/features/assessment/lib/scoring.js';
import { useAppStore } from '@/store/useAppStore.js';
import { api, backendEnabled, demoMode, queueSync, flushQueue } from '@/services/api.js';
import { computeGates } from '@/utils/gating.js';

const TITLES = { pre: 'Pretest', post: 'Posttest' };
const EXAM_SCAFFOLDS = scaffoldsFor('exam');
if (import.meta.env.DEV) assertExamSafe(EXAM_SCAFFOLDS);

/** Kunci jawaban hanya dimuat di mode demo (tree-shaken dari bundle saat VITE_DEMO_MODE=false). */
async function localScore(answers) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const { default: keys } = await import('@/data/generated/instrumen.keys.json');
    return { ...scoreAttempt(answers, keys), source: 'lokal' };
  }
  return null;
}

export default function TestPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const state = useAppStore();
  const { profile, attempts, startAttempt, setAnswer, setScratch, submitAttempt, setAttemptResult, setExamActive } = state;
  const attempt = attempts[type];
  const gates = computeGates(state, modules);
  const [itemIdx, setItemIdx] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const syncTimer = useRef(null);

  useEffect(() => {
    if (attempt?.status === 'in_progress') setExamActive(true);
    return () => setExamActive(false);
  }, [attempt?.status, setExamActive]);

  // Sinkronkan jawaban (debounce 1,5 detik). Data tetap aman di HP walau offline.
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || !backendEnabled) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      queueSync({
        method: 'PUT',
        path: `/attempts/${attempt.id}`,
        body: { type, started_at: attempt.startedAt, answers: attempt.answers, scratch: attempt.scratch },
        dedupeKey: `answers-${attempt.id}`,
      });
    }, 1500);
    return () => clearTimeout(syncTimer.current);
  }, [attempt, type]);

  const unanswered = useMemo(() => {
    if (!attempt) return 0;
    return instrument.items.reduce((n, item) => n + item.stages.filter((s) => !isAnswered(attempt.answers[`${item.no}.${s.no}`])).length, 0);
  }, [attempt]);

  if (!TITLES[type]) return <Navigate to="/" replace />;
  if (!profile) return <Navigate to="/masuk" replace />;
  if (attempt?.status === 'submitted') return <Navigate to={`/tes/${type}/hasil`} replace />;
  if (type === 'post' && !gates.postOpen) return <Navigate to="/" replace />;

  // ---------- layar pembuka ----------
  if (!attempt) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-extrabold">{TITLES[type]} Literasi Matematika</h1>
        <div className="card space-y-2">
          <p>Ada <b>{instrument.items.length} soal</b> cerita tentang Himpunan dan Diagram Venn. Setiap soal dikerjakan per langkah.</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink/80">
            <li>Kerjakan sendiri. Di tes ini <b>tidak ada petunjuk</b> atau sorotan kata kunci.</li>
            <li>Kamu boleh memakai kertas coretan Diagram Venn.</li>
            <li>Jawaban tersimpan otomatis, termasuk saat tidak ada internet.</li>
            <li>Setelah dikumpulkan, jawaban tidak bisa diubah.</li>
          </ul>
        </div>
        <button type="button" className="btn btn-primary w-full text-base" onClick={() => startAttempt(type)}>
          Mulai {TITLES[type]}
        </button>
      </div>
    );
  }

  const item = instrument.items[itemIdx];
  const last = itemIdx === instrument.items.length - 1;
  const answeredInItem = (it) => it.stages.every((s) => isAnswered(attempt.answers[`${it.no}.${s.no}`]));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    submitAttempt(type);
    let result = null;
    if (backendEnabled) {
      queueSync({
        method: 'PUT',
        path: `/attempts/${attempt.id}`,
        body: { type, started_at: attempt.startedAt, answers: attempt.answers, scratch: attempt.scratch },
        dedupeKey: `answers-${attempt.id}`,
      });
      queueSync({ method: 'POST', path: `/attempts/${attempt.id}/submit`, body: {}, dedupeKey: `submit-${attempt.id}` });
      await flushQueue();
      try {
        result = { ...(await api.getAttempt(attempt.id)), source: 'server' };
      } catch {
        result = null; // offline: hasil menyusul
      }
    }
    if (!result && demoMode) result = await localScore(attempt.answers);
    setAttemptResult(type, result);
    setExamActive(false);
    setSubmitting(false);
    navigate(`/tes/${type}/hasil`, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">{TITLES[type]}</h1>
        <nav className="flex gap-1.5" aria-label="Pilih soal">
          {instrument.items.map((it, i) => (
            <button
              key={it.no}
              type="button"
              onClick={() => setItemIdx(i)}
              aria-current={i === itemIdx}
              className={`relative grid h-10 w-10 place-items-center rounded-xl border-2 font-bold ${
                i === itemIdx ? 'border-violet-600 bg-violet-600 text-white' : 'border-ink/10 bg-white'
              }`}
            >
              {it.no}
              {answeredInItem(it) && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" aria-label="sudah dijawab" />}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={item.no} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          <ExamItem
            item={item}
            answers={attempt.answers}
            scratch={attempt.scratch[item.no]}
            onAnswer={(key, v) => setAnswer(type, key, v)}
            onScratch={(mask, v) => setScratch(type, item.no, mask, v)}
            scaffolds={EXAM_SCAFFOLDS}
          />
        </motion.div>
      </AnimatePresence>

      <div className="safe-bottom sticky bottom-2 z-20 flex gap-2 rounded-2xl bg-paper/90 py-2 backdrop-blur md:bottom-2">
        <button type="button" className="btn btn-ghost" disabled={itemIdx === 0} onClick={() => setItemIdx(itemIdx - 1)}>
          ← Soal sebelumnya
        </button>
        <div className="flex-1" />
        {last ? (
          <button type="button" className="btn btn-primary" onClick={() => setConfirm(true)}>
            Kumpulkan
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setItemIdx(itemIdx + 1)}>
            Soal berikutnya →
          </button>
        )}
      </div>

      <AnimatePresence>
        {confirm && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="dialog" aria-modal="true" className="card w-full max-w-sm space-y-3" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <p className="text-lg font-extrabold">Kumpulkan jawaban?</p>
              {unanswered > 0 ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Masih ada {unanswered} langkah yang kosong.</p>
              ) : (
                <p className="text-sm text-ink/70">Semua langkah sudah diisi.</p>
              )}
              <p className="text-sm text-ink/70">Setelah dikumpulkan, jawaban tidak bisa diubah lagi.</p>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setConfirm(false)} disabled={submitting}>
                  Periksa lagi
                </button>
                <button type="button" className="btn btn-primary flex-1" onClick={submit} disabled={submitting}>
                  {submitting ? 'Mengirim…' : 'Ya, kumpulkan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
