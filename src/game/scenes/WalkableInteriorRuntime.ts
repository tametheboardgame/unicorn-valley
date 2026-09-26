import Phaser from 'phaser';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import {
  isInteractionActivationSuppressed,
  isInteractionModalActive,
} from '../interaction/InteractionModalState';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import type { TraversalMapDefinition } from '../world/MapTraversal';
import { worldDepthForY } from '../world/WorldDepth';

export interface WalkableInteriorRuntimeOptions {
  playerTextureKey: string;
  map: TraversalMapDefinition;
  colliderNamePrefix: string;
  onBack: () => void;
  playerDisplaySize?: { width: number; height: number };
  cameraDeadzone?: { width: number; height: number };
}

export class WalkableInteriorRuntime {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: WalkableInteriorRuntimeOptions,
  ) {}

  public create(): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    createUnicornAppearanceTexture(
      this.scene,
      this.options.playerTextureKey,
      parseUnicornAppearance(save.profile.appearance),
    );

    const map = this.options.map;
    this.scene.physics.world.setBounds(
      map.margin,
      map.margin,
      map.width - map.margin * 2,
      map.height - map.margin * 2,
    );
    this.collisionGroup = this.createCollisionMap(map);
    this.player = new PlayerEntity(
      this.scene,
      map.playerSpawn.x,
      map.playerSpawn.y,
      this.options.playerTextureKey,
    );
    const size = this.options.playerDisplaySize ?? { width: 112, height: 92 };
    this.player.sprite.setDisplaySize(size.width, size.height);
    this.scene.physics.add.collider(this.player.sprite, this.collisionGroup);
    this.updatePlayerDepth();

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([
      new KeyboardInputAdapter(this.scene),
      this.pointerInput,
    ]);
    if (
      shouldShowTouchMovementPad(
        globalThis.navigator?.maxTouchPoints ?? 0,
        'ontouchstart' in globalThis,
      )
    ) {
      this.touchMovementPad = new TouchMovementPad(this.scene, this.pointerInput);
    }

    const camera = this.scene.cameras.main;
    const deadzone = this.options.cameraDeadzone ?? { width: 250, height: 145 };
    camera.setBounds(0, 0, map.width, map.height);
    camera.startFollow(this.player.sprite, true, 0.11, 0.11);
    camera.setDeadzone(deadzone.width, deadzone.height);
  }

  public refreshPlayerAppearance(): void {
    if (!this.player) {
      return;
    }
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    createUnicornAppearanceTexture(
      this.scene,
      this.options.playerTextureKey,
      parseUnicornAppearance(save.profile.appearance),
    );
    this.player.refreshTexture();
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (isInteractionModalActive(this.scene)) {
      this.player.applyMovement(
        resolvePlayerMovement(0, 0, DEFAULT_PLAYER_SPEED, this.player.getFacing()),
      );
      this.player.updatePresentation(time);
      this.updatePlayerDepth();
      return;
    }

    if (this.inputController.justPressed('BACK') && !isInteractionActivationSuppressed()) {
      this.options.onBack();
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
    this.updatePlayerDepth();
  }

  public getPlayerPosition(): { x: number; y: number } | null {
    if (!this.player) {
      return null;
    }
    return { x: this.player.sprite.x, y: this.player.sprite.y };
  }

  public destroy(): void {
    this.touchMovementPad?.destroy();
    this.touchMovementPad = null;
    this.inputController?.destroy();
    this.inputController = null;
    this.pointerInput = null;
    this.player?.destroy();
    this.player = null;
    this.collisionGroup = null;
  }

  private createCollisionMap(map: TraversalMapDefinition): Phaser.Physics.Arcade.StaticGroup {
    const key = 'walkable-interior-collision-pixel';
    if (!this.scene.textures.exists(key)) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(0, 0, 2, 2);
      graphics.generateTexture(key, 2, 2);
      graphics.destroy();
    }

    const group = this.scene.physics.add.staticGroup();
    for (const collider of map.colliders) {
      const blocker = group.create(collider.x, collider.y, key) as Phaser.Physics.Arcade.Image;
      blocker.setDisplaySize(collider.width, collider.height).setVisible(false).refreshBody();
      blocker.setName(`${this.options.colliderNamePrefix}:${collider.id}`);
    }
    return group;
  }

  private updatePlayerDepth(): void {
    if (!this.player) {
      return;
    }
    this.player.sprite.setDepth(worldDepthForY(this.player.sprite.y + 28, 0.42));
  }
}
