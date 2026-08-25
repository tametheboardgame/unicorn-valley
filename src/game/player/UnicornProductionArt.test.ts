import { describe, expect, it } from 'vitest';
import {
  getUnicornProductionTextureKey,
  selectUnicornProductionPose,
  UNICORN_PRODUCTION_POSES,
} from './UnicornProductionArt';

describe('UnicornProductionArt', () => {
  it('keeps the idle frame on the caller-provided base texture key', () => {
    expect(getUnicornProductionTextureKey('player-starlight', 'idle')).toBe('player-starlight');
    expect(getUnicornProductionTextureKey('player-starlight', 'walk-a')).toBe(
      'player-starlight--walk-a',
    );
    expect(new Set(UNICORN_PRODUCTION_POSES).size).toBe(UNICORN_PRODUCTION_POSES.length);
  });

  it('uses a calm idle, readable walk cycle and faster gallop cycle', () => {
    expect(selectUnicornProductionPose('idle', 0, 200, false)).toBe('idle');
    expect(selectUnicornProductionPose('moving', 120, 0, false)).toBe('walk-a');
    expect(selectUnicornProductionPose('moving', 120, 170, false)).toBe('walk-b');
    expect(selectUnicornProductionPose('moving', 280, 0, false)).toBe('gallop-a');
    expect(selectUnicornProductionPose('moving', 280, 110, false)).toBe('gallop-b');
    expect(selectUnicornProductionPose('moving', 150, 110, true)).toBe('gallop-b');
  });
});
