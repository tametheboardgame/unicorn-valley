import type Phaser from 'phaser';
import { ensureSceneRegistered, isSceneKey, type SceneKey } from '../scenes/SceneManifest';
import { getMiniGameDefinition, type MiniGameId } from './MiniGameCatalogue';
import {
  createMiniGameSession,
  miniGameSceneData,
  type MiniGameLaunchSource,
  type MiniGameReturnTarget,
  type MiniGameSession,
  type MiniGameWorldContext,
} from './MiniGameSession';

export interface MiniGameLaunchRequest {
  gameId: MiniGameId;
  source: MiniGameLaunchSource;
  variantId?: string;
  returnTarget?: MiniGameReturnTarget;
  worldContext?: MiniGameWorldContext;
  sceneData?: Readonly<Record<string, unknown>>;
}

export type MiniGameLaunchStatus = 'launched' | 'already-active' | 'caller-inactive';

export interface MiniGameLaunchResult {
  status: MiniGameLaunchStatus;
  session: MiniGameSession;
}

const pendingLaunches = new WeakMap<Phaser.Game, Set<MiniGameId>>();

function pendingFor(game: Phaser.Game): Set<MiniGameId> {
  let pending = pendingLaunches.get(game);
  if (!pending) {
    pending = new Set<MiniGameId>();
    pendingLaunches.set(game, pending);
  }
  return pending;
}

function defaultReturnTarget(scene: Phaser.Scene): MiniGameReturnTarget {
  const callerKey = scene.sys.settings.key;
  if (!isSceneKey(callerKey)) {
    throw new Error(`Mini-game caller is not registered in SceneManifest: ${callerKey}`);
  }

  return {
    sceneKey: callerKey,
    mode: 'resume',
  };
}

export async function launchMiniGame(
  scene: Phaser.Scene,
  request: MiniGameLaunchRequest,
): Promise<MiniGameLaunchResult> {
  const definition = getMiniGameDefinition(request.gameId);
  const session = createMiniGameSession({
    gameId: request.gameId,
    source: request.source,
    ...(request.variantId === undefined ? {} : { variantId: request.variantId }),
    returnTarget: request.returnTarget ?? defaultReturnTarget(scene),
    ...(request.worldContext === undefined ? {} : { worldContext: request.worldContext }),
  });

  const pending = pendingFor(scene.game);
  if (pending.has(request.gameId) || scene.game.scene.isActive(definition.sceneKey)) {
    return { status: 'already-active', session };
  }

  pending.add(request.gameId);
  try {
    await ensureSceneRegistered(scene.game, definition.sceneKey);
    if (!scene.scene.isActive()) {
      return { status: 'caller-inactive', session };
    }

    scene.scene.launch(definition.sceneKey, miniGameSceneData(session, request.sceneData));
    scene.scene.bringToTop(definition.sceneKey);
    if (session.returnTarget.mode === 'start') {
      scene.scene.stop();
    } else {
      scene.scene.pause();
    }

    return { status: 'launched', session };
  } finally {
    pending.delete(request.gameId);
  }
}

export function returnFromMiniGame(scene: Phaser.Scene, session: MiniGameSession): void {
  const currentKey = scene.sys.settings.key;
  scene.scene.stop(currentKey);

  const target: SceneKey = session.returnTarget.sceneKey;
  if (session.returnTarget.mode === 'start') {
    scene.game.scene.start(target, session.returnTarget.payload);
    return;
  }

  if (scene.game.scene.isPaused(target)) {
    scene.game.scene.resume(target);
    return;
  }

  if (!scene.game.scene.isActive(target)) {
    scene.game.scene.start(target, session.returnTarget.payload);
  }
}
