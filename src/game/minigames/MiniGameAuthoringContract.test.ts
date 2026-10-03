import { describe, expect, it, vi } from 'vitest';
import {
  getMiniGameDefinition,
  MINI_GAME_IDS,
} from './MiniGameCatalogue';
import {
  canApplyAdventureEffect,
  runMiniGameAdventureEffect,
  type MiniGameAdventureEffect,
} from './MiniGameOutcomeGateway';
import { createMiniGameSession, miniGameSceneData, readMiniGameSession } from './MiniGameSession';

const ADVENTURE_EFFECTS: readonly MiniGameAdventureEffect[] = [
  'activity-progress',
  'quest',
  'world-flag',
  'relationship',
  'inventory',
  'shimmer',
  'collection',
  'unlock',
];

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

  it('permits accepted world effects while suppressing every sandbox adventure-effect category', () => {
    for (const effect of ADVENTURE_EFFECTS) {
      expect(canApplyAdventureEffect(worldSession, effect)).toBe(true);
      expect(canApplyAdventureEffect(justGamesSession, effect)).toBe(false);

      const worldWrite = vi.fn();
      const sandboxWrite = vi.fn();
      expect(runMiniGameAdventureEffect(worldSession, effect, worldWrite)).toBe(true);
      expect(runMiniGameAdventureEffect(justGamesSession, effect, sandboxWrite)).toBe(false);
      expect(worldWrite).toHaveBeenCalledOnce();
      expect(sandboxWrite).not.toHaveBeenCalled();
    }
  });
});
