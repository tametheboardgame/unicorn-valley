import { describe, expect, it } from 'vitest';
import { EXPLORATION_SHELL_SCENES, supportsExplorationShell } from './ExplorationShell';

describe('exploration shell coverage', () => {
  it('covers every current free-roaming exploration scene', () => {
    expect([...EXPLORATION_SHELL_SCENES]).toEqual(
      expect.arrayContaining([
        'MoonflowerGladeScene',
        'CottageInteriorScene',
        'MoonflowerPatchScene',
        'SunbeamVillageScene',
        'RainbowMeadowScene',
        'CrystalBrookScene',
        'WhisperingWoodsScene',
      ]),
    );
  });

  it('does not attach exploration chrome to races or story scenes', () => {
    expect(supportsExplorationShell('RaceScene')).toBe(false);
    expect(supportsExplorationShell('FireflyLanternScene')).toBe(false);
    expect(supportsExplorationShell('LumiStoryScene')).toBe(false);
  });
});
