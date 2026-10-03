import { isSceneKey, type SceneKey } from '../scenes/SceneKeys';
import {
  getMiniGameDefinition,
  isMiniGameId,
  isMiniGameVariant,
  type MiniGameId,
} from './MiniGameCatalogue';

export const MINI_GAME_SESSION_DATA_KEY = 'miniGameSession' as const;

export type MiniGameLaunchSource = 'world' | 'just-games';
export type MiniGameSideEffectPolicy = 'world' | 'sandbox';
export type MiniGameReturnMode = 'resume' | 'start';

export interface MiniGameReturnTarget {
  sceneKey: SceneKey;
  mode: MiniGameReturnMode;
  payload?: Readonly<Record<string, unknown>>;
}

export interface MiniGameWorldContext {
  locationId?: string;
  interactionId?: string;
  questContext?: string;
}

export interface MiniGameSession {
  gameId: MiniGameId;
  source: MiniGameLaunchSource;
  variantId?: string;
  returnTarget: MiniGameReturnTarget;
  sideEffectPolicy: MiniGameSideEffectPolicy;
  worldContext?: MiniGameWorldContext;
}

export interface MiniGameSessionRequest {
  gameId: MiniGameId;
  source: MiniGameLaunchSource;
  variantId?: string;
  returnTarget: MiniGameReturnTarget;
  worldContext?: MiniGameWorldContext;
}

export function createMiniGameSession(request: MiniGameSessionRequest): MiniGameSession {
  const definition = getMiniGameDefinition(request.gameId);
  if (request.variantId !== undefined && !isMiniGameVariant(definition, request.variantId)) {
    throw new Error(`Unknown variant "${request.variantId}" for mini-game "${request.gameId}"`);
  }

  return {
    gameId: request.gameId,
    source: request.source,
    ...(request.variantId === undefined ? {} : { variantId: request.variantId }),
    returnTarget: request.returnTarget,
    sideEffectPolicy: request.source === 'world' ? 'world' : 'sandbox',
    ...(request.worldContext === undefined ? {} : { worldContext: request.worldContext }),
  };
}

export function miniGameSceneData(
  session: MiniGameSession,
  additionalData: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    ...additionalData,
    [MINI_GAME_SESSION_DATA_KEY]: session,
  };
}

export function readMiniGameSession(data: unknown): MiniGameSession | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const candidate = (data as Record<string, unknown>)[MINI_GAME_SESSION_DATA_KEY];
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const session = candidate as Partial<MiniGameSession>;
  if (
    typeof session.gameId !== 'string' ||
    !isMiniGameId(session.gameId) ||
    (session.source !== 'world' && session.source !== 'just-games') ||
    (session.sideEffectPolicy !== 'world' && session.sideEffectPolicy !== 'sandbox') ||
    session.sideEffectPolicy !== (session.source === 'world' ? 'world' : 'sandbox') ||
    !session.returnTarget ||
    typeof session.returnTarget.sceneKey !== 'string' ||
    !isSceneKey(session.returnTarget.sceneKey) ||
    (session.returnTarget.mode !== 'resume' && session.returnTarget.mode !== 'start')
  ) {
    return null;
  }

  const definition = getMiniGameDefinition(session.gameId);
  if (session.variantId !== undefined && !isMiniGameVariant(definition, session.variantId)) {
    return null;
  }

  if (
    session.worldContext !== undefined &&
    (typeof session.worldContext !== 'object' || session.worldContext === null)
  ) {
    return null;
  }

  return session as MiniGameSession;
}
