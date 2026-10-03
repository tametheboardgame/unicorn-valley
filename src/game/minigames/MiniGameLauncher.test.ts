import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { MINI_GAME_IDS } from './MiniGameCatalogue';
import { launchMiniGame, returnFromMiniGame } from './MiniGameLauncher';
import { createMiniGameSession } from './MiniGameSession';

function createScene(options: {
  callerKey: string;
  registeredGameKey?: string;
  gameAlreadyActive?: boolean;
  returnPaused?: boolean;
}): {
  scene: Phaser.Scene;
  launch: ReturnType<typeof vi.fn>;
  bringToTop: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
} {
  const launch = vi.fn();
  const bringToTop = vi.fn();
  const pause = vi.fn();
  const stop = vi.fn();
  const resume = vi.fn();
  const start = vi.fn();
  const keys: Record<string, unknown> = {};
  if (options.registeredGameKey) {
    keys[options.registeredGameKey] = {};
  }

  const gameScene = {
    keys,
    isActive: vi.fn((key: string) =>
      key === options.registeredGameKey ? options.gameAlreadyActive === true : false,
    ),
    isPaused: vi.fn(() => options.returnPaused === true),
    resume,
    start,
    add: vi.fn(),
  };

  const scenePlugin = {
    isActive: vi.fn(() => true),
    launch,
    bringToTop,
    pause,
    stop,
  };

  const scene = {
    game: { scene: gameScene },
    scene: scenePlugin,
    sys: { settings: { key: options.callerKey } },
  } as unknown as Phaser.Scene;

  return { scene, launch, bringToTop, pause, stop, resume, start };
}

describe('MiniGameLauncher', () => {
  it('launches a registered game with a normalised world session and pauses the caller', async () => {
    const harness = createScene({
      callerKey: 'RainbowMeadowScene',
      registeredGameKey: 'RainbowDiscActivityScene',
    });

    const result = await launchMiniGame(harness.scene, {
      gameId: MINI_GAME_IDS.rainbowDisc,
      source: 'world',
      variantId: 'practice',
    });

    expect(result.status).toBe('launched');
    expect(result.session).toMatchObject({
      gameId: MINI_GAME_IDS.rainbowDisc,
      source: 'world',
      variantId: 'practice',
      sideEffectPolicy: 'world',
      returnTarget: { sceneKey: 'RainbowMeadowScene', mode: 'resume' },
    });
    expect(harness.launch).toHaveBeenCalledWith(
      'RainbowDiscActivityScene',
      expect.objectContaining({
        miniGameSession: expect.objectContaining({
          gameId: MINI_GAME_IDS.rainbowDisc,
          variantId: 'practice',
        }),
      }),
    );
    expect(harness.bringToTop).toHaveBeenCalledWith('RainbowDiscActivityScene');
    expect(harness.pause).toHaveBeenCalledOnce();
  });

  it('stops callers whose return contract requires a fresh start', async () => {
    const harness = createScene({
      callerKey: 'WhisperingWoodsScene',
      registeredGameKey: 'FireflyLanternScene',
    });

    const result = await launchMiniGame(harness.scene, {
      gameId: MINI_GAME_IDS.fireflyLantern,
      source: 'world',
      returnTarget: { sceneKey: 'WhisperingWoodsScene', mode: 'start' },
    });

    expect(result.status).toBe('launched');
    expect(harness.stop).toHaveBeenCalledOnce();
    expect(harness.pause).not.toHaveBeenCalled();
  });

  it('does not launch a second copy when the game is already active', async () => {
    const harness = createScene({
      callerKey: 'SunbeamVillageScene',
      registeredGameKey: 'ChessPlazaActivityScene',
      gameAlreadyActive: true,
    });

    const result = await launchMiniGame(harness.scene, {
      gameId: MINI_GAME_IDS.sunbeamChess,
      source: 'world',
    });

    expect(result.status).toBe('already-active');
    expect(harness.launch).not.toHaveBeenCalled();
    expect(harness.pause).not.toHaveBeenCalled();
  });

  it('resumes a paused world caller on return', () => {
    const harness = createScene({
      callerKey: 'ChessPlazaActivityScene',
      returnPaused: true,
    });
    const session = createMiniGameSession({
      gameId: MINI_GAME_IDS.sunbeamChess,
      source: 'world',
      returnTarget: { sceneKey: 'SunbeamVillageScene', mode: 'resume' },
    });

    returnFromMiniGame(harness.scene, session);

    expect(harness.stop).toHaveBeenCalledWith('ChessPlazaActivityScene');
    expect(harness.resume).toHaveBeenCalledWith('SunbeamVillageScene');
    expect(harness.start).not.toHaveBeenCalled();
  });

  it('starts an explicit return target for a Just Games session', () => {
    const harness = createScene({
      callerKey: 'ChessPlazaActivityScene',
    });
    const session = createMiniGameSession({
      gameId: MINI_GAME_IDS.sunbeamChess,
      source: 'just-games',
      returnTarget: { sceneKey: 'TitleScene', mode: 'start' },
    });

    returnFromMiniGame(harness.scene, session);

    expect(harness.start).toHaveBeenCalledWith('TitleScene', undefined);
    expect(harness.resume).not.toHaveBeenCalled();
  });
});
