import Phaser from 'phaser';
import {
  type FramePerformanceSnapshot,
  summariseFrameDurations,
} from '../performance/FramePerformance';
import { getPlayerEntityFacing } from '../player/PlayerEntity';
import { selectRaceCourse } from '../racing/RaceCourse';

const MAX_EVENTS = 240;
const MAX_FRAME_SAMPLES = 180;
const LONG_FRAME_MS = 50;

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

export type BrowserDiagnosticEventKind =
  | 'scene-state'
  | 'scene-registered'
  | 'interaction'
  | 'runtime-error'
  | 'unhandled-rejection'
  | 'renderer-context-lost'
  | 'renderer-context-restored'
  | 'long-frame';

export interface BrowserDiagnosticEvent {
  atMs: number;
  kind: BrowserDiagnosticEventKind;
  sceneKey: string | null;
  detail: string;
}

export interface DiagnosticSceneHealthSnapshot {
  key: string;
  lifecycleState: 'active' | 'paused' | 'sleeping' | 'visible' | 'inactive';
  objectCount: number;
  timerCount: number | null;
  tweenCount: number | null;
}

export interface BrowserDiagnosticHealthSnapshot {
  heartbeatAgeMs: number;
  lastFrameMs: number;
  recentFrameCount: number;
  recentLongFrameCount: number;
  worstRecentFrameMs: number;
  scenes: DiagnosticSceneHealthSnapshot[];
  lastInteraction: BrowserDiagnosticEvent | null;
  lastError: BrowserDiagnosticEvent | null;
  rendererContextLost: boolean;
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
}

export interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
  health: BrowserDiagnosticHealthSnapshot;
}

export interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  sceneState(sceneKey: string): DiagnosticSceneState | null;
  performance(): FramePerformanceSnapshot;
  events(): readonly BrowserDiagnosticEvent[];
  resetPerformance(): void;
  clearEvents(): void;
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

interface InspectableClock {
  getAllEvents?: () => unknown[];
}

