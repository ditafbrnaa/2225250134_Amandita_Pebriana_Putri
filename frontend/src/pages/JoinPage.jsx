import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore.js';
import { api, backendEnabled } from '@/services/api.js';
import Logo from '@/components/ui/Logo.jsx';

export default function JoinPage() {
  const navigate = useNavigate();
  const setProfile = useAppStore((s) => s.setProfile);
  const [form, setForm] = useState({ name: '', nis: '', classCode: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'classCode' ? e.target.value.toUpperCase() : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) return setError('Tulis nama lengkapmu.');
    if (!form.classCode.trim()) return setError('Kode kelas wajib diisi (minta ke gurumu).');
    setBusy(true);
    try {
      let profile = { name: form.name.trim(), nis: form.nis.trim(), classCode: form.classCode.trim() };
      if (backendEnabled) {
        const res = await api.join({ name: profile.name, nis: profile.nis, class_code: profile.classCode });
        profile = { ...profile, studentId: res.student_id, token: res.token };
      }
      setProfile(profile);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-5 pt-6">
      <div className="text-center">
        <Logo className="mx-auto h-20 w-20" animated />
        <h1 className="mt-2 text-3xl font-extrabold">VennBuster</h1>
        <p className="text-ink/60">Taklukkan Himpunan & Diagram Venn!</p>
      </div>
      <form onSubmit={submit} className="card space-y-3" noValidate>
        <div>
          <label className="label" htmlFor="name">Nama lengkap</label>
          <input id="name" className="input" value={form.name} onChange={update('name')} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="nis">NIS / No. absen <span className="font-normal text-ink/50">(opsional)</span></label>
          <input id="nis" className="input" value={form.nis} onChange={update('nis')} inputMode="numeric" />
        </div>
        <div>
          <label className="label" htmlFor="code">Kode kelas</label>
          <input id="code" className="input font-mono tracking-widest" value={form.classCode} onChange={update('classCode')} placeholder="mis. 7A-VENN" />
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary w-full text-base" disabled={busy}>
          {busy ? 'Memproses…' : 'Masuk'}
        </button>
        {!backendEnabled && <p className="text-center text-xs text-ink/50">Mode offline: data disimpan di perangkat ini saja.</p>}
      </form>
    </div>
  );
}
