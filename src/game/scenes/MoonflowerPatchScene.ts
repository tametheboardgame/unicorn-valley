import Phaser from 'phaser';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import { InventoryService } from '../inventory/InventoryService';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  WILLOW_MOONFLOWER_ITEM_ID,
  WILLOW_MOONFLOWER_REQUIRED_QUANTITY,
  getWillowStoryPhase,
} from '../story/WillowMoonflowersStory';
import {
  MOONFLOWER_GLADE_MAP,
  setMoonflowerGladePlayerSpawn,
} from '../world/MoonflowerGladeMap';

const SAVED_PLAYER_TEXTURE_KEY = 'player-unicorn-moonflower-patch';
const COLLECTION_RADIUS = 82;

interface CollectibleFlower {
  container: Phaser.GameObjects.Container;
  x: number;
  y: number;
}

export class MoonflowerPatchScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private inventory: InventoryService | null = null;
  private readonly flowers: CollectibleFlower[] = [];
  private guideText: Phaser.GameObjects.Text | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private collectingEnabled = false;
  private leaving = false;

  public constructor() {
    super('MoonflowerPatchScene');
  }

  public create(): void {
    this.leaving = false;
    this.flowers.length = 0;
    this.createEnvironment();

    const saveService = getBrowserSaveService();
    this.inventory = new InventoryService(saveService);
    const save = saveService.load() ?? saveService.createNewGame();
    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, SAVED_PLAYER_TEXTURE_KEY, appearance);

    this.player = new PlayerEntity(this, 250, 500, SAVED_PLAYER_TEXTURE_KEY);
    this.player.sprite.setDisplaySize(112, 92);
    this.player.sprite.setCollideWorldBounds(true);
    this.physics.world.setBounds(80, 120, GAME_WIDTH - 160, GAME_HEIGHT - 190);

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

    const phase = getWillowStoryPhase(
      getBrowserQuestEngine().getProgress(WILLOW_MOONFLOWERS_QUEST_ID),
    );
    this.collectingEnabled = phase === 'collecting';
    const owned = this.inventory.getQuantity(WILLOW_MOONFLOWER_ITEM_ID);
    const remaining = Math.max(0, WILLOW_MOONFLOWER_REQUIRED_QUANTITY - owned);

    if (this.collectingEnabled) {
      this.createCollectibleFlowers(remaining);
      this.setGuide(
        remaining > 0
          ? `Willow needs ${WILLOW_MOONFLOWER_REQUIRED_QUANTITY} Moonflowers. Walk close to collect them.`
          : 'You have enough Moonflowers. Take them back to Willow in Sunbeam Village.',
      );
    } else if (phase === 'return-to-willow' || phase === 'resolving') {
      this.createDecorativeFlowers(3);
      this.setGuide('You have enough Moonflowers. Take them back to Willow in Sunbeam Village.');
    } else if (phase === 'completed') {
      this.createDecorativeFlowers(3);
      this.setGuide('The Moonflowers are glowing happily. Willow has all she needs.');
    } else {
      this.createDecorativeFlowers(3);
      this.setGuide('The Moonflowers glow softly in the evening grass.');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.touchMovementPad?.destroy();
      this.touchMovementPad = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.player?.destroy();
      this.player = null;
      for (const flower of this.flowers) {
        flower.container.destroy(true);
      }
      this.flowers.length = 0;
      this.inventory = null;
      this.guideText = null;
      this.feedbackText = null;
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();
    if (this.inputController.justPressed('BACK')) {
      this.leavePatch();
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

    if (this.collectingEnabled) {
      this.tryCollectFlower();
    }
  }

  private tryCollectFlower(): void {
    if (!this.player || !this.inventory) {
      return;
    }

    const index = this.flowers.findIndex(
      (flower) =>
        Phaser.Math.Distance.Between(
          this.player?.sprite.x ?? 0,
          this.player?.sprite.y ?? 0,
          flower.x,
          flower.y,
        ) <= COLLECTION_RADIUS,
    );
    if (index < 0) {
      return;
    }

    const [flower] = this.flowers.splice(index, 1);
    flower.container.destroy(true);
    const quantity = this.inventory.addItem(WILLOW_MOONFLOWER_ITEM_ID);
    this.cameras.main.flash(140, 255, 241, 186, false);
    this.feedbackText?.setText(`Moonflower collected!  ${quantity} / 3`).setVisible(true);
    this.time.delayedCall(1800, () => this.feedbackText?.setVisible(false));

    if (quantity >= WILLOW_MOONFLOWER_REQUIRED_QUANTITY) {
      this.collectingEnabled = false;
      this.setGuide('You found all three! Take the Moonflowers back to Willow in Sunbeam Village.');
    }
  }

  private createCollectibleFlowers(count: number): void {
    const positions = [
      { x: 480, y: 360 },
      { x: 700, y: 470 },
      { x: 930, y: 335 },
    ];
    for (let index = 0; index < count; index += 1) {
      const position = positions[index];
      const glow = this.add.circle(0, 0, 42, 0xffefb0, 0.22);
      const stem = this.add.rectangle(0, 29, 7, 58, 0x5f9b68, 0.95);
      const bloom = this.add
        .text(0, 0, '🌙', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '50px',
        })
        .setOrigin(0.5);
      const container = this.add.container(position.x, position.y, [glow, stem, bloom]).setDepth(12);
      this.tweens.add({
        targets: container,
        y: position.y - 7,
        scale: 1.06,
        duration: 780,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      this.flowers.push({ container, ...position });
    }
  }

  private createDecorativeFlowers(count: number): void {
    const positions = [
      { x: 480, y: 360 },
      { x: 700, y: 470 },
      { x: 930, y: 335 },
    ];
    for (let index = 0; index < count; index += 1) {
      const position = positions[index];
      this.add.circle(position.x, position.y, 34, 0xffefb0, 0.16).setDepth(8);
      this.add
        .text(position.x, position.y, '🌙', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '44px',
        })
        .setOrigin(0.5)
        .setDepth(9);
    }
  }

  private createEnvironment(): void {
    this.cameras.main.setBackgroundColor('#79ae82');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7fbd87, 1);
    this.add.circle(640, 390, 520, 0xa8d99c, 0.6);
    this.add.circle(300, 180, 150, 0x659d70, 0.45);
    this.add.circle(1080, 170, 180, 0x659d70, 0.45);
    this.add
      .text(GAME_WIDTH / 2, 42, 'Moonflower Patch', {
        color: '#4d4161',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e8dd',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setDepth(100);

    this.guideText = this.add
      .text(GAME_WIDTH / 2, 96, '', {
        color: '#5c4a65',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 820 },
        backgroundColor: '#fff9e8cc',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setDepth(100);

    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 70, '', {
        color: '#5b4266',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e8ee',
        padding: { x: 16, y: 9 },
      })
      .setOrigin(0.5)
      .setDepth(105)
      .setVisible(false);

    const exit = this.add
      .rectangle(112, 58, 170, 58, 0xfff9e8, 0.94)
      .setStrokeStyle(4, 0x9d7db1, 0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(110);
    this.add
      .text(112, 58, '← Glade', {
        color: '#594667',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(111);
    exit.on('pointerdown', () => this.leavePatch());
  }

  private setGuide(message: string): void {
    this.guideText?.setText(message);
  }

  private leavePatch(): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    const field = MOONFLOWER_GLADE_MAP.landmarks.find(
      (landmark) => landmark.id === 'moonflower-field',
    );
    if (field) {
      setMoonflowerGladePlayerSpawn(field.approach);
    }
    this.scene.start('MoonflowerGladeScene');
  }
}
