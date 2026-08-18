import Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { gameEventBus } from '../events/GameEventBus';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import {
  createRaceAssistanceControl,
  type RaceAssistanceControl,
} from '../racing/RaceAssistanceControl';
import {
  createRaceCompetitionState,
  formatRacePlace,
  getRaceStandings,
  stepRaceCompetition,
  type NpcRacerDefinition,
  type RaceCompetitionState,
  type RaceStanding,
} from '../racing/RaceCompetition';
import {
  NOVA_TUTORIAL_RAINBOW_RUN_COURSE,
  type RaceBoostZoneDefinition,
  type RaceObstacleDefinition,
} from '../racing/RaceCourse';
import { EARLY_RACE_DIFFICULTY, resolveRacePlayerTuning } from '../racing/RaceDifficulty';
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
import { recordNovaFirstRaceResult } from '../story/NovaFirstRaceStory';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';

const COURSE = NOVA_TUTORIAL_RAINBOW_RUN_COURSE;
const PLAYER_TEXTURE_KEY = 'player-unicorn-nova-first-run';
const COURSE_START_X = 220;
const COURSE_GROUND_Y = 570;
const COURSE_WORLD_WIDTH = COURSE.length + 560;
const FINISH_X = COURSE_START_X + COURSE.length;

const TUTORIAL_RACERS = [
  {
    id: 'racer:nova',
    name: 'Nova',
    tint: 0xf09ad1,
    laneOffset: 34,
    baseSpeedMultiplier: 0.96,
    paceVariance: 0.018,
    variancePeriodSeconds: 2.8,
    variancePhase: 0.4,
    jumpLeadProgress: 120,
    mistakeObstacleIds: [],
  },
] as const satisfies readonly NpcRacerDefinition[];

export class NovaTutorialRaceScene extends Phaser.Scene {
  private readonly audio = getVerticalSliceAudio();
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private assistanceControl: RaceAssistanceControl | null = null;
  private player: Phaser.GameObjects.Sprite | null = null;
  private playerShadow: Phaser.GameObjects.Ellipse | null = null;
  private nova: Phaser.GameObjects.Sprite | null = null;
  private novaLabel: Phaser.GameObjects.Text | null = null;
  private runState: RaceRunState = createRaceRunState();
  private competitionState: RaceCompetitionState = createRaceCompetitionState(TUTORIAL_RACERS);
  private elapsedMs = 0;
  private finishTimeMs = 0;
  private playerFinishPlace = 0;
  private rewardSummary: RaceRewardSummary | null = null;
  private raceStarted = false;
  private countdownElapsedMs = 0;
  private countdownCueIndex = -1;
  private countdownContainer: Phaser.GameObjects.Container | null = null;
  private countdownText: Phaser.GameObjects.Text | null = null;
  private speedBurstRemainingMs = 0;
  private speedStreaks: RaceSpeedStreak[] = [];
  private progressFill: Phaser.GameObjects.Rectangle | null = null;
  private positionText: Phaser.GameObjects.Text | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private statusTimer: Phaser.Time.TimerEvent | null = null;
  private finishPanel: Phaser.GameObjects.Container | null = null;
  private readonly collectableSprites = new Map<string, Phaser.GameObjects.Container>();

  public constructor() {
    super('NovaTutorialRaceScene');
  }

