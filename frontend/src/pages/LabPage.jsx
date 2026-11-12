import { useState } from 'react';
import { motion } from 'motion/react';
import ExploreActivity from '@/features/venn/components/ExploreActivity.jsx';
import ShadeChallenge from '@/features/venn/components/ShadeChallenge.jsx';
import PlacementActivity from '@/features/venn/components/PlacementActivity.jsx';
import { StoryStep } from '@/features/learn/components/Steps.jsx';

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">🧪 Venn Lab</h1>
        <p className="text-sm text-ink/60">Ruang bereksperimen bebas. Tidak ada nilai di sini.</p>
      </div>

      <div className="relative flex gap-1 rounded-2xl bg-ink/5 p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className="relative min-h-11 flex-1 rounded-xl px-2 text-sm font-bold"
          >
            {tab === t.id && <motion.span layoutId="lab-tab" className="absolute inset-0 rounded-xl bg-white shadow-card" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'explore' && (
        <div className="card">
          <p className="mb-2 text-sm text-ink/70">
            S = bilangan asli 1–12, <b className="text-blue-700">A</b> = kelipatan 2, <b className="text-amber-700">B</b> = kelipatan 3.
          </p>
          <ExploreActivity labels={{ A: 'Kelipatan 2', B: 'Kelipatan 3' }} members={MEMBERS} />
        </div>
      )}
      {tab === 'shade' && (
        <div className="card">
          <ShadeChallenge key={round} challenges={['A∩B', 'A∪B', 'Aᶜ', 'B−A', '(A∪B)ᶜ', '(A∩B)ᶜ']} onComplete={() => {}} />
        </div>
      )}
      {tab === 'place' && <PlacementActivity key={round} sets={LAB_SETS} />}
      {tab === 'count' && <StoryStep key={round} step={COUNT_PRACTICE} onDone={() => {}} />}

      {tab !== 'explore' && (
        <button type="button" className="btn btn-ghost" onClick={() => setRound((r) => r + 1)}>
          ↻ Mulai ulang
        </button>
      )}
    </div>
  );
}
