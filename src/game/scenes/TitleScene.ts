import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';

export class TitleScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private comingSoonButton: Phaser.GameObjects.Rectangle | null = null;

  public constructor() {
    super('TitleScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#6f4ba8');

    this.add.circle(170, 130, 115, 0xffd7f4, 0.18);
    this.add.circle(1080, 170, 165, 0xcff7ff, 0.14);
    this.add.circle(1020, 610, 230, 0xffefb6, 0.1);

    const sparkle = this.add.image(GAME_WIDTH / 2, 145, 'valley-sparkle').setDisplaySize(92, 92);
    sparkle.setAlpha(0.95);

    this.add
      .text(GAME_WIDTH / 2, 250, 'Unicorn Valley', {
        color: '#fff8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '76px',
        fontStyle: 'bold',
        stroke: '#4c3578',
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 338, 'A magical place to explore, discover and make your own', {
        color: '#f5eefe',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '25px',
        align: 'center',
      })
      .setOrigin(0.5);

    const button = this.add
      .rectangle(GAME_WIDTH / 2, 475, 340, 82, 0xfff5ff, 0.96)
      .setStrokeStyle(5, 0xe8bdf5, 1)
      .setInteractive({ useHandCursor: true });
    this.comingSoonButton = button;

    this.add
      .text(GAME_WIDTH / 2, 475, 'Coming Soon', {
        color: '#51366f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 545, 'Press Enter, Space, E or tap the button', {
        color: '#eadfff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 82, 'The valley is waking up…', {
        color: '#e9dcf8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [sparkle, button],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([
      new KeyboardInputAdapter(this),
      this.pointerInput,
    ]);

    button.on('pointerdown', () => this.pointerInput?.setButton('INTERACT', true));
    button.on('pointerup', () => this.pointerInput?.setButton('INTERACT', false));
    button.on('pointerout', () => this.pointerInput?.setButton('INTERACT', false));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
    });
  }

  public update(): void {
    this.inputController?.update();

    if (this.inputController?.justPressed('INTERACT')) {
      this.acknowledgeInteraction();
    }
  }

  private acknowledgeInteraction(): void {
    this.statusText?.setText('The valley heard you ✨');
    this.comingSoonButton?.setStrokeStyle(7, 0xffe6a8, 1);

    this.time.delayedCall(240, () => {
      this.comingSoonButton?.setStrokeStyle(5, 0xe8bdf5, 1);
    });
  }
}
