import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { buttonHover, buttonTap, tapSpring } from '@/features/venn/lib/motion.js';
import ExploreActivity from '@/features/venn/components/ExploreActivity.jsx';
import ShadeChallenge from '@/features/venn/components/ShadeChallenge.jsx';
import PlacementActivity from '@/features/venn/components/PlacementActivity.jsx';
import { StoryStep } from '@/features/learn/components/Steps.jsx';
import ChibiDuo from '@/components/ui/ChibiDuo.jsx';
import { chibiLine } from '@/utils/chibiLine.js';

const LAB_SETS = {
  S: { label: 'Bilangan asli 1 sampai 12', members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  A: { label: 'Kelipatan 2', members: [2, 4, 6, 8, 10, 12] },
  B: { label: 'Kelipatan 3', members: [3, 6, 9, 12] },
};
const MEMBERS = { 1: [2, 4, 8, 10], 2: [3, 9], 3: [6, 12], 0: [1, 5, 7, 11] };

const COUNT_PRACTICE = {
  title: 'Isi setiap daerah',
  story: 'Dari 36 siswa, 20 siswa suka futsal, 15 siswa suka bulu tangkis, dan 6 siswa suka keduanya.',
  question: 'Isi semua daerah, lalu tekan Cek Total.',
  labels: { A: 'Futsal', B: 'Bulu tangkis' },
  total: 36,
  answers: { 3: 6, 1: 14, 2: 9, 0: 7 },
  given: [],
  chunked: false,
};

const TABS = [
  { id: 'explore', label: '🎨 Warnai' },
  { id: 'shade', label: '✏️ Arsir' },
  { id: 'place', label: '🔢 Tempatkan' },
  { id: 'count', label: '🧮 Hitung' },
];

export default function LabPage() {
  const [tab, setTab] = useState('explore');
  const [round, setRound] = useState(0);
  // Balon chibi: kalimat pembuka per tab, berganti saat siswa memilih operasi.
  const [opLine, setOpLine] = useState(null);
  const line = opLine ?? chibiLine('lab', tab);
  const changeTab = (id) => {
    setTab(id);
    setOpLine(null);
  };
  const onOperation = (opId) => setOpLine(chibiLine('operations', opId ?? 'cleared'));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl">
          <span className="title-sticker">🧪 Venn Lab</span>
        </h1>
        <p className="mt-2 text-sm text-ink/75">Ruang bereksperimen bebas. Tidak ada nilai di sini.</p>
      </div>

      {/* Layar tugas: chibi membal sekali saat pesan berganti, tidak melayang terus (CLAUDE.md §6). */}
      <ChibiDuo message={line.text} speaker={line.speaker} mood={line.mood} size={72} />

      <div className="relative flex gap-1 rounded-3xl bg-white p-1 cartoon" role="tablist">
        {TABS.map((t) => (
          <motion.button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => changeTab(t.id)}
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={tapSpring}
            className={`relative min-h-11 flex-1 rounded-2xl px-2 text-sm font-semibold ${tab === t.id ? 'text-ink' : 'text-ink/70'}`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="lab-tab"
                className="absolute inset-0 rounded-2xl bg-linear-to-br from-blush to-peach cartoon-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
      <motion.div key={`${tab}-${round}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
      {tab === 'explore' && (
        <div className="card">
          <p className="mb-2 text-sm text-ink/70">
            S = bilangan asli 1–12, <b className="text-blue-700">A</b> = kelipatan 2, <b className="text-amber-700">B</b> = kelipatan 3.
          </p>
          <ExploreActivity labels={{ A: 'Kelipatan 2', B: 'Kelipatan 3' }} members={MEMBERS} onOperation={onOperation} />
        </div>
      )}
      {tab === 'shade' && (
        <div className="card">
          <ShadeChallenge key={round} challenges={['A∩B', 'A∪B', 'Aᶜ', 'B−A', '(A∪B)ᶜ', '(A∩B)ᶜ']} onComplete={() => {}} />
        </div>
      )}
      {tab === 'place' && <PlacementActivity key={round} sets={LAB_SETS} />}
      {tab === 'count' && <StoryStep key={round} step={COUNT_PRACTICE} onDone={() => {}} />}
      </motion.div>
      </AnimatePresence>

      {tab !== 'explore' && (
        <button type="button" className="btn btn-ghost" onClick={() => setRound((r) => r + 1)}>
          ↻ Mulai ulang
        </button>
      )}
    </div>
  );
}
