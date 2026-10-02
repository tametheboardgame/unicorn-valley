import type Phaser from 'phaser';

let registrationPromise: Promise<void> | null = null;
let launchPending = false;

export function ensureRainbowDiscActivityScene(game: Phaser.Game): Promise<void> {
  if (game.scene.keys.RainbowDiscActivityScene) {
    return Promise.resolve();
  }

  registrationPromise ??= import('../activities/RainbowDiscActivityScene')
    .then(({ RainbowDiscActivityScene }) => {
      if (!game.scene.keys.RainbowDiscActivityScene) {
        game.scene.add('RainbowDiscActivityScene', RainbowDiscActivityScene);
      }
    })
    .catch((error: unknown) => {
      registrationPromise = null;
      throw error;
    });

  return registrationPromise;
}

export async function launchRainbowDiscActivity(scene: Phaser.Scene): Promise<void> {
  if (launchPending || scene.game.scene.isActive('RainbowDiscActivityScene')) {
    return;
  }

  launchPending = true;
  try {
    await ensureRainbowDiscActivityScene(scene.game);
    if (!scene.scene.isActive()) {
      return;
    }

    scene.scene.launch('RainbowDiscActivityScene', {
      returnScene: scene.sys.settings.key,
    });
    scene.scene.pause();
  } finally {
    launchPending = false;
  }
}
