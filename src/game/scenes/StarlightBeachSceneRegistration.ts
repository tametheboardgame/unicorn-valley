import type Phaser from 'phaser';

let registrationPromise: Promise<void> | null = null;

export function ensureStarlightBeachScene(game: Phaser.Game): Promise<void> {
  if (game.scene.keys.StarlightBeachScene) {
    return Promise.resolve();
  }

  registrationPromise ??= import('./StarlightBeachScene').then(({ StarlightBeachScene }) => {
    if (!game.scene.keys.StarlightBeachScene) {
      game.scene.add('StarlightBeachScene', StarlightBeachScene);
    }
  });
  return registrationPromise;
}
