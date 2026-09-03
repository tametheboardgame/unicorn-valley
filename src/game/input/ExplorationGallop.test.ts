import { describe, expect, it } from 'vitest';
import { EXPLORATION_GALLOP_MULTIPLIER, explorationSpeedMultiplier } from './ExplorationGallop';

describe('explorationSpeedMultiplier', () => {
  it('uses the locked 1.6x multiplier in outdoor exploration regions', () => {
    expect(explorationSpeedMultiplier('RainbowMeadowScene', true)).toBe(
      EXPLORATION_GALLOP_MULTIPLIER,
    );
    expect(explorationSpeedMultiplier('StarlightBeachScene', true)).toBe(
      EXPLORATION_GALLOP_MULTIPLIER,
    );
    expect(EXPLORATION_GALLOP_MULTIPLIER).toBe(1.6);
  });

  it('does not accelerate indoor or non-exploration scenes', () => {
    expect(explorationSpeedMultiplier('CottageInteriorScene', true)).toBe(1);
    expect(explorationSpeedMultiplier('RaceScene', true)).toBe(1);
    expect(explorationSpeedMultiplier('WhisperingWoodsScene', false)).toBe(1);
  });
});
