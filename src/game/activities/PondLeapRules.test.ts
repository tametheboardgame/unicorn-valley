import { describe, expect, it } from 'vitest';
import {
  POND_LEAP_ASSISTANCE_LEVELS,
  POND_LEAP_COURSE_IDS,
  POND_LEAP_COURSES,
  POND_LEAP_RIPPLE_RUSH_SPLASH_LIMIT,
  getPondLeapTimingChallenge,
  isPondLeapCourseComplete,
  isPondLeapRippleRushFailed,
  isPondLeapTimingSuccessful,
} from './PondLeapRules';

describe('PondLeapRules', () => {
  it('keeps course and help selectors in a stable child-facing order', () => {
    expect(POND_LEAP_COURSE_IDS).toEqual(['sunny-steps', 'reed-weave', 'twinkle-trail']);
    expect(POND_LEAP_ASSISTANCE_LEVELS).toEqual(['relaxed', 'standard', 'quick']);
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

  it('clamps out-of-range hop requests to a valid deterministic challenge', () => {
    expect(getPondLeapTimingChallenge('sunny-steps', -5, 'standard')).toEqual(
      getPondLeapTimingChallenge('sunny-steps', 0, 'standard'),
    );
    expect(getPondLeapTimingChallenge('sunny-steps', 999, 'standard')).toEqual(
      getPondLeapTimingChallenge('sunny-steps', 4, 'standard'),
    );
  });
});
