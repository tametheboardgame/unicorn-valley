import { describe, expect, it } from 'vitest';
import {
  EARLY_RACE_DIFFICULTY,
  EXTRA_HELP_CLEARANCE_ALLOWANCE,
  EXTRA_HELP_SPEED_MULTIPLIER,
  STANDARD_RACE_DIFFICULTY,
  resolveRacePlayerTuning,
} from './RaceDifficulty';

describe('race difficulty profiles', () => {
  it('makes the first-run profile more forgiving than the standard course', () => {
    expect(EARLY_RACE_DIFFICULTY.obstacleClearanceAllowance).toBeGreaterThan(
      STANDARD_RACE_DIFFICULTY.obstacleClearanceAllowance,
    );
    expect(EARLY_RACE_DIFFICULTY.obstacleWidthMultiplier).toBeLessThan(
      STANDARD_RACE_DIFFICULTY.obstacleWidthMultiplier,
    );
  });

  it('adds gentle assistance without replacing the course profile', () => {
    const standard = resolveRacePlayerTuning(STANDARD_RACE_DIFFICULTY, 'standard');
    const assisted = resolveRacePlayerTuning(STANDARD_RACE_DIFFICULTY, 'extra-help');

    expect(assisted.forwardSpeedMultiplier).toBeCloseTo(
      standard.forwardSpeedMultiplier * EXTRA_HELP_SPEED_MULTIPLIER,
    );
    expect(assisted.obstacleClearanceAllowance).toBe(
      standard.obstacleClearanceAllowance + EXTRA_HELP_CLEARANCE_ALLOWANCE,
    );
    expect(assisted.obstacleWidthMultiplier).toBeLessThan(standard.obstacleWidthMultiplier);
  });
});
