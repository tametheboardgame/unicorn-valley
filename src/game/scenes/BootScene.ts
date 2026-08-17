import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public create(): void {
    const requestedScene = new URLSearchParams(globalThis.location.search).get('scene');
    this.registry.set(
      'postPreloadScene',
      requestedScene === 'resize-test' ? 'ResizeTestScene' : 'TitleScene',
    );
    this.scene.start('PreloadScene');
  }
}
