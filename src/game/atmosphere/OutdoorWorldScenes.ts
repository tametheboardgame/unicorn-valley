export const OUTDOOR_EXPLORATION_SCENE_KEYS = [
  'MoonflowerGladeScene',
  'MoonflowerPatchScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
  'CrystalBrookScene',
  'WhisperingWoodsScene',
  'StarlightBeachScene',
] as const;

const OUTDOOR_EXPLORATION_SCENES = new Set<string>(OUTDOOR_EXPLORATION_SCENE_KEYS);

export function supportsOutdoorAtmosphere(sceneKey: string): boolean {
  return OUTDOOR_EXPLORATION_SCENES.has(sceneKey);
}
