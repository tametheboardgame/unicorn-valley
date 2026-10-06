import { describe, expect, it } from 'vitest';
import {
  RAINBOW_DISC_GOALS_TO_WIN,
  applyRainbowDiscAssistance,
  getRainbowDiscAssistanceProfile,
  isRainbowDiscMatchComplete,
  isRainbowDiscReleaseAccurate,
  rainbowDiscDefenceCueProfile,
  rainbowDiscDefenceLane,
  rainbowDiscDefenceTelegraphAlpha,
  rainbowDiscMissOffset,
  rainbowDiscOpenLane,
  varyRainbowDiscTimingChallenge,
} from './RainbowDiscRules';

describe('RainbowDiscRules', () => {
  it('makes Gentle slower and wider while Challenge is faster and tighter', () => {
    const base = { tolerance: 0.2, sweepSpeed: 0.004, label: 'Test' };
    const gentle = applyRainbowDiscAssistance(base, 'gentle');
    const standard = applyRainbowDiscAssistance(base, 'standard');
    const challenge = applyRainbowDiscAssistance(base, 'challenge');

    expect(gentle.tolerance).toBeGreaterThan(standard.tolerance);
    expect(gentle.sweepSpeed).toBeLessThan(standard.sweepSpeed);
    expect(challenge.tolerance).toBeLessThan(standard.tolerance);
    expect(challenge.sweepSpeed).toBeGreaterThan(standard.sweepSpeed);
  });

  it('resolves release accuracy deterministically from the visible timing value', () => {
    expect(isRainbowDiscReleaseAccurate(0.55, 0.1)).toBe(true);
    expect(isRainbowDiscReleaseAccurate(0.64, 0.1)).toBe(true);
    expect(isRainbowDiscReleaseAccurate(0.66, 0.1)).toBe(false);
  });

  it('uses assistance only to change transparent input tolerances', () => {
    const gentle = getRainbowDiscAssistanceProfile('gentle');
    const standard = getRainbowDiscAssistanceProfile('standard');
    const challenge = getRainbowDiscAssistanceProfile('challenge');

    expect(gentle.minimumPointerDrag).toBeLessThan(standard.minimumPointerDrag);
    expect(challenge.minimumPointerDrag).toBeGreaterThan(standard.minimumPointerDrag);
  });

  it('maps early and late releases to opposite miss directions', () => {
    expect(rainbowDiscMissOffset(0.2)).toBeLessThan(0);
    expect(rainbowDiscMissOffset(0.9)).toBeGreaterThan(0);
  });
  it('rotates authored attack lane patterns between possessions', () => {
    expect([0, 1, 2].map((pass) => rainbowDiscOpenLane(0, pass))).toEqual([1, 2, 0]);
    expect([0, 1, 2].map((pass) => rainbowDiscOpenLane(1, pass))).toEqual([2, 0, 1]);
    expect([0, 1, 2].map((pass) => rainbowDiscOpenLane(2, pass))).toEqual([0, 1, 2]);
  });

  it('uses deterministic readable opposition lane sequences', () => {
    expect(rainbowDiscDefenceLane(0, 0)).toBe(1);
    expect(rainbowDiscDefenceLane(0, 1)).toBe(2);
    expect(rainbowDiscDefenceLane(1, 0)).toBe(0);
    expect(rainbowDiscDefenceLane(1, 1)).toBe(1);
  });

  it('completes a short match when either side reaches the target score', () => {
    expect(RAINBOW_DISC_GOALS_TO_WIN).toBe(2);
    expect(isRainbowDiscMatchComplete(1, 1)).toBe(false);
    expect(isRainbowDiscMatchComplete(2, 0)).toBe(true);
    expect(isRainbowDiscMatchComplete(0, 2)).toBe(true);
  });

  it('keeps defence telegraph visible at every assistance level', () => {
    expect(rainbowDiscDefenceTelegraphAlpha('gentle')).toBeGreaterThan(
      rainbowDiscDefenceTelegraphAlpha('standard'),
    );
    expect(rainbowDiscDefenceTelegraphAlpha('standard')).toBeGreaterThan(
      rainbowDiscDefenceTelegraphAlpha('challenge'),
    );
    expect(rainbowDiscDefenceTelegraphAlpha('challenge')).toBeGreaterThan(0);
  });

  it('makes defence cues shorter and subtler as assistance decreases', () => {
    const gentle = rainbowDiscDefenceCueProfile('gentle');
    const standard = rainbowDiscDefenceCueProfile('standard');
    const challenge = rainbowDiscDefenceCueProfile('challenge');

    expect(gentle.durationMs).toBeGreaterThan(standard.durationMs);
    expect(standard.durationMs).toBeGreaterThan(challenge.durationMs);
    expect(gentle.routeReach).toBeGreaterThan(standard.routeReach);
    expect(standard.routeReach).toBeGreaterThan(challenge.routeReach);
    expect(gentle.ringPulse).toBe(true);
    expect(standard.ringPulse).toBe(false);
  });

  it('moves and resizes the green timing window between throws deterministically', () => {
    const base = { tolerance: 0.2, sweepSpeed: 0.004, label: 'Match' };
    const first = varyRainbowDiscTimingChallenge(base, 0);
    const second = varyRainbowDiscTimingChallenge(base, 1);
    const third = varyRainbowDiscTimingChallenge(base, 2);

    expect(second.centre).not.toBe(first.centre);
    expect(second.tolerance).not.toBe(first.tolerance);
    expect(third.centre).not.toBe(second.centre);
    expect(varyRainbowDiscTimingChallenge(base, 1)).toEqual(second);
  });

  it('keeps every varied timing window fully inside the timing track', () => {
    const base = { tolerance: 0.34, sweepSpeed: 0.004, label: 'Gentle' };

    for (let index = 0; index < 24; index += 1) {
      const challenge = varyRainbowDiscTimingChallenge(base, index);
      expect(challenge.centre - challenge.tolerance).toBeGreaterThanOrEqual(0);
      expect(challenge.centre + challenge.tolerance).toBeLessThanOrEqual(1);
    }
  });
});
