import { describe, expect, it } from 'vitest';
import {
  RAINBOW_DISC_GOALS_TO_WIN,
  applyRainbowDiscAssistance,
  getRainbowDiscAssistanceProfile,
  isRainbowDiscMatchComplete,
  isRainbowDiscReleaseAccurate,
  rainbowDiscDefenceLane,
  rainbowDiscDefenceTelegraphAlpha,
  rainbowDiscMissOffset,
  rainbowDiscOpenLane,
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

});
