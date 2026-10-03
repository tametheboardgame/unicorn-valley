import { describe, expect, it } from 'vitest';
import { MINI_GAME_IDS } from './MiniGameCatalogue';
import { createMiniGameSession, miniGameSceneData, readMiniGameSession } from './MiniGameSession';

describe('MiniGameSession', () => {
  it('creates world sessions with world side effects', () => {
    const session = createMiniGameSession({
      gameId: MINI_GAME_IDS.rainbowDisc,
      source: 'world',
      variantId: 'match',
      returnTarget: { sceneKey: 'RainbowMeadowScene', mode: 'resume' },
      worldContext: { interactionId: 'interaction:rainbow-disc' },
    });

    expect(session.sideEffectPolicy).toBe('world');
    expect(session.returnTarget).toEqual({
      sceneKey: 'RainbowMeadowScene',
      mode: 'resume',
    });
    expect(session.worldContext?.interactionId).toBe('interaction:rainbow-disc');
  });

  it('creates Just Games sessions as sandbox sessions', () => {
    const session = createMiniGameSession({
      gameId: MINI_GAME_IDS.sunbeamChess,
      source: 'just-games',
      returnTarget: { sceneKey: 'TitleScene', mode: 'start' },
    });

    expect(session.sideEffectPolicy).toBe('sandbox');
  });

  it('rejects variants that do not belong to the selected game', () => {
    expect(() =>
      createMiniGameSession({
        gameId: MINI_GAME_IDS.rainbowDisc,
        source: 'world',
        variantId: 'not-a-disc-mode',
        returnTarget: { sceneKey: 'RainbowMeadowScene', mode: 'resume' },
      }),
    ).toThrow(/Unknown variant/);
  });

  it('embeds and reads the normalised session without overwriting additional scene data', () => {
    const session = createMiniGameSession({
      gameId: MINI_GAME_IDS.pondLeap,
      source: 'world',
      returnTarget: { sceneKey: 'RainbowMeadowScene', mode: 'resume' },
    });
    const data = miniGameSceneData(session, { discoveredReflection: true });

    expect(data.discoveredReflection).toBe(true);
    expect(readMiniGameSession(data)).toEqual(session);
  });

  it('returns null for data without a valid mini-game session', () => {
    expect(readMiniGameSession({ miniGameSession: { source: 'world' } })).toBeNull();
  });

  it('rejects persisted session data with an unknown mini-game id', () => {
    expect(
      readMiniGameSession({
        miniGameSession: {
          gameId: 'unknown-game',
          source: 'world',
          sideEffectPolicy: 'world',
          returnTarget: { sceneKey: 'RainbowMeadowScene', mode: 'resume' },
        },
      }),
    ).toBeNull();
  });

  it('rejects session data whose side-effect policy disagrees with its launch source', () => {
    expect(
      readMiniGameSession({
        miniGameSession: {
          gameId: MINI_GAME_IDS.sunbeamChess,
          source: 'just-games',
          sideEffectPolicy: 'world',
          returnTarget: { sceneKey: 'TitleScene', mode: 'start' },
        },
      }),
    ).toBeNull();
  });

});
