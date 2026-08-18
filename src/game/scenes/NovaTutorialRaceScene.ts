import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { gameEventBus } from '../events/GameEventBus';
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
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
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
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private assistanceControl: RaceAssistanceControl | null = null;
  private player: Phaser.GameObjects.Sprite | null = null;
  private nova: Phaser.GameObjects.Sprite | null = null;
  private novaLabel: Phaser.GameObjects.Text | null = null;
  private runState: RaceRunState = createRaceRunState();
  private competitionState: RaceCompetitionState = createRaceCompetitionState(TUTORIAL_RACERS);
  private elapsedMs = 0;
  private finishTimeMs = 0;
  private playerFinishPlace = 0;
  private rewardSummary: RaceRewardSummary | null = null;
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

    this.createHud();
    this.createJumpButton();
    this.createExitButton();
    this.assistanceControl = createRaceAssistanceControl(
      this,
      GAME_WIDTH - 150,
      165,
      (_mode, description) => this.showRaceStatus(description),
    );
    this.showRaceStatus('First run: keep moving, jump when you want, and reach the finish.');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.statusTimer?.destroy();
      this.statusTimer = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.assistanceControl = null;
      this.player = null;
      this.nova = null;
      this.novaLabel = null;
      this.progressFill = null;
      this.positionText = null;
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
      this.exitToMeadow();
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

    this.player.setPosition(
      COURSE_START_X + this.runState.movement.progress,
      COURSE_GROUND_Y + this.runState.movement.jumpOffset,
    );
    this.updatePlayerPresentation(time);
    this.updateNovaPresentation(time);
    this.handleRaceEvents(result.events);

    const justFinished = !wasFinished && this.runState.movement.finished;
    if (justFinished) {
      this.finishTimeMs = this.elapsedMs;
      this.playerFinishPlace =
        this.getCurrentStandings().find((standing) => standing.isPlayer)?.place ?? 1;
      this.rewardSummary = this.saveRaceResult();
      this.showFinishPanel();
      this.cameras.main.flash(260, 255, 245, 173, false);
    }

    this.updateHud();
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

    if (this.runState.stumbleRemaining > 0) {
      this.player.setAngle(Math.sin(time * 0.09) * 10);
      return;
    }

    if (this.runState.movement.grounded) {
      this.player.setAngle(Math.sin(time * 0.02) * 2.2);
    } else {
      this.player.setAngle(
        Phaser.Math.Clamp(this.runState.movement.verticalVelocity * 0.018, -11, 10),
      );
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
    } else if (racer.run.movement.grounded) {
      this.nova.setAngle(Math.sin(time * 0.018) * 1.8);
    } else {
      this.nova.setAngle(Phaser.Math.Clamp(racer.run.movement.verticalVelocity * 0.016, -10, 9));
    }
  }

  private handleRaceEvents(events: readonly RaceRunEvent[]): void {
    for (const event of events) {
      if (event.type === 'obstacle-hit') {
        this.cameras.main.shake(110, 0.006);
        this.showRaceStatus('Small bump. You are still racing, keep going!');
      } else if (event.type === 'boost-entered') {
        this.cameras.main.flash(150, 255, 239, 160, false);
        this.showRaceStatus(`${event.boost.label}! Faster! ✨`);
      } else if (event.type === 'collectable-collected') {
        this.collectableSprites.get(event.collectable.id)?.destroy(true);
        this.collectableSprites.delete(event.collectable.id);
        this.showRaceStatus('Race sparkle! Nice find. ✦');
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

    for (let x = 100; x < COURSE_WORLD_WIDTH; x += 430) {
      this.add.ellipse(x, 548, 620, 260, 0x8fd48d, 1).setDepth(1);
      this.add.ellipse(x + 135, 574, 520, 205, 0xa8df93, 0.96).setDepth(2);
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
    for (const boost of COURSE.boostZones) {
      this.createBoostZone(boost);
    }
    for (const obstacle of COURSE.obstacles) {
      this.createObstacle(obstacle);
    }
    for (const collectable of COURSE.collectables) {
      const x = COURSE_START_X + collectable.progress;
      const y = COURSE_GROUND_Y - collectable.heightAboveGround;
      const glow = this.add.circle(0, 0, 28, 0xfff0a1, 0.24);
      const star = this.add
        .text(0, 0, '✦', {
          color: '#b96cb8',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '28px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      const container = this.add.container(x, y, [glow, star]).setDepth(22);
      this.collectableSprites.set(collectable.id, container);
      this.tweens.add({
        targets: container,
        y: y - 8,
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private createStartArch(): void {
    const x = COURSE_START_X - 55;
    this.add.rectangle(x - 58, 470, 20, 180, 0x735164, 1).setDepth(10);
    this.add.rectangle(x + 58, 470, 20, 180, 0x735164, 1).setDepth(10);
    this.add.rectangle(x, 385, 138, 28, 0xf7e4ad, 1).setStrokeStyle(4, 0xa77da9, 1).setDepth(10);
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
    this.add.rectangle(FINISH_X - 64, 460, 24, 205, 0x735164, 1).setDepth(10);
    this.add.rectangle(FINISH_X + 64, 460, 24, 205, 0x735164, 1).setDepth(10);
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
    this.add.rectangle(x - 42, COURSE_GROUND_Y - 38, 12, 78, 0x6c945e, 1).setDepth(16);
    this.add.rectangle(x + 42, COURSE_GROUND_Y - 38, 12, 78, 0x6c945e, 1).setDepth(16);
    this.add
      .rectangle(x, COURSE_GROUND_Y - 66, obstacle.width, 18, 0xe7a5c8, 1)
      .setStrokeStyle(3, 0xb977a6, 1)
      .setDepth(17);
    this.add
      .text(x, COURSE_GROUND_Y - 122, 'JUMP!', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e8e8',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(18);
  }

  private createHud(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, 52, 900, 88, 0xfff8e8, 0.95)
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

    this.positionText = this.add
      .text(GAME_WIDTH / 2 - 330, 67, '1st / 2', {
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
      .rectangle(GAME_WIDTH / 2 - 190, 67, 430, 14, 0xdccce6, 0.95)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.progressFill = this.add
      .rectangle(GAME_WIDTH / 2 - 190, 67, 1, 10, 0xc77cc8, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 112, '', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e8ee',
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

    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 790, 470, 0x5f4772, 0.97);
    const title = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 165,
        `First run complete • ${formatRacePlace(place)}!`,
        {
          color: '#fff5cf',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '35px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);
    const result = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 88, resultText, {
        color: '#fff8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        align: 'center',
        wordWrap: { width: 680 },
      })
      .setOrigin(0.5);
    const ribbon = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, ribbonText, {
        color: '#ffe9ad',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    const rewardText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 28,
        `✨ +${reward?.participationSparkles ?? 0} Rainbow Sparkles for finishing${reward?.podiumBonusSparkles ? ` • +${reward.podiumBonusSparkles} podium bonus` : ''}`,
        {
          color: '#f4eaff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);
    const continueButton = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 142, 300, 76, 0xffefb7, 1)
      .setStrokeStyle(4, 0xd49acb, 1)
      .setInteractive({ useHandCursor: true });
    const continueText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 142, 'Back to Nova', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.finishPanel = this.add
      .container(0, 0, [shade, title, result, ribbon, rewardText, continueButton, continueText])
      .setScrollFactor(0)
      .setDepth(150);

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
