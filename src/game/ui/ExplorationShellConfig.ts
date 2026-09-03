export const EXPLORATION_SHELL_SCENES = new Set([
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
]);

const DEDICATED_AUDIO_SCENES = new Set(['CrystalBrookScene', 'WhisperingWoodsScene']);

export function supportsExplorationShell(sceneKey: string): boolean {
  return EXPLORATION_SHELL_SCENES.has(sceneKey);
}

export function shellManagesSceneAudio(sceneKey: string): boolean {
  return !DEDICATED_AUDIO_SCENES.has(sceneKey);
}
