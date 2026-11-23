import { describe, expect, it } from 'vitest';
import { MAX_HINT_LEVEL, nextHintLevel, tutorAccess } from '../lib/tutorGuard.js';

const profile = { name: 'X', token: 's1.abc' };
const preDone = { pre: { status: 'submitted' } };

describe('tutorAccess', () => {
  it('butuh backend dan login', () => {
    expect(tutorAccess({ backendEnabled: false, profile, attempts: preDone }).reason).toBe('no-backend');
    expect(tutorAccess({ backendEnabled: true, profile: { name: 'X' }, attempts: preDone }).reason).toBe('no-login');
  });

  it('terkunci selama tes berlangsung', () => {
    expect(tutorAccess({ backendEnabled: true, profile, attempts: preDone, examActive: true }).reason).toBe('exam');
    const postRunning = { ...preDone, post: { status: 'in_progress' } };
    expect(tutorAccess({ backendEnabled: true, profile, attempts: postRunning }).reason).toBe('exam');
    // unlockAll (demo) tidak boleh membuka tutor saat ujian
    expect(tutorAccess({ backendEnabled: true, profile, attempts: postRunning, unlockAll: true }).open).toBe(false);
  });

  it('terkunci sebelum pretest dikumpulkan', () => {
    expect(tutorAccess({ backendEnabled: true, profile, attempts: {} }).reason).toBe('before-pretest');
    expect(tutorAccess({ backendEnabled: true, profile, attempts: preDone }).open).toBe(true);
  });
});

describe('nextHintLevel', () => {
  it('naik bertahap sampai batas', () => {
    expect(nextHintLevel(0)).toBe(1);
    expect(nextHintLevel(2)).toBe(3);
    expect(nextHintLevel(MAX_HINT_LEVEL)).toBe(MAX_HINT_LEVEL);
  });
});
