import { describe, expect, it } from 'vitest';
import type { UnicornAppearance } from './UnicornAppearance';
import {
  getPlayerManeCoverageTextureKey,
  PLAYER_MANE_COVERAGE_POSE_OFFSETS,
} from './PlayerManeCoverage';
import { UNICORN_PRODUCTION_POSES } from './UnicornProductionArt';

const appearance: UnicornAppearance = {
  bodyColour: 'cream',
  eyeColour: 'violet',
  maneStyle: 'fluffy',
  maneColour: 'aqua',
  tailStyle: 'swish',
  tailColour: 'plum',
  hornStyle: 'classic',
  marking: 'star',
  accessory: 'flower',
};

describe('PlayerManeCoverage', () => {
  it('defines coverage alignment for every production pose', () => {
    expect(Object.keys(PLAYER_MANE_COVERAGE_POSE_OFFSETS).sort()).toEqual(
      [...UNICORN_PRODUCTION_POSES].sort(),
    );
  });

  it('keeps coverage textures stable across style, colour and pose', () => {
    const keys = UNICORN_PRODUCTION_POSES.map((pose) =>
      getPlayerManeCoverageTextureKey(appearance, pose),
    );
    expect(new Set(keys).size).toBe(UNICORN_PRODUCTION_POSES.length);
    expect(keys[0]).toContain('fluffy:aqua');
  });
});