  public create(): void {
    this.runState = createRaceRunState();
    this.competitionState = createRaceCompetitionState(TUTORIAL_RACERS);
    this.elapsedMs = 0;
    this.finishTimeMs = 0;
    this.playerFinishPlace = 0;
    this.rewardSummary = null;
    this.raceStarted = false;
    this.countdownElapsedMs = 0;
    this.countdownCueIndex = -1;
    this.speedBurstRemainingMs = 0;
    this.speedStreaks = [];
    this.collectableSprites.clear();

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
    this.nova = this.add
      .sprite(
        COURSE_START_X - 20,
        COURSE_GROUND_Y + TUTORIAL_RACERS[0].laneOffset,
        PLAYER_TEXTURE_KEY,
      )
      .setDisplaySize(116, 94)
      .setOrigin(0.5, 0.82)
      .setTint(TUTORIAL_RACERS[0].tint)
      .setAlpha(0.94)
      .setDepth(27);
    this.novaLabel = this.add
      .text(this.nova.x, this.nova.y - 78, 'Nova', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e8dd',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(35);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);

    this.cameras.main.setBackgroundColor('#9bdff2');
    this.cameras.main.setBounds(0, 0, COURSE_WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -GAME_WIDTH * 0.24, 0);
    this.cameras.main.setDeadzone(350, GAME_HEIGHT);

    this.speedStreaks = createRaceSpeedStreaks(this, 14);
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
      this.nova = null;
      this.novaLabel = null;
      this.progressFill = null;
      this.positionText = null;
      this.statusText = null;
      this.finishPanel = null;
      this.countdownContainer = null;
      this.countdownText = null;
      this.speedStreaks = [];
      this.collectableSprites.clear();
    });
  }

  public update(time: number, delta: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (this.inputController.justPressed('BACK')) {
      this.exitToMeadow();
      return;
    }

    if (!this.raceStarted && !this.updateCountdown(delta)) {
      this.updatePlayerPresentation(time);
      this.updateNovaPresentation(time);
      updateRaceSpeedStreaks(this.speedStreaks, delta, false);
      return;
    }

    const wasFinished = this.runState.movement.finished;
    const tuning = resolveRacePlayerTuning(
      EARLY_RACE_DIFFICULTY,
      this.assistanceControl?.getMode() ?? 'standard',
    );
    const result = stepRaceRun(
      this.runState,
      COURSE,
      delta / 1000,
      this.inputController.justPressed('RACE_JUMP'),
      tuning.forwardSpeedMultiplier,
      tuning,
    );
    this.runState = result.state;
    this.competitionState = stepRaceCompetition(
      this.competitionState,
      TUTORIAL_RACERS,
      COURSE,
      delta / 1000,
    );

    if (!wasFinished) {
      this.elapsedMs += Math.max(0, Math.min(delta, 50));
    }
    this.speedBurstRemainingMs = Math.max(0, this.speedBurstRemainingMs - delta);

    this.player.setPosition(
      COURSE_START_X + this.runState.movement.progress,
      COURSE_GROUND_Y + this.runState.movement.jumpOffset,
    );
    this.updatePlayerPresentation(time);
    this.updateNovaPresentation(time);
    this.handleRaceEvents(result.events);
    updateRaceSpeedStreaks(
      this.speedStreaks,
      delta,
      !this.runState.movement.finished,
      this.speedBurstRemainingMs > 0 ? 1.45 : this.runState.stumbleRemaining > 0 ? 0.65 : 0.9,
    );

    const justFinished = !wasFinished && this.runState.movement.finished;
    if (justFinished) {
      this.finishTimeMs = this.elapsedMs;
      this.playerFinishPlace =
        this.getCurrentStandings().find((standing) => standing.isPlayer)?.place ?? 1;
      this.rewardSummary = this.saveRaceResult();
      updateRaceSpeedStreaks(this.speedStreaks, delta, false);
      playRaceFinishBurst(this);
      this.audio.playSfx('race-finish');
      this.cameras.main.flash(280, 255, 245, 173, false);
      this.cameras.main.shake(150, 0.0035);
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
          scaleX: countdown.readyToRace ? 1.22 : 1,
          scaleY: countdown.readyToRace ? 1.22 : 1,
          duration: 190,
          ease: 'Back.Out',
        });
      }

      if (countdown.readyToRace) {
        this.raceStarted = true;
        this.audio.playSfx('race-go');
        this.cameras.main.flash(110, 255, 248, 198, false);
        this.showRaceStatus('Stay with Nova, jump when you want, and reach the finish!');
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
      .rectangle(0, 0, 300, 196, 0x5f4772, 0.9)
      .setStrokeStyle(5, 0xffefb7, 0.95);
    const ready = this.add
      .text(0, -57, "NOVA'S FIRST RUN", {
        color: '#fff5cf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.countdownText = this.add
      .text(0, 18, '3', {
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
      .text(0, 75, 'No pressure, just reach the finish', {
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
      TUTORIAL_RACERS,
    );
  }

  private saveRaceResult(): RaceRewardSummary {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const result = applyRaceResultToSave(save, {
      raceId: COURSE.id,
      finishTimeMs: this.finishTimeMs,
      place: this.playerFinishPlace,
      participantCount: TUTORIAL_RACERS.length + 1,
    });
    saveService.save(recordNovaFirstRaceResult(result.save, this.playerFinishPlace));

    getBrowserQuestEngine();
    gameEventBus.emit('RACE_FINISHED', {
      raceId: COURSE.id,
      finishTimeMs: this.finishTimeMs,
    });

    return result.summary;
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
      this.player.setAngle(stride * 2.8 - (this.speedBurstRemainingMs > 0 ? 3 : 0.7));
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

  private updateNovaPresentation(time: number): void {
    if (!this.nova || !this.novaLabel) {
      return;
    }

    const racer = this.competitionState.npcRacers[0];
    if (!racer) {
      return;
    }

    const x = COURSE_START_X + racer.run.movement.progress;
    const y = COURSE_GROUND_Y + TUTORIAL_RACERS[0].laneOffset + racer.run.movement.jumpOffset;
    this.nova.setPosition(x, y);
    this.novaLabel.setPosition(x, y - 78);

    if (racer.run.stumbleRemaining > 0) {
      this.nova.setAngle(Math.sin(time * 0.085) * 9);
      this.nova.setDisplaySize(112, 90);
    } else if (racer.run.movement.grounded) {
      const stride = Math.sin(time * 0.026 + 0.8);
      this.nova.setAngle(stride * 2.4 - 0.6);
      this.nova.setDisplaySize(118 + Math.abs(stride) * 3, 92 - stride * 2.5);
    } else {
      this.nova.setAngle(Phaser.Math.Clamp(racer.run.movement.verticalVelocity * 0.016, -10, 9));
      this.nova.setDisplaySize(118, 92);
    }
  }

  private handleRaceEvents(events: readonly RaceRunEvent[]): void {
    for (const event of events) {
      if (event.type === 'obstacle-hit') {
        this.cameras.main.shake(110, 0.006);
        this.audio.playSfx('ui');
        this.showRaceStatus('Small bump. You are still racing, keep going!');
      } else if (event.type === 'boost-entered') {
        this.speedBurstRemainingMs = 720;
        this.audio.playSfx('collect');
        this.cameras.main.flash(150, 255, 239, 160, false);
        this.showRaceStatus(`${event.boost.label}! Faster! ✨`);
      } else if (event.type === 'collectable-collected') {
        this.collectableSprites.get(event.collectable.id)?.destroy(true);
        this.collectableSprites.delete(event.collectable.id);
        this.audio.playSfx('collect');
        this.showRaceStatus('Race sparkle! Nice find. ✦');
      }
    }
  }

  private createCourse(): void {
    createLayeredRaceBackdrop(this, COURSE_WORLD_WIDTH, COURSE_GROUND_Y);

    this.add
      .rectangle(
        COURSE_WORLD_WIDTH / 2,
        COURSE_GROUND_Y + 68,
        COURSE_WORLD_WIDTH,
        190,
        0x68af68,
        1,
      )
      .setDepth(3);
    this.add
      .rectangle(
        COURSE_WORLD_WIDTH / 2,
        COURSE_GROUND_Y + 18,
        COURSE_WORLD_WIDTH,
        74,
        0xd8bd82,
        1,
      )
      .setDepth(4);
    this.add
      .rectangle(
        COURSE_WORLD_WIDTH / 2,
        COURSE_GROUND_Y + 3,
        COURSE_WORLD_WIDTH,
        9,
        0xffefb5,
        0.94,
      )
      .setDepth(5);

    for (let x = 390, index = 0; x < FINISH_X - 100; x += 220, index += 1) {
      this.add
        .ellipse(
          x,
          COURSE_GROUND_Y + 28 + (index % 2) * 11,
          70,
          8,
          index % 2 === 0 ? 0xf1d69b : 0xc9ab73,
          0.55,
        )
        .setDepth(5);
    }

    this.createStartArch();
    this.createFinishArch();
    for (const boost of COURSE.boostZones) {
      this.createBoostZone(boost);
    }
    for (const obstacle of COURSE.obstacles) {
      this.createObstacle(obstacle);
    }
    for (const collectable of COURSE.collectables) {
      const x = COURSE_START_X + collectable.progress;
      const y = COURSE_GROUND_Y - collectable.heightAboveGround;
      const glow = this.add.circle(0, 0, 30, 0xfff0a1, 0.25);
      const ring = this.add
        .circle(0, 0, 19, 0xfff4bd, 0.92)
        .setStrokeStyle(3, 0xd69bd2, 0.95);
      const star = this.add
        .text(0, 0, '✦', {
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
        y: y - 8,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 680,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private createStartArch(): void {
    const x = COURSE_START_X - 55;
    this.add.ellipse(x, COURSE_GROUND_Y + 25, 190, 24, 0x4b5a46, 0.18).setDepth(8);
    this.add.rectangle(x - 61, 470, 27, 184, 0x5d4055, 1).setDepth(9);
    this.add.rectangle(x + 61, 470, 27, 184, 0x5d4055, 1).setDepth(9);
    this.add.rectangle(x - 58, 468, 17, 178, 0x68475f, 1).setDepth(10);
    this.add.rectangle(x + 58, 468, 17, 178, 0x68475f, 1).setDepth(10);
    this.add
      .rectangle(x, 385, 150, 34, 0xf7e4ad, 1)
      .setStrokeStyle(5, 0xa77da9, 1)
      .setDepth(10);
    this.add
      .text(x, 385, 'FIRST RUN', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);
  }

  private createFinishArch(): void {
    this.add.ellipse(FINISH_X, COURSE_GROUND_Y + 25, 210, 26, 0x4b5a46, 0.18).setDepth(8);
    this.add.rectangle(FINISH_X - 67, 460, 30, 210, 0x5d4055, 1).setDepth(9);
    this.add.rectangle(FINISH_X + 67, 460, 30, 210, 0x5d4055, 1).setDepth(9);
    this.add.rectangle(FINISH_X - 64, 458, 20, 202, 0x68475f, 1).setDepth(10);
    this.add.rectangle(FINISH_X + 64, 458, 20, 202, 0x68475f, 1).setDepth(10);
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
  }

  private createBoostZone(boost: RaceBoostZoneDefinition): void {
    const startX = COURSE_START_X + boost.startProgress;
    const endX = COURSE_START_X + boost.endProgress;
    const width = endX - startX;
    const centreX = startX + width / 2;
    this.add
      .rectangle(centreX, COURSE_GROUND_Y + 18, width + 10, 68, 0xf5b6dd, 0.32)
      .setDepth(5);
    this.add
      .rectangle(centreX, COURSE_GROUND_Y + 18, width, 62, 0xffe684, 0.76)
      .setStrokeStyle(4, 0xc777b7, 0.82)
      .setDepth(6);
    for (let x = startX + 38; x < endX - 18; x += 68) {
      this.add
        .text(x, COURSE_GROUND_Y + 18, '➜', {
          color: '#a9539e',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '28px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(7);
    }
    this.add
      .text(centreX, COURSE_GROUND_Y - 74, 'BOOST ✨', {
        color: '#5b4268',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff3bdf2',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  private createObstacle(obstacle: RaceObstacleDefinition): void {
    const x = COURSE_START_X + obstacle.progress;
    this.add.ellipse(x, COURSE_GROUND_Y + 7, obstacle.width + 42, 22, 0x554b42, 0.25).setDepth(14);
    this.add.rectangle(x - 45, COURSE_GROUND_Y - 38, 18, 82, 0x4c6844, 1).setDepth(15);
    this.add.rectangle(x + 45, COURSE_GROUND_Y - 38, 18, 82, 0x4c6844, 1).setDepth(15);
    this.add.rectangle(x - 44, COURSE_GROUND_Y - 38, 11, 78, 0x75a367, 1).setDepth(16);
    this.add.rectangle(x + 44, COURSE_GROUND_Y - 38, 11, 78, 0x75a367, 1).setDepth(16);
    this.add
      .rectangle(x, COURSE_GROUND_Y - 66, obstacle.width + 8, 26, 0x8a5580, 1)
      .setDepth(16);
    this.add
      .rectangle(x, COURSE_GROUND_Y - 66, obstacle.width, 18, 0xe7a5c8, 1)
      .setStrokeStyle(4, 0xb977a6, 1)
      .setDepth(17);
    this.add
      .text(x, COURSE_GROUND_Y - 124, '↑ JUMP', {
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#5f4772f2',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(18);
  }

  private createHud(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, 50, 900, 84, 0xfff8e8, 0.95)
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
      .text(GAME_WIDTH / 2 - 330, 64, '1st / 2', {
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
      .rectangle(GAME_WIDTH / 2 - 190, 64, 430, 14, 0xdccce6, 0.95)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.progressFill = this.add
      .rectangle(GAME_WIDTH / 2 - 190, 64, 1, 10, 0xc77cc8, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 108, '', {
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

  private updateHud(): void {
    const ratio = Phaser.Math.Clamp(this.runState.movement.progress / COURSE.length, 0, 1);
    this.progressFill?.setDisplaySize(Math.max(1, 430 * ratio), 10);
    const playerStanding = this.getCurrentStandings().find((standing) => standing.isPlayer);
    if (playerStanding) {
      this.positionText?.setText(`${formatRacePlace(playerStanding.place)} / 2`);
    }
  }

  private createJumpButton(): void {
    const x = GAME_WIDTH - 128;
    const y = GAME_HEIGHT - 102;
    this.add.circle(x + 5, y + 7, 73, 0x4c3e59, 0.2).setScrollFactor(0).setDepth(109);
    const button = this.add
      .circle(x, y, 70, 0xfff2c6, 0.97)
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
    button.on('pointerdown', () => this.exitToMeadow());
  }

  private showRaceStatus(message: string): void {
    this.statusTimer?.destroy();
    this.statusText?.setText(message).setVisible(true);
    this.statusTimer = this.time.delayedCall(1900, () => {
      this.statusText?.setVisible(false);
      this.statusTimer = null;
    });
  }

  private showFinishPanel(): void {
    if (this.finishPanel) {
      return;
    }

    const place = this.playerFinishPlace || 1;
    const won = place === 1;
    const reward = this.rewardSummary;
    const ribbonText = reward?.newRibbonIds.includes(RAINBOW_RUN_FINISHER_RIBBON_ID)
      ? '🎀 Your first Rainbow Run Finisher Ribbon is yours!'
      : '🎀 Your Rainbow Run Finisher Ribbon is already safely yours.';
    const resultText = won
      ? 'You crossed the line first. Nova definitely noticed.'
      : 'You finished the course. Nova is waiting to hear how it felt.';

    const shadow = this.add.rectangle(
      GAME_WIDTH / 2 + 10,
      GAME_HEIGHT / 2 + 12,
      808,
      488,
      0x493958,
      0.38,
    );
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 790, 470, 0xfff8e8, 0.985)
      .setStrokeStyle(6, 0xb689b8, 1);
    const title = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 165,
        `First run complete • ${formatRacePlace(place)}!`,
        {
          color: '#60486d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '35px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);
    const result = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 88, resultText, {
        color: '#6f587a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        align: 'center',
        wordWrap: { width: 680 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    const ribbon = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, ribbonText, {
        color: '#9a654f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    const rewardText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 28,
        `✨ +${reward?.participationSparkles ?? 0} Rainbow Sparkles for finishing${reward?.podiumBonusSparkles ? ` • +${reward.podiumBonusSparkles} podium bonus` : ''}`,
        {
          color: '#735b80',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);
    const continueButton = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 142, 300, 76, 0xffefb7, 1)
      .setStrokeStyle(4, 0xd49acb, 1)
      .setAlpha(0);
    const continueText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 142, 'Back to Nova', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.finishPanel = this.add
      .container(0, 0, [shadow, panel, title, result, ribbon, rewardText, continueButton, continueText])
      .setScrollFactor(0)
      .setDepth(150)
      .setAlpha(0)
      .setScale(0.86);

    this.tweens.add({
      targets: this.finishPanel,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 260,
      ease: 'Back.Out',
    });
    this.time.delayedCall(190, () => {
      this.tweens.add({ targets: [result, ribbon, rewardText], alpha: 1, y: '-=5', duration: 210 });
    });
    this.time.delayedCall(430, () => {
      continueButton.setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: [continueButton, continueText], alpha: 1, y: '-=5', duration: 190 });
    });

    continueButton.on('pointerdown', () => {
      this.scene.start('NovaStoryScene', { returnScene: 'RainbowMeadowScene' });
    });
  }

  private exitToMeadow(): void {
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
