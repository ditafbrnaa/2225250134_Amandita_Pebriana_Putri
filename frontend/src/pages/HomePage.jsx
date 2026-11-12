import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import modules from '@/data/modules.json';
import { useAppStore } from '@/store/useAppStore.js';
import { computeGates } from '@/utils/gating.js';
import InstallPrompt from '@/features/pwa/InstallPrompt.jsx';
import Logo from '@/components/ui/Logo.jsx';

function Node({ to, open, done, icon, title, subtitle, index }) {
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={open ? { y: -2 } : undefined}
      whileTap={open ? { scale: 0.98 } : undefined}
      className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${
        done ? 'border-emerald-300 bg-emerald-50' : open ? 'border-violet-300 bg-white shadow-card' : 'border-ink/5 bg-ink/5 opacity-60'
      }`}
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${done ? 'bg-emerald-200' : open ? 'bg-violet-100' : 'bg-ink/10'}`}>
        {done ? '✅' : open ? icon : '🔒'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">{title}</span>
        <span className="block truncate text-sm text-ink/60">{subtitle}</span>
      </span>
      {open && !done && <span className="text-violet-600">→</span>}
    </motion.div>
  );
  return open && to ? (
    <Link to={to} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-venn-hl">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function HomePage() {
  const state = useAppStore();
  const { profile } = state;
  const gates = computeGates(state, modules);
  const location = useLocation();
  const justFinished = modules.find((m) => m.id === location.state?.finished);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Logo className="h-12 w-12" />
        <div>
          <p className="text-sm text-ink/60">Halo{profile ? `, ${profile.name.split(' ')[0]}` : ''}! 👋</p>
          <h1 className="text-2xl font-extrabold leading-tight">Peta Belajar</h1>
        </div>
      </header>

      {justFinished && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-emerald-100 p-3 font-semibold text-emerald-900">
          🎉 Modul "{justFinished.title}" selesai!
        </motion.div>
      )}

      {!profile && (
        <div className="card space-y-2">
          <p className="font-semibold">Masuk dulu dengan kode kelas dari gurumu.</p>
          <Link to="/masuk" className="btn btn-primary">
            Masuk
          </Link>
        </div>
      )}

      <InstallPrompt />

      <div className="card">
        <div className="flex justify-between text-sm font-semibold">
          <span>Progres modul</span>
          <span>
            {gates.doneCount}/{modules.length}
          </span>
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-ink/10">
          <motion.div className="h-full rounded-full bg-linear-to-r from-venn-a via-venn-ab to-venn-b" animate={{ width: `${(gates.doneCount / modules.length) * 100}%` }} />
        </div>
      </div>

      <ol className="space-y-2.5">
        <li>
          <Node
            index={0}
            to={gates.preDone ? '/tes/pre/hasil' : '/tes/pre'}
            open={Boolean(profile)}
            done={gates.preDone}
            icon="📝"
            title="Pretest"
            subtitle={gates.preDone ? 'Sudah dikerjakan' : 'Kerjakan dulu sebelum mulai belajar'}
          />
        </li>
        {modules.map((m, i) => (
          <li key={m.id}>
            <Node
              index={i + 1}
              to={`/modul/${m.id}`}
              open={Boolean(profile) && gates.moduleOpen(i)}
              done={Boolean(state.progress[m.id]?.done)}
              icon={m.icon}
              title={`${i + 1}. ${m.title}`}
              subtitle={m.summary}
            />
          </li>
        ))}
        <li>
          <Node
            index={modules.length + 1}
            to={gates.postDone ? '/tes/post/hasil' : '/tes/post'}
            open={Boolean(profile) && (gates.postOpen || gates.postDone)}
            done={gates.postDone}
            icon="🏆"
            title="Posttest"
            subtitle={gates.postDone ? 'Lihat hasilmu' : 'Terbuka setelah semua modul selesai'}
          />
        </li>
      </ol>

      <Link to="/lab" className="block">
        <motion.div whileTap={{ scale: 0.98 }} className="rounded-2xl bg-ink p-4 text-white">
          <p className="text-lg font-extrabold">🧪 Venn Lab</p>
          <p className="text-sm text-white/70">Bebas bereksperimen dengan warna, arsiran, dan anggota himpunan kapan saja.</p>
        </motion.div>
      </Link>
    </div>
  );
}
