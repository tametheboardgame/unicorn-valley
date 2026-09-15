import Phaser from 'phaser';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { isReducedMotionEnabled } from '../accessibility/AccessibilitySettings';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { InventoryService } from '../inventory/InventoryService';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getWorldFeedbackPresenter } from '../ui/WorldFeedbackPresenter';
import { worldDepthForY } from '../world/WorldDepth';
import {
  WILLOW_MOONFLOWER_ITEM_ID,
  WILLOW_MOONFLOWER_REQUIRED_QUANTITY,
  getWillowStoryPhase,
} from './WillowMoonflowersStory';

const COLLECTION_RADIUS = 132;
const LEGACY_THRESHOLD_GLIMMER_NAME = 'moonflower-field-threshold-glimmer';
const COLLECTION_FLAG_PREFIX = 'h1:willow-moonflower-collected:';
const INTERACTION_OWNER = 'h1:willow-moonflower-collectibles';

const COLLECTIBLES = [
  { id: 'west', x: 2020, y: 1190 },
  { id: 'middle', x: 2240, y: 1335 },
  { id: 'east', x: 2440, y: 1450 },
] as const;

type CollectibleId = (typeof COLLECTIBLES)[number]['id'];

interface CollectibleMoonflower {
  id: CollectibleId;
  container: Phaser.GameObjects.Container;
  x: number;
  y: number;
}

interface GladeCollectionState {
  scene: Phaser.Scene;
  flowers: CollectibleMoonflower[];
  signature: string;
}

