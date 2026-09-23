export const CLICK_NAVIGATION_SUPPORTED_SCENES = [
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
  'CrystalBrookScene',
  'WhisperingWoodsScene',
  'StarlightBeachScene',
  'CottageInteriorScene',
  'VillageInteriorScene',
  'MoonflowerPatchScene',
  'HollowTreeNookScene',
  'WindmillLookoutScene',
  'CrystalGrottoScene',
  'FireflyGroveScene',
] as const;

export const CLICK_NAVIGATION_SCENE_CLASSIFICATION = {
  supported: CLICK_NAVIGATION_SUPPORTED_SCENES,
  intentionallyStatic: [
    'TitleScene',
    'UnicornCreatorScene',
    'InventoryScene',
    'WonderbookScene',
    'SettingsScene',
    'CottageDecorateScene',
    'ShopScene',
    'DoorwayStubScene',
    'PipEggHatchScene',
    'RainbowRunEntryScene',
    'NovaTutorialRaceScene',
    'RaceScene',
    'FireflyLanternScene',
  ],
} as const;
