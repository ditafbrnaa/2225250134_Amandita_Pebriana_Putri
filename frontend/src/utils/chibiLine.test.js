import { describe, expect, it } from 'vitest';
import { chibiLine } from './chibiLine.js';
import { OPERATIONS } from '@/features/venn/lib/expression.js';

describe('chibiLine', () => {
  it('mengisi placeholder nama', () => {
    expect(chibiLine('home', 'named', { name: 'Sari' }).text).toContain('Sari');
  });

  it('memakai "kamu" bila nama tidak ada', () => {
    expect(chibiLine('home', 'named').text).toContain('kamu');
  });

  it('punya kalimat untuk setiap operasi di Bilah Operasi', () => {
    for (const op of OPERATIONS) {
      expect(chibiLine('operations', op.id).text).not.toBe(chibiLine('operations', 'default').text);
    }
  });

  it('jatuh ke default untuk kunci tak dikenal', () => {
    expect(chibiLine('operations', 'X?').text).toBe(chibiLine('operations', 'default').text);
  });

  it('setiap kalimat bernotasi ∩/∪ juga menyebut kata irisan/gabungan', () => {
    for (const op of OPERATIONS) {
      const key = op.id;
      const t = chibiLine('operations', key).text;
      if (t.includes('∩')) expect(t.toLowerCase()).toContain('irisan');
      if (t.includes('∪')) expect(t.toLowerCase()).toContain('gabungan');
    }
  });
});