function collectionFlag(id: CollectibleId): string {
  return `${COLLECTION_FLAG_PREFIX}${id}`;
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
  }

  private ensureState(scene: Phaser.Scene): GladeCollectionState {
    if (this.state?.scene === scene) {
      return this.state;
    }

    this.destroyState();
    this.state = {
      scene,
      flowers: [],
      signature: '',
    };
    this.syncFlowers(this.state, true);
    return this.state;
  }

  private getCollectedIds(): Set<CollectibleId> {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const collected = new Set<CollectibleId>();
    for (const collectible of COLLECTIBLES) {
      if (save.world.flags[collectionFlag(collectible.id)] === true) {
        collected.add(collectible.id);
      }
    }

    // Compatibility for saves created by the first H1.5a preview, which tracked quantity but not
    // physical flower identity. Preserve enough inferred identities to match the saved quantity,
    // while explicit identity flags remain authoritative for all newly collected flowers.
    const owned = Math.min(
      WILLOW_MOONFLOWER_REQUIRED_QUANTITY,
      this.inventory.getQuantity(WILLOW_MOONFLOWER_ITEM_ID),
    );
    if (collected.size < owned) {
      for (const collectible of COLLECTIBLES) {
        if (collected.size >= owned) {
          break;
        }
        collected.add(collectible.id);
      }
    }

    return collected;
  }

  private markCollected(id: CollectibleId): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    this.saveService.save({
      ...save,
      world: {
        ...save.world,
        flags: {
          ...save.world.flags,
          [collectionFlag(id)]: true,
        },
      },
    });
  }

  private syncFlowers(state: GladeCollectionState, force = false): void {
    const progress = this.quests.getProgress(WILLOW_MOONFLOWERS_QUEST_ID);
    const collected = this.getCollectedIds();
    const owned = Math.min(
      WILLOW_MOONFLOWER_REQUIRED_QUANTITY,
      this.inventory.getQuantity(WILLOW_MOONFLOWER_ITEM_ID),
    );
    const signature = `${progress.status}:${owned}:${[...collected].sort().join(',')}`;
    if (!force && signature === state.signature) {
      return;
    }
    state.signature = signature;

    for (const flower of state.flowers) {
      flower.container.destroy(true);
    }
    state.flowers.length = 0;

    if (progress.status !== 'completed' && owned < WILLOW_MOONFLOWER_REQUIRED_QUANTITY) {
      for (const collectible of COLLECTIBLES) {
        if (!collected.has(collectible.id)) {
          state.flowers.push(
            this.createCollectible(state.scene, collectible.id, collectible.x, collectible.y),
          );
        }
      }
    }

    this.syncInteractions(state);
  }

  private createCollectible(
    scene: Phaser.Scene,
    id: CollectibleId,
    x: number,
    y: number,
  ): CollectibleMoonflower {
    const halo = scene.add.circle(0, -4, 40, 0xe8dcff, 0.1);
    const stem = scene.add.rectangle(0, 31, 7, 62, 0x589566, 1);
    const leafLeft = scene.add.ellipse(-12, 30, 21, 9, 0x78b979, 1).setAngle(-30);
    const leafRight = scene.add.ellipse(12, 40, 21, 9, 0x78b979, 1).setAngle(30);

    // The blossom is deliberately a crescent moon rather than an ordinary petalled flower.
    const crescent = scene.add
      .text(0, -10, '☾', {
        color: '#eee2ff',
        fontFamily: 'Georgia, serif',
        fontSize: '64px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const moonHeart = scene.add.circle(5, -9, 6, 0xffecae, 0.95);
    const lowerPetalLeft = scene.add.ellipse(-10, 13, 14, 24, 0xd8c9ff, 0.95).setAngle(-30);
    const lowerPetalRight = scene.add.ellipse(10, 13, 14, 24, 0xc8dcff, 0.95).setAngle(30);
    const glintA = scene.add
      .text(28, -38, '✦', {
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const glintB = scene.add
      .text(-30, -15, '✧', {
        color: '#efe4ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const flowerParts = [
      stem,
      leafLeft,
      leafRight,
      lowerPetalLeft,
      lowerPetalRight,
      crescent,
      moonHeart,
    ];
    const container = scene.add
      .container(x, y, [halo, ...flowerParts, glintA, glintB])
      .setName(`willow-moonflower:${id}`)
      .setDepth(worldDepthForY(y + 60, 0.3));

    if (!isReducedMotionEnabled()) {
      scene.tweens.add({
        targets: [crescent, moonHeart, lowerPetalLeft, lowerPetalRight],
        scaleX: { from: 0.94, to: 1.07 },
        scaleY: { from: 0.94, to: 1.07 },
        duration: 920,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      scene.tweens.add({
        targets: halo,
        alpha: { from: 0.06, to: 0.18 },
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

    return { id, container, x, y };
  }

  private syncInteractions(state: GladeCollectionState): void {
    const targets = state.flowers.map((flower) => ({
      id: `interaction:willow-moonflower:${flower.id}`,
      label: 'Moonflower',
      actionLabel: 'Pick up',
      actionKind: 'pick-up' as const,
      position: { x: flower.x, y: flower.y },
      interactionRadius: COLLECTION_RADIUS,
      priority: 15,
      directArea: {
        width: COLLECTION_RADIUS * 1.6,
        height: COLLECTION_RADIUS * 1.6,
        name: `willow-moonflower-direct:${flower.id}`,
      },
      result: {
        type: 'callback' as const,
        activate: () => this.collectFlower(state, flower.id),
      },
    }));

    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(INTERACTION_OWNER, targets);
  }

  private collectFlower(state: GladeCollectionState, id: CollectibleId): void {
    if (this.state !== state || !state.scene.scene.isActive()) {
      return;
    }

    const index = state.flowers.findIndex((flower) => flower.id === id);
    if (index < 0 || this.getCollectedIds().has(id)) {
      return;
    }

    const [flower] = state.flowers.splice(index, 1);
    flower.container.destroy(true);
    this.markCollected(flower.id);
    const quantity = this.inventory.addItem(WILLOW_MOONFLOWER_ITEM_ID, 1, {
      suppressRewardFeedback: true,
    });
    state.scene.cameras.main.flash(140, 220, 245, 255, false);

    const progress = this.quests.getProgress(WILLOW_MOONFLOWERS_QUEST_ID);
    const phase = getWillowStoryPhase(progress);
    const feedback = getWorldFeedbackPresenter(state.scene);
    if (quantity >= WILLOW_MOONFLOWER_REQUIRED_QUANTITY) {
      const hint =
        phase === 'collecting' || phase === 'return-to-willow' || phase === 'resolving'
          ? 'You have all three Moonflowers. Take them back to Willow in Sunbeam Village.'
          : 'You have all three Moonflowers. Someone in Sunbeam Village might want these.';
      feedback.showGuidance(`Moonflower collected! 3 / 3\n${hint}`, 5200);
    } else {
      feedback.showGuidance(
        `Moonflower collected! ${quantity} / ${WILLOW_MOONFLOWER_REQUIRED_QUANTITY}`,
        2600,
      );
    }

    this.syncFlowers(state, true);
  }

  private removeLegacyThresholdGlimmer(scene: Phaser.Scene): void {
    scene.children.getByName(LEGACY_THRESHOLD_GLIMMER_NAME)?.destroy();
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    getSceneInteractionRegistry(this.state.scene).clearOwner(INTERACTION_OWNER);
    for (const flower of this.state.flowers) {
      flower.container.destroy(true);
    }
    this.state.flowers.length = 0;
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
