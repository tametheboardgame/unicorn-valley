import type { AccessibilitySettings } from '../accessibility/AccessibilitySettings';
import type { AudioSettings } from '../audio/AudioSettings';

export const GAME_SETTING_KINDS = [
  'muted',
  'music',
  'ambience',
  'sfx',
  'reduced-motion',
  'high-visibility',
  'fullscreen',
] as const;

export type GameSettingKind = (typeof GAME_SETTING_KINDS)[number];

export interface GameSettingsSnapshot {
  audio: AudioSettings;
  accessibility: AccessibilitySettings;
  fullscreenSupported: boolean;
  fullscreenActive: boolean;
}

export interface GameSettingPresentation {
  label: string;
  enabled: boolean;
  available: boolean;
}

export function describeGameSetting(
  kind: GameSettingKind,
  snapshot: GameSettingsSnapshot,
): GameSettingPresentation {
  switch (kind) {
    case 'muted': {
      const enabled = !snapshot.audio.muted;
      return { label: `All sound: ${enabled ? 'On' : 'Off'}`, enabled, available: true };
    }
    case 'music': {
      const enabled = snapshot.audio.musicEnabled;
      return { label: `Music: ${enabled ? 'On' : 'Off'}`, enabled, available: true };
    }
    case 'ambience': {
      const enabled = snapshot.audio.ambienceEnabled;
      return { label: `Ambience: ${enabled ? 'On' : 'Off'}`, enabled, available: true };
    }
    case 'sfx': {
      const enabled = snapshot.audio.sfxEnabled;
      return { label: `Effects: ${enabled ? 'On' : 'Off'}`, enabled, available: true };
    }
    case 'reduced-motion': {
      const enabled = snapshot.accessibility.reducedMotion;
      return { label: `Reduced motion: ${enabled ? 'On' : 'Off'}`, enabled, available: true };
    }
    case 'high-visibility': {
      const enabled = snapshot.accessibility.highVisibilityInteractions;
      return { label: `High visibility: ${enabled ? 'On' : 'Off'}`, enabled, available: true };
    }
    case 'fullscreen':
      return snapshot.fullscreenSupported
        ? {
            label: `Fullscreen: ${snapshot.fullscreenActive ? 'On' : 'Off'}`,
            enabled: snapshot.fullscreenActive,
            available: true,
          }
        : { label: 'Fullscreen: Not available', enabled: false, available: false };
  }
}

export function moveGameSettingSelection(
  currentIndex: number,
  direction: -1 | 1,
  itemCount: number,
): number {
  if (itemCount <= 0) {
    return 0;
  }
  return (currentIndex + direction + itemCount) % itemCount;
}
