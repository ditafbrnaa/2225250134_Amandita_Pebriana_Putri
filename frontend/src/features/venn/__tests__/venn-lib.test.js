import { describe, it, expect } from 'vitest';
import { twoSetLayout, circleIntersections, pointMask, regionSlots } from '../lib/geometry.js';
import { parseExpression, regionsFor, matchOperation, OPERATIONS } from '../lib/expression.js';
import { checkPlacement } from '../lib/placement.js';
import { maskOf } from '../lib/regions.js';

describe('geometry', () => {
  it('menghitung titik potong tata letak bawaan', () => {
    const { top, bottom } = circleIntersections({ cx: 150, cy: 140, r: 90 }, { cx: 250, cy: 140, r: 90 });
    expect(top.x).toBeCloseTo(200);
    expect(top.y).toBeCloseTo(65.17, 1);
    expect(bottom.y).toBeCloseTo(214.83, 1);
  });

  it('menghasilkan path daerah yang sudah diverifikasi visual (snapshot)', () => {
    const L = twoSetLayout();
    expect(L.paths[3]).toBe('M200,65.17 A90,90 0 0,1 200,214.83 A90,90 0 0,1 200,65.17 Z');
    expect(L.paths[1]).toBe('M200,65.17 A90,90 0 1,0 200,214.83 A90,90 0 0,1 200,65.17 Z');
    expect(L.paths[2]).toBe('M200,65.17 A90,90 0 1,1 200,214.83 A90,90 0 0,0 200,65.17 Z');
  });

  it('posisi label berada di dalam daerahnya sendiri', () => {
    const L = twoSetLayout();
    [0, 1, 2, 3].forEach((m) => expect(pointMask(L, L.labelPos[m].x, L.labelPos[m].y)).toBe(m));
  });

  it('slot token selalu berada di daerah yang benar', () => {
    const L = twoSetLayout();
    [0, 1, 2, 3].forEach((m) => {
      const slots = regionSlots(L, m);
      expect(slots.length).toBeGreaterThan(4);
      slots.forEach((s) => expect(pointMask(L, s.x, s.y)).toBe(m));
    });
  });
});

describe('expression', () => {
  it('mengevaluasi operasi dasar', () => {
    expect(regionsFor('A∩B')).toEqual([3]);
    expect(regionsFor('A∪B')).toEqual([1, 2, 3]);
    expect(regionsFor('Aᶜ')).toEqual([0, 2]);
    expect(regionsFor('A−B')).toEqual([1]);
    expect(regionsFor('(A∪B)ᶜ')).toEqual([0]);
    expect(regionsFor('S')).toEqual([0, 1, 2, 3]);
  });

  it('menerima ekspresi bersarang & penulisan alternatif', () => {
    expect(regionsFor('(A∩B)ᶜ')).toEqual([0, 1, 2]);
    expect(regionsFor("A'")).toEqual([0, 2]);
    expect(regionsFor('A U B')).toEqual([1, 2, 3]);
    expect(regionsFor('S - (A ∪ B)')).toEqual([0]);
    expect(regionsFor('Aᶜ ∩ Bᶜ')).toEqual(regionsFor('(A∪B)ᶜ')); // hukum De Morgan
  });

  it('menolak ekspresi tidak valid', () => {
    expect(() => parseExpression('A ∩')).toThrow();
    expect(() => parseExpression('(A ∪ B')).toThrow();
    expect(() => parseExpression('A ? B')).toThrow();
  });

  it('menebak operasi dari daerah yang dipilih', () => {
    expect(matchOperation([1, 2, 3]).id).toBe('A∪B');
    expect(matchOperation([0]).id).toBe('(A∪B)ᶜ');
    expect(matchOperation([1, 2])).toBeNull();
    OPERATIONS.forEach((op) => expect(matchOperation(regionsFor(op.id))).not.toBeNull());
  });
});

describe('placement', () => {
  const sets = {
    A: { label: 'Bilangan genap', members: [2, 4, 6, 8, 10] },
    B: { label: 'Bilangan prima', members: [2, 3, 5, 7] },
  };
  it('menentukan daerah yang benar', () => {
    expect(maskOf(2, sets.A.members, sets.B.members)).toBe(3);
    expect(maskOf(9, sets.A.members, sets.B.members)).toBe(0);
    expect(checkPlacement(4, 1, sets).ok).toBe(true);
  });
  it('memberi petunjuk bertingkat untuk anggota di luar lingkaran', () => {
    const r2 = checkPlacement(9, 1, sets, 2);
    expect(r2.ok).toBe(false);
    expect(r2.correctMask).toBe(0);
    expect(r2.hint).toMatch(/di luar kedua lingkaran/);
    expect(checkPlacement(9, 1, sets, 3).hint).toMatch(/Bukan Bilangan genap maupun Bilangan prima/);
  });
});
