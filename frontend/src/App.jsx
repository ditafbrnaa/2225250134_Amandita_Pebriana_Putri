import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import { useAppStore } from '@/store/useAppStore.js';
import { useOnline } from '@/hooks/useOnline.js';
import BottomNav from '@/components/ui/BottomNav.jsx';
import CuteBackdrop from '@/components/ui/CuteBackdrop.jsx';
import Mascot from '@/components/ui/Mascot.jsx';
import { pageFade } from '@/features/venn/lib/motion.js';
import UpdateBanner from '@/features/pwa/UpdateBanner.jsx';
import HomePage from '@/pages/HomePage.jsx';
import JoinPage from '@/pages/JoinPage.jsx';
import LabPage from '@/pages/LabPage.jsx';
import ModulePage from '@/pages/ModulePage.jsx';
import TestPage from '@/pages/TestPage.jsx';
import TestResultPage from '@/pages/TestResultPage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';

// Dasbor guru jarang dibuka siswa → dimuat terpisah agar bundle awal kecil.
const TeacherPage = lazy(() => import('@/pages/teacher/TeacherPage.jsx'));

function OfflineBadge() {
  const online = useOnline();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          exit={{ y: -60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed inset-x-3 top-2 z-50 mx-auto max-w-md rounded-full bg-peach py-1.5 text-center text-xs font-semibold text-ink cartoon"
          role="status"
        >
          Sedang offline. Kamu tetap bisa belajar, dan data akan dikirim nanti.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Layar tugas: hiasan latar dibuat diam agar tidak ada animasi berulang tanpa henti (CLAUDE.md §6). */
const isTaskScreen = (path) => path.startsWith('/lab') || path.startsWith('/modul') || (path.startsWith('/tes/') && !path.endsWith('/hasil'));

function Shell() {
  const location = useLocation();
  const examActive = useAppStore((s) => s.examActive);
  const hideNav = examActive || location.pathname === '/masuk';

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-28 pt-4 md:pb-8">
      {/* Mode ujian: tanpa hiasan sama sekali agar siswa fokus. */}
      {!examActive && <CuteBackdrop animated={!isTaskScreen(location.pathname)} />}
      {!hideNav && (
        <div className="mb-4 hidden md:block">
          <BottomNav />
        </div>
      )}
      <main>
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-2 p-8 font-semibold text-ink" role="status">
              <Mascot mood="sleepy" size={72} bounce />
              Memuat…
            </div>
          }
        >
          <AnimatePresence mode="wait" initial={false}>
          {/* Sub-rute dasbor guru tidak dimuat ulang (state guru tetap). */}
          <motion.div key={location.pathname.startsWith('/guru') ? '/guru' : location.pathname} {...pageFade}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/masuk" element={<JoinPage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/modul/:id" element={<ModulePage />} />
            <Route path="/tes/:type" element={<TestPage />} />
            <Route path="/tes/:type/hasil" element={<TestResultPage />} />
            <Route path="/pengaturan" element={<SettingsPage />} />
            <Route path="/guru/*" element={<TeacherPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      {!hideNav && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { reduceMotion, fontScale } = useAppStore((s) => s.settings);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--font-scale', String(fontScale));
    root.dataset.reduceMotion = String(reduceMotion);
  }, [reduceMotion, fontScale]);

  return (
    // "user" → ikuti pengaturan HP; "always" → paksa kurangi animasi dari menu Pengaturan.
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <BrowserRouter>
        <OfflineBadge />
        <Shell />
        <UpdateBanner />
      </BrowserRouter>
    </MotionConfig>
  );
}
