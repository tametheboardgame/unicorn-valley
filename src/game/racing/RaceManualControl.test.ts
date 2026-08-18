import { describe, expect, it } from 'vitest';
import { resolveRaceRunning, updateRaceKeyboardArmed } from './RaceManualControl';

describe('manual race forward control', () => {
  it('does not run with no player input', () => {
    expect(resolveRaceRunning(true, false, false, false)).toBe(false);
  });

  it('runs while Right, D, or the touch RUN control is held', () => {
    expect(resolveRaceRunning(true, true, false, false)).toBe(true);
    expect(resolveRaceRunning(true, false, true, false)).toBe(true);
    expect(resolveRaceRunning(true, false, false, true)).toBe(true);
  });

  it('requires a release before inherited movement keys can start a new race', () => {
    expect(resolveRaceRunning(false, true, false, false)).toBe(false);
    expect(updateRaceKeyboardArmed(false, true, false)).toBe(false);
    expect(updateRaceKeyboardArmed(false, false, false)).toBe(true);
    expect(resolveRaceRunning(true, true, false, false)).toBe(true);
  });
});
