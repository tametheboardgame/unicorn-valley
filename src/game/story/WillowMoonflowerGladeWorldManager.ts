import Phaser from 'phaser';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { isReducedMotionEnabled } from '../accessibility/AccessibilitySettings';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InventoryService } from '../inventory/InventoryService';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { worldDepthForY } from '../world/WorldDepth';
import {
  WILLOW_MOONFLOWER_ITEM_ID,
  WILLOW_MOONFLOWER_REQUIRED_QUANTITY,
  getWillowStoryPhase,
} from './WillowMoonflowersStory';

const COLLECTION_RADIUS = 82;
const LEGACY_THRESHOLD_GLIMMER_NAME = 'moonflower-field-threshold-glimmer';
const FEEDBACK_Y = GAME_HEIGHT - 205;

const COLLECTIBLE_POSITIONS = [
  { x: 2020, y: 1190 },
  { x: 2240, y: 1335 },
  { x: 2440, y: 1450 },
] as const;

interface CollectibleMoonflower {
  container: Phaser.GameObjects.Container;
  x: number;
  y: number;
}

interface GladeCollectionState {
  scene: Phaser.Scene;
  flowers: CollectibleMoonflower[];
  feedback: Phaser.GameObjects.Text;
  signature: string;
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  return (
    scene.children.list.find(
      (object): object is Phaser.Physics.Arcade.Sprite =>
        object instanceof Phaser.Physics.Arcade.Sprite &&
        object.texture.key.startsWith('player-unicorn-'),
    ) ?? null
  );
}

export class WillowMoonflowerGladeWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly inventory = new InventoryService(this.saveService);
  private readonly quests = getBrowserQuestEngine();
  private state: GladeCollectionState | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('MoonflowerGladeScene');
    if (!scene?.scene.isActive()) {
      this.destroyState();
      return;
    }

    const state = this.ensureState(scene);
    this.removeLegacyThresholdGlimmer(scene);
    this.syncFlowers(state);
    this.tryCollect(state);
  }

  private ensureState(scene: Phaser.Scene): GladeCollectionState {
    if (this.state?.scene === scene) {
      return this.state;
    }

    this.destroyState();
    this.state = {
      scene,
      flowers: [],
      feedback: scene.add
        .text(GAME_WIDTH / 2, FEEDBACK_Y, '', {
          color: '#244f5c',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#e9fff8fa',
          padding: { x: 22, y: 13 },
          wordWrap: { width: 456 },
        })
        .setName('willow-moonflower-feedback')
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(20_162)
        .setVisible(false),
      signature: '',
    };
    this.syncFlowers(this.state, true);
    return this.state;
  }

  private syncFlowers(state: GladeCollectionState, force = false): void {
    const progress = this.quests.getProgress(WILLOW_MOONFLOWERS_QUEST_ID);
    const owned = Math.min(
      WILLOW_MOONFLOWER_REQUIRED_QUANTITY,
      this.inventory.getQuantity(WILLOW_MOONFLOWER_ITEM_ID),
    );
    const signature = `${progress.status}:${owned}`;
    if (!force && signature === state.signature) {
      return;
    }
    state.signature = signature;

    for (const flower of state.flowers) {
      flower.container.destroy(true);
    }
    state.flowers.length = 0;

    if (progress.status === 'completed' || owned >= WILLOW_MOONFLOWER_REQUIRED_QUANTITY) {
      return;
    }

    for (const position of COLLECTIBLE_POSITIONS.slice(owned)) {
      state.flowers.push(this.createCollectible(state.scene, position.x, position.y));
    }
  }

  private createCollectible(scene: Phaser.Scene, x: number, y: number): CollectibleMoonflower {
    const halo = scene.add.circle(0, 0, 38, 0xd8c8ff, 0.12);
    const stem = scene.add.rectangle(0, 28, 7, 60, 0x589566, 1);
    const leafLeft = scene.add.ellipse(-11, 27, 20, 9, 0x78b979, 1).setAngle(-30);
    const leafRight = scene.add.ellipse(11, 37, 20, 9, 0x78b979, 1).setAngle(30);
    const petals = [
      scene.add.ellipse(0, -20, 28, 40, 0xf4ddff, 1),
      scene.add.ellipse(20, -5, 28, 40, 0xd9c6ff, 1).setAngle(65),
      scene.add.ellipse(12, 17, 28, 40, 0xc4ddff, 1).setAngle(140),
      scene.add.ellipse(-12, 17, 28, 40, 0xd9c6ff, 1).setAngle(-140),
      scene.add.ellipse(-20, -5, 28, 40, 0xc4ddff, 1).setAngle(-65),
    ];
    const centre = scene.add.circle(0, 1, 12, 0xffe49b, 1);
    const glintA = scene.add
      .text(29, -32, '✦', {
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const glintB = scene.add
      .text(-28, -12, '✧', {
        color: '#efe4ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const flowerParts = [stem, leafLeft, leafRight, ...petals, centre];
    const container = scene.add
      .container(x, y, [halo, ...flowerParts, glintA, glintB])
      .setName(`willow-moonflower:${x}:${y}`)
      .setDepth(worldDepthForY(y + 58, 0.3));

    if (!isReducedMotionEnabled()) {
      scene.tweens.add({
        targets: flowerParts,
        scaleX: { from: 0.95, to: 1.06 },
        scaleY: { from: 0.95, to: 1.06 },
        duration: 920,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      scene.tweens.add({
        targets: halo,
        alpha: { from: 0.08, to: 0.2 },
        scale: { from: 0.92, to: 1.08 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      scene.tweens.add({
        targets: [glintA, glintB],
        alpha: { from: 0.2, to: 1 },
        scale: { from: 0.8, to: 1.15 },
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    return { container, x, y };
  }

  private tryCollect(state: GladeCollectionState): void {
    const player = findPlayer(state.scene);
    if (!player || state.flowers.length === 0) {
      return;
    }

    const index = state.flowers.findIndex(
      (flower) =>
        Phaser.Math.Distance.Between(player.x, player.y, flower.x, flower.y) <= COLLECTION_RADIUS,
    );
    if (index < 0) {
      return;
    }

    const [flower] = state.flowers.splice(index, 1);
    flower.container.destroy(true);
    const quantity = this.inventory.addItem(WILLOW_MOONFLOWER_ITEM_ID, 1, {
      suppressRewardFeedback: true,
    });
    state.scene.cameras.main.flash(140, 220, 245, 255, false);

    if (quantity >= WILLOW_MOONFLOWER_REQUIRED_QUANTITY) {
      const progress = this.quests.getProgress(WILLOW_MOONFLOWERS_QUEST_ID);
      const phase = getWillowStoryPhase(progress);
      const hint =
        phase === 'collecting' || phase === 'return-to-willow' || phase === 'resolving'
          ? 'You have all three Moonflowers. Take them back to Willow in Sunbeam Village.'
          : 'You have all three Moonflowers. Someone in Sunbeam Village might want these.';
      this.showFeedback(
        state,
        `Moonflower collected! ${quantity} / ${WILLOW_MOONFLOWER_REQUIRED_QUANTITY}`,
        1350,
        () => this.showFeedback(state, hint, 3200),
      );
    } else {
      this.showFeedback(
        state,
        `Moonflower collected! ${quantity} / ${WILLOW_MOONFLOWER_REQUIRED_QUANTITY}`,
        2300,
      );
    }
    this.syncFlowers(state, true);
  }

  private showFeedback(
    state: GladeCollectionState,
    message: string,
    durationMs: number,
    onComplete?: () => void,
  ): void {
    this.feedbackTimer?.destroy();
    this.feedbackTimer = null;
    state.feedback.setText(message).setVisible(true);
    this.feedbackTimer = state.scene.time.delayedCall(durationMs, () => {
      this.feedbackTimer = null;
      if (state.feedback.active) {
        state.feedback.setVisible(false);
      }
      onComplete?.();
    });
  }

  private removeLegacyThresholdGlimmer(scene: Phaser.Scene): void {
    scene.children.getByName(LEGACY_THRESHOLD_GLIMMER_NAME)?.destroy();
  }

  private destroyState(): void {
    this.feedbackTimer?.destroy();
    this.feedbackTimer = null;
    if (!this.state) {
      return;
    }
    for (const flower of this.state.flowers) {
      flower.container.destroy(true);
    }
    this.state.flowers.length = 0;
    this.state.feedback.destroy();
    this.state = null;
  }
}

let manager: WillowMoonflowerGladeWorldManager | null = null;

export function getWillowMoonflowerGladeWorldManager(
  game: Phaser.Game,
): WillowMoonflowerGladeWorldManager {
  manager ??= new WillowMoonflowerGladeWorldManager(game);
  return manager;
}
