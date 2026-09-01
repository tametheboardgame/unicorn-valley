import Phaser from 'phaser';
import {
  type FramePerformanceSnapshot,
  summariseFrameDurations,
} from '../performance/FramePerformance';
import { getPlayerEntityFacing } from '../player/PlayerEntity';
import { selectRaceCourse } from '../racing/RaceCourse';

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

export interface DiagnosticSceneState {
  raceStarted: boolean | null;
  raceFinished: boolean | null;
  raceProgress: number | null;
  raceGrounded: boolean | null;
  raceHitObstacleCount: number | null;
  raceCollectedCount: number | null;
  raceUsedShortcutCount: number | null;
  racePlayerFinishPlace: number | null;
  raceElapsedMs: number | null;
  forwardControlMultiplier: number | null;
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
  state: DiagnosticSceneState;
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
  sceneState(sceneKey: string): DiagnosticSceneState | null;
  performance(): FramePerformanceSnapshot;
  resetPerformance(): void;
  startScene(sceneKey: string, data?: object): void;
  selectRaceCourse(courseId: string): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
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
  playerFinishPlace?: unknown;
  elapsedMs?: unknown;
  runState?: {
    forwardControlMultiplier?: unknown;
    hitObstacleIds?: unknown;
    collectedIds?: unknown;
    usedShortcutIds?: unknown;
    movement?: {
      finished?: unknown;
      progress?: unknown;
      grounded?: unknown;
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

function snapshotSceneState(scene: Phaser.Scene): DiagnosticSceneState {
  const runtime = scene as unknown as InspectableSceneRuntime;
  const hitObstacleIds = Array.isArray(runtime.runState?.hitObstacleIds)
    ? runtime.runState.hitObstacleIds
    : null;
  const collectedIds = Array.isArray(runtime.runState?.collectedIds)
    ? runtime.runState.collectedIds
    : null;
  const usedShortcutIds = Array.isArray(runtime.runState?.usedShortcutIds)
    ? runtime.runState.usedShortcutIds
    : null;

  return {
    raceStarted: typeof runtime.raceStarted === 'boolean' ? runtime.raceStarted : null,
    raceFinished:
      typeof runtime.runState?.movement?.finished === 'boolean'
        ? runtime.runState.movement.finished
        : null,
    raceProgress:
      typeof runtime.runState?.movement?.progress === 'number'
        ? runtime.runState.movement.progress
        : null,
    raceGrounded:
      typeof runtime.runState?.movement?.grounded === 'boolean'
        ? runtime.runState.movement.grounded
        : null,
    raceHitObstacleCount: hitObstacleIds?.length ?? null,
    raceCollectedCount: collectedIds?.length ?? null,
    raceUsedShortcutCount: usedShortcutIds?.length ?? null,
    racePlayerFinishPlace:
      typeof runtime.playerFinishPlace === 'number' ? runtime.playerFinishPlace : null,
    raceElapsedMs: typeof runtime.elapsedMs === 'number' ? runtime.elapsedMs : null,
    forwardControlMultiplier:
      typeof runtime.runState?.forwardControlMultiplier === 'number'
        ? runtime.runState.forwardControlMultiplier
        : null,
  };
}

function snapshotScene(scene: Phaser.Scene): DiagnosticSceneSnapshot {
  const camera = scene.cameras.main;
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
    state: snapshotSceneState(scene),
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
    sceneState: (sceneKey) => {
      const scene = game.scene.getScene(sceneKey);
      return scene?.scene.isActive() ? snapshotSceneState(scene) : null;
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
    selectRaceCourse: (courseId) => {
      selectRaceCourse(courseId);
    },
    setArcadeSpritePosition: (sceneKey, objectName, x, y) => {
      const scene = game.scene.getScene(sceneKey);
      if (!scene?.scene.isActive()) {
        throw new Error(
          `Cannot position ${objectName}: diagnostic scene ${sceneKey} is not active.`,
        );
      }
      const object = scene.children.getByName(objectName);
      if (!(object instanceof Phaser.Physics.Arcade.Sprite)) {
        throw new Error(`Cannot position ${objectName}: expected an Arcade Sprite in ${sceneKey}.`);
      }
      const body = object.body;
      if (!(body instanceof Phaser.Physics.Arcade.Body)) {
        throw new Error(
          `Cannot position ${objectName}: expected a dynamic Arcade body in ${sceneKey}.`,
        );
      }
      object.setVelocity(0, 0);
      body.reset(x, y);
    },
  };

  const diagnosticsGlobal = globalThis as typeof globalThis & {
    __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
  };
  diagnosticsGlobal.__UNICORN_VALLEY_DIAGNOSTICS__ = api;
  return api;
}
