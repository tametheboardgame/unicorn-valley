import { describe, expect, it } from 'vitest';
import { SCENE_KEYS } from './SceneKeys';
import { SCENE_MANIFEST, getStartupSceneKeys } from './SceneManifest';

const EXPECTED_STARTUP_KEYS = [
  'BootScene',
  'PreloadScene',
  'TitleScene',
  'ResizeTestScene',
  'MovementTestScene',
  'MoonflowerGladeScene',
  'CottageInteriorScene',
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

  it('classifies the Rainbow Run Race Hub as exploration rather than a race scene', () => {
    expect(SCENE_MANIFEST.find((entry) => entry.key === 'RainbowRunEntryScene')).toMatchObject({
      category: 'exploration',
      loadBoundary: 'startup',
    });
  });

  it('keeps the manifest and dependency-free scene-key registry aligned', () => {
    expect(SCENE_MANIFEST.map((entry) => entry.key).sort()).toEqual([...SCENE_KEYS].sort());
  });

  it('keeps the Crystal Cup Raceway hub behind the on-demand exploration boundary', () => {
    expect(SCENE_MANIFEST.find((entry) => entry.key === 'CrystalCupEntryScene')).toMatchObject({
      category: 'exploration',
      loadBoundary: 'on-demand',
      registrationOwner: 'feature',
    });
  });

  it('keeps Just Games behind the on-demand feature boundary', () => {
    expect(SCENE_MANIFEST.find((entry) => entry.key === 'JustGamesScene')).toMatchObject({
      category: 'modal',
      loadBoundary: 'on-demand',
      registrationOwner: 'feature',
    });
  });

  it('keeps the cottage decoration editor behind the feature boundary', () => {
    const cottageDecorate = SCENE_MANIFEST.find((entry) => entry.key === 'CottageDecorateScene');
    expect(cottageDecorate).toMatchObject({
      loadBoundary: 'on-demand',
      registrationOwner: 'feature',
    });
  });

  it('keeps Chess and Pond Leap on the canonical on-demand manifest path', () => {
    for (const key of ['ChessPlazaActivityScene', 'PondLeapActivityScene'] as const) {
      expect(SCENE_MANIFEST.find((entry) => entry.key === key)).toMatchObject({
        category: 'activity',
        loadBoundary: 'on-demand',
        registrationOwner: 'feature',
      });
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
