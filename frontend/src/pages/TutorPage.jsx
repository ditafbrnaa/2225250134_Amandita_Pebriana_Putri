import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import problems from '@/data/tutorProblems.json';
import ChibiDuo from '@/components/ui/ChibiDuo.jsx';
import { useAppStore } from '@/store/useAppStore.js';
import { api, backendEnabled } from '@/services/api.js';
import { useOnline } from '@/hooks/useOnline.js';
import { MAX_HINT_LEVEL, RMT_PHASES, nextHintLevel, tutorAccess } from '@/features/tutor/lib/tutorGuard.js';

const LOCKED = {
  'no-backend': 'Kak Venn butuh server sekolah. Versi ini belum terhubung ke server.',
  'no-login': 'Masuk dulu dengan namamu supaya bisa belajar bersama Kak Venn.',
  exam: 'Kak Venn istirahat dulu selama kamu mengerjakan tes. Kerjakan tesnya sendiri, ya!',
  'before-pretest': 'Kerjakan pretest dulu, ya. Setelah itu Kak Venn siap menemanimu berlatih.',
};
const HINT_LABEL = ['', 'Pertanyaan pemantik', 'Petunjuk strategi', 'Petunjuk langkah', 'Contoh soal serupa'];
const START_MESSAGE = 'Aku siap mengerjakan soal ini. Bimbing aku, ya.';

