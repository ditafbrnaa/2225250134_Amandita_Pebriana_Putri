import { describe, it, expect } from 'vitest';
import { tokenizeKeywords, chunkStory } from '../lib/keywordTokenizer.js';

const kw = (text) => tokenizeKeywords(text).filter((s) => s.keyword).map((s) => [s.text, s.keyword.id]);

describe('penyorot kata kunci', () => {
  it('mengenali "tidak … keduanya" sebagai satu frasa (bukan irisan)', () => {
    expect(kw('dan 5 siswa tidak menyukai keduanya.')).toEqual([['tidak menyukai keduanya', 'tidak-keduanya']]);
  });
  it('mengenali kata jebakan "hanya" dan "keduanya"', () => {
    expect(kw('20 orang hanya menggunakan TikTok dan 6 siswa gemar keduanya')).toEqual([
      ['hanya', 'hanya'],
      ['keduanya', 'keduanya'],
    ]);
  });
  it('mengenali "kedua aplikasi sekaligus"', () => {
    expect(kw('menggunakan kedua aplikasi sekaligus adalah 15 orang')[0][1]).toBe('keduanya');
  });
  it('tidak menandai kata yang hanya mirip', () => {
    expect(kw('Basket dan bulu tangkis disajikan')).toEqual([]);
  });
  it('teks tetap utuh setelah dipecah', () => {
    const t = 'Dari 30 siswa, 17 siswa hanya suka voli, 6 siswa suka keduanya.';
    expect(tokenizeKeywords(t).map((s) => s.text).join('')).toBe(t);
  });
});

describe('segmenting soal cerita', () => {
  it('memecah soal Pretest no. 1 menjadi potongan informasi', () => {
    const t =
      'Dalam sebuah kegiatan ekstrakurikuler, pendataan hobi siswa kelas VIII menunjukkan hasil sebagai berikut: dari 40 siswa di kelas tersebut, ada 22 siswa yang menyukai Sepak Bola, 18 siswa menyukai Basket, dan 5 siswa tidak menyukai keduanya.';
    expect(chunkStory(t)).toEqual([
      'Dalam sebuah kegiatan ekstrakurikuler, pendataan hobi siswa kelas VIII menunjukkan hasil sebagai berikut:',
      'dari 40 siswa di kelas tersebut',
      'ada 22 siswa yang menyukai Sepak Bola',
      '18 siswa menyukai Basket',
      'dan 5 siswa tidak menyukai keduanya.',
    ]);
  });
});
