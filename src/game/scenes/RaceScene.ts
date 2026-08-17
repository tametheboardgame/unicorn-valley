import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import {
  RACE_COURSE_LENGTH,
  createRaceMovementState,
  stepRaceMovement,
  type RaceMovementState,
} from '../racing/RaceMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';

const PLAYER_TEXTURE_KEY = 'player-unicorn-race';
const COURSE_START_X = 260;
const COURSE_GROUND_Y = 575;
const COURSE_WORLD_WIDTH = RACE_COURSE_LENGTH + 760;
const FINISH_X = COURSE_START_X + RACE_COURSE_LENGTH;

export class RaceScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private player: Phaser.GameObjects.Sprite | null = null;
  private raceState: RaceMovementState = createRaceMovementState();
  private elapsedMs = 0;
  private finishTimeMs = 0;
  private progressFill: Phaser.GameObjects.Rectangle | null = null;
  private timeText: Phaser.GameObjects.Text | null = null;
  private finishPanel: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('RaceScene');
  }

  public create(): void {
    this.raceState = createRaceMovementState();
    this.elapsedMs = 0;
    this.finishTimeMs = 0;

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
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.player = null;
      this.progressFill = null;
      this.timeText = null;
      this.finishPanel = null;
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

    const wasFinished = this.raceState.finished;
    const jumpRequested = this.inputController.justPressed('RACE_JUMP');
    this.raceState = stepRaceMovement(this.raceState, delta / 1000, jumpRequested);

    if (!wasFinished) {
      this.elapsedMs += Math.max(0, Math.min(delta, 50));
    }

    this.player.setPosition(
      COURSE_START_X + this.raceState.progress,
      COURSE_GROUND_Y + this.raceState.jumpOffset,
    );

    if (this.raceState.grounded) {
      this.player.setAngle(Math.sin(time * 0.02) * 2.2);
      this.player.setDisplaySize(138, 112 * (1 + Math.sin(time * 0.025) * 0.018));
    } else {
      this.player.setAngle(Phaser.Math.Clamp(this.raceState.verticalVelocity * 0.018, -11, 10));
      this.player.setDisplaySize(140, 110);
    }

    const justFinished = !wasFinished && this.raceState.finished;
    if (justFinished) {
      this.finishTimeMs = this.elapsedMs;
    }
    this.updateHud();

    if (justFinished) {
      this.showFinishPanel();
      this.cameras.main.flash(240, 255, 245, 173, false);
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

  private createHud(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, 50, 710, 72, 0xfff8e8, 0.94)
      .setStrokeStyle(4, 0xb996c6, 0.95)
      .setScrollFactor(0)
      .setDepth(100);

    this.add
      .text(GAME_WIDTH / 2, 30, 'Rainbow Run • Practice Dash', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    this.add
      .rectangle(GAME_WIDTH / 2 - 74, 68, 430, 14, 0xdccce6, 0.95)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.progressFill = this.add
      .rectangle(GAME_WIDTH / 2 - 74, 68, 1, 10, 0xc77cc8, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.timeText = this.add
      .text(GAME_WIDTH / 2 + 250, 68, '0.0s', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);
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
    const ratio = Phaser.Math.Clamp(this.raceState.progress / RACE_COURSE_LENGTH, 0, 1);
    this.progressFill?.setDisplaySize(Math.max(1, 430 * ratio), 10);
    const shownMs = this.raceState.finished ? this.finishTimeMs : this.elapsedMs;
    this.timeText?.setText(`${(shownMs / 1000).toFixed(1)}s`);
  }

  private showFinishPanel(): void {
    if (this.finishPanel) {
      return;
    }

    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 620, 320, 0x5f4772, 0.94);
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 105, 'You finished! 🌈', {
        color: '#fff5cf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const time = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 35,
        `Practice time: ${(this.finishTimeMs / 1000).toFixed(1)} seconds`,
        {
          color: '#fff8ff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
        },
      )
      .setOrigin(0.5);

    const restart = this.add
      .rectangle(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 75, 230, 70, 0xffefb7, 1)
      .setStrokeStyle(4, 0xd49acb, 1)
      .setInteractive({ useHandCursor: true });
    const restartText = this.add
      .text(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 75, 'Race again', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const exit = this.add
      .rectangle(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 75, 230, 70, 0xf7e8ff, 1)
      .setStrokeStyle(4, 0xb895c8, 1)
      .setInteractive({ useHandCursor: true });
    const exitText = this.add
      .text(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 75, 'Back to Meadow', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.finishPanel = this.add
      .container(0, 0, [shade, title, time, restart, restartText, exit, exitText])
      .setScrollFactor(0)
      .setDepth(150);

    restart.on('pointerdown', () => this.restartRace());
    exit.on('pointerdown', () => this.exitRace());
  }

  private restartRace(): void {
    this.finishPanel?.destroy(true);
    this.finishPanel = null;
    this.raceState = createRaceMovementState();
    this.elapsedMs = 0;
    this.finishTimeMs = 0;
    this.player?.setPosition(COURSE_START_X, COURSE_GROUND_Y).setAngle(0).setDisplaySize(138, 112);
    this.cameras.main.scrollX = 0;
    this.pointerInput?.setButton('RACE_JUMP', false);
    this.updateHud();
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
