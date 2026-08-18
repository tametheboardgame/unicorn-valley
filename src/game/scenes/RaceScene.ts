import Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import {
  createRaceAssistanceControl,
  type RaceAssistanceControl,
} from '../racing/RaceAssistanceControl';
import {
  RAINBOW_RUN_NPC_RACERS,
  createRaceCompetitionState,
  formatRacePlace,
  getRaceStandings,
  stepRaceCompetition,
  type RaceCompetitionState,
  type RaceStanding,
} from '../racing/RaceCompetition';
import {
  PRACTICE_RAINBOW_RUN_COURSE,
  type RaceBoostZoneDefinition,
  type RaceCollectableDefinition,
  type RaceObstacleDefinition,
} from '../racing/RaceCourse';
import { STANDARD_RACE_DIFFICULTY, resolveRacePlayerTuning } from '../racing/RaceDifficulty';
import {
  createLayeredRaceBackdrop,
  createRaceSpeedStreaks,
  playRaceFinishBurst,
  resolveRaceCountdown,
  type RaceSpeedStreak,
  updateRaceSpeedStreaks,
} from '../racing/RacePresentation';
import {
  RAINBOW_RUN_FINISHER_RIBBON_ID,
  RAINBOW_RUN_PODIUM_ROSETTE_ID,
  applyRaceResultToSave,
  type RaceRewardSummary,
} from '../racing/RaceResults';
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

interface NpcRacerVisual {
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  laneOffset: number;
}

export class RaceScene extends Phaser.Scene {
  private readonly audio = getVerticalSliceAudio();
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private assistanceControl: RaceAssistanceControl | null = null;
  private player: Phaser.GameObjects.Sprite | null = null;
  private playerShadow: Phaser.GameObjects.Ellipse | null = null;
  private runState: RaceRunState = createRaceRunState();
  private competitionState: RaceCompetitionState = createRaceCompetitionState();
  private elapsedMs = 0;
  private finishTimeMs = 0;
  private playerFinishPlace = 0;
  private raceRewardSummary: RaceRewardSummary | null = null;
  private raceStarted = false;
  private countdownElapsedMs = 0;
  private countdownCueIndex = -1;
  private countdownContainer: Phaser.GameObjects.Container | null = null;
  private countdownText: Phaser.GameObjects.Text | null = null;
  private speedBurstRemainingMs = 0;
  private speedStreaks: RaceSpeedStreak[] = [];
  private progressFill: Phaser.GameObjects.Rectangle | null = null;
  private positionText: Phaser.GameObjects.Text | null = null;
  private timeText: Phaser.GameObjects.Text | null = null;
  private collectableText: Phaser.GameObjects.Text | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private finishOrderText: Phaser.GameObjects.Text | null = null;
  private statusTimer: Phaser.Time.TimerEvent | null = null;
  private finishPanel: Phaser.GameObjects.Container | null = null;
  private readonly collectableSprites = new Map<string, Phaser.GameObjects.Container>();
  private readonly npcRacerVisuals = new Map<string, NpcRacerVisual>();

  public constructor() {
    super('RaceScene');
  }

  public create(): void {
    this.runState = createRaceRunState();
    this.competitionState = createRaceCompetitionState();
    this.elapsedMs = 0;
    this.finishTimeMs = 0;
    this.playerFinishPlace = 0;
    this.raceRewardSummary = null;
    this.raceStarted = false;
    this.countdownElapsedMs = 0;
    this.countdownCueIndex = -1;
    this.speedBurstRemainingMs = 0;
    this.collectableSprites.clear();
    this.npcRacerVisuals.clear();
    this.speedStreaks = [];

    this.createCourse();

    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, PLAYER_TEXTURE_KEY, appearance);

