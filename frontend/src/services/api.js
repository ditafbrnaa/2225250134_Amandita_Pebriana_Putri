// Komunikasi dengan backend FastAPI + antrean sinkronisasi offline.
import { useAppStore } from '@/store/useAppStore.js';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const backendEnabled = Boolean(BASE);
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
};

/** Menjadwalkan sinkronisasi (aman diulang; job dengan dedupeKey sama diganti yang terbaru). */
export function queueSync(job) {
  if (!backendEnabled) return;
  useAppStore.getState().enqueue(job);
  flushQueue();
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

export function startSyncListeners() {
  window.addEventListener('online', flushQueue);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && flushQueue());
  flushQueue();
}
