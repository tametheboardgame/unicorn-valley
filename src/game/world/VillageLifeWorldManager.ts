import Phaser from 'phaser';
import {
  TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID,
  TANSY_MAP_HUNT_ACTIVE_FLAG,
  TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID,
  TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID,
} from '../../content/r6VillageContent';
import { DiscoveryService } from '../discovery/DiscoveryService';
import type { InteractionActionKind, InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserSaveService } from '../save/browserSaveService';
import { worldDepthForY } from './WorldDepth';

interface VillageLifePoint {
  id: string;
  label: string;
  actionLabel: string;
  actionKind: InteractionActionKind;
  x: number;
  y: number;
  radius: number;
  createProp: (scene: Phaser.Scene) => Phaser.GameObjects.GameObject[];
}

interface VillageLifeRuntime {
  definition: VillageLifePoint;
  container: Phaser.GameObjects.Container;
}

interface VillageLifeState {
  scene: Phaser.Scene;
  points: VillageLifeRuntime[];
  feedback: Phaser.GameObjects.Text;
}

const REGISTRY_OWNER = 'village-life';
const VILLAGE_POINTS: readonly VillageLifePoint[] = [
  {
    id: 'notice-board',
    label: 'Village notice board',
    actionLabel: 'Read',
    actionKind: 'inspect',
    x: 1180,
    y: 830,
    radius: 122,
    createProp: (scene) => [
      scene.add.rectangle(0, 0, 126, 96, 0x9a684c, 1).setStrokeStyle(5, 0x6e4939, 0.95),
      scene.add.rectangle(0, -2, 102, 70, 0xffedbd, 1).setStrokeStyle(2, 0xd8a76d, 0.9),
      scene.add
        .text(0, -4, '📌  ✦  📜', { fontFamily: 'system-ui, sans-serif', fontSize: '20px' })
        .setOrigin(0.5),
    ],
  },
  {
    id: 'sundial',
    label: 'Sunny little sundial',
    actionLabel: 'Inspect',
    actionKind: 'inspect',
    x: 1320,
    y: 1320,
    radius: 118,
    createProp: (scene) => [
      scene.add.ellipse(0, 5, 116, 58, 0xe0b15e, 1).setStrokeStyle(4, 0xb17d43, 0.9),
      scene.add.triangle(0, -24, 0, 46, 20, 0, 40, 46, 0x8d6845, 1).setOrigin(0.5, 1),
      scene.add
        .text(0, 12, '☀️', { fontFamily: 'system-ui, sans-serif', fontSize: '22px' })
        .setOrigin(0.5),
    ],
  },
  {
    id: 'bench',
    label: 'Village bench',
    actionLabel: 'Sit',
    actionKind: 'interact',
    x: 1880,
    y: 920,
    radius: 118,
    createProp: (scene) => [
      scene.add.rectangle(0, 8, 150, 28, 0xb97855, 1).setStrokeStyle(3, 0x80503e, 0.9),
      scene.add.rectangle(0, -22, 150, 18, 0xc58a62, 1).setStrokeStyle(3, 0x80503e, 0.9),
      scene.add.rectangle(-58, 34, 12, 48, 0x80503e, 1),
      scene.add.rectangle(58, 34, 12, 48, 0x80503e, 1),
    ],
  },
  {
    id: 'story-map-sign',
    label: 'Story House map sign',
    actionLabel: 'Peek',
    actionKind: 'inspect',
    x: 2470,
    y: 770,
    radius: 120,
    createProp: (scene) => [
      scene.add.rectangle(0, 0, 112, 80, 0x7aa5bd, 1).setStrokeStyle(4, 0x50758d, 0.95),
      scene.add
        .text(0, -5, '🗺️', { fontFamily: 'system-ui, sans-serif', fontSize: '32px' })
        .setOrigin(0.5),
      scene.add
        .text(0, 27, 'MAP', {
          color: '#f7fbff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    ],
  },
  {
    id: 'thread-window',
    label: 'Twinkle & Thread window',
    actionLabel: 'Look',
    actionKind: 'inspect',
    x: 1260,
    y: 760,
    radius: 116,
    createProp: (scene) => [
      scene.add.rectangle(0, 0, 112, 76, 0xf8d8ef, 1).setStrokeStyle(4, 0xb86da6, 0.9),
      scene.add
        .text(0, 0, '🎀  ✨', { fontFamily: 'system-ui, sans-serif', fontSize: '25px' })
        .setOrigin(0.5),
    ],
  },
  {
    id: 'fountain-splash',
    label: 'Sunbeam Fountain water',
    actionLabel: 'Splash',
    actionKind: 'interact',
    x: 1690,
    y: 1050,
    radius: 116,
    createProp: (scene) => [
      scene.add
        .text(0, 0, '💧', { fontFamily: 'system-ui, sans-serif', fontSize: '26px' })
        .setOrigin(0.5)
        .setAlpha(0.72),
    ],
  },
];

export class VillageLifeWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly discoveryService = new DiscoveryService(this.saveService);
  private state: VillageLifeState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('SunbeamVillageScene');
    if (!scene?.scene.isActive()) {
      this.destroyState();
      return;
    }
    this.ensureState(scene);
  }

  private ensureState(scene: Phaser.Scene): VillageLifeState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();
    const feedback = scene.add
      .text(640, 116, '', {
        color: '#574a61',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff8eaf2',
        padding: { x: 18, y: 10 },
        wordWrap: { width: 700 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(184)
      .setVisible(false);
    const state: VillageLifeState = { scene, points: [], feedback };
    for (const definition of VILLAGE_POINTS) {
      const container = scene.add
        .container(definition.x, definition.y, definition.createProp(scene))
        .setName(`village-life:${definition.id}`)
        .setDepth(worldDepthForY(definition.y + 24, 0.3));
      state.points.push({ definition, container });
    }
    this.state = state;
    this.publishTargets(state);
    return state;
  }

  private publishTargets(state: VillageLifeState): void {
    const targets: InteractionTarget[] = state.points.map(({ definition, container }) => ({
      id: `interaction:village-life:${definition.id}`,
      label: definition.label,
      actionLabel: definition.actionLabel,
      actionKind: definition.actionKind,
      position: { x: definition.x, y: definition.y },
      interactionRadius: definition.radius,
      priority: 10,
      visible: () => container.active,
      result: {
        type: 'callback',
        activate: () => this.activate(state, definition),
      },
    }));
    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
  }

  private activate(state: VillageLifeState, definition: VillageLifePoint): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const hunting = save.world.flags[TANSY_MAP_HUNT_ACTIVE_FLAG] === true;
    const noticeFound = this.discoveryService.hasDiscovery(TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID);
    const bakeryFound = this.discoveryService.hasDiscovery(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID);
    const sundialFound = this.discoveryService.hasDiscovery(TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID);

    if (definition.id === 'notice-board') {
      if (hunting && !noticeFound) {
        this.discoveryService.unlockDiscovery(TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID);
        this.showFeedback(
          state,
          '🗺️ Map corner found! It was tucked behind a notice about a missing purple mitten.',
        );
        return;
      }
      this.showFeedback(
        state,
        '📌 Today’s notices: “Picnic weather?”, “Race ribbons wanted for display”, and “Please stop feeding buns to the fountain fish.”',
      );
      return;
    }

    if (definition.id === 'sundial') {
      if (hunting && noticeFound && bakeryFound && !sundialFound) {
        this.discoveryService.unlockDiscovery(TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID);
        this.showFeedback(
          state,
          '🗺️ Final map corner found! It was wedged beneath the sundial where the breeze could not steal it again.',
        );
        return;
      }
      this.showFeedback(
        state,
        '☀️ The little shadow points across the square. The gold marks sparkle differently as the valley light changes.',
      );
      return;
    }

    if (definition.id === 'bench') {
      this.showFeedback(
        state,
        '🪑 You sit for a moment. From here you can see the Bakery, the fountain and unicorns crossing the square.',
      );
      return;
    }
    if (definition.id === 'story-map-sign') {
      this.showFeedback(
        state,
        hunting
          ? '🗺️ Tansy has added three tiny question marks to the Village map. The Story House might know more.'
          : '🗺️ The sign shows the Village in the middle, with little paths curling towards the Glade and Meadow.',
      );
      return;
    }
    if (definition.id === 'thread-window') {
      this.showFeedback(
        state,
        '🎀 The window has a starter bow beside two empty stands labelled “More treasures appear as your adventures grow.”',
      );
      return;
    }

    this.showFeedback(
      state,
      '💦 Splash! Three tiny rainbow fish-shaped sparkles leap from the fountain and plop back into the water.',
    );
    state.scene.cameras.main.flash(90, 255, 238, 164, false);
  }

  private showFeedback(state: VillageLifeState, message: string): void {
    state.feedback.setText(message).setVisible(true);
    state.scene.time.delayedCall(3300, () => {
      if (state.feedback.active) {
        state.feedback.setVisible(false);
      }
    });
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    for (const runtime of this.state.points) {
      runtime.container.destroy(true);
    }
    this.state.feedback.destroy();
    this.state = null;
  }
}

let browserVillageLifeWorldManager: VillageLifeWorldManager | null = null;

export function getVillageLifeWorldManager(game: Phaser.Game): VillageLifeWorldManager {
  browserVillageLifeWorldManager ??= new VillageLifeWorldManager(game);
  return browserVillageLifeWorldManager;
}
