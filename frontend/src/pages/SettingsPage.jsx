import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore.js';
import { backendEnabled, demoMode, flushQueue } from '@/services/api.js';

function Toggle({ checked, onChange, label, desc }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
      <span>
        <span className="block font-bold">{label}</span>
        {desc && <span className="block text-sm text-ink/60">{desc}</span>}
      </span>
      <input type="checkbox" className="h-6 w-6 accent-pink-500" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function SettingsPage() {
  const { profile, settings, setSetting, unlockAll, setUnlockAll, resetAll, syncQueue } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">⚙️ Pengaturan</h1>

      {profile && (
        <div className="card">
          <p className="font-bold">{profile.name}</p>
          <p className="text-sm text-ink/60">
            {profile.nis && `NIS ${profile.nis} · `}Kelas {profile.classCode}
          </p>
        </div>
      )}

      <div className="card divide-y divide-ink/10">
        <Toggle
          label="Kurangi animasi"
          desc="Untuk HP yang lambat atau jika animasi terasa mengganggu."
          checked={settings.reduceMotion}
          onChange={(v) => setSetting('reduceMotion', v)}
        />
        <div className="py-2">
          <p className="font-bold">Ukuran huruf</p>
          <div className="mt-2 flex gap-2">
            {[
              [0.9, 'Kecil'],
              [1, 'Normal'],
              [1.15, 'Besar'],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setSetting('fontScale', v)}
                className={`btn flex-1 border-2 ${settings.fontScale === v ? 'border-line bg-butter text-ink' : 'border-line bg-white'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {backendEnabled && (
        <div className="card flex items-center justify-between gap-2">
          <span className="text-sm">{syncQueue.length ? `⏳ ${syncQueue.length} data menunggu dikirim` : '✔ Semua data sudah terkirim'}</span>
          <button type="button" className="btn btn-secondary" onClick={flushQueue}>
            Kirim sekarang
          </button>
        </div>
      )}

      {demoMode && (
        <div className="card border-2 border-dashed border-amber-300">
          <Toggle
            label="Buka semua modul & posttest (mode demo)"
            desc="Hanya untuk uji coba/validasi ahli. Matikan saat penelitian."
            checked={unlockAll}
            onChange={setUnlockAll}
          />
        </div>
      )}

      <div className="card space-y-2">
        {/* Dasbor guru hanya muncul bila backend diatur (VITE_API_URL). */}
        {backendEnabled && (
          <Link to="/guru" className="btn btn-ghost w-full justify-start">
            👩‍🏫 Halaman guru
          </Link>
        )}
        {!confirmReset ? (
          <button type="button" className="btn btn-ghost w-full justify-start text-red-700" onClick={() => setConfirmReset(true)}>
            🗑️ Keluar & hapus data di perangkat ini
          </button>
        ) : (
          <div className="rounded-xl border-2 border-line bg-blush p-3 text-sm text-red-900">
            <p className="mb-2">Semua progres & jawaban di perangkat ini akan dihapus. Lanjutkan?</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setConfirmReset(false)}>
                Batal
              </button>
              <button type="button" className="btn flex-1 bg-red-600 text-white" onClick={() => { resetAll(); setConfirmReset(false); }}>
                Hapus
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-ink/40">VennBuster v1.0 · Pendidikan Matematika UNTIRTA</p>
    </div>
  );
}
