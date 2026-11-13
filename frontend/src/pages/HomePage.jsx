import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import modules from '@/data/modules.json';
import { useAppStore } from '@/store/useAppStore.js';
import { computeGates } from '@/utils/gating.js';
import InstallPrompt from '@/features/pwa/InstallPrompt.jsx';
import Logo from '@/components/ui/Logo.jsx';
import ChibiDuo from '@/components/ui/ChibiDuo.jsx';
import { chibiLine } from '@/utils/chibiLine.js';
import { bouncyIn, tapSpring } from '@/features/venn/lib/motion.js';

function Node({ to, open, done, icon, title, subtitle, index }) {
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...bouncyIn, delay: index * 0.05 }}
      whileHover={open ? { y: -3, scale: 1.01 } : undefined}
      whileTap={open ? { scale: 0.97 } : undefined}
      className={`flex items-center gap-3 rounded-3xl border-2 p-3 ${
        done
          ? 'border-line bg-mint cartoon'
          : open
            ? index % 2 ? 'bg-white cartoon-blue' : 'border-line bg-white cartoon'
            : `border-dashed bg-white/60 text-ink/70 ${index % 2 ? 'border-line-blue-deep' : 'border-line-deep'}`
      }`}
    >
      <motion.span
        initial={{ rotate: -20, scale: 0.6 }}
        animate={{ rotate: 0, scale: 1 }}
        whileHover={open ? { rotate: [0, -10, 10, 0], scale: 1.12 } : undefined}
        transition={{ ...bouncyIn, delay: 0.1 + index * 0.05 }}
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 text-2xl ${index % 2 ? 'border-line-blue' : 'border-line'} ${
          done ? 'bg-white' : open ? (index % 2 ? 'bg-linear-to-br from-babyblue to-blush' : 'bg-linear-to-br from-blush to-babyblue') : 'bg-ink/5'
        }`}
      >
        {done ? '✅' : open ? icon : '🔒'}
      </motion.span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">{title}</span>
        <span className="block truncate text-sm text-ink/70">{subtitle}</span>
      </span>
      {open && !done && (
        <motion.span
          className={index % 2 ? 'chip-sky' : 'chip-pastel'}
          initial={{ x: -6, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ ...bouncyIn, delay: 0.25 + index * 0.05 }}
        >
          Mulai →
        </motion.span>
      )}
    </motion.div>
  );
  return open && to ? (
    <Link to={to} className="block rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
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
  const firstName = profile?.name.split(' ')[0];
  const welcome = chibiLine('home', !profile ? 'guest' : gates.postDone ? 'allDone' : 'named', { name: firstName });

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={bouncyIn} whileHover={{ rotate: 8, scale: 1.08 }}>
          <Logo className="h-14 w-14" animated />
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-ink/75">
            Halo{firstName ? `, ${firstName}` : ''}!{' '}
            <motion.span
              aria-hidden
              className="inline-block origin-[70%_70%]"
              animate={{ rotate: [0, 18, -8, 18, -4, 0] }}
              transition={{ duration: 1.2, delay: 0.5 }}
            >
              👋
            </motion.span>
          </p>
          <h1 className="mt-1 text-2xl leading-tight">
            <motion.span
              className="title-sticker"
              initial={{ rotate: 4, scale: 0.8, opacity: 0 }}
              animate={{ rotate: -1.5, scale: 1, opacity: 1 }}
              transition={{ ...bouncyIn, delay: 0.15 }}
            >
              Peta Belajar
            </motion.span>{' '}
            <motion.span
              aria-hidden
              className="inline-block"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: [0, 1.4, 1], rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              ✨
            </motion.span>
          </h1>
        </div>
      </header>

      {/* Layar sambutan: Pinka & Minto melayang lembut (bukan layar tugas). */}
      <section className="card cartoon-blue overflow-hidden bg-linear-to-br from-blush via-white to-babyblue" aria-label="Sapaan">
        <ChibiDuo message={welcome.text} speaker={welcome.speaker} mood={welcome.mood} float size={92} />
      </section>

      {justFinished && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={bouncyIn}
          role="status"
          className="rounded-3xl bg-linear-to-r from-mint to-babyblue p-3 font-semibold text-ink cartoon"
        >
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
        <div className="mt-2 h-5 overflow-hidden rounded-full border-2 border-line bg-babyblue">
          <motion.div
            className="h-full rounded-full border-r-2 border-white bg-linear-to-r from-pinky via-pop-hover to-pop-blue"
            initial={{ width: 0 }}
            animate={{ width: `${(gates.doneCount / modules.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.2 }}
          />
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

      <Link to="/lab" className="block rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          transition={tapSpring}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-babyblue via-sky-soft to-blush p-4 text-ink cartoon-blue"
        >
          <p className="text-lg font-extrabold">🧪 Venn Lab</p>
          <p className="text-sm text-ink/75">Bebas bereksperimen dengan warna, arsiran, dan anggota himpunan kapan saja.</p>
          <span aria-hidden className="absolute -right-3 -top-3 h-16 w-16 rounded-full border-2 border-ink/20 bg-white/50" />
          <span aria-hidden className="absolute right-10 bottom-2 h-6 w-6 rounded-full bg-white/60" />
        </motion.div>
      </Link>
    </div>
  );
}
