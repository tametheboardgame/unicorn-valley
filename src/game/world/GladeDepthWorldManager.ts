import Phaser from 'phaser';
import { WILLOW_GARDEN_PLANTED_FLAG } from '../../content/r2Quests';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';
import {
  JUNIPER_BUTTERFLY_TRAIL_FLAG,
  PIP_HOLLOW_TREE_QUEST_ID,
  R6_GLADE_HOME_SECRET_DEFINITIONS,
} from '../../content/r6GladeHomeContent';
import { SecretDiscoveryService } from '../discovery/SecretDiscoveryService';
import type { InteractionActionKind, InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { HollowTreeStoryService } from '../story/HollowTreeStoryService';
import { MOONFLOWER_GLADE_MAP } from './MoonflowerGladeMap';
import { worldDepthForY } from './WorldDepth';

interface FixedGladeInteractionDefinition {
  id: string;
  label: string;
  actionLabel: string;
  actionKind: InteractionActionKind;
  position: { x: number; y: number };
  radius: number;
  icon: string;
}

interface InteractionRuntime {
  id: string;
  label: string;
  actionLabel: string;
  actionKind: InteractionActionKind;
  position: { x: number; y: number };
  radius: number;
  container: Phaser.GameObjects.Container;
  activate: () => void;
}

interface GladeDepthState {
  scene: Phaser.Scene;
  fixed: InteractionRuntime[];
  secrets: Map<string, InteractionRuntime>;
  feedback: Phaser.GameObjects.Text;
  persistentVisuals: Phaser.GameObjects.Container | null;
  nookDoorwayVisuals: Phaser.GameObjects.Container | null;
  outdoorDisplayVisuals: Phaser.GameObjects.Container | null;
  persistentSignature: string;
}

const REGISTRY_OWNER = 'glade-depth';
const FIXED_INTERACTIONS: readonly FixedGladeInteractionDefinition[] = [
  {
    id: 'hollow-tree',
    label: 'Hollow Tree',
    actionLabel: 'Peek',
    actionKind: 'inspect',
    position: { x: 2140, y: 710 },
    radius: 170,
    icon: '🌳',
  },
  {
    id: 'moonflower-bridge',
    label: 'Moonflower Bridge',
    actionLabel: 'Listen / skim pebble',
    actionKind: 'interact',
    position: { x: 1400, y: 900 },
    radius: 145,
    icon: '🌉',
  },
  {
    id: 'stream-bank',
    label: 'Sparkling stream',
    actionLabel: 'Splash',
    actionKind: 'interact',
    position: { x: 1240, y: 1180 },
    radius: 135,
    icon: '💧',
  },
  {
    id: 'garden-corner',
    label: 'Garden corner',
    actionLabel: 'Look closely',
    actionKind: 'inspect',
    position: { x: 1080, y: 540 },
    radius: 100,
    icon: '🌸',
  },
  {
    id: 'cottage-step',
    label: 'Cottage step',
    actionLabel: 'Sit',
    actionKind: 'interact',
    position: { x: 760, y: 720 },
    radius: 115,
    icon: '🏡',
  },
  {
    id: 'home-fireflies',
    label: 'Little home fireflies',
    actionLabel: 'Watch',
    actionKind: 'inspect',
    position: { x: 2320, y: 1480 },
    radius: 145,
    icon: '✨',
  },
];

const OUTDOOR_DISPLAY_ITEMS = [
  ['item:rainbow-run-finisher-ribbon', '🎀'],
  ['item:crystal-cascade-finisher-ribbon', '🏅'],
  ['item:pebble-curiosity-display', '⚙️'],
  ['item:brook-prism-mobile', '💎'],
  ['item:hollow-tree-star-jar', '🌟'],
  ['item:butterfly-window-charm', '🦋'],
] as const;

export class GladeDepthWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly story = new HollowTreeStoryService(this.saveService, getBrowserQuestEngine());
  private readonly secrets = new SecretDiscoveryService(this.saveService);
  private state: GladeDepthState | null = null;

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
    this.syncSecrets(state);
    this.syncPersistentVisuals(state);
  }

  private ensureState(scene: Phaser.Scene): GladeDepthState {
    if (this.state?.scene === scene) {
      return this.state;
    }

    this.destroyState();
    const state: GladeDepthState = {
      scene,
      fixed: [],
      secrets: new Map(),
      feedback: this.createFeedback(scene),
      persistentVisuals: null,
      nookDoorwayVisuals: null,
      outdoorDisplayVisuals: null,
      persistentSignature: '',
    };
    state.fixed = FIXED_INTERACTIONS.map((definition) =>
      this.createFixedRuntime(state, definition),
    );
    this.state = state;
    this.syncSecrets(state);
    this.publishTargets(state);
    return state;
  }

  private createFeedback(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return scene.add
      .text(640, 118, '', {
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
      .setVisible(false);
  }

  private createFixedRuntime(
    state: GladeDepthState,
    definition: FixedGladeInteractionDefinition,
  ): InteractionRuntime {
    const icon = state.scene.add
      .text(0, 0, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: definition.id === 'hollow-tree' ? '28px' : '22px',
      })
      .setOrigin(0.5)
      .setAlpha(definition.id === 'hollow-tree' ? 0.5 : 0.7);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [icon])
      .setName(`glade-depth:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 20, 0.42));
    const activate = () => this.activateFixed(state, definition);
    state.scene.tweens.add({
      targets: icon,
      alpha: { from: 0.38, to: 0.85 },
      y: { from: -2, to: 2 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return {
      id: definition.id,
      label: definition.label,
      actionLabel: definition.actionLabel,
      actionKind: definition.actionKind,
      position: definition.position,
      radius: definition.radius,
      container,
      activate,
    };
  }

  private activateFixed(state: GladeDepthState, definition: FixedGladeInteractionDefinition): void {
    if (definition.id === 'hollow-tree') {
      const result = this.story.inspectTree();
      if (result.state === 'enter-nook' || result.state === 'complete') {
        state.scene.scene.start('HollowTreeNookScene');
        return;
      }
      this.showFeedback(state, result.message);
      return;
    }

    if (definition.id === 'moonflower-bridge') {
      if (this.story.listenAtBridge()) {
        this.showFeedback(
          state,
          'The water answers with the same three notes. Pip cheers from the path: “That is definitely a clue!” 🎵',
        );
        state.scene.cameras.main.flash(90, 210, 245, 255, false);
      } else {
        this.showFeedback(
          state,
          'A flat pebble skitters across the stream: one, two, three tiny skips. The bridge gives a soft wooden knock back. 🌉',
        );
      }
      return;
    }

    if (definition.id === 'stream-bank') {
      this.showFeedback(
        state,
        'Splash! Rings of pale blue light spread across the stream and a pair of silver fish-shaped sparkles dart underneath. 💧',
      );
      return;
    }

    if (definition.id === 'garden-corner') {
      const save = this.saveService.load();
      this.showFeedback(
        state,
        save?.world.flags[WILLOW_GARDEN_PLANTED_FLAG]
          ? 'Willow’s Moonflowers are thriving. New buds have appeared between the older blooms, and Juniper has been counting visiting butterflies. 🌸'
          : 'The garden corner is ready for something to grow. Tiny shoots are already testing the warm soil.',
      );
      return;
    }

    if (definition.id === 'cottage-step') {
      this.showFeedback(
        state,
        'You sit on the warm cottage step for a moment. From here the bridge, garden and path to the wider valley all fit into one view. 🏡',
      );
      return;
    }

    this.showFeedback(
      state,
      'The little fireflies gather into a loose star, orbit your horn once, then drift back towards the Moonflower Field. ✨',
    );
  }

  private syncSecrets(state: GladeDepthState): void {
    const available = this.secrets.listAvailable(
      R6_GLADE_HOME_SECRET_DEFINITIONS,
      'MoonflowerGladeScene',
    );
    const wantedIds = new Set<string>(available.map(({ id }) => id));
    let changed = false;

    for (const [id, runtime] of state.secrets) {
      if (!wantedIds.has(id)) {
        runtime.container.destroy(true);
        state.secrets.delete(id);
        changed = true;
      }
    }

    for (const definition of available) {
      if (!state.secrets.has(definition.id)) {
        state.secrets.set(definition.id, this.createSecretRuntime(state, definition));
        changed = true;
      }
    }

    if (changed) {
      this.publishTargets(state);
    }
  }

  private createSecretRuntime(
    state: GladeDepthState,
    definition: SecretDiscoveryDefinition,
  ): InteractionRuntime {
    const icon = state.scene.add
      .text(0, 0, definition.pattern === 'hidden-path' ? '🌸' : '🦋', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: definition.pattern === 'hidden-path' ? '27px' : '24px',
      })
      .setOrigin(0.5)
      .setAlpha(0.72);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [icon])
      .setName(`glade-butterfly-secret:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 18, 0.48));
    const activate = () => this.activateSecret(state, definition);
    state.scene.tweens.add({
      targets: icon,
      x: { from: -5, to: 5 },
      y: { from: -4, to: 4 },
      angle: { from: -6, to: 6 },
      duration: 780,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return {
      id: definition.id,
      label: definition.label,
      actionLabel: definition.actionLabel,
      actionKind: 'inspect',
      position: definition.position,
      radius: definition.interactionRadius,
      container,
      activate,
    };
  }

  private publishTargets(state: GladeDepthState): void {
    const runtimes = [...state.fixed, ...state.secrets.values()];
    const targets: InteractionTarget[] = runtimes.map((runtime) => ({
      id: `interaction:glade-depth:${runtime.id}`,
      label: runtime.label,
      actionLabel: runtime.actionLabel,
      actionKind: runtime.actionKind,
      position: runtime.position,
      interactionRadius: runtime.radius,
      priority: 15,
      visible: () => runtime.container.active,
      result: { type: 'callback', activate: runtime.activate },
    }));
    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
  }

  private activateSecret(state: GladeDepthState, definition: SecretDiscoveryDefinition): void {
    const result = this.secrets.discover(definition);
    if (result.status !== 'discovered') {
      return;
    }
    this.showFeedback(state, definition.feedback);
    state.scene.cameras.main.flash(100, 255, 236, 182, false);
    this.syncSecrets(state);
    this.syncPersistentVisuals(state, true);
  }

  private syncPersistentVisuals(state: GladeDepthState, force = false): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const displayIcons = OUTDOOR_DISPLAY_ITEMS.filter(
      ([itemId]) => (save.inventory.itemQuantities[itemId] ?? 0) > 0,
    ).map(([, icon]) => icon);
    const signature = [
      save.world.flags[WILLOW_GARDEN_PLANTED_FLAG] === true ? 'garden' : '',
      this.story.isNookOpen() ? 'nook' : '',
      save.world.flags[JUNIPER_BUTTERFLY_TRAIL_FLAG] === true ? 'butterfly' : '',
      ...displayIcons,
    ].join('|');
    if (!force && signature === state.persistentSignature) {
      return;
    }
    state.persistentSignature = signature;
    state.persistentVisuals?.destroy(true);
    state.nookDoorwayVisuals?.destroy(true);
    state.outdoorDisplayVisuals?.destroy(true);
    state.persistentVisuals = null;
    state.nookDoorwayVisuals = null;
    state.outdoorDisplayVisuals = null;

    const objects: Phaser.GameObjects.GameObject[] = [];
    if (this.story.isNookOpen()) {
      const doorway = state.scene.add
        .ellipse(0, 0, 106, 142, 0x59415e, 0.92)
        .setStrokeStyle(5, 0xffe5a2, 0.72);
      const light = state.scene.add.ellipse(0, 5, 70, 105, 0xffe8a3, 0.2);
      state.nookDoorwayVisuals = state.scene.add
        .container(2200, 650, [doorway, light])
        .setName('glade-depth:hollow-tree-open-doorway')
        .setDepth(worldDepthForY(695, 0.25));
      state.scene.tweens.add({
        targets: light,
        alpha: { from: 0.12, to: 0.34 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    }

    if (save.world.flags[WILLOW_GARDEN_PLANTED_FLAG] === true) {
      for (const [x, y] of [
        [830, 630],
        [885, 645],
        [940, 625],
      ] as const) {
        objects.push(
          state.scene.add
            .text(x, y, '🌸', { fontFamily: 'system-ui, sans-serif', fontSize: '23px' })
            .setOrigin(0.5)
            .setDepth(9),
        );
      }
    }

    if (save.world.flags[JUNIPER_BUTTERFLY_TRAIL_FLAG] === true) {
      for (const [index, point] of [
        { x: 1535, y: 900 },
        { x: 1420, y: 900 },
        { x: 1250, y: 1070 },
        { x: 1200, y: 1350 },
        { x: 1200, y: 1650 },
      ].entries()) {
        const butterfly = state.scene.add
          .text(point.x, point.y, index % 2 === 0 ? '🦋' : '✦', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: index % 2 === 0 ? '20px' : '18px',
          })
          .setOrigin(0.5)
          .setAlpha(0.7)
          .setDepth(8);
        objects.push(butterfly);
      }
    }

    if (displayIcons.length > 0) {
      const displayObjects = displayIcons.slice(0, 6).map((icon, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, displayIcons.length);
        return state.scene.add
          .text(Math.cos(angle) * 58, Math.sin(angle) * 34, icon, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '20px',
          })
          .setOrigin(0.5);
      });
      state.outdoorDisplayVisuals = state.scene.add
        .container(850, 1082, displayObjects)
        .setName('glade-depth:outdoor-achievement-display')
        .setDepth(worldDepthForY(1135, 0.4));
    }

    state.persistentVisuals = state.scene.add.container(0, 0, objects).setDepth(12);
  }

  private showFeedback(state: GladeDepthState, message: string): void {
    const serial = ((state.feedback.getData('feedback-serial') as number | undefined) ?? 0) + 1;
    state.feedback.setData('feedback-serial', serial).setText(message).setVisible(true);
    state.scene.time.delayedCall(3900, () => {
      if (state.feedback.active && state.feedback.getData('feedback-serial') === serial) {
        state.feedback.setVisible(false);
      }
    });
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    for (const runtime of this.state.fixed) {
      runtime.container.destroy(true);
    }
    for (const runtime of this.state.secrets.values()) {
      runtime.container.destroy(true);
    }
    this.state.persistentVisuals?.destroy(true);
    this.state.nookDoorwayVisuals?.destroy(true);
    this.state.outdoorDisplayVisuals?.destroy(true);
    this.state.feedback.destroy();
    this.state = null;
  }
}

let browserGladeDepthWorldManager: GladeDepthWorldManager | null = null;

export function getGladeDepthWorldManager(game: Phaser.Game): GladeDepthWorldManager {
  browserGladeDepthWorldManager ??= new GladeDepthWorldManager(game);
  return browserGladeDepthWorldManager;
}

export function getGladeDepthQuestId(): string {
  return PIP_HOLLOW_TREE_QUEST_ID;
}

export function getGladeDepthMapSize(): { width: number; height: number } {
  return { width: MOONFLOWER_GLADE_MAP.width, height: MOONFLOWER_GLADE_MAP.height };
}
