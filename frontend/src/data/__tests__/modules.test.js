// Menjaga konten modul tetap benar secara matematis saat direvisi.
import { describe, it, expect } from 'vitest';
import modules from '@/data/modules.json';
import { parseExpression } from '@/features/venn/lib/expression.js';
import { maskOf } from '@/features/venn/lib/regions.js';

const STEP_TYPES = ['intro', 'symbols', 'quiz', 'explore', 'shade', 'place', 'worked', 'story', 'fill', 'reflection'];
const sum = (obj) => Object.values(obj).reduce((s, v) => s + Number(v), 0);

describe('konten modul', () => {
  it('ada 6 modul dengan id unik & tipe langkah dikenal', () => {
    expect(modules.length).toBe(6);
    expect(new Set(modules.map((m) => m.id)).size).toBe(6);
    modules.forEach((m) => m.steps.forEach((s) => expect(STEP_TYPES.includes(s.type)).toBe(true)));
  });

  modules.forEach((m) =>
    m.steps.forEach((s, i) => {
      const where = `${m.id} langkah ${i + 1} (${s.type})`;
      if (s.type === 'story') {
        it(`${where}: jumlah semua daerah = n(S)`, () => {
          expect(Object.keys(s.answers).sort()).toEqual(['0', '1', '2', '3']);
          expect(sum(s.answers)).toBe(s.total);
        });
      }
      if (s.type === 'worked' && s.total) {
        it(`${where}: angka akhir contoh soal = n(S)`, () => {
          expect(sum(Object.assign({}, ...s.steps.map((x) => x.counts)))).toBe(s.total);
        });
      }
      if (s.type === 'quiz') {
        it(`${where}: indeks kunci valid`, () => {
          expect(s.answer >= 0 && s.answer < s.options.length).toBe(true);
        });
      }
      if (s.type === 'explore' && !s.free) {
        it(`${where}: ekspresi valid`, () => {
          expect(typeof parseExpression(s.expr)).toBe('function');
        });
      }
      if (s.type === 'shade') {
        it(`${where}: semua ekspresi arsir valid`, () => {
          s.challenges.forEach((c) => expect(typeof parseExpression(c)).toBe('function'));
        });
      }
      if (s.type === 'place') {
        it(`${where}: A dan B adalah himpunan bagian S`, () => {
          [...s.sets.A.members, ...s.sets.B.members].forEach((v) => expect(s.sets.S.members.includes(v)).toBe(true));
          expect(s.sets.S.members.some((v) => maskOf(v, s.sets.A.members, s.sets.B.members) === 0)).toBe(true);
        });
      }
    }),
  );
});
