import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { selectInteractionTarget } from '../interaction/InteractionTargeting';
import { PlayerEntity } from '../player/PlayerEntity';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { getBrowserSaveService } from '../save/browserSaveService';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import type { CollisionRectangle } from '../world/MapTraversal';

export interface MicroLocationRuntimeOptions {
  playerTextureKey: string;
  worldBounds: { x: number; y: number; width: number; height: number };
  playerSpawn?: { x: number; y: number };
  feedback?: {
    y?: number;
    color?: string;
    backgroundColor?: string;
    depth?: number;
    durationMs?: number;
  };
  colliders?: readonly CollisionRectangle[];
}

export abstract class InteractiveMicroLocationScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private feedback: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private feedbackDurationMs = 4000;

  protected initialiseMicroLocation(options: MicroLocationRuntimeOptions): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    createUnicornAppearanceTexture(
      this,
      options.playerTextureKey,
      parseUnicornAppearance(save.profile.appearance),
    );
    const bounds = options.worldBounds;
    this.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    const spawn = options.playerSpawn ?? { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 150 };
    this.player = new PlayerEntity(this, spawn.x, spawn.y, options.playerTextureKey);
    this.player.sprite.setDisplaySize(104, 86).setCollideWorldBounds(true);
    if (options.colliders?.length) {
      const blockers = this.physics.add.staticGroup();
      const key = 'micro-location-collision-pixel';
      if (!this.textures.exists(key)) {
        const graphics = this.add.graphics().fillStyle(0xffffff).fillRect(0, 0, 2, 2);
        graphics.generateTexture(key, 2, 2).destroy();
      }
      for (const collider of options.colliders) {
        const blocker = blockers.create(collider.x, collider.y, key) as Phaser.Physics.Arcade.Image;
        blocker.setDisplaySize(collider.width, collider.height).setVisible(false).refreshBody();
        blocker.setName(`micro-location-collider:${collider.id}`);
      }
      this.physics.add.collider(this.player.sprite, blockers);
    }

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
    this.interactionPrompt = new InteractionPrompt(this, this.pointerInput);

    const feedback = options.feedback ?? {};
    this.feedbackDurationMs = feedback.durationMs ?? 4000;
    this.feedback = this.add
      .text(GAME_WIDTH / 2, feedback.y ?? 116, '', {
        color: feedback.color ?? '#4d4a68',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: feedback.backgroundColor ?? '#fff9eaf2',
        padding: { x: 16, y: 9 },
      })
      .setOrigin(0.5)
      .setDepth(feedback.depth ?? 80)
      .setVisible(false);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyMicroLocationRuntime());
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }
    this.inputController.update();
    if (this.inputController.justPressed('BACK')) {
      this.leaveMicroLocation();
      return;
    }

    this.player.applyMovement(
      resolvePlayerMovement(
        this.inputController.getAxis('MOVE_X'),
        this.inputController.getAxis('MOVE_Y'),
        DEFAULT_PLAYER_SPEED,
        this.player.getFacing(),
      ),
    );
    this.player.updatePresentation(time);

    const active = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      this.getMicroLocationInteractions(),
    );
    this.interactionPrompt?.setTarget(active);
    if (this.inputController.justPressed('INTERACT') && active) {
      this.activateMicroLocationInteraction(active.id);
    }
  }

  protected showMicroLocationFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedback?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(this.feedbackDurationMs, () => {
      this.feedback?.setVisible(false);
      this.feedbackTimer = null;
    });
  }

  protected abstract getMicroLocationInteractions(): readonly InteractionTarget[];
  protected abstract activateMicroLocationInteraction(id: string): void;
  protected abstract leaveMicroLocation(): void;

  protected onMicroLocationShutdown(): void {}

  private destroyMicroLocationRuntime(): void {
    this.feedbackTimer?.destroy();
    this.feedbackTimer = null;
    this.touchMovementPad?.destroy();
    this.touchMovementPad = null;
    this.inputController?.destroy();
    this.inputController = null;
    this.pointerInput = null;
    this.interactionPrompt?.destroy();
    this.interactionPrompt = null;
    this.player?.destroy();
    this.player = null;
    this.feedback = null;
    this.onMicroLocationShutdown();
  }
}
