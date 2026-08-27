import { describe, expect, it } from 'vitest';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '../accessibility/AccessibilitySettings';
import { DEFAULT_AUDIO_SETTINGS } from '../audio/AudioSettings';
import { describeGameSetting, moveGameSettingSelection } from './GameSettingsModel';

const baseSnapshot = {
  audio: { ...DEFAULT_AUDIO_SETTINGS },
  accessibility: { ...DEFAULT_ACCESSIBILITY_SETTINGS },
  fullscreenSupported: true,
  fullscreenActive: false,
};

describe('GameSettingsModel', () => {
  it('uses the same child-facing labels for persisted sound and accessibility settings', () => {
    expect(describeGameSetting('muted', baseSnapshot).label).toBe('All sound: On');
    expect(describeGameSetting('music', baseSnapshot).label).toBe('Music: On');
    expect(describeGameSetting('reduced-motion', baseSnapshot).label).toBe('Reduced motion: Off');
    expect(describeGameSetting('high-visibility', baseSnapshot).label).toBe('High visibility: Off');
  });

  it('describes fullscreen capability without pretending unsupported browsers can toggle it', () => {
    expect(describeGameSetting('fullscreen', baseSnapshot)).toMatchObject({
      label: 'Fullscreen: Off',
      available: true,
      enabled: false,
    });
    expect(
      describeGameSetting('fullscreen', { ...baseSnapshot, fullscreenSupported: false }),
    ).toMatchObject({
      label: 'Fullscreen: Not available',
      available: false,
      enabled: false,
    });
  });

  it('wraps keyboard selection in both directions', () => {
    expect(moveGameSettingSelection(0, -1, 8)).toBe(7);
    expect(moveGameSettingSelection(7, 1, 8)).toBe(0);
    expect(moveGameSettingSelection(3, 1, 8)).toBe(4);
  });
});