function PhaseBar({ phase }) {
  return (
    <ol className="flex gap-1" aria-label="Tahapan berpikir">
      {RMT_PHASES.map((p) => {
        const state = p.no < phase ? 'done' : p.no === phase ? 'now' : 'next';
        return (
          <li
            key={p.no}
            aria-current={state === 'now' ? 'step' : undefined}
            className={`flex-1 rounded-2xl px-2 py-1.5 text-center text-xs font-semibold cartoon-sm ${
              state === 'now' ? 'bg-pop text-ink' : state === 'done' ? 'bg-mint text-ink' : 'bg-white text-ink/60'
            }`}
          >
            <span aria-hidden>{state === 'done' ? '✔ ' : `${p.no}. `}</span>
            {p.name}
            <span className="block text-[10px] font-normal text-ink/70">{p.desc}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Bubble({ role, children }) {
  const mine = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
    >
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-2 text-[15px] leading-relaxed cartoon-sm ${
          mine ? 'rounded-br-md bg-babyblue' : 'rounded-bl-md bg-white'
        }`}
      >
        {!mine && <span className="mb-0.5 block text-xs font-bold text-brand">Kak Venn</span>}
        {children}
      </p>
    </motion.div>
  );
}

export default function TutorPage() {
  const { profile, attempts, examActive, unlockAll } = useAppStore();
  const online = useOnline();
  const access = tutorAccess({ backendEnabled, profile, attempts, examActive, unlockAll });

  const [problem, setProblem] = useState(null); // { id?, title, text }
  const [custom, setCustom] = useState('');
  const [messages, setMessages] = useState([]); // [{ role, content }]
  const [phase, setPhase] = useState(1);
  const phaseRef = useRef(1); // nilai terbaru untuk dibandingkan di dalam send() (hindari closure basi)
  const [hintLevel, setHintLevel] = useState(0);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [messages, busy]);

  if (!access.open) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl">
          <span className="title-sticker">🤖 Tutor Kak Venn</span>
        </h1>
        <ChibiDuo message={LOCKED[access.reason]} mood="sleepy" size={72} />
        {access.reason === 'no-login' && (
          <Link to="/masuk" className="btn btn-primary">
            Masuk
          </Link>
        )}
      </div>
    );
  }

  /** Mengirim satu giliran. `level` > 0 berarti siswa meminta petunjuk tingkat itu. */
  async function send(text, level = 0, base = messages, prob = problem) {
    const next = [...base, { role: 'user', content: text }];
    setMessages(next);
    setBusy(true);
    setError(null);
    try {
      const res = await api.tutorChat({ problem: prob.text, messages: next, hint_level: level });
      setMessages([...next, { role: 'assistant', content: res.reply }]);
      if (res.phase && res.phase > phaseRef.current) {
        phaseRef.current = res.phase;
        setPhase(res.phase);
        setHintLevel(0); // tahap baru → petunjuk mulai lagi dari yang paling umum
      }
    } catch (e) {
      setError({ message: e.message, retry: { text, level, base, prob } });
      setMessages(base);
    } finally {
      setBusy(false);
    }
  }

  function start(p) {
    setProblem(p);
    setMessages([]);
    phaseRef.current = 1;
    setPhase(1);
    setHintLevel(0);
    send(START_MESSAGE, 0, [], p);
  }

  function askHint() {
    const level = nextHintLevel(hintLevel);
    setHintLevel(level);
    send(`Aku butuh petunjuk (${HINT_LABEL[level].toLowerCase()}).`, level);
  }

  function submit(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    send(text, 0);
  }

  if (!problem) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl">
            <span className="title-sticker">🤖 Tutor Kak Venn</span>
          </h1>
          <p className="mt-2 text-sm text-ink/75">
            Kak Venn tidak memberi jawaban langsung. Kak Venn akan bertanya dan memberi petunjuk sedikit demi sedikit, supaya kamu bisa menemukan jawabannya sendiri.
          </p>
        </div>
        <ChibiDuo message="Pilih satu soal latihan, atau tulis soal ceritamu sendiri!" size={72} />
        <ul className="grid gap-3 sm:grid-cols-2">
          {problems.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => start(p)} disabled={!online} className="card w-full text-left disabled:opacity-60">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-bold">{p.title}</span>
                  <span className="chip-sky">{p.level}</span>
                </span>
                <span className="mt-1 block text-sm text-ink/80">{p.text}</span>
              </button>
            </li>
          ))}
        </ul>
        <form
          className="card space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (custom.trim().length >= 10) start({ title: 'Soalku', text: custom.trim() });
          }}
        >
          <label htmlFor="custom-problem" className="label">
            Atau tulis soal cerita himpunan dari buku/guru:
          </label>
          <textarea id="custom-problem" className="input min-h-24" maxLength={1500} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Contoh: Dari 30 siswa, 18 suka …" />
          <button type="submit" className="btn btn-primary" disabled={!online || custom.trim().length < 10}>
            Mulai dengan soal ini
          </button>
        </form>
        {!online && <p className="text-center text-sm text-ink/70">Kak Venn butuh internet. Sambungkan HP-mu dulu, ya.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button type="button" className="text-sm font-semibold text-violet-700" onClick={() => setProblem(null)}>
        ← Ganti soal
      </button>
      <div className="card">
        <p className="text-xs font-bold text-brand">📄 {problem.title}</p>
        <p className="mt-1 text-[15px]">{problem.text}</p>
      </div>
      <PhaseBar phase={phase} />

      <div className="space-y-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {messages.slice(1).map((m, i) => (
            <Bubble key={i} role={m.role}>
              {m.content}
            </Bubble>
          ))}
        </AnimatePresence>
        {busy && (
          <p className="text-sm text-ink/60" role="status">
            Kak Venn sedang berpikir…
          </p>
        )}
        {error && (
          <div className="rounded-2xl bg-peach p-3 text-sm" role="alert">
            {error.message}{' '}
            <button
              type="button"
              className="font-bold underline"
              onClick={() => send(error.retry.text, error.retry.level, error.retry.base, error.retry.prob)}
            >
              Coba lagi
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="safe-bottom sticky bottom-20 z-20 space-y-2 rounded-3xl bg-white p-2 cartoon md:bottom-2">
        <button
          type="button"
          className="btn btn-secondary w-full"
          onClick={askHint}
          disabled={busy || !online || messages.length < 2}
        >
          💡 Minta petunjuk
          {hintLevel > 0 && (
            <span className="text-xs font-normal">
              {' '}
              ({hintLevel}/{MAX_HINT_LEVEL}: {HINT_LABEL[hintLevel]})
            </span>
          )}
        </button>
        <form className="flex gap-2" onSubmit={submit}>
          <label htmlFor="tutor-input" className="sr-only">
            Tulis jawaban atau pertanyaanmu
          </label>
          <input
            id="tutor-input"
            className="input flex-1"
            value={draft}
            maxLength={1200}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={online ? 'Tulis jawaban atau pertanyaanmu…' : 'Sedang offline…'}
            disabled={busy || !online}
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !online || !draft.trim()}>
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
