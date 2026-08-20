import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserPipEggArcService } from '../story/browserPipEggArc';

export class PipEggHatchScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private readyToContinue = false;
  private closing = false;

  public constructor() {
    super('PipEggHatchScene');
  }

  public create(): void {
    this.readyToContinue = false;
    this.closing = false;
    this.cameras.main.setBackgroundColor('#f5dfcb');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xf5dfcb, 1);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35, 1040, 650, 0xfff2df, 0.98)
      .setStrokeStyle(12, 0xb98b72, 0.9);
    this.add.ellipse(GAME_WIDTH / 2, 645, 420, 150, 0xcda889, 0.55);
    this.add.ellipse(GAME_WIDTH / 2, 610, 270, 96, 0xe6c7a7, 0.82);

    const glow = this.add.circle(GAME_WIDTH / 2, 410, 150, 0xffe993, 0.16).setDepth(2);
    const egg = this.add
      .ellipse(GAME_WIDTH / 2, 430, 190, 245, 0xf3e7d0, 1)
      .setStrokeStyle(8, 0xb899c8, 1)
      .setDepth(3);
    const marks = this.add
      .text(GAME_WIDTH / 2, 430, '✦  ☾  ✦', {
        color: '#b58bc7',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(4);
    const title = this.add
      .text(GAME_WIDTH / 2, 155, 'The strange egg is hatching!', {
        color: '#634f70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
        backgroundColor: '#fff9eddd',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(8);
    const instruction = this.add
      .text(GAME_WIDTH / 2, 790, 'The shell is wobbling...', {
        color: '#6e5879',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '25px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.tweens.add({
      targets: [egg, marks, glow],
      angle: { from: -3, to: 3 },
      scale: { from: 0.98, to: 1.03 },
      duration: 380,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.InOut',
    });

    this.time.delayedCall(1250, () => {
      egg.setVisible(false);
      marks.setVisible(false);
      this.add
        .text(GAME_WIDTH / 2 - 63, 455, '◜', {
          color: '#efe0c8',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '150px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAngle(-22)
        .setDepth(3);
      this.add
        .text(GAME_WIDTH / 2 + 66, 455, '◝', {
          color: '#efe0c8',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '150px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAngle(22)
        .setDepth(3);

      const lumaBody = this.add.ellipse(GAME_WIDTH / 2, 420, 150, 118, 0xc6b2eb, 1).setDepth(5);
      const lumaBelly = this.add.ellipse(GAME_WIDTH / 2, 438, 93, 68, 0xf3e9ff, 0.96).setDepth(6);
      this.add.triangle(GAME_WIDTH / 2 - 54, 362, 0, 50, 22, 0, 47, 48, 0x9c82ca, 1).setDepth(4);
      this.add.triangle(GAME_WIDTH / 2 + 53, 362, 0, 48, 23, 0, 49, 51, 0x9c82ca, 1).setDepth(4);
      this.add.circle(GAME_WIDTH / 2 - 28, 398, 7, 0x493d67, 1).setDepth(7);
      this.add.circle(GAME_WIDTH / 2 + 28, 398, 7, 0x493d67, 1).setDepth(7);
      this.add
        .text(GAME_WIDTH / 2, 350, '✦', {
          color: '#fff3a8',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '34px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(7);
      this.add
        .text(GAME_WIDTH / 2, 535, 'Luma', {
          color: '#5f4c78',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '34px',
          fontStyle: 'bold',
          backgroundColor: '#fff9eddd',
          padding: { x: 14, y: 7 },
        })
        .setOrigin(0.5)
        .setDepth(8);
      this.tweens.add({
        targets: [lumaBody, lumaBelly],
        y: '-=8',
        duration: 760,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      glow.setAlpha(0.34);
      title.setText('Hello, Luma!');
      instruction.setText(
        'Your first companion has hatched.\nPress Interact or tap to welcome Luma home.',
      );
      this.readyToContinue = true;
    });

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    const tapZone = this.add
      .zone(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setInteractive();
    tapZone.on('pointerdown', () => {
      if (this.readyToContinue) {
        this.finishHatch();
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
    });
  }

  public update(): void {
    this.inputController?.update();
    if (!this.readyToContinue || !this.inputController) {
      return;
    }
    if (this.inputController.justPressed('INTERACT') || this.inputController.justPressed('BACK')) {
      this.finishHatch();
    }
  }

  private finishHatch(): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    getBrowserPipEggArcService().completeHatch();
    this.scene.start('CottageInteriorScene');
  }
}