    this.playerShadow = this.add
      .ellipse(COURSE_START_X, COURSE_GROUND_Y + 20, 104, 24, 0x4d5d46, 0.22)
      .setDepth(24);
    this.player = this.add
      .sprite(COURSE_START_X, COURSE_GROUND_Y, PLAYER_TEXTURE_KEY)
      .setDisplaySize(138, 112)
      .setOrigin(0.5, 0.82)
      .setDepth(30);
    this.createNpcRacers();

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);

    this.cameras.main.setBackgroundColor('#9bdff2');
    this.cameras.main.setBounds(0, 0, COURSE_WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -GAME_WIDTH * 0.24, 0);
    this.cameras.main.setDeadzone(350, GAME_HEIGHT);

    this.speedStreaks = createRaceSpeedStreaks(this);
    this.createHud();
    this.createJumpButton();
    this.createExitButton();
    this.createCountdownOverlay();
    this.assistanceControl = createRaceAssistanceControl(
      this,
      GAME_WIDTH - 150,
      165,
      (_mode, description) => this.showRaceStatus(description),
    );

    this.audio.enterScene(this.scene.key);
    this.input.once('pointerdown', () => void this.audio.unlock());
    this.input.keyboard?.once('keydown', () => void this.audio.unlock());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audio.leaveScene(this.scene.key);
      this.statusTimer?.destroy();
      this.statusTimer = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.assistanceControl = null;
      this.player = null;
      this.playerShadow = null;
      this.raceRewardSummary = null;
      this.progressFill = null;
      this.positionText = null;
      this.timeText = null;
      this.collectableText = null;
      this.statusText = null;
      this.finishOrderText = null;
      this.finishPanel = null;
      this.countdownContainer = null;
      this.countdownText = null;
      this.speedStreaks = [];
      this.collectableSprites.clear();
      this.npcRacerVisuals.clear();
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

    if (!this.raceStarted && !this.updateCountdown(delta)) {
      this.updatePlayerPresentation(time);
      this.updateNpcRacerPresentation(time);
      updateRaceSpeedStreaks(this.speedStreaks, delta, false);
      return;
    }

    const wasFinished = this.runState.movement.finished;
    const jumpRequested = this.inputController.justPressed('RACE_JUMP');
    const tuning = resolveRacePlayerTuning(
      STANDARD_RACE_DIFFICULTY,
      this.assistanceControl?.getMode() ?? 'standard',
    );
    const result = stepRaceRun(
      this.runState,
      COURSE,
      delta / 1000,
      jumpRequested,
      tuning.forwardSpeedMultiplier,
      tuning,
    );
    this.runState = result.state;
    this.competitionState = stepRaceCompetition(
      this.competitionState,
      RAINBOW_RUN_NPC_RACERS,
      COURSE,
      delta / 1000,
    );

    if (!wasFinished) {
      this.elapsedMs += Math.max(0, Math.min(delta, 50));
    }
    this.speedBurstRemainingMs = Math.max(0, this.speedBurstRemainingMs - delta);

    const movement = this.runState.movement;
    this.player.setPosition(
      COURSE_START_X + movement.progress,
      COURSE_GROUND_Y + movement.jumpOffset,
    );

    this.updatePlayerPresentation(time);
    this.updateNpcRacerPresentation(time);
    this.handleRaceEvents(result.events);
    updateRaceSpeedStreaks(
      this.speedStreaks,
      delta,
      !movement.finished,
      this.speedBurstRemainingMs > 0 ? 1.55 : this.runState.stumbleRemaining > 0 ? 0.65 : 1,
    );

    const justFinished = !wasFinished && movement.finished;
    if (justFinished) {
      this.finishTimeMs = this.elapsedMs;
      this.playerFinishPlace =
        this.getCurrentStandings().find((standing) => standing.isPlayer)?.place ?? 1;
      this.raceRewardSummary = this.saveRaceResult();
      updateRaceSpeedStreaks(this.speedStreaks, delta, false);
      playRaceFinishBurst(this);
      this.audio.playSfx('race-finish');
      this.cameras.main.flash(300, 255, 245, 173, false);
      this.cameras.main.shake(170, 0.004);
      this.time.delayedCall(260, () => this.showFinishPanel());
    }

    this.updateHud();
  }

  private updateCountdown(delta: number): boolean {
    this.countdownElapsedMs += Math.max(0, Math.min(delta, 100));
    const countdown = resolveRaceCountdown(this.countdownElapsedMs);

    if (countdown.cueIndex !== this.countdownCueIndex) {
      this.countdownCueIndex = countdown.cueIndex;
      this.countdownText?.setText(countdown.cue).setAlpha(1).setScale(0.66);
      if (this.countdownText) {
        this.tweens.killTweensOf(this.countdownText);
        this.tweens.add({
          targets: this.countdownText,
          scaleX: countdown.readyToRace ? 1.24 : 1,
          scaleY: countdown.readyToRace ? 1.24 : 1,
          duration: 190,
          ease: 'Back.Out',
        });
      }

      if (countdown.readyToRace) {
        this.raceStarted = true;
        this.audio.playSfx('race-go');
        this.cameras.main.flash(110, 255, 248, 198, false);
        this.time.delayedCall(430, () => {
          if (!this.countdownContainer) {
            return;
          }
          this.tweens.add({
            targets: this.countdownContainer,
            alpha: 0,
            y: this.countdownContainer.y - 18,
            duration: 230,
            ease: 'Quad.In',
            onComplete: () => this.countdownContainer?.setVisible(false),
          });
        });
      } else {
        this.audio.playSfx('race-countdown');
      }
    }

    return this.raceStarted;
  }

  private createCountdownOverlay(): void {
    const panel = this.add
      .rectangle(0, 0, 270, 188, 0x5f4772, 0.88)
      .setStrokeStyle(5, 0xffefb7, 0.95);
    const ready = this.add
      .text(0, -52, 'READY?', {
        color: '#fff5cf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.countdownText = this.add
      .text(0, 22, '3', {
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '72px',
        fontStyle: 'bold',
        stroke: '#8c63a7',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScale(0.66);
    const hint = this.add
      .text(0, 74, 'Jump with SPACE or tap', {
        color: '#f6eaff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5);

    this.countdownContainer = this.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 74, [panel, ready, this.countdownText, hint])
      .setScrollFactor(0)
      .setDepth(132);
  }

  private updatePlayerPresentation(time: number): void {
    if (!this.player) {
      return;
    }

    const movement = this.runState.movement;
    const stride = Math.sin(time * 0.03);
    if (this.runState.stumbleRemaining > 0) {
      this.player.setAngle(Math.sin(time * 0.09) * 10);
      this.player.setDisplaySize(134, 108);
    } else if (movement.grounded) {
      const speedLean = this.speedBurstRemainingMs > 0 ? -3.2 : -0.8;
      this.player.setAngle(stride * 2.8 + speedLean);
      this.player.setDisplaySize(140 + Math.abs(stride) * 4, 110 - stride * 3.5);
    } else {
      this.player.setAngle(Phaser.Math.Clamp(movement.verticalVelocity * 0.018, -11, 10));
      this.player.setDisplaySize(142, 108);
    }

    if (this.playerShadow) {
      const airborne = !movement.grounded;
      this.playerShadow.setPosition(this.player.x, COURSE_GROUND_Y + 20);
      this.playerShadow.setScale(airborne ? 0.72 : 1, airborne ? 0.72 : 1);
      this.playerShadow.setAlpha(airborne ? 0.11 : 0.23);
    }
  }

  private createNpcRacers(): void {
    for (let index = 0; index < RAINBOW_RUN_NPC_RACERS.length; index += 1) {
      const definition = RAINBOW_RUN_NPC_RACERS[index];
      const sprite = this.add
        .sprite(
          COURSE_START_X - 18 - index * 15,
          COURSE_GROUND_Y + definition.laneOffset,
          PLAYER_TEXTURE_KEY,
        )
        .setDisplaySize(116, 94)
        .setOrigin(0.5, 0.82)
        .setTint(definition.tint)
        .setAlpha(0.92)
        .setDepth(26 + index);
      const label = this.add
        .text(sprite.x, sprite.y - 78, definition.name, {
          color: '#5c4668',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          backgroundColor: '#fff8e8dd',
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5, 1)
        .setDepth(35 + index);

      this.npcRacerVisuals.set(definition.id, {
        sprite,
        label,
        laneOffset: definition.laneOffset,
      });
    }
  }

  private updateNpcRacerPresentation(time: number): void {
    for (let index = 0; index < this.competitionState.npcRacers.length; index += 1) {
      const racer = this.competitionState.npcRacers[index];
      const visual = this.npcRacerVisuals.get(racer.id);
      if (!visual) {
        continue;
      }

      const movement = racer.run.movement;
      const x = COURSE_START_X + movement.progress;
      const y = COURSE_GROUND_Y + visual.laneOffset + movement.jumpOffset;
      visual.sprite.setPosition(x, y);
      visual.label.setPosition(x, y - 78);

      if (racer.run.stumbleRemaining > 0) {
        visual.sprite.setAngle(Math.sin(time * 0.085 + index) * 9);
        visual.sprite.setDisplaySize(112, 90);
      } else if (movement.grounded) {
        const stride = Math.sin(time * 0.026 + index * 0.8);
        visual.sprite.setAngle(stride * 2.4 - 0.6);
        visual.sprite.setDisplaySize(118 + Math.abs(stride) * 3, 92 - stride * 2.5);
      } else {
        visual.sprite.setAngle(Phaser.Math.Clamp(movement.verticalVelocity * 0.016, -10, 9));
        visual.sprite.setDisplaySize(118, 92);
      }
    }
  }

  private handleRaceEvents(events: readonly RaceRunEvent[]): void {
    for (const event of events) {
      if (event.type === 'obstacle-hit') {
        this.cameras.main.shake(110, 0.006);
        this.audio.playSfx('ui');
        this.showRaceStatus(`Bump! ${event.obstacle.label} slowed you a little. Keep going!`);
      } else if (event.type === 'boost-entered') {
        this.speedBurstRemainingMs = 780;
        this.audio.playSfx('collect');
        this.cameras.main.flash(150, 255, 239, 160, false);
        this.showRaceStatus(`${event.boost.label}! Faster! ✨`);
      } else if (event.type === 'collectable-collected') {
        this.collectableSprites.get(event.collectable.id)?.destroy(true);
        this.collectableSprites.delete(event.collectable.id);
        this.audio.playSfx('collect');
        this.cameras.main.flash(90, 255, 247, 190, false);
        this.showRaceStatus(
          `Race sparkle! ${this.runState.collectedIds.length} / ${COURSE.collectables.length} ✦`,
        );
      }
    }
  }

  private createCourse(): void {
    createLayeredRaceBackdrop(this, COURSE_WORLD_WIDTH, COURSE_GROUND_Y);

    this.add
      .rectangle(COURSE_WORLD_WIDTH / 2, COURSE_GROUND_Y + 70, COURSE_WORLD_WIDTH, 196, 0x68af68, 1)
      .setDepth(3);
    this.add
      .rectangle(COURSE_WORLD_WIDTH / 2, COURSE_GROUND_Y + 20, COURSE_WORLD_WIDTH, 78, 0xd8bd82, 1)
      .setDepth(4);
    this.add
      .rectangle(
        COURSE_WORLD_WIDTH / 2,
        COURSE_GROUND_Y + 4,
        COURSE_WORLD_WIDTH,
        10,
        0xfff0b7,
        0.96,
      )
      .setDepth(5);
    this.add
      .rectangle(
        COURSE_WORLD_WIDTH / 2,
        COURSE_GROUND_Y + 57,
        COURSE_WORLD_WIDTH,
        6,
        0xb89b69,
        0.62,
      )
      .setDepth(5);

    for (let x = 420, index = 0; x < FINISH_X - 120; x += 230, index += 1) {
      this.add
        .ellipse(
          x,
          COURSE_GROUND_Y + 28 + (index % 2) * 12,
          76,
          8,
          index % 2 === 0 ? 0xf1d69b : 0xc9ab73,
          0.56,
        )
        .setDepth(5);
    }

    this.createStartArch();
    this.createFinishArch();
    this.createCourseScenery();
    this.createCourseFeatures();
  }

  private createStartArch(): void {
    const x = COURSE_START_X - 70;
    const postColour = 0x68475f;
    this.add.ellipse(x, COURSE_GROUND_Y + 26, 190, 24, 0x4b5a46, 0.18).setDepth(8);
    this.add.rectangle(x - 61, 470, 27, 184, 0x5d4055, 1).setDepth(9);
    this.add.rectangle(x + 61, 470, 27, 184, 0x5d4055, 1).setDepth(9);
    this.add.rectangle(x - 58, 468, 17, 178, postColour, 1).setDepth(10);
    this.add.rectangle(x + 58, 468, 17, 178, postColour, 1).setDepth(10);
    this.add.rectangle(x, 385, 150, 34, 0xf7e4ad, 1).setStrokeStyle(5, 0xa77da9, 1).setDepth(10);
    this.add
      .text(x, 385, 'START', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);

    for (let index = 0; index < 5; index += 1) {
      this.add
        .triangle(x - 92 + index * 46, 352, 0, 0, 32, 8, 0, 22, index % 2 ? 0xf5c968 : 0xf18dad, 1)
        .setDepth(11);
    }
  }

  private createFinishArch(): void {
    const postColour = 0x68475f;
    this.add.ellipse(FINISH_X, COURSE_GROUND_Y + 26, 210, 26, 0x4b5a46, 0.18).setDepth(8);
    this.add.rectangle(FINISH_X - 67, 460, 30, 210, 0x5d4055, 1).setDepth(9);
    this.add.rectangle(FINISH_X + 67, 460, 30, 210, 0x5d4055, 1).setDepth(9);
    this.add.rectangle(FINISH_X - 64, 458, 20, 202, postColour, 1).setDepth(10);
    this.add.rectangle(FINISH_X + 64, 458, 20, 202, postColour, 1).setDepth(10);
    this.add
      .rectangle(FINISH_X, 362, 166, 40, 0xfff1bd, 1)
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

    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        this.add
          .rectangle(
            FINISH_X - 24 + column * 16,
            COURSE_GROUND_Y + 14 + row * 16,
            16,
            16,
            (row + column) % 2 === 0 ? 0xfff8e8 : 0x735164,
            0.9,
          )
          .setDepth(7);
      }
    }
  }

  private createCourseScenery(): void {
    const colours = [0xf3a4c2, 0xf5ce70, 0x8ccbe0, 0xb99ad9];
    for (let x = 520, index = 0; x < FINISH_X - 180; x += 330, index += 1) {
      const flowerY = COURSE_GROUND_Y + 76 + (index % 2) * 22;
      this.add.rectangle(x, flowerY + 20, 4, 32, 0x5d9d61, 0.9).setDepth(7);
      this.add.circle(x, flowerY, 11, colours[index % colours.length], 0.95).setDepth(8);
      this.add
        .circle(x + 12, flowerY + 4, 8, colours[(index + 1) % colours.length], 0.9)
        .setDepth(8);
    }

    for (let x = 820, index = 0; x < FINISH_X - 250; x += 820, index += 1) {
      this.add.rectangle(x, 468, 8, 124, 0x6d5043, 1).setDepth(8);
      this.add
        .triangle(x + 4, 406, 0, 0, 82, 22, 0, 44, index % 2 === 0 ? 0xf18dad : 0x7cc6d8, 1)
        .setDepth(9);
      this.add.circle(x + 4, 401, 8, 0xffefb7, 1).setDepth(10);
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

    this.add.rectangle(centreX, COURSE_GROUND_Y + 18, width + 12, 70, 0xf5b6dd, 0.34).setDepth(5);
    this.add
      .rectangle(centreX, COURSE_GROUND_Y + 18, width, 62, 0xffe684, 0.78)
      .setStrokeStyle(4, 0xc777b7, 0.84)
      .setDepth(6);

    for (let x = startX + 38; x < endX - 18; x += 68) {
      this.add
        .text(x, COURSE_GROUND_Y + 18, '➜', {
          color: '#a9539e',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '30px',
          fontStyle: 'bold',
          stroke: '#fff1c5',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(7);
    }

    this.add
      .text(centreX, COURSE_GROUND_Y - 76, 'BOOST ✨', {
        color: '#5b4268',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff3bdf2',
        padding: { x: 11, y: 6 },
        stroke: '#ffffff',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  private createObstacle(obstacle: RaceObstacleDefinition): void {
    const x = COURSE_START_X + obstacle.progress;
    this.add.ellipse(x, COURSE_GROUND_Y + 7, obstacle.width + 44, 22, 0x554b42, 0.25).setDepth(14);

    if (obstacle.kind === 'log') {
      this.add.rectangle(x, COURSE_GROUND_Y - 20, obstacle.width + 8, 50, 0x5d3c2e, 1).setDepth(15);
      this.add
        .rectangle(x, COURSE_GROUND_Y - 21, obstacle.width, 42, 0x8b6047, 1)
        .setStrokeStyle(5, 0x684534, 1)
        .setDepth(16);
      this.add
        .rectangle(x, COURSE_GROUND_Y - 31, obstacle.width - 18, 7, 0xb9845c, 0.72)
        .setDepth(17);
      this.add
        .circle(x - obstacle.width / 2 + 7, COURSE_GROUND_Y - 20, 19, 0xa97855, 1)
        .setStrokeStyle(4, 0x684534, 1)
        .setDepth(17);
      this.add
        .circle(x + obstacle.width / 2 - 7, COURSE_GROUND_Y - 20, 19, 0xa97855, 1)
        .setStrokeStyle(4, 0x684534, 1)
        .setDepth(17);
    } else {
      this.add.rectangle(x - 45, COURSE_GROUND_Y - 38, 18, 82, 0x4c6844, 1).setDepth(15);
      this.add.rectangle(x + 45, COURSE_GROUND_Y - 38, 18, 82, 0x4c6844, 1).setDepth(15);
      this.add.rectangle(x - 44, COURSE_GROUND_Y - 38, 11, 78, 0x75a367, 1).setDepth(16);
      this.add.rectangle(x + 44, COURSE_GROUND_Y - 38, 11, 78, 0x75a367, 1).setDepth(16);
      this.add.rectangle(x, COURSE_GROUND_Y - 67, obstacle.width + 8, 26, 0x8a5580, 1).setDepth(16);
      this.add
        .rectangle(x, COURSE_GROUND_Y - 67, obstacle.width, 18, 0xe7a5c8, 1)
        .setStrokeStyle(4, 0xb977a6, 1)
        .setDepth(17);
      for (const offset of [-31, 0, 31]) {
        this.add
          .circle(x + offset, COURSE_GROUND_Y - 73, 12, 0xffd96e, 1)
          .setStrokeStyle(2, 0x9b6f3f, 0.8)
          .setDepth(18);
      }
    }

    this.add
      .text(x, COURSE_GROUND_Y - 128, '↑ JUMP', {
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#5f4772f2',
        padding: { x: 10, y: 5 },
        stroke: '#5f4772',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setDepth(19);
  }

  private createRaceCollectable(collectable: RaceCollectableDefinition): void {
    const x = COURSE_START_X + collectable.progress;
    const y = COURSE_GROUND_Y - collectable.heightAboveGround;
    const glow = this.add.circle(0, 0, 31, 0xfff0a1, 0.25);
    const ring = this.add.circle(0, 0, 20, 0xfff4bd, 0.94).setStrokeStyle(4, 0xd69bd2, 0.95);
    const star = this.add
      .text(0, -1, '✦', {
        color: '#a95baa',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const container = this.add.container(x, y, [glow, ring, star]).setDepth(22);
    this.collectableSprites.set(collectable.id, container);

    this.tweens.add({
      targets: container,
      y: y - 9,
      angle: 6,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 680,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createHud(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, 50, 930, 84, 0xfff8e8, 0.95)
      .setStrokeStyle(4, 0xb996c6, 0.95)
      .setScrollFactor(0)
      .setDepth(100);

    this.add
      .text(GAME_WIDTH / 2, 23, `Rainbow Run • ${COURSE.name}`, {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    this.positionText = this.add
      .text(GAME_WIDTH / 2 - 350, 64, `1st / ${RAINBOW_RUN_NPC_RACERS.length + 1}`, {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#f7e8ffee',
        padding: { x: 9, y: 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.add
      .rectangle(GAME_WIDTH / 2 - 205, 64, 330, 14, 0xdccce6, 0.95)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.progressFill = this.add
      .rectangle(GAME_WIDTH / 2 - 205, 64, 1, 10, 0xc77cc8, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.timeText = this.add
      .text(GAME_WIDTH / 2 + 190, 64, '0.0s', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.collectableText = this.add
      .text(GAME_WIDTH / 2 + 315, 64, `✦ 0/${COURSE.collectables.length}`, {
        color: '#6b4f78',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 106, '', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e8f2',
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
    this.add
      .circle(x + 5, y + 7, 73, 0x4c3e59, 0.2)
      .setScrollFactor(0)
      .setDepth(109);
    const button = this.add
      .circle(x, y, 70, 0xfff2c6, 0.97)
      .setStrokeStyle(6, 0xc887c4, 1)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(110);

    this.add
      .text(x, y - 5, 'JUMP', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(111);
    this.add
      .text(x, y + 29, 'tap / SPACE', {
        color: '#7b6782',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(111);

    button.on('pointerdown', () => {
      button.setScale(0.94);
      this.pointerInput?.setButton('RACE_JUMP', true);
    });
    button.on('pointerup', () => {
      button.setScale(1);
      this.pointerInput?.setButton('RACE_JUMP', false);
    });
    button.on('pointerout', () => {
      button.setScale(1);
      this.pointerInput?.setButton('RACE_JUMP', false);
    });
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

  private getCurrentStandings(): RaceStanding[] {
    return getRaceStandings(
      {
        id: 'player',
        name: 'You',
        progress: this.runState.movement.progress,
        finished: this.runState.movement.finished,
        finishTimeSeconds: this.runState.movement.finished ? this.finishTimeMs / 1000 : null,
        isPlayer: true,
      },
      this.competitionState,
      RAINBOW_RUN_NPC_RACERS,
    );
  }

  private saveRaceResult(): RaceRewardSummary {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const result = applyRaceResultToSave(save, {
      raceId: COURSE.id,
      finishTimeMs: this.finishTimeMs,
      place: this.playerFinishPlace,
      participantCount: RAINBOW_RUN_NPC_RACERS.length + 1,
    });
    saveService.save(result.save);
    return result.summary;
  }

  private updateHud(): void {
    const movement = this.runState.movement;
    const ratio = Phaser.Math.Clamp(movement.progress / COURSE.length, 0, 1);
    this.progressFill?.setDisplaySize(Math.max(1, 330 * ratio), 10);
    const shownMs = movement.finished ? this.finishTimeMs : this.elapsedMs;
    this.timeText?.setText(`${(shownMs / 1000).toFixed(1)}s`);
    this.collectableText?.setText(
      `✦ ${this.runState.collectedIds.length}/${COURSE.collectables.length}`,
    );

    const standings = this.getCurrentStandings();
    const playerStanding = standings.find((standing) => standing.isPlayer);
    if (playerStanding) {
      this.positionText?.setText(`${formatRacePlace(playerStanding.place)} / ${standings.length}`);
    }

    if (this.finishOrderText) {
      const allFinished = standings.every((standing) => standing.finished);
      this.finishOrderText.setText(
        allFinished
          ? `Finish order: ${standings.map((standing) => standing.name).join(' • ')}`
          : `Current order: ${standings.map((standing) => standing.name).join(' • ')}`,
      );
    }
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

    const standings = this.getCurrentStandings();
    const place =
      this.playerFinishPlace || standings.find((standing) => standing.isPlayer)?.place || 1;
    const reward = this.raceRewardSummary;
    const bestText = reward
      ? reward.isPersonalBest
        ? reward.previousBestTimeMs === null
          ? `Personal best: ${(reward.bestTimeMs / 1000).toFixed(1)}s ✨`
          : `New personal best: ${(reward.bestTimeMs / 1000).toFixed(1)}s • was ${(reward.previousBestTimeMs / 1000).toFixed(1)}s ✨`
        : `Personal best: ${(reward.bestTimeMs / 1000).toFixed(1)}s`
      : '';
    const rewardLines = reward
      ? [
          `✨ +${reward.participationSparkles} Rainbow Sparkles for finishing`,
          ...(reward.podiumBonusSparkles > 0
            ? [`🏆 +${reward.podiumBonusSparkles} Rainbow Sparkles for a podium finish`]
            : []),
          ...(reward.newRibbonIds.includes(RAINBOW_RUN_FINISHER_RIBBON_ID)
            ? ['🎀 New Finisher Ribbon • available to decorate your cottage']
            : []),
          ...(reward.newRibbonIds.includes(RAINBOW_RUN_PODIUM_ROSETTE_ID)
            ? ['🏅 New Podium Rosette • available to decorate your cottage']
            : []),
        ]
      : ['Your race record has been saved.'];

    const shadow = this.add.rectangle(
      GAME_WIDTH / 2 + 10,
      GAME_HEIGHT / 2 + 12,
      838,
      548,
      0x493958,
      0.38,
    );
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 820, 530, 0xfff8e8, 0.985)
      .setStrokeStyle(6, 0xb689b8, 1);
    const ribbon = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 218, 510, 62, 0x76558a, 1)
      .setStrokeStyle(4, 0xffeab3, 0.9);
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 218, `You finished ${formatRacePlace(place)}! 🌈`, {
        color: '#fff6d5',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const time = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 158,
        `Race time: ${(this.finishTimeMs / 1000).toFixed(1)} seconds`,
        {
          color: '#60486d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '21px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);
    const best = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 122, bestText, {
        color: '#8a5f58',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    const rewards = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, rewardLines.join('\n'), {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: 740 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    const sparkles = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 48,
        `Course sparkles: ${this.runState.collectedIds.length} / ${COURSE.collectables.length} • missing some is OK!`,
        {
          color: '#735b80',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);

    this.finishOrderText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 88, '', {
        color: '#735b80',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 740 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const restart = this.add
      .rectangle(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 195, 230, 70, 0xffefb7, 1)
      .setStrokeStyle(4, 0xd49acb, 1)
      .setAlpha(0);
    const restartText = this.add
      .text(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 195, 'Race again', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const exit = this.add
      .rectangle(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 195, 230, 70, 0xf1e2fb, 1)
      .setStrokeStyle(4, 0xb895c8, 1)
      .setAlpha(0);
    const exitText = this.add
      .text(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 195, 'Back to Meadow', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.finishPanel = this.add
      .container(0, 0, [
        shadow,
        panel,
        ribbon,
        title,
        time,
        best,
        rewards,
        sparkles,
        this.finishOrderText,
        restart,
        restartText,
        exit,
        exitText,
      ])
      .setScrollFactor(0)
      .setDepth(150)
      .setAlpha(0)
      .setScale(0.86);

    this.updateHud();
    this.tweens.add({
      targets: this.finishPanel,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 260,
      ease: 'Back.Out',
    });
    this.time.delayedCall(170, () => {
      this.tweens.add({ targets: [time, best], alpha: 1, y: '-=6', duration: 180 });
    });
    this.time.delayedCall(300, () => {
      this.tweens.add({ targets: [rewards, sparkles], alpha: 1, y: '-=5', duration: 190 });
    });
    this.time.delayedCall(410, () => {
      if (this.finishOrderText) {
        this.tweens.add({ targets: this.finishOrderText, alpha: 1, duration: 170 });
      }
    });
    this.time.delayedCall(500, () => {
      restart.setInteractive({ useHandCursor: true });
      exit.setInteractive({ useHandCursor: true });
      this.tweens.add({
        targets: [restart, restartText, exit, exitText],
        alpha: 1,
        y: '-=5',
        duration: 190,
      });
    });

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
