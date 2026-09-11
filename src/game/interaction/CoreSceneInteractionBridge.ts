import Phaser from 'phaser';
import { createPipInteraction } from '../intro/PipIntro';
import { MoonflowerGladeScene } from '../scenes/MoonflowerGladeScene';
import { RainbowMeadowScene } from '../scenes/RainbowMeadowScene';
import { SunbeamVillageScene } from '../scenes/SunbeamVillageScene';
import type { InteractionActionKind, InteractionTarget } from './InteractionTarget';
import { MOONFLOWER_GLADE_INTERACTIONS } from './MoonflowerGladeInteractions';
import { getSceneInteractionRegistry } from './SceneInteractionRegistry';
import { RAINBOW_MEADOW_MAP } from '../world/RainbowMeadowMap';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';

const OWNER_KEY = 'wp19d-core-scene-interactions';

type LegacyActivator = (target: InteractionTarget) => void;

type CoreSceneRuntime = Phaser.Scene & {
  interactionPrompt?: { destroy(): void } | null;
  activeInteraction?: InteractionTarget | null;
  hasFirstDiscovery?: boolean;
};

type ScenePrototype = {
  activateInteraction?: LegacyActivator;
};

let patched = false;
let moonflowerActivate: LegacyActivator | null = null;
let villageActivate: LegacyActivator | null = null;
let meadowActivate: LegacyActivator | null = null;

function requiredPoint(
  points: readonly {
    id: string;
    approach?: { x: number; y: number };
    position: { x: number; y: number };
  }[],
  id: string,
  useApproach: boolean,
): { x: number; y: number } {
  const point = points.find((candidate) => candidate.id === id);
  if (!point) {
    throw new Error(`WP19D core interaction references missing map point: ${id}`);
  }
  return useApproach && point.approach ? point.approach : point.position;
}

function callbackTarget(
  target: InteractionTarget,
  actionKind: InteractionActionKind,
  activate: () => void,
): InteractionTarget {
  if (target.result.type === 'dialogue') {
    return { ...target, actionKind, activationMode: 'explicit' };
  }
  return {
    ...target,
    actionKind,
    activationMode: 'explicit',
    result: { type: 'callback', activate },
  };
}

function captureAndDisable(prototype: ScenePrototype, sceneName: string): LegacyActivator {
  const original = prototype.activateInteraction;
  if (typeof original !== 'function') {
    throw new Error(`WP19D could not capture ${sceneName}.activateInteraction`);
  }
  prototype.activateInteraction = () => undefined;
  return original;
}

/**
 * Core exploration scenes predate the registry and still perform their own target selection.
 * Patch only their activation method so movement/discovery/save behaviour remains scene-owned,
 * while the coordinator becomes the sole explicit interaction activator.
 */
export function patchCoreSceneInteractionHandlers(): void {
  if (patched) {
    return;
  }

  moonflowerActivate = captureAndDisable(
    MoonflowerGladeScene.prototype as unknown as ScenePrototype,
    'MoonflowerGladeScene',
  );
  villageActivate = captureAndDisable(
    SunbeamVillageScene.prototype as unknown as ScenePrototype,
    'SunbeamVillageScene',
  );
  meadowActivate = captureAndDisable(
    RainbowMeadowScene.prototype as unknown as ScenePrototype,
    'RainbowMeadowScene',
  );
  patched = true;
}

