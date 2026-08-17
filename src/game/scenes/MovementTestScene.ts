import Phaser from 'phaser';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PlayerEntity } from '../player/PlayerEntity';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1400;
const WORLD_MARGIN = 96;
const PLAYER_TEXTURE_KEY = 'player-unicorn-placeholder';

export class MovementTestScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private player: PlayerEntity | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;

  public constructor() {
    super('MovementTestScene');
  }

  public create(): void {
    this.createPrototypeWorld();
    this.ensurePlayerTexture();

    this.physics.world.setBounds(
      WORLD_MARGIN,
      WORLD_MARGIN,
      WORLD_WIDTH - WORLD_MARGIN * 2,
      WORLD_HEIGHT - WORLD_MARGIN * 2,
    );

    this.player = new PlayerEntity(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, PLAYER_TEXTURE_KEY);
    this.inputController = new InputController([new KeyboardInputAdapter(this)]);

    const camera = this.cameras.main;
    camera.setBackgroundColor('#9bd9c2');
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.player.sprite, true, 0.12, 0.12);
    camera.setDeadzone(260, 150);

    this.add
      .text(28, 28, 'Move with WASD or the arrow keys', {
        color: '#39294f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        backgroundColor: '#fff8ffdd',
        padding: { x: 14, y: 10 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.add
      .text(28, 88, 'Explore the whole test glade. Escape returns to the title screen.', {
        color: '#513f68',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        backgroundColor: '#fff8ffcc',
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.statusText = this.add
      .text(28, 134, '', {
        color: '#513f68',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        backgroundColor: '#fff8ffbb',
        padding: { x: 10, y: 7 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.player?.destroy();
      this.player = null;
      this.statusText = null;
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (this.inputController.justPressed('BACK')) {
      this.scene.start('TitleScene');
      return;
    }

    const movement = resolvePlayerMovement(
      this.inputController.getAxis('MOVE_X'),
      this.inputController.getAxis('MOVE_Y'),
      DEFAULT_PLAYER_SPEED,
      this.player.getFacing(),
    );

    this.player.applyMovement(movement);
    this.player.updatePresentation(time);
    this.statusText?.setText(
      `Facing: ${movement.facing}   State: ${movement.motionState}   Speed: ${Math.round(
        Math.hypot(movement.velocityX, movement.velocityY),
      )}`,
    );
  }

  private createPrototypeWorld(): void {
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0xa9dfb7);

    this.add.rectangle(WORLD_WIDTH / 2, 700, 1900, 190, 0xe6d19a, 0.9).setAngle(-5);
    this.add.rectangle(1380, WORLD_HEIGHT / 2, 180, 1050, 0xe9d7a6, 0.88).setAngle(8);

    this.add.rectangle(430, 680, 230, 980, 0x73cde0, 0.95).setAngle(5);
    this.add.rectangle(430, 680, 150, 980, 0xbceff2, 0.45).setAngle(5);

    this.add.rectangle(WORLD_WIDTH / 2, WORLD_MARGIN / 2, WORLD_WIDTH, WORLD_MARGIN, 0x5c9c70);
    this.add.rectangle(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT - WORLD_MARGIN / 2,
      WORLD_WIDTH,
      WORLD_MARGIN,
      0x5c9c70,
    );
    this.add.rectangle(WORLD_MARGIN / 2, WORLD_HEIGHT / 2, WORLD_MARGIN, WORLD_HEIGHT, 0x5c9c70);
    this.add.rectangle(
      WORLD_WIDTH - WORLD_MARGIN / 2,
      WORLD_HEIGHT / 2,
      WORLD_MARGIN,
      WORLD_HEIGHT,
      0x5c9c70,
    );

    const flowerPositions = [
      [760, 340],
      [930, 270],
      [1100, 400],
      [1720, 310],
      [1940, 470],
      [760, 1030],
      [1040, 1120],
      [1780, 1060],
      [2050, 900],
      [1550, 890],
    ] as const;

    for (const [x, y] of flowerPositions) {
      this.add.circle(x, y, 22, 0xffd7f4, 0.95);
      this.add.circle(x + 18, y + 8, 13, 0xfff3a8, 0.9);
      this.add.circle(x - 16, y + 10, 12, 0xd7b9ff, 0.9);
    }

    this.add.circle(1820, 690, 145, 0x79b57d, 0.95);
    this.add.circle(1820, 650, 100, 0x68a66f, 0.95);
    this.add.rectangle(1820, 790, 55, 170, 0x8f6a4f);

    this.add
      .text(1840, 845, 'Future cottage area', {
        color: '#4b3b58',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        backgroundColor: '#fff8ffbb',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(0.5);
  }

  private ensurePlayerTexture(): void {
    if (this.textures.exists(PLAYER_TEXTURE_KEY)) {
      return;
    }

    const graphics = this.add.graphics();

    graphics.fillStyle(0xfff5ff, 1);
    graphics.fillEllipse(48, 48, 72, 42);
    graphics.fillCircle(82, 33, 18);

    graphics.fillStyle(0xd69af0, 1);
    graphics.fillTriangle(95, 23, 106, 3, 101, 29);
    graphics.fillTriangle(19, 42, 2, 28, 23, 53);
    graphics.fillRect(31, 62, 8, 18);
    graphics.fillRect(55, 62, 8, 18);

    graphics.fillStyle(0xf1b4ef, 1);
    graphics.fillTriangle(69, 20, 78, 5, 82, 26);
    graphics.fillTriangle(58, 24, 67, 8, 71, 29);

    graphics.fillStyle(0x4b3066, 1);
    graphics.fillCircle(88, 30, 3);

    graphics.generateTexture(PLAYER_TEXTURE_KEY, 112, 84);
    graphics.destroy();
  }
}
