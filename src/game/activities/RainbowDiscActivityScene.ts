import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { createResidentAppearanceSprite } from '../population/SupportingResidentArt';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT, createUiShadow } from '../ui/uiTheme';
import { RAINBOW_DISC_PLAYER_APPEARANCES } from '../world/RainbowDiscMeadowPresentation';

interface RainbowDiscActivitySceneData {
  returnScene?: string;
}

interface Point {
  x: number;
  y: number;
}

const PLAYER_TEXTURE_KEY = 'rainbow-disc-activity:player-unicorn';
const FIELD_LEFT = 80;
const FIELD_RIGHT = 1200;
const FIELD_TOP = 128;
const FIELD_BOTTOM = 615;
const RECEIVER_Y = [250, 370, 490] as const;
const THROW_X = [220, 440, 680] as const;
const TARGET_X = [535, 775, 1040] as const;
const CATCH_RADIUS = 118;
const PASS_COUNT = 3;

export class RainbowDiscActivityScene extends Phaser.Scene {
  private returnScene = 'RainbowMeadowScene';
  private possession = 0;
  private selectedReceiver = 1;
  private dragging = false;
  private actionLocked = false;
  private completed = false;
  private timingPhase = 0;
  private timingValue = 0.5;

  private playLayer: Phaser.GameObjects.Container | null = null;
  private disc: Phaser.GameObjects.Ellipse | null = null;
  private aimGraphics: Phaser.GameObjects.Graphics | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private progressText: Phaser.GameObjects.Text | null = null;
  private timingMarker: Phaser.GameObjects.Rectangle | null = null;
  private receiverRings: Phaser.GameObjects.Arc[] = [];

  public constructor() {
    super('RainbowDiscActivityScene');
  }

