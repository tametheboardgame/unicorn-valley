import Phaser from 'phaser';

const MAX_EVENTS = 240;
const MAX_FRAME_SAMPLES = 180;
const LONG_FRAME_MS = 50;

export type FreezeDiagnosticEventKind =
  | 'scene-state'
  | 'scene-registered'
  | 'interaction'
  | 'runtime-error'
  | 'unhandled-rejection'
  | 'renderer-context-lost'
  | 'renderer-context-restored'
  | 'long-frame';

export interface FreezeDiagnosticEvent {
  atMs: number;
  kind: FreezeDiagnosticEventKind;
  sceneKey: string | null;
  detail: string;
}

export interface FreezeSceneHealthSnapshot {
  key: string;
  state: 'active' | 'paused' | 'sleeping' | 'visible' | 'inactive';
  objectCount: number;
  timerCount: number | null;
  tweenCount: number | null;
}

export interface FreezeDiagnosticsSnapshot {
  atMs: number;
  heartbeatAgeMs: number;
  lastFrameMs: number;
  recentFrameCount: number;
  recentLongFrameCount: number;
  worstRecentFrameMs: number;
  scenes: FreezeSceneHealthSnapshot[];
  lastInteraction: FreezeDiagnosticEvent | null;
  lastError: FreezeDiagnosticEvent | null;
  rendererContextLost: boolean;
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
}

export interface FreezeDiagnosticsApi {
  snapshot(): FreezeDiagnosticsSnapshot;
  events(): readonly FreezeDiagnosticEvent[];
  clear(): void;
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

function sceneState(scene: Phaser.Scene): FreezeSceneHealthSnapshot['state'] {
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

function snapshotScene(scene: Phaser.Scene): FreezeSceneHealthSnapshot {
  const clock = scene.time as unknown as InspectableClock;
  const tweenManager = scene.tweens as unknown as InspectableTweenManager;
  return {
    key: scene.scene.key,
    state: sceneState(scene),
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

export function installFreezeDiagnostics(game: Phaser.Game): FreezeDiagnosticsApi {
  const existing = (
    globalThis as typeof globalThis & {
      __UNICORN_VALLEY_FREEZE_DIAGNOSTICS__?: FreezeDiagnosticsApi;
    }
  ).__UNICORN_VALLEY_FREEZE_DIAGNOSTICS__;
  if (existing) {
    return existing;
  }

  const events: FreezeDiagnosticEvent[] = [];
  const frameDurations: number[] = [];
  const knownSceneStates = new Map<string, FreezeSceneHealthSnapshot['state']>();
  const knownSceneKeys = new Set<string>();
  let lastFrameAt = performance.now();
  let lastHeartbeatAt = lastFrameAt;
  let rendererContextLost = false;
  let lastInteraction: FreezeDiagnosticEvent | null = null;
  let lastError: FreezeDiagnosticEvent | null = null;

  const pushEvent = (
    kind: FreezeDiagnosticEventKind,
    detail: string,
    sceneKey: string | null = null,
  ): FreezeDiagnosticEvent => {
    const event: FreezeDiagnosticEvent = {
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

  const sampleScenes = (): void => {
    for (const [key, scene] of Object.entries(game.scene.keys)) {
      if (!knownSceneKeys.has(key)) {
        knownSceneKeys.add(key);
        pushEvent('scene-registered', 'Scene registered', key);
      }
      const next = sceneState(scene);
      const previous = knownSceneStates.get(key);
      if (previous !== next) {
        knownSceneStates.set(key, next);
        pushEvent('scene-state', `${previous ?? 'unseen'} -> ${next}`, key);
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
    sampleScenes();
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

  game.events.on(Phaser.Core.Events.POST_STEP, recordFrame);
  globalThis.addEventListener('pointerdown', recordPointer, { passive: true });
  globalThis.addEventListener('keydown', recordKey);
  globalThis.addEventListener('error', recordError);
  globalThis.addEventListener('unhandledrejection', recordRejection);
  canvas?.addEventListener('webglcontextlost', onContextLost);
  canvas?.addEventListener('webglcontextrestored', onContextRestored);
  sampleScenes();

  const api: FreezeDiagnosticsApi = {
    snapshot: () => {
      const now = performance.now();
      const memory = (performance as PerformanceWithMemory).memory;
      return {
        atMs: now,
        heartbeatAgeMs: Math.max(0, now - lastHeartbeatAt),
        lastFrameMs: frameDurations.at(-1) ?? 0,
        recentFrameCount: frameDurations.length,
        recentLongFrameCount: frameDurations.filter((duration) => duration > LONG_FRAME_MS).length,
        worstRecentFrameMs: frameDurations.length > 0 ? Math.max(...frameDurations) : 0,
        scenes: Object.values(game.scene.keys).map(snapshotScene),
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
    },
    events: () => [...events],
    clear: () => {
      events.length = 0;
      frameDurations.length = 0;
      knownSceneStates.clear();
      knownSceneKeys.clear();
      lastFrameAt = performance.now();
      lastHeartbeatAt = lastFrameAt;
      lastInteraction = null;
      lastError = null;
      sampleScenes();
    },
  };

  (
    globalThis as typeof globalThis & {
      __UNICORN_VALLEY_FREEZE_DIAGNOSTICS__?: FreezeDiagnosticsApi;
    }
  ).__UNICORN_VALLEY_FREEZE_DIAGNOSTICS__ = api;

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