function villageTargets(scene: Phaser.Scene): InteractionTarget[] {
  if (!villageActivate) {
    return [];
  }

  const landmark = (id: string) => requiredPoint(SUNBEAM_VILLAGE_MAP.landmarks, id, true);
  const entrance = (id: string) => requiredPoint(SUNBEAM_VILLAGE_MAP.entrances, id, true);
  const npc = (id: string) => requiredPoint(SUNBEAM_VILLAGE_MAP.npcMarkers, id, false);

  const definitions: Array<[InteractionTarget, InteractionActionKind]> = [
    [
      {
        id: 'interaction:village-bakery',
        label: 'Sunbeam Bakery',
        actionLabel: 'Enter',
        position: landmark('bakery'),
        interactionRadius: 155,
        result: {
          type: 'scene-transition',
          sceneKey: 'VillageInteriorScene',
          payload: { interiorId: 'bakery', returnScene: 'SunbeamVillageScene' },
        },
      },
      'enter',
    ],
    [
      {
        id: 'interaction:village-accessory-shop',
        label: 'Twinkle & Thread',
        actionLabel: 'Enter',
        position: landmark('accessory-shop'),
        interactionRadius: 155,
        result: {
          type: 'scene-transition',
          sceneKey: 'VillageInteriorScene',
          payload: { interiorId: 'accessory-shop', returnScene: 'SunbeamVillageScene' },
        },
      },
      'enter',
    ],
    [
      {
        id: 'interaction:village-library',
        label: 'Story House',
        actionLabel: 'Enter',
        position: landmark('library'),
        interactionRadius: 160,
        result: {
          type: 'scene-transition',
          sceneKey: 'VillageInteriorScene',
          payload: { interiorId: 'library', returnScene: 'SunbeamVillageScene' },
        },
      },
      'enter',
    ],
    [
      {
        id: 'interaction:village-fountain',
        label: 'Sunbeam Fountain',
        actionLabel: 'Make a wish',
        position: landmark('sunbeam-fountain'),
        interactionRadius: 145,
        result: {
          type: 'message',
          title: 'Sunbeam Fountain',
          message: 'The water catches a tiny rainbow when you get close. Maybe wishes linger here.',
        },
      },
      'inspect',
    ],
    [
      {
        id: 'interaction:village-willow',
        label: 'Willow',
        actionLabel: 'Talk',
        actionKind: 'talk',
        position: npc('willow'),
        interactionRadius: 150,
        priority: 30,
        result: {
          type: 'scene-transition',
          sceneKey: 'WillowStoryScene',
          payload: { returnScene: 'SunbeamVillageScene' },
        },
      },
      'talk',
    ],
    [
      {
        id: 'interaction:village-marigold',
        label: 'Marigold',
        actionLabel: 'Talk',
        position: npc('marigold'),
        interactionRadius: 150,
        priority: 30,
        result: {
          type: 'scene-transition',
          sceneKey: 'MarigoldPicnicScene',
          payload: { returnScene: 'SunbeamVillageScene' },
        },
      },
      'talk',
    ],
    [
      {
        id: 'interaction:village-glade-gate',
        label: 'Moonflower Glade',
        actionLabel: 'Go home',
        position: entrance('moonflower-glade'),
        interactionRadius: 170,
        priority: 20,
        result: { type: 'scene-transition', sceneKey: 'MoonflowerGladeScene' },
      },
      'enter',
    ],
    [
      {
        id: 'interaction:village-meadow-gate',
        label: 'Rainbow Meadow',
        actionLabel: 'Visit meadow',
        position: entrance('rainbow-meadow'),
        interactionRadius: 175,
        priority: 20,
        result: { type: 'scene-transition', sceneKey: 'RainbowMeadowScene' },
      },
      'enter',
    ],
  ];

  return definitions.map(([target, actionKind]) =>
    callbackTarget(target, actionKind, () => villageActivate?.call(scene, target)),
  );
}

function meadowTargets(scene: Phaser.Scene): InteractionTarget[] {
  if (!meadowActivate) {
    return [];
  }

  const entrance = (id: string) => requiredPoint(RAINBOW_MEADOW_MAP.entrances, id, true);
  const feature = (id: string) => requiredPoint(RAINBOW_MEADOW_MAP.hubFeatures, id, true);
  const npc = (id: string) => requiredPoint(RAINBOW_MEADOW_MAP.npcMarkers, id, false);

  const definitions: Array<[InteractionTarget, InteractionActionKind]> = [
    [
      {
        id: 'interaction:meadow-village-gate',
        label: 'Sunbeam Village',
        actionLabel: 'Go to village',
        position: entrance('sunbeam-village'),
        interactionRadius: 170,
        priority: 20,
        result: { type: 'scene-transition', sceneKey: 'SunbeamVillageScene' },
      },
      'enter',
    ],
    [
      {
        id: 'interaction:meadow-nova',
        label: 'Nova',
        actionLabel: 'Talk',
        position: npc('nova'),
        interactionRadius: 155,
        priority: 30,
        result: {
          type: 'scene-transition',
          sceneKey: 'NovaStoryScene',
          payload: { returnScene: 'RainbowMeadowScene' },
        },
      },
      'talk',
    ],
    [
      {
        id: 'interaction:meadow-ribbon-board',
        label: 'Ribbon Board',
        actionLabel: 'Look',
        position: feature('ribbon-board'),
        interactionRadius: 160,
        priority: 20,
        result: {
          type: 'message',
          title: 'Rainbow Run Ribbon Board',
          message:
            'The polished board has hooks for Rainbow Run ribbons. Nova keeps the race names painted neatly beside them.',
        },
      },
      'inspect',
    ],
  ];

  return definitions.map(([target, actionKind]) =>
    callbackTarget(target, actionKind, () => meadowActivate?.call(scene, target)),
  );
}