interface InspectableTweenManager {
  getAllTweens?: () => unknown[];
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
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

function sceneLifecycleState(
  scene: Phaser.Scene,
): DiagnosticSceneHealthSnapshot['lifecycleState'] {
  if (scene.scene.isActive()) {
    return 'active';
  }
  if (scene.scene.isPaused()) {
    return 'paused';
  }
  if (scene.scene.isSleeping()) {
    return 'sleeping';
  }
  if (scene.scene.isVisible()) {
    return 'visible';
  }
  return 'inactive';
}

function safeCount(callback: (() => unknown[]) | undefined): number | null {
  if (!callback) {
    return null;
  }
  try {
    return callback().length;
  } catch {
    return null;
  }
}

function snapshotSceneHealth(scene: Phaser.Scene): DiagnosticSceneHealthSnapshot {
  const clock = scene.time as unknown as InspectableClock;
  const tweenManager = scene.tweens as unknown as InspectableTweenManager;
  return {
    key: scene.scene.key,
    lifecycleState: sceneLifecycleState(scene),
    objectCount: scene.children.list.length,
    timerCount: safeCount(clock.getAllEvents?.bind(scene.time)),
    tweenCount: safeCount(tweenManager.getAllTweens?.bind(scene.tweens)),
  };
}

function describeUnknown(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function installBrowserDiagnostics(game: Phaser.Game): BrowserDiagnosticsApi | null {
  if (new URLSearchParams(globalThis.location.search).get('diagnostics') !== '1') {
    return null;
  }

  const existing = (
    globalThis as typeof globalThis & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    }
  ).__UNICORN_VALLEY_DIAGNOSTICS__;
  if (existing) {
    return existing;
  }

  const frameDurations: number[] = [];
  const events: BrowserDiagnosticEvent[] = [];
  const knownSceneStates = new Map<string, DiagnosticSceneHealthSnapshot['lifecycleState']>();
  const knownSceneKeys = new Set<string>();
  let lastFrameAt = performance.now();
  let lastHeartbeatAt = lastFrameAt;
  let lastInteraction: BrowserDiagnosticEvent | null = null;
  let lastError: BrowserDiagnosticEvent | null = null;
  let rendererContextLost = false;

  const pushEvent = (
    kind: BrowserDiagnosticEventKind,
    detail: string,
    sceneKey: string | null = null,
  ): BrowserDiagnosticEvent => {
    const event: BrowserDiagnosticEvent = {
      atMs: performance.now(),
      kind,
      sceneKey,
      detail: detail.slice(0, 420),
    };
    if (events.length >= MAX_EVENTS) {
      events.shift();
    }
    events.push(event);
    return event;
  };

  const sampleSceneStates = (): void => {
    for (const [key, scene] of Object.entries(game.scene.keys)) {
      if (!knownSceneKeys.has(key)) {
        knownSceneKeys.add(key);
        pushEvent('scene-registered', 'Scene registered', key);
      }
      const nextState = sceneLifecycleState(scene);
      const previousState = knownSceneStates.get(key);
      if (previousState !== nextState) {
        knownSceneStates.set(key, nextState);
        pushEvent('scene-state', `${previousState ?? 'unseen'} -> ${nextState}`, key);
      }
    }
  };

  const recordFrame = (): void => {
    const now = performance.now();
    const delta = now - lastFrameAt;
    lastFrameAt = now;
    lastHeartbeatAt = now;
    if (Number.isFinite(delta) && delta > 0) {
      if (frameDurations.length >= MAX_FRAME_SAMPLES) {
        frameDurations.shift();
      }
      frameDurations.push(delta);
      if (delta > LONG_FRAME_MS) {
        pushEvent('long-frame', `${delta.toFixed(1)} ms`);
      }
    }
    sampleSceneStates();
  };

  const recordPointer = (event: PointerEvent): void => {
    lastInteraction = pushEvent(
      'interaction',
      `pointer ${Math.round(event.clientX)},${Math.round(event.clientY)}`,
    );
  };
  const recordKey = (event: KeyboardEvent): void => {
    lastInteraction = pushEvent('interaction', `key ${event.key}`);
  };
  const recordError = (event: ErrorEvent): void => {
    lastError = pushEvent(
      'runtime-error',
      event.error ? describeUnknown(event.error) : event.message || 'Unknown runtime error',
    );
  };
  const recordRejection = (event: PromiseRejectionEvent): void => {
    lastError = pushEvent('unhandled-rejection', describeUnknown(event.reason));
  };

  const canvas = game.canvas;
  const onContextLost = (event: Event): void => {
    rendererContextLost = true;
    pushEvent('renderer-context-lost', 'Canvas/WebGL context lost');
    if (event.cancelable) {
      event.preventDefault();
    }
  };
  const onContextRestored = (): void => {
    rendererContextLost = false;
    pushEvent('renderer-context-restored', 'Canvas/WebGL context restored');
  };

  const healthSnapshot = (): BrowserDiagnosticHealthSnapshot => {
    const now = performance.now();
    const memory = (performance as PerformanceWithMemory).memory;
    return {
      heartbeatAgeMs: Math.max(0, now - lastHeartbeatAt),
      lastFrameMs: frameDurations.at(-1) ?? 0,
      recentFrameCount: frameDurations.length,
      recentLongFrameCount: frameDurations.filter((duration) => duration > LONG_FRAME_MS).length,
      worstRecentFrameMs: frameDurations.length > 0 ? Math.max(...frameDurations) : 0,
      scenes: Object.values(game.scene.keys).map(snapshotSceneHealth),
      lastInteraction,
      lastError,
      rendererContextLost,
      memory:
        memory &&
        Number.isFinite(memory.usedJSHeapSize) &&
        Number.isFinite(memory.totalJSHeapSize) &&
        Number.isFinite(memory.jsHeapSizeLimit)
          ? {
              usedJSHeapSize: memory.usedJSHeapSize ?? 0,
              totalJSHeapSize: memory.totalJSHeapSize ?? 0,
              jsHeapSizeLimit: memory.jsHeapSizeLimit ?? 0,
            }
          : null,
    };
  };

  game.events.on(Phaser.Core.Events.POST_STEP, recordFrame);
  globalThis.addEventListener('pointerdown', recordPointer, { passive: true });
  globalThis.addEventListener('keydown', recordKey);
  globalThis.addEventListener('error', recordError);
  globalThis.addEventListener('unhandledrejection', recordRejection);
  canvas?.addEventListener('webglcontextlost', onContextLost);
  canvas?.addEventListener('webglcontextrestored', onContextRestored);
  sampleSceneStates();

  const api: BrowserDiagnosticsApi = {
    snapshot: () => {
      const activeScenes = game.scene.getScenes(true);
      return {
        width: Number(game.config.width),
        height: Number(game.config.height),
        activeScenes: activeScenes.map((scene) => scene.scene.key),
        scenes: activeScenes.map(snapshotScene),
        health: healthSnapshot(),
      };
    },
    sceneState: (sceneKey) => {
      const scene = game.scene.getScene(sceneKey);
      return scene?.scene.isActive() ? snapshotSceneState(scene) : null;
    },
    performance: () => summariseFrameDurations(frameDurations),
    events: () => [...events],
    resetPerformance: () => {
      frameDurations.length = 0;
      lastFrameAt = performance.now();
      lastHeartbeatAt = lastFrameAt;
    },
    clearEvents: () => {
      events.length = 0;
      knownSceneKeys.clear();
      knownSceneStates.clear();
      lastInteraction = null;
      lastError = null;
      sampleSceneStates();
    },
    startScene: (sceneKey, data) => {
      if (!game.scene.keys[sceneKey]) {
        throw new Error(`Cannot start diagnostic scene ${sceneKey}: scene is not registered.`);
      }
      for (const activeScene of game.scene.getScenes(true)) {
        if (activeScene.scene.key !== sceneKey) {
          game.scene.stop(activeScene.scene.key);
        }
      }
      game.scene.start(sceneKey, data);
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

  game.events.once(Phaser.Core.Events.DESTROY, () => {
    game.events.off(Phaser.Core.Events.POST_STEP, recordFrame);
    globalThis.removeEventListener('pointerdown', recordPointer);
    globalThis.removeEventListener('keydown', recordKey);
    globalThis.removeEventListener('error', recordError);
    globalThis.removeEventListener('unhandledrejection', recordRejection);
    canvas?.removeEventListener('webglcontextlost', onContextLost);
    canvas?.removeEventListener('webglcontextrestored', onContextRestored);
  });

  return api;
}
