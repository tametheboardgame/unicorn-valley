import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';

export class PreloadScene extends Phaser.Scene {
  public constructor() {
    super('PreloadScene');
  }

  public preload(): void {
    this.cameras.main.setBackgroundColor('#49376f');

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, 'Unicorn Valley', {
        color: '#fff8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const track = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 420, 24, 0x2f234b, 0.8);
    const fill = this.add
      .rectangle(GAME_WIDTH / 2 - 202, GAME_HEIGHT / 2 + 20, 0, 14, 0xf7c6ff, 1)
      .setOrigin(0, 0.5);

    const status = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 65, 'Gathering a little magic…', {
        color: '#eadfff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
      })
      .setOrigin(0.5);

    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      fill.width = 404 * progress;
    });

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      title.destroy();
      track.destroy();
      fill.destroy();
      status.destroy();
    });
  }

  public create(): void {
    const nextScene = this.registry.get('postPreloadScene');
    this.scene.start(typeof nextScene === 'string' ? nextScene : 'TitleScene');
  }
}
