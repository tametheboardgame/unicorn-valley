import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { calculateContainedCanvasSize, getSafeUiBounds } from '../ui/safeUiBounds';

export class ResizeTestScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private diagnosticsText: Phaser.GameObjects.Text | null = null;

  public constructor() {
    super('ResizeTestScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#2c2442');
    const safeBounds = getSafeUiBounds();

    this.add
      .rectangle(
        safeBounds.x + safeBounds.width / 2,
        safeBounds.y + safeBounds.height / 2,
        safeBounds.width,
        safeBounds.height,
        0x000000,
        0,
      )
      .setStrokeStyle(4, 0xf7c6ff, 0.9);

    this.add
      .text(GAME_WIDTH / 2, 95, 'Responsive Canvas Diagnostic', {
        color: '#fff8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.diagnosticsText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        color: '#eadfff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 82, 'Resize the window. Press Esc to return.', {
        color: '#eadfff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
      })
      .setOrigin(0.5);

    this.inputController = new InputController([new KeyboardInputAdapter(this)]);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.refreshDiagnostics, this);
    this.refreshDiagnostics();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.refreshDiagnostics, this);
      this.inputController?.destroy();
      this.inputController = null;
    });
  }

  public update(): void {
    this.inputController?.update();
    if (this.inputController?.justPressed('BACK')) {
      this.scene.start('TitleScene');
    }
  }

  private refreshDiagnostics(): void {
    const parent = this.game.canvas.parentElement;
    const containerWidth = parent?.clientWidth ?? globalThis.innerWidth;
    const containerHeight = parent?.clientHeight ?? globalThis.innerHeight;
    const display = calculateContainedCanvasSize(containerWidth, containerHeight);

    this.diagnosticsText?.setText([
      `Logical world: ${GAME_WIDTH} × ${GAME_HEIGHT}`,
      `Container: ${containerWidth} × ${containerHeight}`,
      `Contained canvas: ${Math.round(display.width)} × ${Math.round(display.height)}`,
      `Scale: ${display.scale.toFixed(3)}`,
      '',
      'The pink outline is the safe UI region.',
    ]);
  }
}
