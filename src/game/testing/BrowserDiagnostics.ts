import Phaser from 'phaser';
import {
  type FramePerformanceSnapshot,
  summariseFrameDurations,
} from '../performance/FramePerformance';
import { getPlayerEntityFacing } from '../player/PlayerEntity';

export interface DiagnosticObjectSnapshot {
  type: string;
  name: string;
  text: string | null;
  textureKey: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  depth: number;
  alpha: number;
  visible: boolean;
  active: boolean;
  scrollFactorX: number;
  scrollFactorY: number;
  interactive: boolean;
  flipX: boolean;
  playerFacing: string | null;
  authoritativeFacing: string | null;
}

export interface DiagnosticSceneSnapshot {
  key: string;
  camera: {
    scrollX: number;
    scrollY: number;
    width: number;
    height: number;
    worldX: number;
    worldY: number;
    worldWidth: number;
    worldHeight: number;
  };
  state: {
    raceStarted: boolean | null;
    raceFinished: boolean | null;
    forwardControlMultiplier: number | null;
  };
  objects: DiagnosticObjectSnapshot[];
}

export interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

export interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  performance(): FramePerformanceSnapshot;
  resetPerformance(): void;
  startScene(sceneKey: string, data?: object): void;
}

interface InspectableProperties {
  x?: number;
  y?: number;
  displayWidth?: number;
  displayHeight?: number;
  depth?: number;
  alpha?: number;
  visible?: boolean;
  active?: boolean;
  scrollFactorX?: number;
  scrollFactorY?: number;
  flipX?: boolean;
  text?: string;
  texture?: { key?: string };
  input?: { enabled?: boolean } | null;
}

type InspectableGameObject = Phaser.GameObjects.GameObject & InspectableProperties;

type InspectableContainer = Phaser.GameObjects.GameObject & {
  list?: Phaser.GameObjects.GameObject[];
};

interface InspectableSceneRuntime {
  raceStarted?: unknown;
  runState?: {
    forwardControlMultiplier?: unknown;
    movement?: {
      finished?: unknown;
    };
  };
}

function finite(value: number | undefined, fallback = 0): number {
  return Number.isFinite(value) ? (value ?? fallback) : fallback;
}

function snapshotObject(gameObject: Phaser.GameObjects.GameObject): DiagnosticObjectSnapshot {
  const object = gameObject as InspectableGameObject;
  const playerFacing =
    gameObject instanceof Phaser.Physics.Arcade.Sprite ? gameObject.getData('player-facing') : null;
  const authoritativeFacing =
    gameObject instanceof Phaser.Physics.Arcade.Sprite ? getPlayerEntityFacing(gameObject) : null;
  return {
    type: gameObject.type ?? gameObject.constructor.name,
    name: gameObject.name,
    text: typeof object.text === 'string' ? object.text : null,
    textureKey: typeof object.texture?.key === 'string' ? object.texture.key : null,
    x: finite(object.x),
    y: finite(object.y),
    displayWidth: Math.max(0, finite(object.displayWidth)),
    displayHeight: Math.max(0, finite(object.displayHeight)),
    depth: finite(object.depth),
    alpha: finite(object.alpha, 1),
    visible: object.visible ?? true,
    active: object.active ?? true,
    scrollFactorX: finite(object.scrollFactorX, 1),
    scrollFactorY: finite(object.scrollFactorY, 1),
    interactive: object.input?.enabled === true,
    flipX: object.flipX ?? false,
    playerFacing: typeof playerFacing === 'string' ? playerFacing : null,
    authoritativeFacing,
  };
}

function snapshotObjects(
  gameObjects: readonly Phaser.GameObjects.GameObject[],
): DiagnosticObjectSnapshot[] {
  const snapshots: DiagnosticObjectSnapshot[] = [];

  const visit = (gameObject: Phaser.GameObjects.GameObject): void => {
    snapshots.push(snapshotObject(gameObject));
    if (gameObject.type !== 'Container') {
      return;
    }

    const container = gameObject as InspectableContainer;
    for (const child of container.list ?? []) {
      visit(child);
    }
  };

  for (const gameObject of gameObjects) {
    visit(gameObject);
  }
  return snapshots;
}

function snapshotScene(scene: Phaser.Scene): DiagnosticSceneSnapshot {
  const camera = scene.cameras.main;
  const runtime = scene as unknown as InspectableSceneRuntime;
  return {
    key: scene.scene.key,
    camera: {
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      width: camera.width,
      height: camera.height,
      worldX: camera.worldView.x,
      worldY: camera.worldView.y,
      worldWidth: camera.worldView.width,
      worldHeight: camera.worldView.height,
    },
    state: {
      raceStarted: typeof runtime.raceStarted === 'boolean' ? runtime.raceStarted : null,
      raceFinished:
        typeof runtime.runState?.movement?.finished === 'boolean'
          ? runtime.runState.movement.finished
          : null,
      forwardControlMultiplier:
        typeof runtime.runState?.forwardControlMultiplier === 'number'
          ? runtime.runState.forwardControlMultiplier
          : null,
    },
    objects: snapshotObjects(scene.children.list),
  };
}

export function installBrowserDiagnostics(game: Phaser.Game): BrowserDiagnosticsApi | null {
  if (new URLSearchParams(globalThis.location.search).get('diagnostics') !== '1') {
    return null;
  }

  const frameDurations: number[] = [];
  let lastFrameAt = performance.now();
  const recordFrame = (): void => {
    const now = performance.now();
    const delta = now - lastFrameAt;
    lastFrameAt = now;
    if (!Number.isFinite(delta) || delta <= 0) {
      return;
    }
    if (frameDurations.length >= 180) {
      frameDurations.shift();
    }
    frameDurations.push(delta);
  };
  game.events.on(Phaser.Core.Events.POST_STEP, recordFrame);

  const api: BrowserDiagnosticsApi = {
    snapshot: () => {
      const activeScenes = game.scene.getScenes(true);
      return {
        width: Number(game.config.width),
        height: Number(game.config.height),
        activeScenes: activeScenes.map((scene) => scene.scene.key),
        scenes: activeScenes.map(snapshotScene),
      };
    },
    performance: () => summariseFrameDurations(frameDurations),
    resetPerformance: () => {
      frameDurations.length = 0;
      lastFrameAt = performance.now();
    },
    startScene: (sceneKey, data) => {
      const activeScene = game.scene.getScenes(true)[0];
      if (!activeScene) {
        throw new Error(`Cannot start diagnostic scene ${sceneKey}: no active scene.`);
      }
      activeScene.scene.start(sceneKey, data);
    },
  };

  const diagnosticsGlobal = globalThis as typeof globalThis & {
    __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
  };
  diagnosticsGlobal.__UNICORN_VALLEY_DIAGNOSTICS__ = api;
  return api;
}
