import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import {
  PRACTICE_RAINBOW_RUN_COURSE,
  type RaceBoostZoneDefinition,
  type RaceCollectableDefinition,
  type RaceObstacleDefinition,
} from '../racing/RaceCourse';
import {
  createRaceRunState,
  stepRaceRun,
  type RaceRunEvent,
  type RaceRunState,
} from '../racing/RaceRun';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';

const PLAYER_TEXTURE_KEY = 'player-unicorn-race';
const COURSE = PRACTICE_RAINBOW_RUN_COURSE;
const COURSE_START_X = 260;
const COURSE_GROUND_Y = 575;
const COURSE_WORLD_WIDTH = COURSE.length + 760;
const FINISH_X = COURSE_START_X + COURSE.length;

export class RaceScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private player: Phaser.GameObjects.Sprite | null = null;
  private runState: RaceRunState = createRaceRunState();
  private elapsedMs = 0;
  private finishTimeMs = 0;
  private progressFill: Phaser.GameObjects.Rectangle | null = null;
  private timeText: Phaser.GameObjects.Text | null = null;
  private collectableText: Phaser.GameObjects.Text | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private statusTimer: Phaser.Time.TimerEvent | null = null;
  private finishPanel: Phaser.GameObjects.Container | null = null;
  private readonly collectableSprites = new Map<string, Phaser.GameObjects.Container>();

  public constructor() {
    super('RaceScene');
  }

  public create(): void {
    this.runState = createRaceRunState();
    this.elapsedMs = 0;
    this.finishTimeMs = 0;
    this.collectableSprites.clear();

    this.createCourse();

    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, PLAYER_TEXTURE_KEY, appearance);

    this.player = this.add
      .sprite(COURSE_START_X, COURSE_GROUND_Y, PLAYER_TEXTURE_KEY)
      .setDisplaySize(138, 112)
      .setOrigin(0.5, 0.82)
      .setDepth(30);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);

    this.cameras.main.setBackgroundColor('#9bdff2');
    this.cameras.main.setBounds(0, 0, COURSE_WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -GAME_WIDTH * 0.24, 0);
    this.cameras.main.setDeadzone(350, GAME_HEIGHT);

    this.createHud();
    this.createJumpButton();
    this.createExitButton();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.statusTimer?.destroy();
      this.statusTimer = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.player = null;
      this.progressFill = null;
      this.timeText = null;
      this.collectableText = null;
      this.statusText = null;
      this.finishPanel = null;
      this.collectableSprites.clear();
    });
  }

  public update(time: number, delta: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (this.inputController.justPressed('BACK')) {
      this.exitRace();
      return;
    }

    const wasFinished = this.runState.movement.finished;
    const jumpRequested = this.inputController.justPressed('RACE_JUMP');
    const result = stepRaceRun(this.runState, COURSE, delta / 1000, jumpRequested);
    this.runState = result.state;

    if (!wasFinished) {
      this.elapsedMs += Math.max(0, Math.min(delta, 50));
    }

    const movement = this.runState.movement;
    this.player.setPosition(
      COURSE_START_X + movement.progress,
      COURSE_GROUND_Y + movement.jumpOffset,
    );

    this.updatePlayerPresentation(time);
    this.handleRaceEvents(result.events);

    const justFinished = !wasFinished && movement.finished;
    if (justFinished) {
      this.finishTimeMs = this.elapsedMs;
    }
    this.updateHud();

    if (justFinished) {
      this.showFinishPanel();
      this.cameras.main.flash(240, 255, 245, 173, false);
    }
  }

  private updatePlayerPresentation(time: number): void {
    if (!this.player) {
      return;
    }

    const movement = this.runState.movement;
    if (this.runState.stumbleRemaining > 0) {
      this.player.setAngle(Math.sin(time * 0.09) * 10);
      this.player.setDisplaySize(134, 108);
      return;
    }

    if (movement.grounded) {
      this.player.setAngle(Math.sin(time * 0.02) * 2.2);
      this.player.setDisplaySize(138, 112 * (1 + Math.sin(time * 0.025) * 0.018));
    } else {
      this.player.setAngle(Phaser.Math.Clamp(movement.verticalVelocity * 0.018, -11, 10));
      this.player.setDisplaySize(140, 110);
    }
  }

  private handleRaceEvents(events: readonly RaceRunEvent[]): void {
    for (const event of events) {
      if (event.type === 'obstacle-hit') {
        this.cameras.main.shake(110, 0.006);
        this.showRaceStatus(`Bump! ${event.obstacle.label} slowed you a little. Keep going!`);
      } else if (event.type === 'boost-entered') {
        this.cameras.main.flash(150, 255, 239, 160, false);
        this.showRaceStatus(`${event.boost.label}! Faster! ✨`);
      } else if (event.type === 'collectable-collected') {
        this.collectableSprites.get(event.collectable.id)?.destroy(true);
        this.collectableSprites.delete(event.collectable.id);
        this.cameras.main.flash(90, 255, 247, 190, false);
        this.showRaceStatus(
          `Race sparkle! ${this.runState.collectedIds.length} / ${COURSE.collectables.length} ✦`,
        );
      }
    }
  }

  private createCourse(): void {
    this.add.rectangle(
      COURSE_WORLD_WIDTH / 2,
      GAME_HEIGHT / 2,
      COURSE_WORLD_WIDTH,
      GAME_HEIGHT,
      0x9bdff2,
    );

    for (let x = 120; x < COURSE_WORLD_WIDTH; x += 430) {
      const hillHeight = 130 + ((x / 430) % 3) * 24;
      this.add.ellipse(x, 545, 620, hillHeight * 2, 0x8fd48d, 1).setDepth(1);
      this.add.ellipse(x + 130, 570, 520, hillHeight * 1.5, 0xa8df93, 0.96).setDepth(2);
    }

    this.add
      .rectangle(COURSE_WORLD_WIDTH / 2, COURSE_GROUND_Y + 68, COURSE_WORLD_WIDTH, 190, 0x73bd70, 1)
      .setDepth(3);
    this.add
      .rectangle(COURSE_WORLD_WIDTH / 2, COURSE_GROUND_Y + 18, COURSE_WORLD_WIDTH, 74, 0xe6cc91, 1)
      .setDepth(4);
    this.add
      .rectangle(COURSE_WORLD_WIDTH / 2, COURSE_GROUND_Y + 3, COURSE_WORLD_WIDTH, 9, 0xffefb5, 0.92)
      .setDepth(5);

    this.createStartArch();
    this.createFinishArch();
    this.createCourseScenery();
    this.createCourseFeatures();
  }

  private createStartArch(): void {
    const x = COURSE_START_X - 70;
    const postColour = 0x735164;
    this.add.rectangle(x - 58, 470, 20, 180, postColour, 1).setDepth(10);
    this.add.rectangle(x + 58, 470, 20, 180, postColour, 1).setDepth(10);
    this.add.rectangle(x, 385, 138, 28, 0xf7e4ad, 1).setStrokeStyle(4, 0xa77da9, 1).setDepth(10);
    this.add
      .text(x, 385, 'START', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);
  }

  private createFinishArch(): void {
    const postColour = 0x735164;
    this.add.rectangle(FINISH_X - 64, 460, 24, 205, postColour, 1).setDepth(10);
    this.add.rectangle(FINISH_X + 64, 460, 24, 205, postColour, 1).setDepth(10);
    this.add
      .rectangle(FINISH_X, 362, 154, 34, 0xfff1bd, 1)
      .setStrokeStyle(5, 0xb689b8, 1)
      .setDepth(10);
    this.add
      .text(FINISH_X, 362, 'FINISH!', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);

    const colours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];
    for (let index = 0; index < colours.length; index += 1) {
      this.add
        .triangle(FINISH_X - 80 + index * 40, 330, 0, 0, 34, 10, 0, 20, colours[index], 1)
        .setDepth(11);
    }
  }

  private createCourseScenery(): void {
    const colours = [0xf3a4c2, 0xf5ce70, 0x8ccbe0, 0xb99ad9];
    for (let x = 520, index = 0; x < FINISH_X - 180; x += 360, index += 1) {
      const flowerY = COURSE_GROUND_Y + 72 + (index % 2) * 22;
      this.add.circle(x, flowerY, 11, colours[index % colours.length], 0.95).setDepth(8);
      this.add
        .circle(x + 12, flowerY + 4, 8, colours[(index + 1) % colours.length], 0.9)
        .setDepth(8);

      if (index % 3 === 1) {
        this.add
          .text(x + 70, 180 + (index % 2) * 55, '☁', {
            color: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '72px',
          })
          .setAlpha(0.72)
          .setDepth(0);
      }
    }

    for (let x = 920; x < FINISH_X - 250; x += 960) {
      this.add.rectangle(x, 470, 7, 120, 0x805e4b, 1).setDepth(8);
      this.add.triangle(x + 4, 410, 0, 0, 72, 20, 0, 40, 0xf18dad, 1).setDepth(9);
    }
  }

  private createCourseFeatures(): void {
    for (const boost of COURSE.boostZones) {
      this.createBoostZone(boost);
    }
    for (const obstacle of COURSE.obstacles) {
      this.createObstacle(obstacle);
    }
    for (const collectable of COURSE.collectables) {
      this.createRaceCollectable(collectable);
    }
  }

  private createBoostZone(boost: RaceBoostZoneDefinition): void {
    const startX = COURSE_START_X + boost.startProgress;
    const endX = COURSE_START_X + boost.endProgress;
    const width = endX - startX;
    const centreX = startX + width / 2;

    this.add
      .rectangle(centreX, COURSE_GROUND_Y + 18, width, 64, 0xffe684, 0.72)
      .setStrokeStyle(3, 0xf0a8cf, 0.75)
      .setDepth(6);

    for (let x = startX + 42; x < endX - 20; x += 72) {
      this.add
        .text(x, COURSE_GROUND_Y + 18, '➜', {
          color: '#b46cac',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '28px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(7);
    }

    this.add
      .text(centreX, COURSE_GROUND_Y - 72, 'BOOST ✨', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff3bde8',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  private createObstacle(obstacle: RaceObstacleDefinition): void {
    const x = COURSE_START_X + obstacle.progress;

    if (obstacle.kind === 'log') {
      this.add
        .rectangle(x, COURSE_GROUND_Y - 20, obstacle.width, 42, 0x8b6047, 1)
        .setStrokeStyle(4, 0x684534, 1)
        .setDepth(16);
      this.add
        .circle(x - obstacle.width / 2 + 7, COURSE_GROUND_Y - 20, 18, 0xa97855, 1)
        .setDepth(17);
      this.add
        .circle(x + obstacle.width / 2 - 7, COURSE_GROUND_Y - 20, 18, 0xa97855, 1)
        .setDepth(17);
    } else {
      const postColour = 0x6c945e;
      this.add.rectangle(x - 44, COURSE_GROUND_Y - 38, 12, 78, postColour, 1).setDepth(16);
      this.add.rectangle(x + 44, COURSE_GROUND_Y - 38, 12, 78, postColour, 1).setDepth(16);
      this.add
        .rectangle(x, COURSE_GROUND_Y - 67, obstacle.width, 18, 0xe7a5c8, 1)
        .setStrokeStyle(3, 0xb977a6, 1)
        .setDepth(17);
      for (const offset of [-31, 0, 31]) {
        this.add.circle(x + offset, COURSE_GROUND_Y - 73, 12, 0xffd96e, 1).setDepth(18);
      }
    }

    this.add
      .text(x, COURSE_GROUND_Y - 125, 'JUMP!', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e8e8',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(18);
  }

  private createRaceCollectable(collectable: RaceCollectableDefinition): void {
    const x = COURSE_START_X + collectable.progress;
    const y = COURSE_GROUND_Y - collectable.heightAboveGround;
    const glow = this.add.circle(0, 0, 29, 0xfff0a1, 0.22);
    const ring = this.add.circle(0, 0, 19, 0xfff4bd, 0.9).setStrokeStyle(3, 0xd69bd2, 0.95);
    const star = this.add
      .text(0, -1, '✦', {
        color: '#b96cb8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const container = this.add.container(x, y, [glow, ring, star]).setDepth(22);
    this.collectableSprites.set(collectable.id, container);

    this.tweens.add({
      targets: container,
      y: y - 8,
      angle: 5,
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createHud(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, 52, 820, 90, 0xfff8e8, 0.95)
      .setStrokeStyle(4, 0xb996c6, 0.95)
      .setScrollFactor(0)
      .setDepth(100);

    this.add
      .text(GAME_WIDTH / 2, 25, `Rainbow Run • ${COURSE.name}`, {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    this.add
      .rectangle(GAME_WIDTH / 2 - 180, 67, 360, 14, 0xdccce6, 0.95)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.progressFill = this.add
      .rectangle(GAME_WIDTH / 2 - 180, 67, 1, 10, 0xc77cc8, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.timeText = this.add
      .text(GAME_WIDTH / 2 + 230, 67, '0.0s', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.collectableText = this.add
      .text(GAME_WIDTH / 2 + 335, 67, `✦ 0/${COURSE.collectables.length}`, {
        color: '#6b4f78',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 111, '', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e8e8',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(104)
      .setVisible(false);
  }

  private createJumpButton(): void {
    const x = GAME_WIDTH - 128;
    const y = GAME_HEIGHT - 102;
    const button = this.add
      .circle(x, y, 70, 0xfff2c6, 0.96)
      .setStrokeStyle(6, 0xc887c4, 1)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(110);

    this.add
      .text(x, y - 4, 'JUMP', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(111);
    this.add
      .text(x, y + 28, 'tap / SPACE', {
        color: '#7b6782',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(111);

    button.on('pointerdown', () => this.pointerInput?.setButton('RACE_JUMP', true));
    button.on('pointerup', () => this.pointerInput?.setButton('RACE_JUMP', false));
    button.on('pointerout', () => this.pointerInput?.setButton('RACE_JUMP', false));
  }

  private createExitButton(): void {
    const button = this.add
      .text(22, 22, '← Meadow', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e8ee',
        padding: { x: 13, y: 8 },
      })
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(112);
    button.on('pointerdown', () => this.exitRace());
  }

  private updateHud(): void {
    const movement = this.runState.movement;
    const ratio = Phaser.Math.Clamp(movement.progress / COURSE.length, 0, 1);
    this.progressFill?.setDisplaySize(Math.max(1, 360 * ratio), 10);
    const shownMs = movement.finished ? this.finishTimeMs : this.elapsedMs;
    this.timeText?.setText(`${(shownMs / 1000).toFixed(1)}s`);
    this.collectableText?.setText(
      `✦ ${this.runState.collectedIds.length}/${COURSE.collectables.length}`,
    );
  }

  private showRaceStatus(message: string): void {
    this.statusTimer?.destroy();
    this.statusText?.setText(message).setVisible(true);
    this.statusTimer = this.time.delayedCall(1500, () => {
      this.statusText?.setVisible(false);
      this.statusTimer = null;
    });
  }

  private showFinishPanel(): void {
    if (this.finishPanel) {
      return;
    }

    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 650, 350, 0x5f4772, 0.94);
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, 'You finished! 🌈', {
        color: '#fff5cf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const time = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 55,
        `Practice time: ${(this.finishTimeMs / 1000).toFixed(1)} seconds`,
        {
          color: '#fff8ff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
        },
      )
      .setOrigin(0.5);
    const sparkles = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 12,
        `Race sparkles: ${this.runState.collectedIds.length} / ${COURSE.collectables.length} • missing some is OK!`,
        {
          color: '#ffe9ad',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    const restart = this.add
      .rectangle(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 92, 230, 70, 0xffefb7, 1)
      .setStrokeStyle(4, 0xd49acb, 1)
      .setInteractive({ useHandCursor: true });
    const restartText = this.add
      .text(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 92, 'Race again', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const exit = this.add
      .rectangle(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 92, 230, 70, 0xf7e8ff, 1)
      .setStrokeStyle(4, 0xb895c8, 1)
      .setInteractive({ useHandCursor: true });
    const exitText = this.add
      .text(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 92, 'Back to Meadow', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.finishPanel = this.add
      .container(0, 0, [shade, title, time, sparkles, restart, restartText, exit, exitText])
      .setScrollFactor(0)
      .setDepth(150);

    restart.on('pointerdown', () => this.restartRace());
    exit.on('pointerdown', () => this.exitRace());
  }

  private restartRace(): void {
    this.pointerInput?.setButton('RACE_JUMP', false);
    this.scene.restart();
  }

  private exitRace(): void {
    const raceEntrance = RAINBOW_MEADOW_MAP.hubFeatures.find(
      (feature) => feature.id === 'rainbow-run-entrance',
    );
    if (raceEntrance) {
      setRainbowMeadowPlayerSpawn(raceEntrance.approach);
    }
    saveLocationCheckpoint(getBrowserSaveService(), RAINBOW_MEADOW_LOCATION_ID);
    this.scene.start('RainbowMeadowScene');
  }
}
