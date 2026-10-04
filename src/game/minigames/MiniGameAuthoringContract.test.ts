import { describe, expect, it } from 'vitest';
import { getMiniGameDefinition, MINI_GAME_IDS } from './MiniGameCatalogue';
import {
  assertSandboxAdventureEffectsBlocked,
  assertWorldAdventureEffectsAllowed,
} from './MiniGameSandboxContract.testSupport';
import { createMiniGameSession, miniGameSceneData, readMiniGameSession } from './MiniGameSession';

describe('MG-WP4 deterministic mini-game authoring fixture', () => {
  const definition = getMiniGameDefinition(MINI_GAME_IDS.sunbeamChess);

  const worldSession = createMiniGameSession({
    gameId: definition.id,
    source: 'world',
    returnTarget: { sceneKey: 'SunbeamVillageScene', mode: 'resume' },
    worldContext: { interactionId: 'fixture:sunbeam-chess' },
  });

  const justGamesSession = createMiniGameSession({
    gameId: definition.id,
    source: 'just-games',
    returnTarget: { sceneKey: 'JustGamesScene', mode: 'start' },
  });

  it('uses one canonical game definition and scene for world and Just Games sessions', () => {
    expect(worldSession.gameId).toBe(definition.id);
    expect(justGamesSession.gameId).toBe(definition.id);
    expect(definition.sceneKey).toBe('ChessPlazaActivityScene');

    expect(readMiniGameSession(miniGameSceneData(worldSession))).toEqual(worldSession);
    expect(readMiniGameSession(miniGameSceneData(justGamesSession))).toEqual(justGamesSession);
  });

  it('derives caller-specific return and side-effect policy without changing gameplay identity', () => {
    expect(worldSession).toMatchObject({
      gameId: definition.id,
      source: 'world',
      sideEffectPolicy: 'world',
      returnTarget: { sceneKey: 'SunbeamVillageScene', mode: 'resume' },
    });
    expect(justGamesSession).toMatchObject({
      gameId: definition.id,
      source: 'just-games',
      sideEffectPolicy: 'sandbox',
      returnTarget: { sceneKey: 'JustGamesScene', mode: 'start' },
    });
  });

  it('satisfies the reusable world and sandbox side-effect contracts', () => {
    expect(() => assertWorldAdventureEffectsAllowed(worldSession)).not.toThrow();
    expect(() => assertSandboxAdventureEffectsBlocked(justGamesSession)).not.toThrow();
  });
});
