import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request, backendEnabled, API_BASE } from '@/services/api.js';

const TOKEN_KEY = 'vb-teacher-token';

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
      <input className="input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN guru" autoComplete="current-password" aria-label="PIN guru" />
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button className="btn btn-primary w-full" type="submit">Masuk</button>
    </form>
  );
}

const fmt = (v) => (v === null || v === undefined ? '–' : v);
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–';
const TEST_LABEL = { pre: 'pretest', post: 'posttest' };

/** Tabel rekap utama: seluruh siswa di database, tanpa filter kelas. */
function Summary({ token, onUnauthorized }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    request('/teacher/summary', { token })
      .then(setRows)
      .catch((e) => {
        if (e.status === 401) onUnauthorized();
        else setError(e.message);
      });
  }, [token, onUnauthorized]);

  if (error) return <p className="card text-red-700" role="alert">{error}</p>;
  if (!rows) return <p>Memuat…</p>;

  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || (r.nis ?? '').includes(q)) : rows;
  const preDone = rows.filter((r) => r.pre !== null).length;
  const postDone = rows.filter((r) => r.post !== null).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-2"><p className="text-2xl font-extrabold">{rows.length}</p><p className="text-xs text-ink/60">siswa</p></div>
        <div className="card p-2"><p className="text-2xl font-extrabold">{preDone}</p><p className="text-xs text-ink/60">selesai pretest</p></div>
        <div className="card p-2"><p className="text-2xl font-extrabold">{postDone}</p><p className="text-xs text-ink/60">selesai posttest</p></div>
      </div>
      <input
        className="input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama atau NIS…"
        aria-label="Cari siswa"
      />
      <div className="overflow-x-auto rounded-2xl bg-white cartoon">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left">
            <tr>
              <th className="p-2">No</th>
              <th className="p-2">Nama</th>
              <th className="p-2">NIS</th>
              <th className="p-2 text-center">Pretest</th>
              <th className="p-2 text-center">Posttest</th>
              <th className="p-2 text-center">N-gain</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={r.student_id} className="border-t border-ink/5 align-top">
                <td className="p-2 text-ink/60">{i + 1}</td>
                <td className="p-2 font-semibold">{r.name}</td>
                <td className="p-2">{r.nis || '–'}</td>
                <td className="p-2 text-center">
                  {fmt(r.pre)}{r.pre_pending ? '*' : ''}
                  {r.pre_submitted_at && <span className="block text-[11px] text-ink/50">{fmtDate(r.pre_submitted_at)}</span>}
                </td>
                <td className="p-2 text-center">
                  {fmt(r.post)}{r.post_pending ? '*' : ''}
                  {r.post_submitted_at && <span className="block text-[11px] text-ink/50">{fmtDate(r.post_submitted_at)}</span>}
                </td>
                <td className="p-2 text-center">{r.ngain === null ? '–' : `${r.ngain.toFixed(2)} (${r.category})`}</td>
                <td className="p-2 text-xs text-ink/70">
                  {r.in_progress?.length ? `Sedang mengerjakan ${r.in_progress.map((t) => TEST_LABEL[t] ?? t).join(' & ')}` : r.pre === null && r.post === null ? 'Belum tes' : '✔'}
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={7} className="p-4 text-center text-ink/60">{rows.length ? 'Tidak ada siswa yang cocok.' : 'Belum ada siswa yang masuk.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink/60">* masih ada langkah uraian yang belum dinilai. Skor maksimum 24.</p>
      <a className="btn btn-secondary" href={`${API_BASE}/api/v1/teacher/export.csv?token=${encodeURIComponent(token)}`}>
        ⬇️ Unduh CSV semua jawaban (per tahap)
      </a>
    </div>
  );
}

