import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import problems from '@/data/tutorProblems.json';
import ChibiDuo from '@/components/ui/ChibiDuo.jsx';
import { useAppStore } from '@/store/useAppStore.js';
import { api, backendEnabled } from '@/services/api.js';
import { useOnline } from '@/hooks/useOnline.js';
import { MAX_HINT_LEVEL, RMT_PHASES, nextHintLevel, tutorAccess } from '@/features/tutor/lib/tutorGuard.js';
import { formatReply } from '@/features/tutor/lib/formatReply.js';

const LOCKED = {
  'no-backend': 'Kak Venn butuh server sekolah. Versi ini belum terhubung ke server.',
  'no-login': 'Masuk dulu dengan namamu supaya bisa belajar bersama Kak Venn.',
  exam: 'Kak Venn istirahat dulu selama kamu mengerjakan tes. Kerjakan tesnya sendiri, ya!',
  'before-pretest': 'Kerjakan pretest dulu, ya. Setelah itu Kak Venn siap menemanimu berlatih.',
};
const HINT_LABEL = ['', 'Pertanyaan pemantik', 'Petunjuk strategi', 'Petunjuk langkah', 'Contoh soal serupa'];
const START_MESSAGE = 'Aku siap mengerjakan soal ini. Bimbing aku, ya.';

/** Penanda tahapan RMT (bukan tombol): naik sendiri saat Kak Venn menilai siswa siap ke tahap berikutnya. */
function PhaseBar({ phase }) {
  const current = RMT_PHASES[phase - 1];
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-2" role="status" aria-label={`Tahap ${phase} dari 3: ${current.name}`}>
      <p className="flex items-baseline justify-between gap-2 text-xs text-ink/70">
        <span>
          Tahap {phase} dari {RMT_PHASES.length}
        </span>
        <span className="font-bold text-ink">{current.name}</span>
      </p>
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {RMT_PHASES.map((p) => (
          <span key={p.no} className={`h-2 flex-1 rounded-full ${p.no <= phase ? 'bg-brand-pink' : 'bg-blush'}`} />
        ))}
      </div>
      <p className="mt-1 flex justify-between gap-1 text-[11px] text-ink/60" aria-hidden>
        {RMT_PHASES.map((p) => (
          <span
            key={p.no}
            className={`flex-1 ${p.no === 2 ? 'text-center' : p.no === 3 ? 'text-right' : ''} ${p.no === phase ? 'font-semibold text-ink' : ''}`}
          >
            {p.name}
          </span>
        ))}
      </p>
    </div>
  );
}

function Bubble({ role, text }) {
  const mine = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] break-words rounded-3xl px-4 py-2 text-[15px] leading-relaxed cartoon-sm ${
          mine ? 'whitespace-pre-wrap rounded-br-md bg-babyblue' : 'rounded-bl-md bg-white'
        }`}
      >
        {mine ? (
          text
        ) : (
          <>
            <span className="mb-0.5 block text-xs font-bold text-brand">Kak Venn</span>
            {formatReply(text).map((line, i) => (
              <p key={i} className={line.length ? '' : 'h-2'}>
                {line.map((seg, j) => (seg.bold ? <strong key={j}>{seg.text}</strong> : <span key={j}>{seg.text}</span>))}
              </p>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function TutorPage() {
  const { profile, attempts, examActive, unlockAll } = useAppStore();
  const online = useOnline();
  const access = tutorAccess({ backendEnabled, profile, attempts, examActive, unlockAll });

  const [problem, setProblem] = useState(null); // { id?, title, text }
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState(null);
  const [messages, setMessages] = useState([]); // [{ role, content }]
  const [phase, setPhase] = useState(1);
  const phaseRef = useRef(1); // nilai terbaru untuk dibandingkan di dalam send() (hindari closure basi)
  const [hintLevel, setHintLevel] = useState(0);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const composerRef = useRef(null);
  const inputRef = useRef(null);

  // Pesan terbaru harus terlihat DI ATAS kotak ketik yang menempel di bawah (dan navigasi bawah di HP).
  useLayoutEffect(() => {
    const end = endRef.current;
    const composer = composerRef.current;
    if (!end || !composer) return;
    const frame = requestAnimationFrame(() => {
      const overlap = end.getBoundingClientRect().bottom - (composer.getBoundingClientRect().top - 12);
      if (overlap > 0) window.scrollBy({ top: overlap, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, busy, error]);

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
    setError(null);
    window.scrollTo({ top: 0 });
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
    inputRef.current?.focus(); // keyboard HP tetap terbuka
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
            if (custom.trim().length < 10) {
              setCustomError('Tulis soal ceritanya dulu di kotak ini, minimal satu kalimat, ya.');
              return;
            }
            start({ title: 'Soalku', text: custom.trim() });
          }}
        >
          <label htmlFor="custom-problem" className="label">
            Atau tulis soal cerita himpunan dari buku/guru:
          </label>
          <textarea id="custom-problem" className="input min-h-24" maxLength={1500} value={custom} onChange={(e) => {
              setCustom(e.target.value);
              setCustomError(null);
            }}
            placeholder="Contoh: Dari 30 siswa, 18 suka futsal, 12 suka voli, dan 5 suka keduanya. Berapa siswa yang …"
            aria-describedby={customError ? 'custom-error' : undefined}
          />
          {customError && (
            <p id="custom-error" className="text-sm font-semibold text-brand-dark" role="alert">
              {customError}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={!online}>
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
            <Bubble key={i} role={m.role} text={m.content} />
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

      <div ref={composerRef} className="safe-bottom sticky bottom-20 z-20 space-y-2 rounded-3xl bg-white p-2 cartoon md:bottom-2">
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
            ref={inputRef}
            id="tutor-input"
            className="input min-w-0 flex-1"
            value={draft}
            maxLength={1200}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={online ? 'Tulis jawabanmu…' : 'Sedang offline…'}
            enterKeyHint="send"
            autoComplete="off"
            disabled={!online}
          />
          <button type="submit" className="btn btn-primary shrink-0" disabled={busy || !online || !draft.trim()}>
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
