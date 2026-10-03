export const SCENE_KEYS = [
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
  'JustGamesScene',
  'InventoryScene',
  'WonderbookScene',
  'ShopScene',
  'VillageInteriorScene',
  'HollowTreeNookScene',
  'WindmillLookoutScene',
  'CrystalGrottoScene',
  'FireflyGroveScene',
  'CottageStyleScene',
  'SettingsScene',
  'StarlightBeachScene',
  'MapleBakingActivityScene',
  'CoralBeachcombingActivityScene',
  'RainbowDiscActivityScene',
  'ChessPlazaActivityScene',
  'PondLeapActivityScene',
  'ExplorationHudOverlayScene',
] as const;

export type SceneKey = (typeof SCENE_KEYS)[number];

const SCENE_KEY_SET = new Set<string>(SCENE_KEYS);

export function isSceneKey(value: string): value is SceneKey {
  return SCENE_KEY_SET.has(value);
}
