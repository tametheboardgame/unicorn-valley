import { describe, expect, it } from 'vitest';
import {
  AUDIO_SETTINGS_STORAGE_KEY,
  AudioSettingsStore,
  DEFAULT_AUDIO_SETTINGS,
  type AudioSettingsStorage,
  normaliseAudioSettings,
} from './AudioSettings';
import {
  AUDIO_SCENE_PROFILES,
  PRODUCTION_AUDIO_LOOP_MINIMUM_MS,
  getAudioSceneLoopDurationMs,
  resolveAudioSceneProfile,
} from './VerticalSliceAudio';

class MemoryStorage implements AudioSettingsStorage {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('AudioSettingsStore', () => {
  it('returns calm child-friendly defaults when nothing has been saved', () => {
    const store = new AudioSettingsStore(new MemoryStorage());
    expect(store.load()).toEqual(DEFAULT_AUDIO_SETTINGS);
  });

  it('persists independent music, ambience and effects controls', () => {
    const storage = new MemoryStorage();
    const store = new AudioSettingsStore(storage);

    store.save({
      muted: false,
      musicEnabled: false,
      ambienceEnabled: true,
      sfxEnabled: false,
      masterVolume: 0.4,
    });

    expect(new AudioSettingsStore(storage).load()).toEqual({
      muted: false,
      musicEnabled: false,
      ambienceEnabled: true,
      sfxEnabled: false,
      masterVolume: 0.4,
    });
  });

  it('fails safely when stored preferences are malformed', () => {
    const storage = new MemoryStorage();
    storage.setItem(AUDIO_SETTINGS_STORAGE_KEY, '{not-json');
    expect(new AudioSettingsStore(storage).load()).toEqual(DEFAULT_AUDIO_SETTINGS);
  });

  it('normalises partial values and clamps volume', () => {
    expect(normaliseAudioSettings({ musicEnabled: false, masterVolume: 8 })).toEqual({
      ...DEFAULT_AUDIO_SETTINGS,
      musicEnabled: false,
      masterVolume: 1,
    });
  });
});

describe('production audio scene profiles', () => {
  it('gives the menu, home and every major exploration region its intended identity', () => {
    expect(resolveAudioSceneProfile('TitleScene')).toBe('menu');
    expect(resolveAudioSceneProfile('MoonflowerGladeScene')).toBe('glade');
    expect(resolveAudioSceneProfile('MoonflowerPatchScene')).toBe('glade');
    expect(resolveAudioSceneProfile('SunbeamVillageScene')).toBe('village');
    expect(resolveAudioSceneProfile('RainbowMeadowScene')).toBe('meadow');
    expect(resolveAudioSceneProfile('CrystalBrookScene')).toBe('brook');
    expect(resolveAudioSceneProfile('WhisperingWoodsScene')).toBe('woods');
    expect(resolveAudioSceneProfile('CottageInteriorScene')).toBe('cottage');
  });

  it('gives both Rainbow Run scenes the energetic race profile', () => {
    expect(resolveAudioSceneProfile('RaceScene')).toBe('race');
    expect(resolveAudioSceneProfile('NovaTutorialRaceScene')).toBe('race');
  });

  it('keeps every production music phrase above the minimum repetition window', () => {
    for (const profile of AUDIO_SCENE_PROFILES) {
      expect(getAudioSceneLoopDurationMs(profile), profile).toBeGreaterThanOrEqual(
        PRODUCTION_AUDIO_LOOP_MINIMUM_MS,
      );
    }
  });

  it('leaves utility scenes free of unintended location ambience', () => {
    expect(resolveAudioSceneProfile('InventoryScene')).toBeNull();
    expect(resolveAudioSceneProfile('WonderbookScene')).toBeNull();
  });
});
