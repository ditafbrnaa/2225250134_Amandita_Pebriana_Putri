import { describe, it, expect, afterEach } from 'vitest';
import { playClick, setSoundEnabled, isSoundEnabled } from './sound.js';

describe('sound', () => {
  afterEach(() => setSoundEnabled(true));

  it('tidak berbunyi saat suara dimatikan', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(playClick()).toBe(false);
  });

  it('tidak error bila browser tidak punya Web Audio', () => {
    setSoundEnabled(true);
    // Lingkungan test tidak menyediakan AudioContext → no-op, bukan crash.
    expect(() => playClick()).not.toThrow();
  });
});
