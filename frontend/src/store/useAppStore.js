// State global VennBuster. Disimpan otomatis di localStorage (bertahan saat offline / aplikasi ditutup).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { uuid } from '@/utils/id.js';

const emptyAttempt = (type) => ({
  id: uuid(),
  type,
  status: 'in_progress', // in_progress | submitted
  startedAt: new Date().toISOString(),
  submittedAt: null,
  answers: {}, // { "itemNo.stageNo": value }
  scratch: {}, // { itemNo: { mask: angka } } coretan Venn
  result: null,
});

export const useAppStore = create(
  persist(
    (set, get) => ({
      profile: null, // { name, nis, studentId?, token? }
      settings: { reduceMotion: false, fontScale: 1, soundOn: true },
      progress: {}, // { [moduleId]: { step: number, done: boolean } }
      reflections: {}, // { "moduleId.step": teks }
      // Asesmen dinamis (RMT): bantuan yang dibutuhkan per langkah. { [moduleId]: { [step]: { wrong, hints, solved } } }
      rmtLog: {},
      attempts: {}, // { pre: Attempt, post: Attempt }
      unlockAll: false, // hanya untuk mode demo/uji coba
      syncQueue: [], // [{ id, method, path, body, dedupeKey }]
      examActive: false, // tidak dipersist

      setProfile: (profile) => set({ profile }),
      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
      setUnlockAll: (v) => set({ unlockAll: v }),
      setExamActive: (v) => set({ examActive: v }),

      setModuleStep: (moduleId, step) =>
        set((s) => ({ progress: { ...s.progress, [moduleId]: { ...(s.progress[moduleId] ?? {}), step } } })),
      completeModule: (moduleId) =>
        set((s) => ({ progress: { ...s.progress, [moduleId]: { ...(s.progress[moduleId] ?? {}), done: true } } })),
      saveReflection: (key, text) => set((s) => ({ reflections: { ...s.reflections, [key]: text } })),

      /** Mencatat percobaan salah / petunjuk / selesai. Langkah yang sudah selesai tidak dicatat ulang (agar skor proses tidak naik turun). */
      logStep: (moduleId, step, event) =>
        set((s) => {
          const mod = s.rmtLog[moduleId] ?? {};
          const cur = mod[step] ?? { wrong: 0, hints: 0, solved: false };
          if (cur.solved) return {};
          const next =
            event.type === 'mistake'
              ? { ...cur, wrong: cur.wrong + 1 }
              : event.type === 'hint'
                ? { ...cur, hints: Math.max(cur.hints, event.level) }
                : { ...cur, solved: true };
          return { rmtLog: { ...s.rmtLog, [moduleId]: { ...mod, [step]: next } } };
        }),

      startAttempt: (type) => {
        const existing = get().attempts[type];
        if (existing) return existing;
        const attempt = emptyAttempt(type);
        set((s) => ({ attempts: { ...s.attempts, [type]: attempt } }));
        return attempt;
      },
      setAnswer: (type, key, value) =>
        set((s) => {
          const a = s.attempts[type];
          if (!a || a.status !== 'in_progress') return {};
          return { attempts: { ...s.attempts, [type]: { ...a, answers: { ...a.answers, [key]: value } } } };
        }),
      setScratch: (type, itemNo, mask, value) =>
        set((s) => {
          const a = s.attempts[type];
          if (!a || a.status !== 'in_progress') return {};
          const item = { ...(a.scratch[itemNo] ?? {}), [mask]: value };
          return { attempts: { ...s.attempts, [type]: { ...a, scratch: { ...a.scratch, [itemNo]: item } } } };
        }),
      submitAttempt: (type) =>
        set((s) => ({
          attempts: { ...s.attempts, [type]: { ...s.attempts[type], status: 'submitted', submittedAt: new Date().toISOString() } },
        })),
      setAttemptResult: (type, result) =>
        set((s) => ({ attempts: { ...s.attempts, [type]: { ...s.attempts[type], result } } })),

      enqueue: (job) =>
        set((s) => {
          const q = job.dedupeKey ? s.syncQueue.filter((j) => j.dedupeKey !== job.dedupeKey) : s.syncQueue;
          return { syncQueue: [...q, { id: uuid(), ...job }] };
        }),
      dequeue: (id) => set((s) => ({ syncQueue: s.syncQueue.filter((j) => j.id !== id) })),

      resetAll: () =>
        set({ profile: null, progress: {}, reflections: {}, rmtLog: {}, attempts: {}, syncQueue: [], unlockAll: false, examActive: false }),
    }),
    {
      name: 'vennbuster-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ examActive, ...rest }) => rest,
    },
  ),
);
