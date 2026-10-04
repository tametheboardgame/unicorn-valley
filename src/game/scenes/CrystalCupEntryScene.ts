import Phaser from 'phaser';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import { isInteractionModalActive } from '../interaction/InteractionModalState';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { launchRainbowRunRace } from '../racing/RaceMiniGameAdapter';
import { getCrystalCascadeUnlockState } from '../racing/RaceProgression';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import {
  CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD,
  CRYSTAL_BROOK_LOCATION_ID,
  setCrystalBrookPlayerSpawn,
} from '../world/CrystalBrookMap';
import {
  CRYSTAL_CUP_HUB_LAYOUT,
  CRYSTAL_CUP_HUB_LOCATION_ID,
  CRYSTAL_CUP_HUB_MAP,
  resetCrystalCupHubPlayerSpawn,
} from '../world/CrystalCupHubMap';
import { worldDepthForY } from '../world/WorldDepth';

const PLAYER_TEXTURE_KEY = 'player-unicorn-crystal-cup-hub';

export class CrystalCupEntryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;

  public constructor() {
    super('CrystalCupEntryScene');
  }

  public create(): void {
    this.createEnvironment();

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, CRYSTAL_CUP_HUB_LOCATION_ID);
    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, PLAYER_TEXTURE_KEY, appearance);

    this.physics.world.setBounds(
      CRYSTAL_CUP_HUB_MAP.margin,
      CRYSTAL_CUP_HUB_MAP.margin,
      CRYSTAL_CUP_HUB_MAP.width - CRYSTAL_CUP_HUB_MAP.margin * 2,
      CRYSTAL_CUP_HUB_MAP.height - CRYSTAL_CUP_HUB_MAP.margin * 2,
    );

    const spawn = { ...CRYSTAL_CUP_HUB_MAP.playerSpawn };
    resetCrystalCupHubPlayerSpawn();
    this.player = new PlayerEntity(this, spawn.x, spawn.y, PLAYER_TEXTURE_KEY);
    this.player.sprite.setDisplaySize(112, 92);
    this.player.sprite.setDepth(worldDepthForY(this.player.sprite.y, 0.5));

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    if (
      shouldShowTouchMovementPad(
        globalThis.navigator?.maxTouchPoints ?? 0,
        'ontouchstart' in globalThis,
      )
    ) {
      this.touchMovementPad = new TouchMovementPad(this, this.pointerInput);
    }

    getSceneInteractionRegistry(this).replaceOwnerTargets(
      'crystal-cup-hub',
      this.createInteractions(),
    );

    this.cameras.main.setBackgroundColor('#9edfe6');
    this.cameras.main.setBounds(0, 0, CRYSTAL_CUP_HUB_MAP.width, CRYSTAL_CUP_HUB_MAP.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.11, 0.11);
    this.cameras.main.setDeadzone(260, 150);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.feedbackTimer?.destroy();
      this.feedbackTimer = null;
      this.touchMovementPad?.destroy();
      this.touchMovementPad = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.player = null;
      getSceneInteractionRegistry(this).clearOwner('crystal-cup-hub');
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (isInteractionModalActive(this)) {
      this.player.applyMovement(
        resolvePlayerMovement(0, 0, DEFAULT_PLAYER_SPEED, this.player.getFacing()),
      );
      this.player.updatePresentation(time);
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
    this.player.sprite.setDepth(worldDepthForY(this.player.sprite.y, 0.5));

    const exit = CRYSTAL_CUP_HUB_LAYOUT.brookExit.position;
    if (
      Math.abs(this.player.sprite.x - exit.x) <= 110 &&
      this.player.sprite.y >= exit.y - 40
    ) {
      this.exitToBrook();
      return;
    }

    if (this.inputController.justPressed('BACK')) {
      this.exitToBrook();
    }
  }

  private createInteractions(): readonly InteractionTarget[] {
    return [
      {
        id: 'interaction:crystal-cup-hub-exit',
        label: 'Crystal Brook',
        actionLabel: 'Return to Brook',
        actionKind: 'enter',
        position: CRYSTAL_CUP_HUB_LAYOUT.brookExit.approach,
        interactionRadius: 165,
        priority: 25,
        result: { type: 'callback', activate: () => this.exitToBrook() },
      },
      {
        id: 'interaction:crystal-cup-hub-start',
        label: 'Crystal Cascade',
        actionLabel: 'Start race',
        actionKind: 'start',
        position: CRYSTAL_CUP_HUB_LAYOUT.raceGate.approach,
        interactionRadius: 180,
        priority: 30,
        enabled: () => this.getRaceUnlock().unlocked,
        result: { type: 'callback', activate: () => this.startRace() },
      },
    ] satisfies readonly InteractionTarget[];
  }

  private getRaceUnlock(): { unlocked: boolean; clue: string } {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    return getCrystalCascadeUnlockState(save);
  }

  private startRace(): void {
    const unlock = this.getRaceUnlock();
    if (!unlock.unlocked) {
      this.showFeedback(`🔒 ${unlock.clue}`);
      return;
    }

    void launchRainbowRunRace(this, {
      courseId: CRYSTAL_CASCADE_RACE_ID,
      returnScene: 'CrystalCupEntryScene',
      worldContext: {
        locationId: 'crystal-cup-hub',
        interactionId: 'interaction:crystal-cup-hub-start',
      },
    });
  }

  private exitToBrook(): void {
    setCrystalBrookPlayerSpawn(CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD.approach);
    saveLocationCheckpoint(getBrowserSaveService(), CRYSTAL_BROOK_LOCATION_ID);
    this.scene.start('CrystalBrookScene');
  }

  private createEnvironment(): void {
    this.add
      .rectangle(
        CRYSTAL_CUP_HUB_MAP.width / 2,
        CRYSTAL_CUP_HUB_MAP.height / 2,
        CRYSTAL_CUP_HUB_MAP.width,
        CRYSTAL_CUP_HUB_MAP.height,
        0x9edfe6,
        1,
      )
      .setName('crystal-cup-hub:ground')
      .setDepth(0);

    this.add
      .ellipse(900, 540, 1460, 760, 0xcdf3f2, 0.44)
      .setName('crystal-cup-hub:ice-field')
      .setDepth(1);

    const path = this.add.graphics().setName('crystal-cup-hub:path').setDepth(2);
    const [first, ...rest] = CRYSTAL_CUP_HUB_LAYOUT.pathPoints;
    const drawLayer = (width: number, colour: number, alpha: number): void => {
      path.lineStyle(width, colour, alpha);
      path.beginPath();
      path.moveTo(first.x, first.y);
      for (const point of rest) {
        path.lineTo(point.x, point.y);
      }
      path.strokePath();
    };
    drawLayer(138, 0x84cfd8, 0.78);
    drawLayer(98, 0xe4fbff, 0.92);

    this.createBrookExit();
    this.createRaceGate();

    for (const [x, y, scale, colour] of [
      [510, 320, 1.25, 0xa8edf1],
      [1310, 360, 1.1, 0xc8bff0],
      [430, 760, 0.88, 0xb9edf0],
      [1370, 780, 0.96, 0xa8dfe9],
    ] as const) {
      this.add
        .triangle(x, y, 0, 72 * scale, 28 * scale, 0, 56 * scale, 72 * scale, colour, 0.88)
        .setStrokeStyle(4, 0xf2ffff, 0.76)
        .setDepth(worldDepthForY(y, 0.32));
    }

    this.add
      .text(900, 38, 'The Crystal Cup Raceway', {
        color: '#365965',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        backgroundColor: '#f1ffffe8',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);

    this.feedbackText = this.add
      .text(900, 118, '', {
        color: '#45636c',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 720 },
        backgroundColor: '#f3ffffec',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(120)
      .setVisible(false);
  }

  private createBrookExit(): void {
    const { x, y } = CRYSTAL_CUP_HUB_LAYOUT.brookExit.position;
    this.add
      .text(x, y - 72, '↓  CRYSTAL BROOK', {
        color: '#3f6168',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        backgroundColor: '#eaffffdd',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createRaceGate(): void {
    const { x, y } = CRYSTAL_CUP_HUB_LAYOUT.raceGate.position;
    this.add
      .rectangle(x - 105, y + 66, 24, 190, 0x6ca9b3, 0.96)
      .setStrokeStyle(4, 0xe8ffff, 0.78)
      .setDepth(8);
    this.add
      .rectangle(x + 105, y + 66, 24, 190, 0x6ca9b3, 0.96)
      .setStrokeStyle(4, 0xe8ffff, 0.78)
      .setDepth(8);
    this.add
      .rectangle(x, y - 24, 250, 56, 0xe8fbff, 0.96)
      .setStrokeStyle(5, 0x839cc3, 0.92)
      .setDepth(9);
    this.add
      .text(x, y - 24, 'CRYSTAL CASCADE', {
        color: '#365965',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedbackText?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(3000, () => {
      this.feedbackText?.setVisible(false);
      this.feedbackTimer = null;
    });
  }
}
