export const WORLD_TRAVERSAL_POLISH_SUPPORTED_SCENE_KEYS = ['MoonflowerGladeScene'] as const;

export const EXPLORATION_GEOMETRY_SUPPORTED_SCENE_KEYS = [
  'MoonflowerGladeScene',
  'CrystalBrookScene',
  'WhisperingWoodsScene',
] as const;

export const ENVIRONMENT_PRODUCTION_SCENE_ENVIRONMENTS = {
  MoonflowerGladeScene: 'moonflower-glade',
  CrystalBrookScene: 'crystal-brook',
  WhisperingWoodsScene: 'whispering-woods',
  RaceScene: 'rainbow-run',
  NovaTutorialRaceScene: 'rainbow-run',
} as const;

export const VISUAL_TIGHTENING_SUPPORTED_SCENE_KEYS = [
  'NovaTutorialRaceScene',
  'RaceScene',
] as const;
