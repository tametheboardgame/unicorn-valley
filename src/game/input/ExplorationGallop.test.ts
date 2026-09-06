import { beforeEach, describe, expect, it } from 'vitest';
import {
  EXPLORATION_GALLOP_MULTIPLIER,
  EXPLORATION_SNACK_DURATION_MS,
  EXPLORATION_SNACK_MULTIPLIER,
  activateExplorationSnackBoost,
  clearExplorationSnackBoost,
  explorationSpeedMultiplier,
  getExplorationSnackBoostRemainingSeconds,
} from './ExplorationGallop';

describe('explorationSpeedMultiplier', () => {
  beforeEach(() => {
    clearExplorationSnackBoost();
  });

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

  it('applies a bounded snack boost to outdoor walking without stacking on gallop', () => {
    const now = 1_000_000;
    const expiresAt = activateExplorationSnackBoost(now);

    expect(expiresAt).toBe(now + EXPLORATION_SNACK_DURATION_MS);
    expect(getExplorationSnackBoostRemainingSeconds(now)).toBe(45);
    expect(explorationSpeedMultiplier('MoonflowerGladeScene', false, now)).toBe(
      EXPLORATION_SNACK_MULTIPLIER,
    );
    expect(explorationSpeedMultiplier('MoonflowerGladeScene', true, now)).toBe(
      EXPLORATION_GALLOP_MULTIPLIER,
    );
    expect(explorationSpeedMultiplier('CottageInteriorScene', false, now)).toBe(1);
    expect(explorationSpeedMultiplier('MoonflowerGladeScene', false, expiresAt)).toBe(1);
  });
});
