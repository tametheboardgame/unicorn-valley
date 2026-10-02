import type Phaser from 'phaser';

export const RACE_RETURN_SCENE_REGISTRY_KEY = 'race-return-scene';

export type RaceReturnSceneKey =
  | 'RainbowRunEntryScene'
  | 'WhisperingWoodsScene'
  | 'StarlightBeachScene';

export function setRaceReturnScene(game: Phaser.Game, sceneKey: RaceReturnSceneKey): void {
  game.registry.set(RACE_RETURN_SCENE_REGISTRY_KEY, sceneKey);
}

export function consumeRaceReturnScene(
  game: Phaser.Game,
  fallback: RaceReturnSceneKey = 'RainbowRunEntryScene',
): RaceReturnSceneKey {
  const value = game.registry.get(RACE_RETURN_SCENE_REGISTRY_KEY);
  game.registry.remove(RACE_RETURN_SCENE_REGISTRY_KEY);
  return value === 'WhisperingWoodsScene' ||
    value === 'StarlightBeachScene' ||
    value === 'RainbowRunEntryScene'
    ? value
    : fallback;
}
