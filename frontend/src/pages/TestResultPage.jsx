import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppStore } from '@/store/useAppStore.js';
import { api, backendEnabled, flushQueue } from '@/services/api.js';
import { nGain } from '@/features/assessment/lib/scoring.js';
import { bouncyIn } from '@/features/venn/lib/motion.js';
import Mascot from '@/components/ui/Mascot.jsx';

function ScoreBar({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div className="mt-1 h-5 overflow-hidden rounded-full border-2 border-line bg-lavender">
        <motion.div className={`h-full rounded-full border-r-2 border-white ${color}`} initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={{ type: 'spring', stiffness: 70, damping: 15, delay: 0.3 }} />
      </div>
    </div>
  );
}

const scoreOf = (r) => (r ? r.total ?? r.autoTotal : null);

export default function TestResultPage() {
  const { type } = useParams();
  const attempts = useAppStore((s) => s.attempts);
  const setAttemptResult = useAppStore((s) => s.setAttemptResult);
  const pending = useAppStore((s) => s.syncQueue.length);
  const [loading, setLoading] = useState(false);
  const attempt = attempts[type];

  if (!attempt || attempt.status !== 'submitted') return <Navigate to="/" replace />;
  const r = attempt.result;

  const refresh = async () => {
    setLoading(true);
    await flushQueue();
    try {
      setAttemptResult(type, { ...(await api.getAttempt(attempt.id)), source: 'server' });
    } catch {
      /* masih offline */
    }
    setLoading(false);
  };

  // Pretest: skor tidak ditampilkan agar tidak memengaruhi posttest (butir sama).
  if (type === 'pre') {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <div className="flex items-end justify-center gap-1">
          <Mascot mood="happy" size={88} />
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={bouncyIn} className="text-5xl">
            📝
          </motion.p>
        </div>
        <h1 className="text-2xl font-extrabold">Pretest selesai. Terima kasih!</h1>
        <p className="text-ink/70">Jawabanmu sudah tersimpan. Sekarang modul belajar sudah terbuka. Selamat menjelajah!</p>
        {backendEnabled && pending > 0 && <p className="text-sm text-amber-800">⏳ Jawaban akan terkirim otomatis saat ada internet.</p>}
        <Link to="/" className="btn btn-primary">
          Ke Peta Belajar →
        </Link>
      </div>
    );
  }

  const pre = attempts.pre?.result;
  const postScore = scoreOf(r);
  const preScore = scoreOf(pre);
  const max = r?.max ?? 24;
  const g = postScore !== null && preScore !== null ? nGain(preScore, postScore, max) : null;
  const provisional = (r?.pendingCount ?? 0) > 0 || (pre?.pendingCount ?? 0) > 0;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="text-center">
        <div className="flex items-end justify-center gap-1">
          <Mascot mood="wow" size={88} />
          <motion.p initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={bouncyIn} className="text-5xl">
            🏆
          </motion.p>
        </div>
        <h1 className="mt-2 text-2xl">
          <span className="title-sticker">Posttest selesai!</span>
        </h1>
      </div>

      {!r ? (
        <div className="card space-y-2 text-center">
          <p>Jawabanmu sudah tersimpan. Hasil akan muncul setelah terkirim ke server.</p>
          {backendEnabled && (
            <button type="button" className="btn btn-secondary" onClick={refresh} disabled={loading}>
              {loading ? 'Memuat…' : 'Muat hasil'}
            </button>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...bouncyIn, delay: 0.15 }} className="card space-y-3">
          {preScore !== null && <ScoreBar label="Pretest" value={preScore} max={max} color="bg-linear-to-r from-venn-a to-lilac" />}
          <ScoreBar label="Posttest" value={postScore} max={max} color="bg-linear-to-r from-pinky to-brand" />
          {g && (
            <p className="rounded-xl border-2 border-line bg-lavender px-3 py-2 text-sm text-violet-950">
              Peningkatan (N-gain): <b>{g.value.toFixed(2)}</b>, kategori <b>{g.category}</b>
            </p>
          )}
          {provisional && (
            <p className="rounded-xl border-2 border-line bg-butter px-3 py-2 text-sm text-amber-900">
              Skor ini <b>sementara</b>. Langkah yang berisi alasan/kesimpulan akan dinilai oleh guru.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {r.items.map((it, i) => (
              <motion.div
                key={it.no}
                initial={{ opacity: 0, y: 14, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...bouncyIn, delay: 0.5 + i * 0.08 }}
                className={`rounded-2xl border-2 border-line p-2 text-center ${['bg-blush', 'bg-lavender', 'bg-mint', 'bg-peach'][i % 4]}`}
              >
                <p className="font-bold">Soal {it.no}</p>
                <p className="text-lg font-extrabold">
                  {it.total ?? it.auto}/{it.max}
                </p>
                {it.pending > 0 && <p className="text-xs text-amber-800">{it.pending} menunggu guru</p>}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <Link to="/" className="btn btn-primary w-full">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
