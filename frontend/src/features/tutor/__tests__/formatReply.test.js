import { describe, expect, it } from 'vitest';
import { formatReply } from '../lib/formatReply.js';

const plain = (lines) => lines.map((segs) => segs.map((s) => (s.bold ? `[${s.text}]` : s.text)).join('')).join('\n');

describe('formatReply', () => {
  it('mengubah **tebal** jadi segmen bold tanpa bintang', () => {
    expect(formatReply('Coba cek **irisan** dulu.')).toEqual([
      [
        { bold: false, text: 'Coba cek ' },
        { bold: true, text: 'irisan' },
        { bold: false, text: ' dulu.' },
      ],
    ]);
  });

  it('membuang judul, butir daftar, miring, dan LaTeX', () => {
    const out = plain(formatReply('## Langkah 1\n- Apa yang *diketahui*?\n* n\\(A ∩ B\\) = 8'));
    expect(out).toBe('Langkah 1\n• Apa yang diketahui?\n• nA ∩ B = 8');
    expect(out).not.toContain('*');
  });

  it('membiarkan tanda kali di antara angka', () => {
    expect(plain(formatReply('Hitung 3 * 4 dulu.'))).toBe('Hitung 3 * 4 dulu.');
  });

  it('membuang bintang tebal yang tidak berpasangan', () => {
    expect(plain(formatReply('Bagus sekali!** Lanjut ya.'))).toBe('Bagus sekali! Lanjut ya.');
  });
});
