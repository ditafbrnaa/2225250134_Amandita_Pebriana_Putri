import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request, backendEnabled } from '@/services/api.js';

const TOKEN_KEY = 'vb-teacher-token';
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await request('/teacher/login', { method: 'POST', body: { pin } });
      sessionStorage.setItem(TOKEN_KEY, res.token);
      onLogin(res.token);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={submit} className="card mx-auto max-w-sm space-y-3">
      <p className="text-lg font-extrabold">👩‍🏫 Masuk sebagai guru</p>
      <input className="input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN guru" autoComplete="current-password" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" type="submit">Masuk</button>
    </form>
  );
}

function Classes({ token, classes, reload, selected, onSelect }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const create = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await request('/teacher/classes', { method: 'POST', token, body: { name, code: code || null } });
      setName('');
      setCode('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {classes.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`rounded-2xl border-2 p-3 text-left ${selected === c.id ? 'border-violet-600 bg-violet-50' : 'border-ink/10 bg-white'}`}
          >
            <p className="font-bold">{c.name}</p>
            <p className="font-mono text-sm tracking-widest text-violet-700">{c.code}</p>
            <p className="text-xs text-ink/60">{c.student_count} siswa</p>
          </button>
        ))}
      </div>
      <form onSubmit={create} className="card flex flex-wrap gap-2">
        <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kelas (mis. VII A)" required />
        <input className="input w-36 font-mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Kode (opsional)" />
        <button className="btn btn-primary" type="submit">+ Kelas</button>
        {error && <p className="w-full text-sm text-red-700">{error}</p>}
      </form>
    </div>
  );
}

function Summary({ token, classId }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    request(`/teacher/classes/${classId}/summary`, { token }).then(setRows).catch(() => setRows([]));
  }, [classId, token]);
  if (!rows) return <p>Memuat…</p>;
  const fmt = (v) => (v === null || v === undefined ? '–' : v);
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left">
            <tr>
              <th className="p-2">Nama</th>
              <th className="p-2">NIS</th>
              <th className="p-2 text-center">Pre</th>
              <th className="p-2 text-center">Post</th>
              <th className="p-2 text-center">N-gain</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student_id} className="border-t border-ink/5">
                <td className="p-2 font-semibold">{r.name}</td>
                <td className="p-2">{r.nis}</td>
                <td className="p-2 text-center">{fmt(r.pre)}{r.pre_pending ? '*' : ''}</td>
                <td className="p-2 text-center">{fmt(r.post)}{r.post_pending ? '*' : ''}</td>
                <td className="p-2 text-center">{r.ngain === null ? '–' : `${r.ngain.toFixed(2)} (${r.category})`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink/60">* masih ada langkah uraian yang belum dinilai. Skor maksimum 24.</p>
      <a className="btn btn-secondary" href={`${API_BASE}/api/v1/teacher/classes/${classId}/export.csv?token=${encodeURIComponent(token)}`}>
        ⬇️ Unduh CSV (per tahap)
      </a>
    </div>
  );
}

function Grading({ token, classId }) {
  const [queue, setQueue] = useState(null);
  const load = useCallback(() => {
    request(`/teacher/grading-queue?class_id=${classId}`, { token }).then(setQueue).catch(() => setQueue([]));
  }, [classId, token]);
  useEffect(load, [load]);

  const give = async (id, score) => {
    await request(`/teacher/answers/${id}/score`, { method: 'PUT', token, body: { score } });
    setQueue((q) => q.filter((x) => x.answer_id !== id));
  };

  if (!queue) return <p>Memuat…</p>;
  if (!queue.length) return <p className="card text-center">✔ Tidak ada jawaban yang menunggu penilaian.</p>;
  return (
    <div className="space-y-3">
      {queue.map((q) => (
        <div key={q.answer_id} className="card space-y-2">
          <p className="text-xs font-bold uppercase text-violet-700">
            {q.student_name} · {q.type === 'pre' ? 'Pretest' : 'Posttest'} · Soal {q.item_no} Langkah {q.stage_no}
          </p>
          <p className="text-sm text-ink/70">{q.prompt}</p>
          <p className="rounded-xl bg-ink/5 p-2 whitespace-pre-wrap">{typeof q.value === 'object' && q.value !== null ? `${q.value.choice ?? ''} — ${q.value.text ?? ''}` : String(q.value)}</p>
          <p className="rounded-xl bg-emerald-50 p-2 text-sm text-emerald-900"><b>Rubrik:</b> {q.rubric}</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: q.max + 1 }, (_, s) => (
              <button key={s} type="button" className="btn btn-secondary" onClick={() => give(q.answer_id, s)}>
                Skor {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TeacherPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('summary');

  const reload = useCallback(() => {
    if (!token) return;
    request('/teacher/classes', { token })
      .then(setClasses)
      .catch((e) => {
        if (e.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      });
  }, [token]);
  useEffect(reload, [reload]);

  if (!backendEnabled) {
    return (
      <div className="card space-y-2">
        <p className="font-bold">Dasbor guru memerlukan backend.</p>
        <p className="text-sm text-ink/70">Isi <code>VITE_API_URL</code> di file <code>.env</code> lalu jalankan server FastAPI (lihat README).</p>
        <Link to="/" className="btn btn-ghost">← Beranda</Link>
      </div>
    );
  }
  if (!token) return <Login onLogin={setToken} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">👩‍🏫 Dasbor Guru</h1>
        <button type="button" className="btn btn-ghost" onClick={() => { sessionStorage.removeItem(TOKEN_KEY); setToken(null); }}>
          Keluar
        </button>
      </div>
      <Classes token={token} classes={classes} reload={reload} selected={selected} onSelect={setSelected} />
      {selected && (
        <>
          <div className="flex gap-2">
            <button type="button" className={`btn ${tab === 'summary' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('summary')}>
              Rekap nilai
            </button>
            <button type="button" className={`btn ${tab === 'grading' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('grading')}>
              Penilaian uraian
            </button>
          </div>
          {tab === 'summary' ? <Summary key={selected} token={token} classId={selected} /> : <Grading key={selected} token={token} classId={selected} />}
        </>
      )}
    </div>
  );
}