  public create(data: RainbowDiscActivitySceneData = {}): void {
    this.returnScene = data.returnScene ?? 'RainbowMeadowScene';
    this.possession = 0;
    this.selectedReceiver = 1;
    this.dragging = false;
    this.actionLocked = false;
    this.completed = false;
    this.timingPhase = 0;
    this.timingValue = 0.5;

    this.cameras.main.setBackgroundColor('#6ead72');
    this.createBackdrop();
    this.createPlayerTexture();
    this.renderPossession();

    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.keyboard?.on('keydown-UP', this.selectPreviousReceiver, this);
    this.input.keyboard?.on('keydown-DOWN', this.selectNextReceiver, this);
    this.input.keyboard?.on('keydown-W', this.selectPreviousReceiver, this);
    this.input.keyboard?.on('keydown-S', this.selectNextReceiver, this);
    this.input.keyboard?.on('keydown-SPACE', this.keyboardThrow, this);
    this.input.keyboard?.on('keydown-ENTER', this.keyboardThrow, this);
    this.input.keyboard?.on('keydown-ESC', this.leaveActivity, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.off('pointerup', this.handlePointerUp, this);
      this.input.keyboard?.off('keydown-UP', this.selectPreviousReceiver, this);
      this.input.keyboard?.off('keydown-DOWN', this.selectNextReceiver, this);
      this.input.keyboard?.off('keydown-W', this.selectPreviousReceiver, this);
      this.input.keyboard?.off('keydown-S', this.selectNextReceiver, this);
      this.input.keyboard?.off('keydown-SPACE', this.keyboardThrow, this);
      this.input.keyboard?.off('keydown-ENTER', this.keyboardThrow, this);
      this.input.keyboard?.off('keydown-ESC', this.leaveActivity, this);
      this.playLayer?.destroy(true);
      this.playLayer = null;
      this.disc = null;
      this.aimGraphics = null;
      this.statusText = null;
      this.progressText = null;
      this.timingMarker = null;
      this.receiverRings = [];
    });
  }

  public update(_time: number, delta: number): void {
    if (this.completed || this.actionLocked) {
      return;
    }

    this.timingPhase += delta * 0.0042;
    this.timingValue = (Math.sin(this.timingPhase) + 1) / 2;
    const meterLeft = 462;
    const meterWidth = 350;
    this.timingMarker?.setX(meterLeft + this.timingValue * meterWidth);
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x74b97a, 1);
    createUiShadow(this, GAME_WIDTH / 2, 373, 1190, 650, 1, 0.24);

    this.add
      .rectangle(GAME_WIDTH / 2, 373, 1190, 650, 0xf7f2df, 1)
      .setStrokeStyle(7, 0xc89bd9, 1)
      .setName('rainbow-disc-activity:panel');

    this.add
      .text(GAME_WIDTH / 2, 55, 'Rainbow Disc', {
        color: '#5f496d',
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        92,
        'Complete three catches to reach the end zone. Drag and release the disc, or use ↑/↓ and Space.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '15px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 900 },
        },
      )
      .setOrigin(0.5);

    this.add
      .rectangle(
        (FIELD_LEFT + FIELD_RIGHT) / 2,
        (FIELD_TOP + FIELD_BOTTOM) / 2,
        FIELD_RIGHT - FIELD_LEFT,
        FIELD_BOTTOM - FIELD_TOP,
        0x9fda88,
        1,
      )
      .setStrokeStyle(5, 0xf5edc6, 0.84)
      .setName('rainbow-disc-activity:field');

    const markings = this.add.graphics().setName('rainbow-disc-activity:field-markings');
    markings.lineStyle(4, 0xf8f0c9, 0.5);
    markings.lineBetween(315, FIELD_TOP + 20, 315, FIELD_BOTTOM - 20);
    markings.lineBetween(975, FIELD_TOP + 20, 975, FIELD_BOTTOM - 20);
    markings.lineStyle(5, 0xf8e8ab, 0.72);
    markings.lineBetween(1090, FIELD_TOP + 20, 1090, FIELD_BOTTOM - 20);

    this.add
      .text(1140, 150, 'END\nZONE', {
        color: '#6e7759',
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    this.progressText = this.add
      .text(126, 110, '', {
        color: '#5f496d',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 641, '', {
        color: '#5f496d',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5);

    this.createTimingMeter();
    this.createButton(1100, 672, 220, 'Back to Meadow', () => this.leaveActivity(), 'back');
  }

  private createTimingMeter(): void {
    this.add
      .text(350, 672, 'Keyboard throw timing', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5);

    this.add
      .rectangle(637, 672, 370, 22, 0xd8cfc0, 1)
      .setStrokeStyle(2, 0x9b8977, 0.7)
      .setName('rainbow-disc-activity:timing-track');
    this.add.rectangle(637, 672, 155, 16, 0xa6d99a, 0.9);
    this.timingMarker = this.add
      .rectangle(637, 672, 8, 30, 0x6f4d80, 1)
      .setName('rainbow-disc-activity:timing-marker');
  }

  private createPlayerTexture(): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    createUnicornAppearanceTexture(
      this,
      PLAYER_TEXTURE_KEY,
      parseUnicornAppearance(save.profile.appearance),
    );
  }

  private renderPossession(): void {
    this.playLayer?.destroy(true);
    this.playLayer = this.add.container(0, 0).setDepth(10);
    this.receiverRings = [];
    this.dragging = false;
    this.actionLocked = false;
    this.selectedReceiver = Phaser.Math.Clamp(this.selectedReceiver, 0, RECEIVER_Y.length - 1);

    if (this.completed) {
      this.renderResult();
      return;
    }

    const throwOrigin = this.throwOrigin();
    const targetX = TARGET_X[this.possession];

    const thrower = this.add
      .sprite(throwOrigin.x - 40, throwOrigin.y + 46, PLAYER_TEXTURE_KEY)
      .setDisplaySize(164, 116)
      .setOrigin(0.5, 0.78)
      .setName('rainbow-disc-activity:thrower');
    this.playLayer.add(thrower);

    RECEIVER_Y.forEach((receiverY, index) => {
      const appearance =
        RAINBOW_DISC_PLAYER_APPEARANCES[(index + this.possession + 1) % RAINBOW_DISC_PLAYER_APPEARANCES.length];
      const receiver = createResidentAppearanceSprite(
        this,
        `rainbow-disc-activity:receiver:${this.possession}:${index}`,
        `rainbow-disc-activity:receiver:${index}`,
        appearance,
      )
        .setPosition(targetX, receiverY)
        .setScale(0.9)
        .setInteractive({ useHandCursor: true });
      receiver.on('pointerdown', () => this.selectReceiver(index));

      const ring = this.add
        .circle(targetX, receiverY + 6, 66, 0xfff4b8, index === this.selectedReceiver ? 0.22 : 0)
        .setStrokeStyle(4, 0xf4c96b, index === this.selectedReceiver ? 0.9 : 0.18)
        .setName(`rainbow-disc-activity:receiver-ring:${index}`);
      this.receiverRings.push(ring);
      this.playLayer?.add([ring, receiver]);
    });

    this.aimGraphics = this.add
      .graphics()
      .setName('rainbow-disc-activity:aim-line')
      .setDepth(25);
    this.playLayer.add(this.aimGraphics);

    this.disc = this.add
      .ellipse(throwOrigin.x, throwOrigin.y, 42, 14, 0xfff0ad, 1)
      .setStrokeStyle(3, 0xa9774d, 0.95)
      .setInteractive({ useHandCursor: true })
      .setName('rainbow-disc-activity:disc')
      .setDepth(30);
    this.disc.on('pointerdown', () => {
      if (!this.actionLocked) {
        this.dragging = true;
      }
    });
    this.playLayer.add(this.disc);

    const passLabel =
      this.possession === PASS_COUNT - 1
        ? 'Final pass: make the end-zone catch!'
        : `Pass ${this.possession + 1} of ${PASS_COUNT}: aim for any teammate.`;
    this.statusText?.setText(passLabel);
    this.progressText?.setText(
      `Catch chain: ${'●'.repeat(this.possession)}${'○'.repeat(PASS_COUNT - this.possession)}`,
    );
    this.refreshReceiverSelection();
  }

  private renderResult(): void {
    this.statusText?.setText('Score! Three catches all the way into the end zone.');
    this.progressText?.setText('Catch chain: ●●●');

    const burst = this.add.graphics().setName('rainbow-disc-activity:score-burst');
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12;
      const colour = [0xf19fbd, 0xffdc7d, 0x86cae0, 0xb9a0df][index % 4];
      burst.fillStyle(colour, 0.94);
      burst.fillCircle(
        GAME_WIDTH / 2 + Math.cos(angle) * 105,
        345 + Math.sin(angle) * 75,
        7,
      );
    }

    const title = this.add
      .text(GAME_WIDTH / 2, 300, 'RAINBOW DISC SCORE!', {
        color: '#5f496d',
        fontFamily: UI_FONT,
        fontSize: '36px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('rainbow-disc-activity:result');
    const summary = this.add
      .text(
        GAME_WIDTH / 2,
        365,
        'Nice passing. The team catches the third throw inside the end zone.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    this.playLayer?.add([burst, title, summary]);
    this.createButton(510, 460, 250, 'Play again', () => this.restartRun(), 'replay', this.playLayer);
    this.createButton(
      790,
      460,
      250,
      'Back to Meadow',
      () => this.leaveActivity(),
      'result-back',
      this.playLayer,
    );
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.dragging || this.actionLocked || !this.disc || this.completed) {
      return;
    }

    const x = Phaser.Math.Clamp(pointer.x, FIELD_LEFT + 35, FIELD_RIGHT - 35);
    const y = Phaser.Math.Clamp(pointer.y, FIELD_TOP + 30, FIELD_BOTTOM - 30);
    this.disc.setPosition(x, y);

    const throwOrigin = this.throwOrigin();
    this.aimGraphics?.clear();
    this.aimGraphics?.lineStyle(5, 0xffffff, 0.52);
    this.aimGraphics?.lineBetween(throwOrigin.x, throwOrigin.y, x, y);

    const nearest = this.nearestReceiverIndex({ x, y });
    if (nearest !== this.selectedReceiver) {
      this.selectReceiver(nearest);
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.dragging || this.actionLocked || !this.disc || this.completed) {
      return;
    }

    this.dragging = false;
    const release = {
      x: Phaser.Math.Clamp(pointer.x, FIELD_LEFT + 35, FIELD_RIGHT - 35),
      y: Phaser.Math.Clamp(pointer.y, FIELD_TOP + 30, FIELD_BOTTOM - 30),
    };
    const receiverIndex = this.nearestReceiverIndex(release);
    this.selectedReceiver = receiverIndex;
    this.refreshReceiverSelection();

    const target = this.receiverPoint(receiverIndex);
    const distance = Phaser.Math.Distance.Between(release.x, release.y, target.x, target.y);
    this.resolveThrow(target, distance <= CATCH_RADIUS, release);
  }

  private keyboardThrow(): void {
    if (this.actionLocked || this.completed || this.dragging) {
      return;
    }

    const target = this.receiverPoint(this.selectedReceiver);
    const success = this.timingValue >= 0.34 && this.timingValue <= 0.78;
    const missOffset = this.timingValue < 0.34 ? -150 : 150;
    this.resolveThrow(
      target,
      success,
      success ? target : { x: target.x - 20, y: target.y + missOffset },
    );
  }

  private resolveThrow(target: Point, success: boolean, missPoint: Point): void {
    if (!this.disc || this.actionLocked) {
      return;
    }

    this.actionLocked = true;
    this.dragging = false;
    this.aimGraphics?.clear();
    const destination = success ? target : missPoint;

    this.tweens.add({
      targets: this.disc,
      x: destination.x,
      y: destination.y,
      angle: this.disc.angle + 280,
      duration: 430,
      ease: 'Sine.Out',
      onComplete: () => {
        if (success) {
          this.handleCatch();
        } else {
          this.handleTurnover();
        }
      },
    });
  }

  private handleCatch(): void {
    this.possession += 1;
    if (this.possession >= PASS_COUNT) {
      this.completed = true;
      this.cameras.main.flash(150, 255, 239, 164, false);
      this.renderPossession();
      return;
    }

    this.statusText?.setText('Caught! Keep the chain moving.');
    this.time.delayedCall(420, () => this.renderPossession());
  }

  private handleTurnover(): void {
    this.statusText?.setText('Almost! Quick turnover — the team resets and tries the chain again.');
    this.cameras.main.shake(110, 0.002);
    this.possession = 0;
    this.time.delayedCall(520, () => this.renderPossession());
  }

  private throwOrigin(): Point {
    return {
      x: THROW_X[this.possession] ?? THROW_X[0],
      y: 370,
    };
  }

  private receiverPoint(index: number): Point {
    return {
      x: TARGET_X[this.possession] ?? TARGET_X[0],
      y: RECEIVER_Y[index] ?? RECEIVER_Y[1],
    };
  }

  private nearestReceiverIndex(point: Point): number {
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    RECEIVER_Y.forEach((_receiverY, index) => {
      const target = this.receiverPoint(index);
      const distance = Phaser.Math.Distance.Between(point.x, point.y, target.x, target.y);
      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  private selectPreviousReceiver(): void {
    if (this.actionLocked || this.completed) {
      return;
    }
    this.selectReceiver((this.selectedReceiver + RECEIVER_Y.length - 1) % RECEIVER_Y.length);
  }

  private selectNextReceiver(): void {
    if (this.actionLocked || this.completed) {
      return;
    }
    this.selectReceiver((this.selectedReceiver + 1) % RECEIVER_Y.length);
  }

  private selectReceiver(index: number): void {
    if (this.actionLocked || this.completed) {
      return;
    }
    this.selectedReceiver = Phaser.Math.Clamp(index, 0, RECEIVER_Y.length - 1);
    this.refreshReceiverSelection();
  }

  private refreshReceiverSelection(): void {
    this.receiverRings.forEach((ring, index) => {
      const selected = index === this.selectedReceiver;
      ring.setFillStyle(0xfff4b8, selected ? 0.22 : 0);
      ring.setStrokeStyle(4, 0xf4c96b, selected ? 0.9 : 0.18);
    });
  }

  private restartRun(): void {
    this.possession = 0;
    this.selectedReceiver = 1;
    this.completed = false;
    this.actionLocked = false;
    this.renderPossession();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    labelText: string,
    onPress: () => void,
    name: string,
    parent: Phaser.GameObjects.Container | null = null,
  ): void {
    const button = this.add
      .rectangle(x, y, width, 52, UI_COLOURS.mint, 1)
      .setStrokeStyle(3, 0x6aa996, 1)
      .setInteractive({ useHandCursor: true })
      .setName(`rainbow-disc-activity:${name}`);
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on('pointerdown', onPress);
    label.on('pointerdown', onPress);
    parent?.add([button, label]);
  }

  private leaveActivity(): void {
    this.scene.stop();
    if (this.game.scene.isPaused(this.returnScene)) {
      this.game.scene.resume(this.returnScene);
    } else if (!this.game.scene.isActive(this.returnScene)) {
      this.game.scene.start(this.returnScene);
    }
  }
}
