import Phaser from 'phaser';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
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
        .text(640, 165, '', {
          color: '#574a61',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '19px',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#fff9eaf2',
          padding: { x: 18, y: 10 },
          wordWrap: { width: 720 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(188)
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
    const outerGlow = scene.add.circle(0, 0, 46, 0x9ddfff, 0.16);
    const innerGlow = scene.add.circle(0, -4, 29, 0xffefb0, 0.2);
    const stem = scene.add.rectangle(0, 26, 7, 58, 0x5f9b68, 0.96);
    const leafLeft = scene.add.ellipse(-10, 25, 17, 8, 0x79b879, 0.95).setAngle(-28);
    const leafRight = scene.add.ellipse(10, 34, 17, 8, 0x79b879, 0.95).setAngle(28);
    const petals = [
      scene.add.ellipse(0, -18, 24, 34, 0xf3d8ff, 0.98),
      scene.add.ellipse(17, -5, 24, 34, 0xd8c8ff, 0.98).setAngle(65),
      scene.add.ellipse(11, 13, 24, 34, 0xbfe5ff, 0.98).setAngle(140),
      scene.add.ellipse(-11, 13, 24, 34, 0xd8c8ff, 0.98).setAngle(-140),
      scene.add.ellipse(-17, -5, 24, 34, 0xbfe5ff, 0.98).setAngle(-65),
    ];
    const centre = scene.add.circle(0, 0, 11, 0xffe39e, 1);
    const sparkle = scene.add
      .text(25, -30, '✦', {
        color: '#d8f5ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const container = scene.add
      .container(x, y, [
        outerGlow,
        innerGlow,
        stem,
        leafLeft,
        leafRight,
        ...petals,
        centre,
        sparkle,
      ])
      .setName(`willow-moonflower:${x}:${y}`)
      .setDepth(worldDepthForY(y + 55, 0.3));

    scene.tweens.add({
      targets: [outerGlow, innerGlow],
      alpha: { from: 0.1, to: 0.3 },
      scale: { from: 0.92, to: 1.08 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: sparkle,
      alpha: { from: 0.35, to: 1 },
      y: { from: -34, to: -26 },
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

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
    const quantity = this.inventory.addItem(WILLOW_MOONFLOWER_ITEM_ID);
    state.scene.cameras.main.flash(140, 220, 245, 255, false);

    const progress = this.quests.getProgress(WILLOW_MOONFLOWERS_QUEST_ID);
    const phase = getWillowStoryPhase(progress);
    const message =
      quantity >= WILLOW_MOONFLOWER_REQUIRED_QUANTITY
        ? phase === 'collecting' || phase === 'return-to-willow'
          ? 'You found all three Moonflowers! Take them back to Willow in Sunbeam Village.'
          : 'You found all three Moonflowers! Someone in Sunbeam Village may know what they are for.'
        : `Moonflower collected! ${quantity} / ${WILLOW_MOONFLOWER_REQUIRED_QUANTITY}`;
    this.showFeedback(state, message);
    this.syncFlowers(state, true);
  }

  private showFeedback(state: GladeCollectionState, message: string): void {
    state.feedback.setText(message).setVisible(true);
    state.scene.time.delayedCall(2600, () => {
      if (state.feedback.active) {
        state.feedback.setVisible(false);
      }
    });
  }

  private removeLegacyThresholdGlimmer(scene: Phaser.Scene): void {
    scene.children.getByName(LEGACY_THRESHOLD_GLIMMER_NAME)?.destroy();
  }

  private destroyState(): void {
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
