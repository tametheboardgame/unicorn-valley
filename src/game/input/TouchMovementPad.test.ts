import { describe, expect, it } from 'vitest';
import { shouldShowTouchMovementPad } from './TouchMovementPad';

describe('touch movement pad visibility', () => {
  it('shows when the browser reports touch points', () => {
    expect(shouldShowTouchMovementPad(1, false)).toBe(true);
  });

  it('shows when touchstart exists even if maxTouchPoints is unavailable', () => {
    expect(shouldShowTouchMovementPad(0, true)).toBe(true);
  });

  it('stays hidden on a conventional mouse/keyboard browser', () => {
    expect(shouldShowTouchMovementPad(0, false)).toBe(false);
  });
});
