import { describe, it, expect } from 'vitest';
import modules from '@/data/modules.json';
import {
  COGNITIVE_FUNCTIONS,
  RMT_PHASES,
  availableHints,
  helpLevel,
  hintBudget,
  hintsUnlocked,
  independenceTrend,
  isGraded,
  moduleSummary,
  potentialLabel,
} from '@/features/learn/lib/rmt.js';

describe('logika RMT', () => {
  it('bantuan dikurangi bertahap dari modul ke modul (fading ZPD)', () => {
    expect([0, 1, 2, 3, 4, 5].map(hintBudget)).toEqual([3, 3, 2, 2, 1, 1]);
    expect(hintsUnlocked(0, 0)).toBe(true);
    expect(hintsUnlocked(2, 0)).toBe(false); // harus mencoba dulu
    expect(hintsUnlocked(2, 1)).toBe(true);
    expect(availableHints({ hints: ['a', 'b', 'c'] }, 4)).toEqual(['a']);
  });

  it('tingkat bantuan & ringkasan modul (asesmen dinamis)', () => {
    expect(helpLevel({ wrong: 0, hints: 0 })).toBe(0);
    expect(helpLevel({ wrong: 2, hints: 1 })).toBe(1);
    expect(helpLevel({ wrong: 3, hints: 0 })).toBe(2);
    expect(helpLevel({ wrong: 0, hints: 2 })).toBe(2);
    const s = moduleSummary({
      2: { wrong: 0, hints: 0, solved: true },
      3: { wrong: 1, hints: 1, solved: true },
      4: { wrong: 5, hints: 3, solved: true },
      5: { wrong: 9, hints: 0, solved: false },
    });
    expect(s).toEqual({ graded: 3, mandiri: 1, sedikit: 1, banyak: 1, hints: 4, index: 0.5 });
    expect(moduleSummary({}).index).toBeNull();
  });

  it('potensi belajar & tren sama dengan backend', () => {
    expect(potentialLabel(0.8)).toBe('Mandiri');
    expect(potentialLabel(0.5)).toBe('Berkembang dengan bantuan');
    expect(potentialLabel(0.1)).toBe('Perlu pendampingan');
    expect(independenceTrend([0.25, null, 0.75])).toBe(0.5);
    expect(independenceTrend([0.5])).toBeNull();
  });
});

describe('konten modul mengikuti RMT', () => {
  modules.forEach((m, mi) => {
    it(`${m.id}: punya mediasi MLE (tujuan, makna, transendensi)`, () => {
      ['goal', 'meaning', 'transcendence'].forEach((k) => expect(m.mediation?.[k]?.length).toBeGreaterThan(10));
    });

    it(`${m.id}: tahap RMT urut 1 → 3, fungsi kognitif dikenal`, () => {
      const phases = m.steps.map((s) => s.phase);
      phases.forEach((p) => expect(RMT_PHASES.map((x) => x.no)).toContain(p));
      expect(phases[0]).toBe(1);
      expect(phases.at(-1)).toBe(3);
      phases.slice(1).forEach((p, i) => expect(p).toBeGreaterThanOrEqual(phases[i]));
      m.steps.forEach((s) => expect(COGNITIVE_FUNCTIONS[s.cognitive]).toBeDefined());
    });

    it(`${m.id}: tiap tugas punya petunjuk sesuai jatah modul`, () => {
      m.steps.filter(isGraded).forEach((s) => {
        expect(s.hints?.length).toBe(hintBudget(mi));
      });
    });
  });
});
