import { describe, expect, it } from 'vitest';
import {
  selectTouchMovementPresentation,
  shouldShowTouchMovementPad,
  shouldUsePortraitTouchControls,
} from './TouchMovementPad';

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

describe('portrait touch control layout', () => {
  it('uses the mobile overlay for a touch phone in portrait', () => {
    expect(shouldUsePortraitTouchControls(390, 844, 1, false)).toBe(true);
  });

  it('keeps the in-canvas controls in landscape', () => {
    expect(shouldUsePortraitTouchControls(844, 390, 1, false)).toBe(false);
  });

  it('does not show the mobile overlay on a non-touch viewport', () => {
    expect(shouldUsePortraitTouchControls(390, 844, 0, false)).toBe(false);
  });
});

describe('touch movement presentation selection', () => {
  it('selects the portrait DOM deck when a touch viewport rotates into portrait', () => {
    expect(selectTouchMovementPresentation(600, 900, 5, true, false)).toBe('portrait-dom');
  });

  it('selects the landscape tablet deck for an eligible landscape tablet', () => {
    expect(selectTouchMovementPresentation(1280, 800, 5, true, true)).toBe('landscape-tablet');
  });

  it('falls back to the canvas controls when neither specialised presentation applies', () => {
    expect(selectTouchMovementPresentation(1280, 720, 0, false, false)).toBe('canvas');
  });
});
