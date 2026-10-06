import { describe, expect, it } from 'vitest';
import {
  POND_LEAP_ASSISTANCE_LEVELS,
  POND_LEAP_COURSE_IDS,
  POND_LEAP_COURSES,
  POND_LEAP_MODES,
  POND_LEAP_PRACTICE_ATTEMPTS,
  POND_LEAP_RIPPLE_RUSH_HOPS,
  POND_LEAP_RIPPLE_RUSH_SPLASH_LIMIT,
  applyPondLeapModePressure,
  createPondLeapModeRunState,
  defaultPondLeapAssistance,
  getPondLeapTimingChallenge,
  isPondLeapCourseComplete,
  isPondLeapModeFinished,
  isPondLeapRippleRushFailed,
  isPondLeapTimingSuccessful,
  pondLeapModeTitle,
  recordPondLeapModeAttempt,
} from './PondLeapRules';

describe('PondLeapRules', () => {
  it('keeps course and help selectors in a stable child-facing order', () => {
    expect(POND_LEAP_COURSE_IDS).toEqual(['sunny-steps', 'reed-weave', 'twinkle-trail']);
    expect(POND_LEAP_ASSISTANCE_LEVELS).toEqual(['relaxed', 'standard', 'quick']);
    expect(POND_LEAP_MODES).toEqual(['classic', 'practice', 'ripple-rush']);
  });

  it('gives each mode a readable title and sensible default help', () => {
    expect(pondLeapModeTitle('classic')).toBe('Classic Crossing');
    expect(pondLeapModeTitle('practice')).toBe('Practice Pond');
    expect(pondLeapModeTitle('ripple-rush')).toBe('Ripple Rush');
    expect(defaultPondLeapAssistance('classic')).toBe('standard');
    expect(defaultPondLeapAssistance('practice')).toBe('relaxed');
    expect(defaultPondLeapAssistance('ripple-rush')).toBe('quick');
  });

  it('keeps Relaxed slower and wider while Quick is faster and tighter', () => {
    const relaxed = getPondLeapTimingChallenge('sunny-steps', 2, 'relaxed');
    const standard = getPondLeapTimingChallenge('sunny-steps', 2, 'standard');
    const quick = getPondLeapTimingChallenge('sunny-steps', 2, 'quick');

    expect(relaxed.tolerance).toBeGreaterThan(standard.tolerance);
    expect(relaxed.sweepSpeed).toBeLessThan(standard.sweepSpeed);
    expect(quick.tolerance).toBeLessThan(standard.tolerance);
    expect(quick.sweepSpeed).toBeGreaterThan(standard.sweepSpeed);
  });

  it('defines three distinct six-pad crossing patterns', () => {
    const courses = Object.values(POND_LEAP_COURSES);

    expect(courses).toHaveLength(3);
    for (const course of courses) {
      expect(course.pads).toHaveLength(6);
      expect(course.timingCentres).toHaveLength(5);
      expect(course.timingTolerances).toHaveLength(5);
      expect(course.sweepSpeeds).toHaveLength(5);
    }

    expect(POND_LEAP_COURSES['reed-weave'].pads).not.toEqual(POND_LEAP_COURSES['sunny-steps'].pads);
    expect(POND_LEAP_COURSES['twinkle-trail'].timingCentres).not.toEqual(
      POND_LEAP_COURSES['reed-weave'].timingCentres,
    );
  });

  it('preserves the accepted Sunny Steps timing values at Standard assistance', () => {
    const first = getPondLeapTimingChallenge('sunny-steps', 0, 'standard');
    const last = getPondLeapTimingChallenge('sunny-steps', 4, 'standard');

    expect(first).toEqual({ centre: 0.34, tolerance: 0.18, sweepSpeed: 0.0042 });
    expect(last).toEqual({ centre: 0.42, tolerance: 0.12, sweepSpeed: 0.0056 });
  });

  it('resolves landings from the exact visible timing challenge', () => {
    const challenge = getPondLeapTimingChallenge('reed-weave', 1, 'standard');

    expect(isPondLeapTimingSuccessful(challenge.centre, challenge)).toBe(true);
    expect(
      isPondLeapTimingSuccessful(challenge.centre + challenge.tolerance * 0.9, challenge),
    ).toBe(true);
    expect(
      isPondLeapTimingSuccessful(challenge.centre + challenge.tolerance + 0.01, challenge),
    ).toBe(false);
  });

  it('completes only after reaching the final pad for the selected course', () => {
    expect(isPondLeapCourseComplete(4, 'sunny-steps')).toBe(false);
    expect(isPondLeapCourseComplete(5, 'sunny-steps')).toBe(true);
  });

  it('uses an explicit three-splash failure threshold for Ripple Rush', () => {
    expect(POND_LEAP_RIPPLE_RUSH_SPLASH_LIMIT).toBe(3);
    expect(isPondLeapRippleRushFailed(2)).toBe(false);
    expect(isPondLeapRippleRushFailed(3)).toBe(true);
  });

  it('tracks Practice Pond streaks without creating a fail state', () => {
    let state = createPondLeapModeRunState();
    state = recordPondLeapModeAttempt(state, true);
    state = recordPondLeapModeAttempt(state, true);
    state = recordPondLeapModeAttempt(state, false);

    expect(state).toMatchObject({
      attempts: 3,
      successes: 2,
      streak: 0,
      bestStreak: 2,
      splashes: 1,
    });
    expect(isPondLeapModeFinished('practice', state)).toBe(false);

    for (let index = state.attempts; index < POND_LEAP_PRACTICE_ATTEMPTS; index += 1) {
      state = recordPondLeapModeAttempt(state, false);
    }

    expect(isPondLeapModeFinished('practice', state)).toBe(true);
  });

  it('finishes Ripple Rush after eight clean hops or the third splash', () => {
    let completed = createPondLeapModeRunState();
    for (let index = 0; index < POND_LEAP_RIPPLE_RUSH_HOPS; index += 1) {
      completed = recordPondLeapModeAttempt(completed, true);
    }

    expect(isPondLeapModeFinished('ripple-rush', completed)).toBe(true);

    let failed = createPondLeapModeRunState();
    failed = recordPondLeapModeAttempt(failed, false);
    failed = recordPondLeapModeAttempt(failed, false);
    expect(isPondLeapModeFinished('ripple-rush', failed)).toBe(false);
    failed = recordPondLeapModeAttempt(failed, false);
    expect(isPondLeapModeFinished('ripple-rush', failed)).toBe(true);
  });

  it('progressively tightens and speeds Ripple Rush using visible timing rules', () => {
    const base = getPondLeapTimingChallenge('sunny-steps', 2, 'standard');
    const early = applyPondLeapModePressure(base, 'ripple-rush', 0);
    const later = applyPondLeapModePressure(base, 'ripple-rush', 6);

    expect(later.tolerance).toBeLessThan(early.tolerance);
    expect(later.sweepSpeed).toBeGreaterThan(early.sweepSpeed);
    expect(applyPondLeapModePressure(base, 'practice', 6)).toEqual(base);
    expect(applyPondLeapModePressure(base, 'classic', 6)).toEqual(base);
  });

  it('clamps out-of-range hop requests to a valid deterministic challenge', () => {
    expect(getPondLeapTimingChallenge('sunny-steps', -5, 'standard')).toEqual(
      getPondLeapTimingChallenge('sunny-steps', 0, 'standard'),
    );
    expect(getPondLeapTimingChallenge('sunny-steps', 999, 'standard')).toEqual(
      getPondLeapTimingChallenge('sunny-steps', 4, 'standard'),
    );
  });
});
