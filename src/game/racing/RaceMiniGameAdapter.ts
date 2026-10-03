import type Phaser from 'phaser';
import { MINI_GAME_IDS } from '../minigames/MiniGameCatalogue';
import { launchMiniGame, type MiniGameLaunchResult } from '../minigames/MiniGameLauncher';
import type { MiniGameWorldContext } from '../minigames/MiniGameSession';
import { selectRaceCourse } from './RaceCourse';
import { setRaceReturnScene, type RaceReturnSceneKey } from './RaceReturnContext';

export interface RainbowRunRaceLaunchRequest {
  courseId: string;
  returnScene: RaceReturnSceneKey;
  worldContext?: MiniGameWorldContext;
}

export async function launchRainbowRunRace(
  scene: Phaser.Scene,
  request: RainbowRunRaceLaunchRequest,
): Promise<MiniGameLaunchResult> {
  selectRaceCourse(request.courseId);
  setRaceReturnScene(scene.game, request.returnScene);

  return launchMiniGame(scene, {
    gameId: MINI_GAME_IDS.rainbowRunRacing,
    source: 'world',
    variantId: request.courseId,
    returnTarget: {
      sceneKey: request.returnScene,
      mode: 'start',
    },
    ...(request.worldContext === undefined ? {} : { worldContext: request.worldContext }),
  });
}