function Grading({ token }) {
  const [queue, setQueue] = useState(null);
  const load = useCallback(() => {
    request('/teacher/grading-queue', { token }).then(setQueue).catch(() => setQueue([]));
  }, [token]);
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
          <p className="rounded-xl border-2 border-line bg-mint p-2 text-sm text-emerald-900"><b>Rubrik:</b> {q.rubric}</p>
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

const MODULE_IDS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
const pct = (v) => (v === null || v === undefined ? '–' : `${Math.round(v * 100)}%`);
const trendText = (t) => (t === null || t === undefined ? '–' : t > 0 ? `↑ +${Math.round(t * 100)}` : t < 0 ? `↓ ${Math.round(t * 100)}` : '→ 0');

/**
 * Asesmen dinamis (RMT): bukan hanya hasil akhir, tetapi seberapa banyak bantuan yang dibutuhkan siswa
 * dan apakah kebutuhan itu berkurang dari modul ke modul (potensi belajar).
 */
function Learning({ token, onUnauthorized }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    request('/teacher/learning', { token })
      .then(setRows)
      .catch((e) => {
        if (e.status === 401) onUnauthorized();
        else setError(e.message);
      });
  }, [token, onUnauthorized]);

  if (error) return <p className="card text-red-700" role="alert">{error}</p>;
  if (!rows) return <p>Memuat…</p>;
  const active = rows.filter((r) => r.index !== null);

  return (
    <div className="space-y-3">
      <div className="card space-y-1 text-sm">
        <p className="font-bold">📈 Asesmen dinamis (Rigorous Mathematical Thinking)</p>
        <p className="text-ink/70">
          <b>Indeks kemandirian</b> = rata-rata tingkat bantuan pada tugas modul (100% = semua benar tanpa salah &amp; tanpa petunjuk).{' '}
          <b>Tren</b> = modul terakhir − modul pertama. Tren naik berarti siswa makin mandiri setelah dibimbing (potensi belajar).
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white cartoon">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left">
            <tr>
              <th className="p-2">Nama</th>
              {MODULE_IDS.map((m) => (
                <th key={m} className="p-2 text-center">{m.toUpperCase()}</th>
              ))}
              <th className="p-2 text-center">Kemandirian</th>
              <th className="p-2 text-center">Tren</th>
              <th className="p-2 text-center">Petunjuk</th>
              <th className="p-2">Potensi belajar</th>
            </tr>
          </thead>
          <tbody>
            {active.map((r) => (
              <tr key={r.student_id} className="border-t border-ink/5">
                <td className="p-2 font-semibold">{r.name}</td>
                {MODULE_IDS.map((m) => {
                  const x = r.modules[m];
                  return (
                    <td key={m} className="p-2 text-center" title={x ? `${x.mandiri} mandiri · ${x.sedikit} bantuan ringan · ${x.banyak} bantuan banyak` : 'Belum dikerjakan'}>
                      {x ? pct(x.index) : '–'}
                      {x && !x.done && <span className="block text-[11px] text-ink/50">belum tamat</span>}
                    </td>
                  );
                })}
                <td className="p-2 text-center font-bold">{pct(r.index)}</td>
                <td className="p-2 text-center">{trendText(r.trend)}</td>
                <td className="p-2 text-center">{r.hints}</td>
                <td className="p-2">{r.potential}</td>
              </tr>
            ))}
            {!active.length && (
              <tr><td colSpan={MODULE_IDS.length + 5} className="p-4 text-center text-ink/60">Belum ada siswa yang mengerjakan modul.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <a className="btn btn-secondary" href={`${API_BASE}/api/v1/teacher/learning.csv?token=${encodeURIComponent(token)}`}>
        ⬇️ Unduh CSV proses belajar (per langkah)
      </a>
    </div>
  );
}

/** Info layanan AI Tutor Kak Venn. Kunci tidak pernah ditampilkan utuh (hanya 4 karakter terakhir). */
function AiStatus({ token }) {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    request('/teacher/ai-status', { token }).then(setStatus).catch(() => setStatus(null));
  }, [token]);
  if (!status) return null;

  return (
    <div className="card space-y-2">
      <button type="button" className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="font-bold">🤖 Tutor AI Kak Venn</span>
        <span className={`chip-pastel ${status.enabled ? 'bg-mint' : ''}`}>{status.enabled ? `Aktif · ${status.providers[0].name}` : 'Belum aktif'}</span>
      </button>
      {open && (
        <div className="space-y-2 text-sm">
          {status.enabled ? (
            <>
              <p className="text-ink/70">Layanan dicoba berurutan. Bila yang pertama gagal atau penuh, yang berikutnya dipakai otomatis.</p>
              <ol className="space-y-2">
                {status.providers.map((p, i) => (
                  <li key={p.name} className="rounded-2xl bg-sky-soft p-3">
                    <p className="font-semibold">
                      {i + 1}. {p.name} {i > 0 && <span className="font-normal text-ink/60">(cadangan)</span>}
                    </p>
                    <p className="break-all text-ink/80">Model: {p.models.join(', ')}</p>
                    <p className="text-ink/80">
                      Kunci: <code>{p.env}</code> berakhiran <code>{p.key_hint}</code>
                    </p>
                    <a href={p.dashboard} target="_blank" rel="noreferrer" className="font-semibold text-brand-blue underline">
                      Lihat pemakaian & saldo
                    </a>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-ink/70">
              Isi <code>ANTHROPIC_API_KEY</code> (Claude) atau <code>AI_API_KEY</code> (OpenRouter) di Environment Variables Vercel, lalu Redeploy.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeacherPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [tab, setTab] = useState('summary');

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  if (!backendEnabled) {
    return (
      // Pesan ramah untuk pengunjung; petunjuk teknis ada di README.
      <div className="card space-y-3 text-center">
        <p className="text-4xl" aria-hidden="true">👩‍🏫</p>
        <p className="font-bold">Halaman guru belum tersedia</p>
        <p className="text-sm text-ink/70">Versi ini adalah mode latihan. Semua progres kamu tersimpan di perangkat ini.</p>
        <Link to="/" className="btn btn-ghost">← Kembali ke Beranda</Link>
      </div>
    );
  }
  if (!token) return <Login onLogin={setToken} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">👩‍🏫 Dasbor Guru</h1>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Keluar
        </button>
      </div>
      <AiStatus token={token} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`btn ${tab === 'summary' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('summary')} aria-pressed={tab === 'summary'}>
          Rekap semua siswa
        </button>
        <button type="button" className={`btn ${tab === 'grading' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('grading')} aria-pressed={tab === 'grading'}>
          Penilaian uraian
        </button>
        <button type="button" className={`btn ${tab === 'learning' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('learning')} aria-pressed={tab === 'learning'}>
          Proses belajar (RMT)
        </button>
      </div>
      {tab === 'summary' && <Summary token={token} onUnauthorized={logout} />}
      {tab === 'grading' && <Grading token={token} />}
      {tab === 'learning' && <Learning token={token} onUnauthorized={logout} />}
    </div>
  );
}
