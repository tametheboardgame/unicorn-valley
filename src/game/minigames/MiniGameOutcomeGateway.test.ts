import { describe, expect, it, vi } from 'vitest';
import { MINI_GAME_IDS } from './MiniGameCatalogue';
import {
  runMiniGameAdventureEffect,
  type MiniGameAdventureEffect,
} from './MiniGameOutcomeGateway';
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

  it('preserves legacy direct starts as world-effect compatible', () => {
    const apply = vi.fn();

    expect(runMiniGameAdventureEffect(null, 'activity-progress', apply)).toBe(true);
    expect(apply).toHaveBeenCalledOnce();
  });

  it('suppresses every adventure-effect category for Just Games sessions', () => {
    const session = createMiniGameSession({
      gameId: MINI_GAME_IDS.wobblyCake,
      source: 'just-games',
      returnTarget: { sceneKey: 'TitleScene', mode: 'start' },
    });
    const effects: MiniGameAdventureEffect[] = [
      'activity-progress',
      'quest',
      'world-flag',
      'relationship',
      'inventory',
      'shimmer',
      'collection',
      'unlock',
    ];

    for (const effect of effects) {
      const apply = vi.fn();
      expect(runMiniGameAdventureEffect(session, effect, apply)).toBe(false);
      expect(apply).not.toHaveBeenCalled();
    }
  });
});
