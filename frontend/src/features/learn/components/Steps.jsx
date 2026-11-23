// Komponen langkah-langkah modul belajar. Setiap langkah memanggil onDone() saat siswa boleh lanjut.
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import VennCanvas from '@/features/venn/components/VennCanvas.jsx';
import ExploreActivity from '@/features/venn/components/ExploreActivity.jsx';
import ShadeChallenge from '@/features/venn/components/ShadeChallenge.jsx';
import PlacementActivity from '@/features/venn/components/PlacementActivity.jsx';
import TotalChecker from '@/features/venn/components/TotalChecker.jsx';
import StoryPanel from '@/features/story-reader/components/StoryPanel.jsx';
import { regionsFor } from '@/features/venn/lib/expression.js';
import { describeRegion, REGION_COLORS, FLOW_ORDER } from '@/features/venn/lib/regions.js';
import { useAppStore } from '@/store/useAppStore.js';
import symbols from '@/data/symbols.json';

const Feedback = ({ ok, children }) => (
  <motion.p
    initial={{ opacity: 0, y: 6 }}
    animate={ok ? { opacity: 1, y: 0, scale: [1, 1.04, 1] } : { opacity: 1, y: 0, x: [0, -6, 6, 0] }}
    role="status"
    className={`rounded-xl px-3 py-2 text-sm ${ok ? 'border-2 border-line bg-mint text-emerald-900' : 'border-2 border-line bg-butter text-amber-900'}`}
  >
    {ok ? '✔ ' : '🤔 '}
    {children}
  </motion.p>
);

