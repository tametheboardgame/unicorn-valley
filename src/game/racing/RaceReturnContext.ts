import type Phaser from 'phaser';

export const RACE_RETURN_SCENE_REGISTRY_KEY = 'race-return-scene';

export type RaceReturnSceneKey =
  | 'RainbowRunEntryScene'
  | 'CrystalCupEntryScene'
  | 'CrystalBrookScene'
  | 'WhisperingWoodsScene'
  | 'StarlightBeachScene';

export function setRaceReturnScene(game: Phaser.Game, sceneKey: RaceReturnSceneKey): void {
  game.registry.set(RACE_RETURN_SCENE_REGISTRY_KEY, sceneKey);
}

export function isRaceReturnSceneKey(value: unknown): value is RaceReturnSceneKey {
  return (
    value === 'WhisperingWoodsScene' ||
    value === 'StarlightBeachScene' ||
    value === 'CrystalBrookScene' ||
    value === 'CrystalCupEntryScene' ||
    value === 'RainbowRunEntryScene'
  );
}

function parseRaceReturnScene(value: unknown): RaceReturnSceneKey | null {
  return isRaceReturnSceneKey(value) ? value : null;
}

export function peekRaceReturnScene(
  game: Phaser.Game,
  fallback: RaceReturnSceneKey = 'RainbowRunEntryScene',
): RaceReturnSceneKey {
  return parseRaceReturnScene(game.registry.get(RACE_RETURN_SCENE_REGISTRY_KEY)) ?? fallback;
}

export function consumeRaceReturnScene(
  game: Phaser.Game,
  fallback: RaceReturnSceneKey = 'RainbowRunEntryScene',
): RaceReturnSceneKey {
  const sceneKey = peekRaceReturnScene(game, fallback);
  game.registry.remove(RACE_RETURN_SCENE_REGISTRY_KEY);
  return sceneKey;
}

export function clearRaceReturnScene(game: Phaser.Game): void {
  game.registry.remove(RACE_RETURN_SCENE_REGISTRY_KEY);
}

export function raceReturnLabel(sceneKey: RaceReturnSceneKey): string {
  if (sceneKey === 'WhisperingWoodsScene') {
    return 'Whispering Woods';
  }
  if (sceneKey === 'StarlightBeachScene') {
    return 'Starlight Beach';
  }
  if (sceneKey === 'CrystalBrookScene') {
    return 'Crystal Brook';
  }
  if (sceneKey === 'CrystalCupEntryScene') {
    return 'Crystal Cup Raceway';
  }
  return 'Race Hub';
}
