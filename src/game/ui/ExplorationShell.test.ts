import { describe, expect, it } from 'vitest';
import {
  EXPLORATION_SHELL_SCENES,
  shellManagesSceneAudio,
  supportsExplorationShell,
} from './ExplorationShellConfig';

describe('exploration shell coverage', () => {
  it('covers every current free-roaming exploration scene and micro-location', () => {
    expect([...EXPLORATION_SHELL_SCENES]).toEqual(
      expect.arrayContaining([
        'MoonflowerGladeScene',
        'CottageInteriorScene',
        'MoonflowerPatchScene',
        'HollowTreeNookScene',
        'SunbeamVillageScene',
        'RainbowMeadowScene',
        'WindmillLookoutScene',
        'CrystalBrookScene',
        'CrystalGrottoScene',
        'WhisperingWoodsScene',
        'FireflyGroveScene',
      ]),
    );
  });

  it('does not attach exploration chrome to races or story scenes', () => {
    expect(supportsExplorationShell('RaceScene')).toBe(false);
    expect(supportsExplorationShell('FireflyLanternScene')).toBe(false);
    expect(supportsExplorationShell('LumiStoryScene')).toBe(false);
  });

  it('does not double-own scene audio where an R5 region already owns it', () => {
    expect(shellManagesSceneAudio('CrystalBrookScene')).toBe(false);
    expect(shellManagesSceneAudio('WhisperingWoodsScene')).toBe(false);
    expect(shellManagesSceneAudio('RainbowMeadowScene')).toBe(true);
  });
});