// ---------------------------------------------------------------- intro
export function IntroStep({ step, onDone }) {
  useEffect(() => onDone(), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="card space-y-3">
      <h2 className="text-xl font-extrabold">{step.title}</h2>
      {step.body.map((p, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 * i }}
          className={p.includes('=') && p.includes('n(') ? 'rounded-xl border-2 border-line bg-babyblue px-3 py-2 text-center font-math text-lg font-bold text-violet-950' : ''}
        >
          {p}
        </motion.p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- kartu simbol
export function SymbolsStep({ onDone }) {
  const [open, setOpen] = useState(null);
  const [seen, setSeen] = useState([]);
  useEffect(() => {
    if (seen.includes('∩') && seen.includes('∪')) onDone();
  }, [seen]); // eslint-disable-line react-hooks/exhaustive-deps

  const card = symbols.find((s) => s.symbol === open);
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/70">Ketuk setiap kartu. Minimal buka kartu ∩ dan ∪ untuk lanjut.</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {symbols.map((s) => (
          <motion.button
            key={s.symbol}
            type="button"
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 17 }}
            onClick={() => {
              setOpen(s.symbol);
              setSeen((v) => (v.includes(s.symbol) ? v : [...v, s.symbol]));
            }}
            className={`aspect-square rounded-2xl border-2 font-math text-3xl font-bold ${
              open === s.symbol ? 'border-line bg-brand text-white cartoon-sm' : seen.includes(s.symbol) ? 'border-line bg-babyblue' : 'border-line bg-white'
            }`}
            aria-label={`Simbol ${s.name}`}
          >
            {s.symbol}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {card && (
          <motion.div
            key={card.symbol}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="card grid gap-3 sm:grid-cols-2"
          >
            <div>
              <p className="font-math text-4xl font-bold">{card.symbol}</p>
              <p className="text-lg font-extrabold">{card.name}</p>
              <p className="text-sm text-ink/80">{card.read}</p>
              <p className="mt-2 rounded-xl border-2 border-line bg-butter px-3 py-2 text-sm text-amber-900">💡 {card.tip}</p>
            </div>
            {card.expr && <VennCanvas highlighted={regionsFor(card.expr)} interactive={false} title={`Daerah ${card.expr}`} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------- kuis pilihan ganda
export function QuizStep({ step, onDone, onMistake }) {
  const [picked, setPicked] = useState(null);
  const correct = picked === step.answer;
  return (
    <div className="space-y-3">
      {step.story && <StoryPanel text={step.story} />}
      <div className="card space-y-3">
        <p className="text-lg font-bold">{step.question}</p>
        <div className="grid gap-2">
          {step.options.map((opt, i) => {
            const state = picked === null ? 'idle' : i === step.answer && correct ? 'right' : i === picked ? 'wrong' : 'idle';
            return (
              <motion.button
                key={i}
                type="button"
                whileHover={correct ? undefined : { y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                disabled={correct}
                onClick={() => {
                  setPicked(i);
                  if (i === step.answer) onDone();
                  else onMistake?.();
                }}
                animate={state === 'wrong' ? { x: [0, -6, 6, 0] } : {}}
                className={`min-h-11 rounded-2xl border-2 px-3 py-2 text-left font-semibold transition-colors ${
                  state === 'right' ? 'border-emerald-500 bg-mint' : state === 'wrong' ? 'border-amber-500 bg-peach' : 'border-line bg-white'
                }`}
              >
                <span className="font-math">{opt}</span>
              </motion.button>
            );
          })}
        </div>
        {picked !== null && <Feedback ok={correct}>{correct ? step.explain : 'Belum tepat, coba pilih jawaban lain.'}</Feedback>}
        {correct && step.highlight && <VennCanvas labels={step.labels} highlighted={step.highlight} interactive={false} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- eksplorasi / tugas daerah
export function ExploreStep({ step, onDone, onMistake }) {
  useEffect(() => {
    if (step.free) onDone();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="card">
      <ExploreActivity
        labels={step.labels}
        task={step.free ? undefined : { prompt: step.prompt, expr: step.expr, hint: step.hint, success: step.success, multi: step.multi }}
        onComplete={onDone}
        onMistake={onMistake}
      />
    </div>
  );
}

export function ShadeStep({ step, onDone, onMistake }) {
  return (
    <div className="card">
      <ShadeChallenge challenges={step.challenges} labels={step.labels} onComplete={onDone} onMistake={onMistake} />
    </div>
  );
}

export function PlaceStep({ step, onDone, onMistake }) {
  return <PlacementActivity sets={step.sets} onComplete={onDone} onMistake={onMistake} />;
}

// ---------------------------------------------------------------- contoh soal (worked example)
export function WorkedStep({ step, onDone }) {
  const [i, setI] = useState(0);
  const last = step.steps.length - 1;
  const counts = useMemo(() => Object.assign({}, ...step.steps.slice(0, i + 1).map((s) => s.counts)), [i, step.steps]);
  const cur = step.steps[i];
  useEffect(() => {
    if (i === last) onDone();
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-3 md:grid-cols-2 md:items-start">
      <div className="space-y-3">
        <StoryPanel text={step.story} />
        <div className="card space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
            {step.title} · Langkah {i + 1}/{step.steps.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.p key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="text-lg font-semibold">
              {cur.text}
            </motion.p>
          </AnimatePresence>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>
              ← Sebelumnya
            </button>
            <button type="button" className="btn btn-secondary" disabled={i === last} onClick={() => setI(i + 1)}>
              Langkah berikutnya →
            </button>
          </div>
        </div>
      </div>
      <div className="card sticky top-2">
        <VennCanvas labels={step.labels} highlighted={cur.highlight} counts={counts} interactive={false} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- soal cerita → isi daerah
export function StoryStep({ step, onDone, onMistake }) {
  const given = step.given ?? [];
  const [values, setValues] = useState(() => Object.fromEntries(given.map((m) => [m, String(step.answers[m])])));
  const [focus, setFocus] = useState([]);
  const [marks, setMarks] = useState({});
  const [status, setStatus] = useState(null);
  const [pulse, setPulse] = useState({ mask: null, key: 0 });
  const order = FLOW_ORDER;

  const setVal = (mask, v) => {
    setValues((s) => ({ ...s, [mask]: v.replace(/[^0-9]/g, '') }));
    setMarks({});
    setStatus(null);
  };

  const check = () => {
    const m = {};
    order.forEach((mask) => {
      m[mask] = Number(values[mask]) === step.answers[mask] && values[mask] !== '' && values[mask] !== undefined ? 'correct' : 'wrong';
    });
    setMarks(m);
    const ok = Object.values(m).every((x) => x === 'correct');
    setStatus(ok ? 'ok' : 'retry');
    if (ok) onDone();
    else onMistake?.();
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 md:items-start">
      <div className="space-y-3 md:order-1">
        <StoryPanel text={step.story} question={step.question} chunked={step.chunked} onKeyword={(k) => setFocus(k?.masks ?? [])} />
        <div className="card space-y-2">
          <p className="text-sm font-bold">{step.title}</p>
          {order.map((mask) => {
            const d = describeRegion(mask, step.labels);
            const isGiven = given.includes(mask);
            return (
              <label key={mask} className="flex items-center gap-2">
                <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: REGION_COLORS[mask] }} aria-hidden />
                <span className="flex-1 text-sm font-semibold">{d.name}</span>
                <input
                  className={`input w-24 text-center text-lg font-bold ${marks[mask] === 'wrong' ? 'border-amber-500' : marks[mask] === 'correct' ? 'border-emerald-500' : ''}`}
                  inputMode="numeric"
                  value={values[mask] ?? ''}
                  disabled={isGiven || status === 'ok'}
                  onFocus={() => setFocus([mask])}
                  onChange={(e) => setVal(mask, e.target.value)}
                  aria-label={`Banyak anggota daerah ${d.name}`}
                />
              </label>
            );
          })}
          <button type="button" className="btn btn-primary w-full" onClick={check} disabled={status === 'ok'}>
            Periksa
          </button>
          {status && (
            <Feedback ok={status === 'ok'}>
              {status === 'ok' ? 'Semua daerah tepat! Diagrammu sudah benar.' : 'Ada daerah yang belum tepat (bergaris merah). Mulailah dari irisan, lalu gunakan Cek Total.'}
            </Feedback>
          )}
        </div>
      </div>
      <div className="sticky top-2 z-10 space-y-2 md:order-2">
        <div className="card p-2">
          <VennCanvas
            labels={step.labels}
            highlighted={focus}
            counts={values}
            marks={marks}
            pulseMask={pulse.mask}
            pulseKey={pulse.key}
            onRegionClick={(m) => setFocus([m])}
          />
        </div>
        {step.total && <TotalChecker counts={values} total={step.total} onPulse={(m) => setPulse((p) => ({ mask: m, key: p.key + 1 }))} compact />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- isian angka
export function FillStep({ step, onDone, onMistake }) {
  const [value, setValue] = useState('');
  const [tries, setTries] = useState(0);
  const [ok, setOk] = useState(false);
  const check = () => {
    const good = Number(value) === step.answer;
    setOk(good);
    setTries((t) => t + 1);
    if (good) onDone();
    else onMistake?.();
  };
  return (
    <div className="space-y-3">
      {step.story && <StoryPanel text={step.story} />}
      <div className="card space-y-3">
        <p className="text-lg font-bold">{step.prompt}</p>
        <div className="flex gap-2">
          <input className="input w-32 text-center text-xl font-bold" inputMode="numeric" value={value} disabled={ok} onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))} aria-label="Jawaban" />
          <button type="button" className="btn btn-primary" onClick={check} disabled={!value || ok}>
            Periksa
          </button>
        </div>
        {tries > 0 && <Feedback ok={ok}>{ok ? step.explain : 'Belum tepat. Coba lagi, atau buka Bantuan Kak Venn di bawah.'}</Feedback>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- refleksi
export function ReflectionStep({ step, onDone, moduleId, index }) {
  const key = `${moduleId}.${index}`;
  const saved = useAppStore((s) => s.reflections[key]) ?? '';
  const save = useAppStore((s) => s.saveReflection);
  useEffect(() => {
    if (saved.trim().length >= 5) onDone();
  }, [saved]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="card space-y-2">
      <p className="text-lg font-bold">🪞 Refleksi</p>
      <p>{step.prompt}</p>
      <textarea className="input min-h-28" value={saved} onChange={(e) => save(key, e.target.value)} placeholder="Tulis jawabanmu di sini…" />
      <p className="text-xs text-ink/60">Tidak ada jawaban benar atau salah. Tulisanmu tersimpan otomatis.</p>
    </div>
  );
}

export const STEP_COMPONENTS = {
  intro: IntroStep,
  symbols: SymbolsStep,
  quiz: QuizStep,
  explore: ExploreStep,
  shade: ShadeStep,
  place: PlaceStep,
  worked: WorkedStep,
  story: StoryStep,
  fill: FillStep,
  reflection: ReflectionStep,
};
