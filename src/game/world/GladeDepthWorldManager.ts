import Phaser from 'phaser';
import {
  JUNIPER_BUTTERFLY_TRAIL_FLAG,
  PIP_HOLLOW_TREE_QUEST_ID,
  R6_GLADE_HOME_SECRET_DEFINITIONS,
} from '../../content/r6GladeHomeContent';
import { WILLOW_GARDEN_PLANTED_FLAG } from '../../content/r2Quests';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';
import { SecretDiscoveryService } from '../discovery/SecretDiscoveryService';
import {
  WorldInteractionInput,
  WORLD_INTERACTION_PROMPT,
} from '../interaction/WorldInteractionInput';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { HollowTreeStoryService } from '../story/HollowTreeStoryService';
import { MOONFLOWER_GLADE_MAP } from './MoonflowerGladeMap';
import { worldDepthForY } from './WorldDepth';
import { WORLD_PLAYER_NAME } from './WorldTraversalPolishManager';

interface FixedGladeInteractionDefinition {
  id: string;
  label: string;
  actionLabel: string;
  position: { x: number; y: number };
  radius: number;
  icon: string;
}

interface InteractionRuntime {
  id: string;
  position: { x: number; y: number };
  radius: number;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
  activate: () => void;
}

interface GladeDepthState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  fixed: InteractionRuntime[];
  secrets: Map<string, InteractionRuntime>;
  feedback: Phaser.GameObjects.Text;
  persistentVisuals: Phaser.GameObjects.Container | null;
  persistentSignature: string;
}

const FIXED_INTERACTIONS: readonly FixedGladeInteractionDefinition[] = [
  {
    id: 'hollow-tree',
    label: 'Hollow Tree',
    actionLabel: 'Peek',
    position: { x: 2140, y: 710 },
    radius: 170,
    icon: '🌳',
  },
  {
    id: 'moonflower-bridge',
    label: 'Moonflower Bridge',
    actionLabel: 'Listen / skim pebble',
    position: { x: 1400, y: 900 },
    radius: 145,
    icon: '🌉',
  },
  {
    id: 'stream-bank',
    label: 'Sparkling stream',
    actionLabel: 'Splash',
    position: { x: 1240, y: 1180 },
    radius: 135,
    icon: '💧',
  },
  {
    id: 'garden-corner',
    label: 'Garden corner',
    actionLabel: 'Look closely',
    position: { x: 890, y: 790 },
    radius: 135,
    icon: '🌸',
  },
  {
    id: 'cottage-step',
    label: 'Cottage step',
    actionLabel: 'Sit',
    position: { x: 760, y: 720 },
    radius: 115,
    icon: '🏡',
  },
  {
    id: 'home-fireflies',
    label: 'Little home fireflies',
    actionLabel: 'Watch',
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

function findPlayer(scene: Phaser.Scene): { x: number; y: number } | null {
  const object = scene.children.getByName(WORLD_PLAYER_NAME) as Phaser.GameObjects.GameObject &
    Partial<{ x: number; y: number }>;
  if (object && typeof object.x === 'number' && typeof object.y === 'number') {
    return { x: object.x, y: object.y };
  }
  return null;
}

function distance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Phaser.Math.Distance.Between(left.x, left.y, right.x, right.y);
}

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
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    const runtimes = [...state.fixed, ...state.secrets.values()];
    let nearest: InteractionRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const runtime of runtimes) {
      const pointDistance = distance(player, runtime.position);
      runtime.prompt.setVisible(pointDistance <= runtime.radius + 82);
      if (pointDistance <= runtime.radius && pointDistance < nearestDistance) {
        nearest = runtime;
        nearestDistance = pointDistance;
      }
    }

    if (nearest && state.input.justPressed()) {
      nearest.activate();
    }
  }

  private ensureState(scene: Phaser.Scene): GladeDepthState {
    if (this.state?.scene === scene) {
      return this.state;
    }

    this.destroyState();
    const state: GladeDepthState = {
      scene,
      input: new WorldInteractionInput(scene),
      fixed: [],
      secrets: new Map(),
      feedback: this.createFeedback(scene),
      persistentVisuals: null,
      persistentSignature: '',
    };
    state.fixed = FIXED_INTERACTIONS.map((definition) =>
      this.createFixedRuntime(state, definition),
    );
    this.state = state;
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
    const prompt = state.scene.add
      .text(
        0,
        48,
        `${definition.actionLabel}: ${definition.label}  ·  ${WORLD_INTERACTION_PROMPT}`,
        {
          color: '#5d496c',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          backgroundColor: '#fff9edea',
          padding: { x: 8, y: 5 },
        },
      )
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 176, 146);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [icon, prompt, zone])
      .setName(`glade-depth:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 20, 0.42));
    const activate = () => this.activateFixed(state, definition);
    state.input.bindPointer(zone, () => {
      const player = findPlayer(state.scene);
      if (player && distance(player, definition.position) <= definition.radius) {
        activate();
      }
    });
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
      position: definition.position,
      radius: definition.radius,
      container,
      prompt,
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

    for (const [id, runtime] of state.secrets) {
      if (!wantedIds.has(id)) {
        runtime.container.destroy(true);
        state.secrets.delete(id);
      }
    }

    for (const definition of available) {
      if (!state.secrets.has(definition.id)) {
        state.secrets.set(definition.id, this.createSecretRuntime(state, definition));
      }
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
    const prompt = state.scene.add
      .text(
        0,
        48,
        `${definition.actionLabel}: ${definition.label}  ·  ${WORLD_INTERACTION_PROMPT}`,
        {
          color: '#5d496c',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          backgroundColor: '#fff9edea',
          padding: { x: 8, y: 5 },
        },
      )
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 176, 146);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [icon, prompt, zone])
      .setName(`glade-butterfly-secret:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 18, 0.48));
    const activate = () => this.activateSecret(state, definition);
    state.input.bindPointer(zone, () => {
      const player = findPlayer(state.scene);
      if (player && distance(player, definition.position) <= definition.interactionRadius) {
        activate();
      }
    });
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
      position: definition.position,
      radius: definition.interactionRadius,
      container,
      prompt,
      activate,
    };
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

    const objects: Phaser.GameObjects.GameObject[] = [];
    if (this.story.isNookOpen()) {
      const doorway = state.scene.add
        .ellipse(2200, 650, 106, 142, 0x59415e, 0.92)
        .setStrokeStyle(5, 0xffe5a2, 0.72)
        .setDepth(10);
      const light = state.scene.add.ellipse(2200, 655, 70, 105, 0xffe8a3, 0.2).setDepth(11);
      objects.push(doorway, light);
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
        { x: 1540, y: 900 },
        { x: 1600, y: 1040 },
        { x: 1580, y: 1210 },
        { x: 1540, y: 1420 },
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

    displayIcons.slice(0, 6).forEach((icon, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, displayIcons.length);
      objects.push(
        state.scene.add
          .text(850 + Math.cos(angle) * 58, 1082 + Math.sin(angle) * 34, icon, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '20px',
          })
          .setOrigin(0.5)
          .setDepth(11),
      );
    });

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
    for (const runtime of this.state.fixed) {
      runtime.container.destroy(true);
    }
    for (const runtime of this.state.secrets.values()) {
      runtime.container.destroy(true);
    }
    this.state.persistentVisuals?.destroy(true);
    this.state.feedback.destroy();
    this.state.input.destroy();
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
