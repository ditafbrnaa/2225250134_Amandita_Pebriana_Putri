import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

/** Ajakan "Pasang VennBuster" (Android/Chrome) + panduan untuk iPhone. */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('vb-install-dismissed') === '1');
  const [showIOS] = useState(() => isIOS() && !isStandalone());

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const installed = () => setDeferred(null);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('vb-install-dismissed', '1');
    setDismissed(true);
  };

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const visible = !dismissed && (deferred || showIOS);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3 rounded-2xl bg-violet-700 p-3 text-white"
        >
          <span className="text-2xl" aria-hidden>📲</span>
          <div className="flex-1 text-sm">
            <p className="font-bold">Pasang VennBuster di HP-mu</p>
            <p className="text-white/80">
              {deferred ? 'Bisa dibuka tanpa internet, seperti aplikasi biasa.' : 'Ketuk tombol Bagikan ⬆️ lalu pilih "Tambahkan ke Layar Utama".'}
            </p>
          </div>
          {deferred && (
            <button type="button" className="btn bg-white text-violet-800" onClick={install}>
              Pasang
            </button>
          )}
          <button type="button" className="btn btn-ghost text-white/80" onClick={dismiss} aria-label="Tutup">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
