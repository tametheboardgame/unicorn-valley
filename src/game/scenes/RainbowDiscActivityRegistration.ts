import type Phaser from 'phaser';

export type RainbowDiscActivityMode = 'match' | 'practice';

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

export async function launchRainbowDiscActivity(
  scene: Phaser.Scene,
  mode: RainbowDiscActivityMode = 'match',
): Promise<void> {
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
      mode,
    });
    scene.scene.bringToTop('RainbowDiscActivityScene');
    scene.scene.pause();
  } finally {
    launchPending = false;
  }
}
