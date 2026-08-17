import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';

interface DoorwayStubData {
  title?: string;
  message?: string;
  returnScene?: string;
}

export class DoorwayStubScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private returnScene = 'MoonflowerGladeScene';

  public constructor() {
    super('DoorwayStubScene');
  }

  public create(data: DoorwayStubData): void {
    this.returnScene = data.returnScene ?? 'MoonflowerGladeScene';
    this.cameras.main.setBackgroundColor('#5f4778');

    this.add.circle(230, 180, 190, 0xffddf3, 0.12);
    this.add.circle(1080, 560, 240, 0xffefae, 0.08);

    this.add
      .text(GAME_WIDTH / 2, 205, data.title ?? 'A Doorway', {
        color: '#fff8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '52px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        330,
        data.message ?? 'This doorway is connected, but the room behind it is still being made.',
        {
          color: '#f4ecfb',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '25px',
          align: 'center',
          wordWrap: { width: 760 },
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    const button = this.add
      .rectangle(GAME_WIDTH / 2, 520, 320, 80, 0xfff9ed, 0.98)
      .setStrokeStyle(5, 0xe2b9ed, 1)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, 520, 'Back outside', {
        color: '#513a64',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);

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

    if (
      this.inputController?.justPressed('INTERACT') ||
      this.inputController?.justPressed('BACK')
    ) {
      this.scene.start(this.returnScene);
    }
  }
}
