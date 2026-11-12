import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/store/useAppStore.js';

/**
 * Memberi tahu bila versi baru tersedia. Tidak muncul saat siswa sedang tes,
 * supaya halaman tidak dimuat ulang di tengah ujian.
 */
export default function UpdateBanner() {
  const examActive = useAppStore((s) => s.examActive);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  const show = !examActive && (needRefresh || offlineReady);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink p-3 text-sm text-white shadow-card md:bottom-4"
          role="status"
        >
          <span className="flex-1">{needRefresh ? '✨ Versi baru VennBuster tersedia.' : '✔ VennBuster siap dipakai tanpa internet.'}</span>
          {needRefresh && (
            <button type="button" className="btn bg-white text-ink" onClick={() => updateServiceWorker(true)}>
              Muat ulang
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost text-white/70"
            onClick={() => {
              setNeedRefresh(false);
              setOfflineReady(false);
            }}
            aria-label="Tutup"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
