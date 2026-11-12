import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import { useAppStore } from '@/store/useAppStore.js';
import { useOnline } from '@/hooks/useOnline.js';
import BottomNav from '@/components/ui/BottomNav.jsx';
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
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          exit={{ y: -40 }}
          className="fixed inset-x-0 top-0 z-50 bg-amber-400 py-1 text-center text-xs font-bold text-amber-950"
          role="status"
        >
          Sedang offline. Kamu tetap bisa belajar, dan data akan dikirim nanti.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Shell() {
  const location = useLocation();
  const examActive = useAppStore((s) => s.examActive);
  const hideNav = examActive || location.pathname === '/masuk';

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-28 pt-4 md:pb-8">
      {!hideNav && (
        <div className="mb-4 hidden md:block">
          <BottomNav />
        </div>
      )}
      <main>
        <Suspense fallback={<p className="p-8 text-center text-ink/60">Memuat…</p>}>
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