function moonflowerTargets(scene: CoreSceneRuntime): InteractionTarget[] {
  if (!moonflowerActivate) {
    return [];
  }

  const actionKinds: Record<string, InteractionActionKind> = {
    'interaction:moonflower-cottage-door': 'enter',
    'interaction:display-stump': 'use',
    'interaction:moonflower-patch': 'inspect',
    'interaction:sunbeam-village-gate': 'enter',
  };

  const targets = MOONFLOWER_GLADE_INTERACTIONS.map((target) =>
    callbackTarget(target, actionKinds[target.id] ?? 'interact', () =>
      moonflowerActivate?.call(scene, target),
    ),
  );

  const pip = createPipInteraction(Boolean(scene.hasFirstDiscovery));
  targets.push(
    callbackTarget(pip, 'talk', () => {
      const current = createPipInteraction(Boolean(scene.hasFirstDiscovery));
      moonflowerActivate?.call(scene, current);
    }),
  );
  return targets;
}

export class CoreSceneInteractionBridge {
  private readonly activeScenes = new Map<string, Phaser.Scene>();

  public constructor(private readonly game: Phaser.Game) {
    patchCoreSceneInteractionHandlers();
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      for (const scene of this.activeScenes.values()) {
        getSceneInteractionRegistry(scene).clearOwner(OWNER_KEY);
      }
      this.activeScenes.clear();
    });
  }

  private update(): void {
    this.syncScene('MoonflowerGladeScene', (scene) => moonflowerTargets(scene));
    this.syncScene('SunbeamVillageScene', villageTargets);
    this.syncScene('RainbowMeadowScene', meadowTargets);
  }

  private syncScene(
    sceneKey: string,
    createTargets: (scene: CoreSceneRuntime) => InteractionTarget[],
  ): void {
    const scene = this.game.scene.getScene(sceneKey) as CoreSceneRuntime | null;
    if (!scene?.scene.isActive()) {
      const previous = this.activeScenes.get(sceneKey);
      if (previous) {
        getSceneInteractionRegistry(previous).clearOwner(OWNER_KEY);
        this.activeScenes.delete(sceneKey);
      }
      return;
    }

    this.disableLegacyPresentation(scene);
    const previous = this.activeScenes.get(sceneKey);
    if (previous !== scene) {
      if (previous) {
        getSceneInteractionRegistry(previous).clearOwner(OWNER_KEY);
      }
      this.activeScenes.set(sceneKey, scene);
      getSceneInteractionRegistry(scene).replaceOwnerTargets(OWNER_KEY, createTargets(scene));
    }
  }

  private disableLegacyPresentation(scene: CoreSceneRuntime): void {
    scene.interactionPrompt?.destroy();
    scene.interactionPrompt = null;
    scene.activeInteraction = null;

    if (scene.scene.key !== 'MoonflowerGladeScene') {
      return;
    }
    for (const child of [...scene.children.list]) {
      if (
        child instanceof Phaser.GameObjects.Text &&
        child.text.includes('Interact: E / Enter / Space')
      ) {
        child.destroy();
      }
    }
  }
}

let browserCoreSceneInteractionBridge: CoreSceneInteractionBridge | null = null;

export function getCoreSceneInteractionBridge(game: Phaser.Game): CoreSceneInteractionBridge {
  browserCoreSceneInteractionBridge ??= new CoreSceneInteractionBridge(game);
  return browserCoreSceneInteractionBridge;
}
