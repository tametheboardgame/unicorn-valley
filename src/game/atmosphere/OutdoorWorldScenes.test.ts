import { describe, expect, it } from 'vitest';
import { OUTDOOR_EXPLORATION_SCENE_KEYS, supportsOutdoorAtmosphere } from './OutdoorWorldScenes';

describe('outdoor atmosphere coverage', () => {
  it('covers every current outdoor exploration region', () => {
    expect([...OUTDOOR_EXPLORATION_SCENE_KEYS]).toEqual([
      'MoonflowerGladeScene',
      'MoonflowerPatchScene',
      'SunbeamVillageScene',
      'RainbowMeadowScene',
      'CrystalBrookScene',
      'WhisperingWoodsScene',
    ]);
  });

  it('keeps indoor, race and activity scenes outside the global weather layer', () => {
    expect(supportsOutdoorAtmosphere('CottageInteriorScene')).toBe(false);
    expect(supportsOutdoorAtmosphere('RaceScene')).toBe(false);
    expect(supportsOutdoorAtmosphere('FireflyLanternScene')).toBe(false);
  });
});
