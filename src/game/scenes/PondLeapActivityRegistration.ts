import type Phaser from 'phaser';

export interface PondLeapLaunchOptions {
  discoveredReflection?: boolean;
}

let registrationPromise: Promise<void> | null = null;
let launchPending = false;

export function ensurePondLeapActivityScene(game: Phaser.Game): Promise<void> {
  if (game.scene.keys.PondLeapActivityScene) {
    return Promise.resolve();
  }

  registrationPromise ??= import('../activities/PondLeapActivityScene')
    .then(({ PondLeapActivityScene }) => {
      if (!game.scene.keys.PondLeapActivityScene) {
        game.scene.add('PondLeapActivityScene', PondLeapActivityScene);
      }
    })
    .catch((error: unknown) => {
      registrationPromise = null;
      throw error;
    });

  return registrationPromise;
}

export async function launchPondLeapActivity(
  scene: Phaser.Scene,
  options: PondLeapLaunchOptions = {},
): Promise<void> {
  if (launchPending || scene.game.scene.isActive('PondLeapActivityScene')) {
    return;
  }

  launchPending = true;
  try {
    await ensurePondLeapActivityScene(scene.game);
    if (!scene.scene.isActive()) {
      return;
    }

    scene.scene.launch('PondLeapActivityScene', {
      returnScene: scene.sys.settings.key,
      discoveredReflection: options.discoveredReflection === true,
    });
    scene.scene.pause();
  } finally {
    launchPending = false;
  }
}
