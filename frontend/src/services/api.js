// Komunikasi dengan backend FastAPI + antrean sinkronisasi offline.
import { useAppStore } from '@/store/useAppStore.js';

// VITE_API_URL="/" → backend di domain yang sama (Vercel: folder api/). Kosong → mode demo tanpa backend.
const RAW_API_URL = (import.meta.env.VITE_API_URL ?? '').trim();
export const API_BASE = RAW_API_URL.replace(/\/+$/, '');
const BASE = API_BASE;
export const backendEnabled = RAW_API_URL !== '';
export const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  if (!backendEnabled) throw new ApiError('Backend belum diatur (VITE_API_URL kosong).', 0);
  let res;
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Tidak bisa terhubung ke server. Periksa internetmu.', 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.detail ?? `Server menolak permintaan (${res.status}).`, res.status);
  return data;
}

const studentToken = () => useAppStore.getState().profile?.token;

export const api = {
  join: (payload) => request('/students/join', { method: 'POST', body: payload }),
  submitAttempt: (attemptId) => request(`/attempts/${attemptId}/submit`, { method: 'POST', token: studentToken() }),
  getAttempt: (attemptId) => request(`/attempts/${attemptId}`, { token: studentToken() }),
  /** Tutor AI: kunci API ada di server, aplikasi hanya mengirim soal + percakapan (tanpa nama siswa). */
  tutorChat: (payload) => request('/tutor/chat', { method: 'POST', body: payload, token: studentToken() }),
};

/** Menjadwalkan sinkronisasi (aman diulang; job dengan dedupeKey sama diganti yang terbaru). */
export function queueSync(job) {
  if (!backendEnabled) return;
  useAppStore.getState().enqueue(job);
  flushQueue();
}

/**
 * Mengirim catatan proses belajar satu modul (asesmen dinamis RMT): banyak salah & petunjuk per langkah.
 * Tidak ada data pribadi baru, hanya angka. Dikirim ulang utuh (idempoten), job lama untuk modul yang sama diganti.
 */
export function syncLearning(moduleId) {
  const { rmtLog, progress } = useAppStore.getState();
  queueSync({
    method: 'PUT',
    path: `/learning/${moduleId}`,
    body: { steps: rmtLog[moduleId] ?? {}, done: Boolean(progress[moduleId]?.done) },
    dedupeKey: `learn:${moduleId}`,
  });
}

let flushing = false;
/** Mengirim antrean berurutan. Berhenti di kegagalan jaringan, lalu dicoba lagi saat online. */
export async function flushQueue() {
  if (!backendEnabled || flushing || !navigator.onLine) return;
  flushing = true;
  try {
    for (;;) {
      const { syncQueue, dequeue } = useAppStore.getState();
      const job = syncQueue[0];
      if (!job) break;
      try {
        await request(job.path, { method: job.method, body: job.body, token: studentToken() });
        dequeue(job.id);
      } catch (e) {
        if (e.status >= 400 && e.status < 500 && e.status !== 401) dequeue(job.id); // data ditolak permanen
        else break; // offline / server sibuk → coba lagi nanti
      }
    }
  } finally {
    flushing = false;
  }
}

/**
 * Profil dari versi demo (tanpa token server) tidak bisa mengirim jawaban.
 * Siswa diminta masuk ulang dengan namanya, dan tes demo dihapus agar pretest dikerjakan ulang di server.
 */
export function dropDemoProfile() {
  const { profile } = useAppStore.getState();
  if (!backendEnabled || !profile || profile.token) return;
  useAppStore.setState({ profile: null, attempts: {}, syncQueue: [] });
}

export function startSyncListeners() {
  dropDemoProfile();
  window.addEventListener('online', flushQueue);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && flushQueue());
  flushQueue();
}
