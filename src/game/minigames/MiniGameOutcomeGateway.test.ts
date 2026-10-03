import { describe, expect, it, vi } from 'vitest';
import { MINI_GAME_IDS } from './MiniGameCatalogue';
import { runMiniGameAdventureEffect } from './MiniGameOutcomeGateway';
import { createMiniGameSession } from './MiniGameSession';

describe('MiniGameOutcomeGateway', () => {
  it('allows adventure effects for world sessions', () => {
    const apply = vi.fn();
    const session = createMiniGameSession({
      gameId: MINI_GAME_IDS.wobblyCake,
      source: 'world',
      returnTarget: { sceneKey: 'VillageInteriorScene', mode: 'resume' },
    });

    expect(runMiniGameAdventureEffect(session, 'shimmer', apply)).toBe(true);
    expect(apply).toHaveBeenCalledOnce();
  });

  it('suppresses adventure effects for Just Games sessions', () => {
    const apply = vi.fn();
    const session = createMiniGameSession({
      gameId: MINI_GAME_IDS.wobblyCake,
      source: 'just-games',
      returnTarget: { sceneKey: 'TitleScene', mode: 'start' },
    });

    expect(runMiniGameAdventureEffect(session, 'shimmer', apply)).toBe(false);
    expect(apply).not.toHaveBeenCalled();
  });
});
