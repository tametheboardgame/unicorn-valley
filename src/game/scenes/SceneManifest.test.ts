import { describe, expect, it } from 'vitest';
import { SCENE_MANIFEST, getStartupSceneKeys } from './SceneManifest';

const EXPECTED_STARTUP_KEYS = [
  'BootScene',
  'PreloadScene',
  'TitleScene',
  'ResizeTestScene',
  'MovementTestScene',
  'MoonflowerGladeScene',
  'CottageInteriorScene',
  'CottageDecorateScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
  'CrystalBrookScene',
  'WhisperingWoodsScene',
  'FireflyLanternScene',
  'RainbowRunEntryScene',
  'NovaTutorialRaceScene',
  'RaceScene',
  'PipEggHatchScene',
  'DoorwayStubScene',
  'DialogueTestScene',
  'UnicornCreatorScene',
] as const;

describe('SCENE_MANIFEST', () => {
  it('keeps stable scene keys unique', () => {
    const keys = SCENE_MANIFEST.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves the established startup registration order', () => {
    expect(getStartupSceneKeys()).toEqual(EXPECTED_STARTUP_KEYS);
  });

  it('requires every non-startup scene to expose a lazy constructor factory', () => {
    const runtimeEntries = SCENE_MANIFEST.filter((entry) => entry.loadBoundary !== 'startup');
    expect(runtimeEntries.length).toBeGreaterThan(0);
    for (const entry of runtimeEntries) {
      expect('load' in entry && typeof entry.load === 'function').toBe(true);
    }
  });

  it('records the R6 village interior as the live owner of the stable scene key', () => {
    const villageInterior = SCENE_MANIFEST.find((entry) => entry.key === 'VillageInteriorScene');
    expect(villageInterior).toMatchObject({
      loadBoundary: 'runtime-eager',
      registrationOwner: 'bootstrap',
    });
  });
});
