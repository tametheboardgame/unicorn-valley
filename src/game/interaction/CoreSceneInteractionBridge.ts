import Phaser from 'phaser';
import { createPipInteraction } from '../intro/PipIntro';
import { RainbowMeadowScene } from '../scenes/RainbowMeadowScene';
import { SunbeamVillageScene } from '../scenes/SunbeamVillageScene';
import {
  startMarigoldConversation,
  startNovaConversation,
  startWillowConversation,
} from '../story/WorldStoryConversations';
import { RAINBOW_MEADOW_MAP } from '../world/RainbowMeadowMap';
import { setSunbeamVillagePlayerSpawn, SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import type { InteractionActionKind, InteractionTarget } from './InteractionTarget';
import { MOONFLOWER_GLADE_INTERACTIONS } from './MoonflowerGladeInteractions';
import { getSceneInteractionRegistry } from './SceneInteractionRegistry';

const OWNER_KEY = 'wp19d-core-scene-interactions';

type LegacyActivator = (target: InteractionTarget) => void;

type CoreSceneRuntime = Phaser.Scene & {
  interactionPrompt?: { destroy(): void } | null;
  activeInteraction?: InteractionTarget | null;
  hasFirstDiscovery?: boolean;
  createFirstSparkleInteraction?: () => InteractionTarget | null;
};

type ScenePrototype = {
  activateInteraction?: LegacyActivator;
};

let patched = false;
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
  const activationMode = target.activationMode ?? 'explicit';
  if (target.result.type === 'dialogue' || target.result.type === 'callback') {
    return { ...target, actionKind, activationMode };
  }
  return {
    ...target,
    actionKind,
    activationMode,
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
 * Sunbeam Village and Rainbow Meadow still predate the shared registry. Capture their legacy
 * activators once while their migration is completed elsewhere. Moonflower Glade is now fully
 * registry-owned and deliberately has no legacy activator to patch or suppress.
 */
export function patchCoreSceneInteractionHandlers(): void {
  if (patched) {
    return;
  }

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
  const entranceApproach = (id: string) => requiredPoint(SUNBEAM_VILLAGE_MAP.entrances, id, true);
  const entrancePosition = (id: string) => requiredPoint(SUNBEAM_VILLAGE_MAP.entrances, id, false);
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
        result: { type: 'callback', activate: () => startWillowConversation(scene) },
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
        result: { type: 'callback', activate: () => startMarigoldConversation(scene) },
      },
      'talk',
    ],
    [
      {
        id: 'interaction:village-glade-gate',
        label: 'Moonflower Glade',
        actionLabel: 'Go home',
        actionKind: 'enter',
        activationMode: 'automatic',
        position: entrancePosition('moonflower-glade'),
        interactionRadius: 130,
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
        position: entranceApproach('rainbow-meadow'),
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
        result: { type: 'callback', activate: () => startNovaConversation(scene) },
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
  const targets: InteractionTarget[] = MOONFLOWER_GLADE_INTERACTIONS.map((target) => {
    const activationMode = target.activationMode ?? ('explicit' as const);
    if (target.id !== 'interaction:sunbeam-village-gate') {
      return { ...target, activationMode };
    }

    return {
      ...target,
      activationMode,
      result: {
        type: 'callback',
        activate: () => {
          setSunbeamVillagePlayerSpawn(
            requiredPoint(SUNBEAM_VILLAGE_MAP.entrances, 'moonflower-glade', true),
          );
          scene.scene.start('SunbeamVillageScene');
        },
      },
    };
  });

  const sparkle = scene.createFirstSparkleInteraction?.();
  if (sparkle) {
    targets.push({
      ...sparkle,
      activationMode: 'explicit',
      result:
        sparkle.result.type === 'callback'
          ? {
              type: 'callback',
              activate: () => {
                sparkle.result.type === 'callback' && sparkle.result.activate();
                getSceneInteractionRegistry(scene).replaceOwnerTargets(
                  OWNER_KEY,
                  moonflowerTargets(scene),
                );
              },
            }
          : sparkle.result,
    });
  }

  const pip = createPipInteraction(Boolean(scene.hasFirstDiscovery));
  targets.push({ ...pip, activationMode: 'explicit' });
  return targets;
}

export class CoreSceneInteractionBridge {
  private readonly activeScenes = new Map<string, Phaser.Scene>();

  public constructor(private readonly game: Phaser.Game) {
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
    this.syncScene('MoonflowerGladeScene', moonflowerTargets);
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

    const previous = this.activeScenes.get(sceneKey);
    if (previous === scene) {
      return;
    }

    if (previous) {
      getSceneInteractionRegistry(previous).clearOwner(OWNER_KEY);
    }
    this.activeScenes.set(sceneKey, scene);
    this.disableLegacyPresentationOnce(scene);
    getSceneInteractionRegistry(scene).replaceOwnerTargets(OWNER_KEY, createTargets(scene));
  }

  private disableLegacyPresentationOnce(scene: CoreSceneRuntime): void {
    // Moonflower Glade no longer creates a scene-local interaction prompt. Village/Meadow still do,
    // so retire those prompt instances once per scene instance while their source migrations remain
    // outside H1. This is intentionally not a per-frame suppression scan.
    if (scene.scene.key === 'MoonflowerGladeScene') {
      return;
    }
    scene.interactionPrompt?.destroy();
    scene.interactionPrompt = null;
    scene.activeInteraction = null;
  }
}

let browserCoreSceneInteractionBridge: CoreSceneInteractionBridge | null = null;

export function getCoreSceneInteractionBridge(game: Phaser.Game): CoreSceneInteractionBridge {
  browserCoreSceneInteractionBridge ??= new CoreSceneInteractionBridge(game);
  return browserCoreSceneInteractionBridge;
}
