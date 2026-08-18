import { describe, expect, it } from 'vitest';
import {
  RACE_COUNTDOWN_INTERVAL_MS,
  resolveRaceCountdown,
} from './RacePresentation';

describe('resolveRaceCountdown', () => {
  it('moves through 3, 2, 1 and GO before the race is released', () => {
    expect(resolveRaceCountdown(0)).toEqual({ cue: '3', cueIndex: 0, readyToRace: false });
    expect(resolveRaceCountdown(RACE_COUNTDOWN_INTERVAL_MS)).toEqual({
      cue: '2',
      cueIndex: 1,
      readyToRace: false,
    });
    expect(resolveRaceCountdown(RACE_COUNTDOWN_INTERVAL_MS * 2)).toEqual({
      cue: '1',
      cueIndex: 2,
      readyToRace: false,
    });
    expect(resolveRaceCountdown(RACE_COUNTDOWN_INTERVAL_MS * 3)).toEqual({
      cue: 'GO!',
      cueIndex: 3,
      readyToRace: true,
    });
  });

  it('clamps negative and very large elapsed times safely', () => {
    expect(resolveRaceCountdown(-500).cue).toBe('3');
    expect(resolveRaceCountdown(60_000)).toEqual({ cue: 'GO!', cueIndex: 3, readyToRace: true });
  });
});
