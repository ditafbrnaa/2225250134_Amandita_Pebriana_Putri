import { describe, it, expect } from 'vitest';
import { scoreStage, scoreAttempt, solveLinear, sameFormula, nGain } from '../lib/scoring.js';
import { scaffoldsFor, assertExamSafe, SCAFFOLD_KEYS } from '../lib/examGuard.js';
import keys from '@/data/generated/instrumen.keys.json';

describe('examGuard', () => {
  it('mematikan SEMUA scaffold di mode ujian', () => {
    const s = scaffoldsFor('exam');
    SCAFFOLD_KEYS.forEach((k) => expect(s[k]).toBe(false));
    expect(assertExamSafe(s)).toBe(true);
  });
  it('menyalakan scaffold di mode belajar', () => {
    expect(() => assertExamSafe(scaffoldsFor('learn'))).toThrow();
  });
});

describe('persamaan', () => {
  it('menyelesaikan persamaan linear sederhana', () => {
    expect(solveLinear('35 = 22 + 18 − x')).toBe(5);
    expect(solveLinear('22+18-n(A∩B)=35')).toBe(5);
    expect(solveLinear('30 = 21 + x')).toBe(9);
    expect(solveLinear('n(A∪B)=n(A)+n(B)-n(A∩B)')).toBeNull();
  });
  it('mengenali rumus gabungan dalam berbagai bentuk', () => {
    const key = 'n(A∪B)=n(A)+n(B)-n(A∩B)';
    expect(sameFormula('n(A ∪ B) = n(A) + n(B) − n(A ∩ B)', key)).toBe(true);
    expect(sameFormula('n(A)+n(B)-n(A∩B)=n(A∪B)', key)).toBe(true);
    expect(sameFormula('n(B)+n(A)-n(A∩B)=n(AUB)', key)).toBe(true);
    expect(sameFormula('n(A∪B)=n(A)+n(B)', key)).toBe(false);
  });
});

describe('penilaian instrumen', () => {
  const perfect = {
    '1.1': '35', '1.2': 'n(A∪B) = n(A) + n(B) − n(A∩B)', '1.3': '35 = 22 + 18 − x', '1.4': '5', '1.5': 'Ada 5 siswa',
    '2.1': 'N=30', '2.2': '21', '2.3': '30 = 21 + x', '2.4': '9', '2.5': '9 orang',
    '3.1': { choice: 'Tidak tepat', text: 'irisan terhitung dua kali' }, '3.2': '11', '3.3': '8', '3.4': '23', '3.5': 'valid',
    '4.1': 'data', '4.2': '45', '4.3': '5', '4.4': 'Tidak wajar', '4.5': 'alasan', '4.6': '5 orang',
  };

  it('skor maksimum = 24 (4 soal × 6), sesuai max_total instrumen', () => {
    const r = scoreAttempt({}, keys);
    expect(r.max).toBe(24);
    r.items.forEach((it) => expect(it.max).toBe(6));
    expect(r.autoTotal).toBe(0);
  });

  it('menilai jawaban benar secara otomatis, uraian menunggu guru', () => {
    const r = scoreAttempt(perfect, keys);
    const byNo = Object.fromEntries(r.items.map((i) => [i.no, i]));
    expect(byNo[1].auto).toBe(5); // tahap 1–4 = 1+2+1+1
    expect(byNo[2].auto).toBe(4); // tahap 2,3,4 = 2+1+1
    expect(byNo[3].auto).toBe(5); // tahap 1–4 = 1+2+1+1
    expect(byNo[4].auto).toBe(3); // tahap 2,3,4
    expect(r.pendingCount).toBe(7); // 1.5, 2.1, 2.5, 3.5, 4.1, 4.5, 4.6
  });

  it('jawaban salah mendapat 0, persamaan tak dikenal diserahkan ke guru', () => {
    expect(scoreStage('31', keys['3.4']).score).toBe(0);
    expect(scoreStage('', keys['1.1']).status).toBe('blank');
    expect(scoreStage('pakai rumus gabungan', keys['1.2']).status).toBe('pending');
  });

  it('menghitung N-gain', () => {
    expect(nGain(8, 20, 24)).toEqual({ value: 0.75, category: 'tinggi' });
    expect(nGain(12, 16, 24).category).toBe('sedang');
  });
});
