import Phaser from 'phaser';

const DIAGNOSTIC_SCENES: Readonly<Record<string, string>> = {
  'resize-test': 'ResizeTestScene',
  'movement-test': 'MovementTestScene',
};

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public create(): void {
    const requestedScene = new URLSearchParams(globalThis.location.search).get('scene');
    this.registry.set(
      'postPreloadScene',
      requestedScene ? (DIAGNOSTIC_SCENES[requestedScene] ?? 'TitleScene') : 'TitleScene',
    );
    this.scene.start('PreloadScene');
  }
}
