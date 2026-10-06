import { describe, expect, it } from 'vitest';
import {
  applyRainbowDiscAssistance,
  getRainbowDiscAssistanceProfile,
  isRainbowDiscReleaseAccurate,
  rainbowDiscMissOffset,
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
});
