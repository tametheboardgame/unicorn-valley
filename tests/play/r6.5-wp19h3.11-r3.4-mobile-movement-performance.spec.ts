import { expect, test, type CDPSession, type Page } from '@playwright/test';

interface FramePerformanceSnapshot {
  sampleCount: number;
  averageFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  longFrameCount: number;
}

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  visible: boolean;
  interactive: boolean;
}

interface DiagnosticSceneHealth {
  key: string;
  objectCount: number;
  tweenCount: number | null;
}

interface DiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: Array<{ key: string; objects: DiagnosticObject[] }>;
  health: { scenes: DiagnosticSceneHealth[] };
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  performance(): FramePerformanceSnapshot;
  resetPerformance(): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

interface Point {
  x: number;
  y: number;
}

interface MovementMeasurement {
  distance: number;
  performance: FramePerformanceSnapshot;
}

const SCENE_KEY = 'MoonflowerGladeScene';
const PLAYER_NAME = 'world-player-unicorn';
const START_X = 1600;
const START_Y = 900;
const HOLD_MS = 600;

async function seedIntroducedPip(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const timestamp = new Date().toISOString();
    const save = {
      schemaVersion: 2,
      createdAt: timestamp,
      lastSavedAt: timestamp,
      profile: {
        name: null,
        appearance: {},
        currentLocationId: 'location:moonflower-glade',
        unlockedAbilityIds: [],
      },
      inventory: {
        itemQuantities: {},
        ownedCosmeticIds: [],
        ownedDecorationIds: [],
        specialItemIds: [],
      },
      relationships: { byCharacterId: {} },
      quests: { byQuestId: {} },
      world: {
        flags: {
          'flag:r5-woods-starwell-revealed': true,
          'flag:pip-intro-appeared': true,
          'flag:pip-welcome-complete': true,
        },
        discoveredZoneIds: [],
        changedObjectIds: [],
        uniqueDiscoveryIds: [],
      },
      home: {
        ownedFurnitureIds: [],
        furnitureBySlot: {},
        gardenFlags: {},
      },
      activities: {
        racesById: {},
        miniGameRecords: {},
      },
      collections: {
        discoveryIds: [],
        memoryIds: [],
      },
    };
    const serialisedSave = JSON.stringify(save);
    window.localStorage.setItem('unicorn-valley.save', serialisedSave);
    window.localStorage.setItem('unicorn-valley.save.schema.2', serialisedSave);
  });
}

async function installThirtyFpsFrameConstraint(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
    const delayedCallbacks = new Map<number, number>();
    const frameIntervalMs = 1000 / 30;
    let lastCallbackAt = 0;

    window.requestAnimationFrame = (callback: FrameRequestCallback): number =>
      nativeRequestAnimationFrame((time) => {
        const waitMs = Math.max(0, frameIntervalMs - (time - lastCallbackAt));
        if (waitMs <= 1) {
          lastCallbackAt = time;
          callback(time);
          return;
        }

        const timeoutId = window.setTimeout(() => {
          delayedCallbacks.delete(timeoutId);
          const now = performance.now();
          lastCallbackAt = now;
          callback(now);
        }, waitMs);
        delayedCallbacks.set(timeoutId, timeoutId);
      });

    window.cancelAnimationFrame = (handle: number): void => {
      nativeCancelAnimationFrame(handle);
      const timeoutId = delayedCallbacks.get(handle);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        delayedCallbacks.delete(handle);
      }
    };
  });
}

async function diagnostics(page: Page): Promise<BrowserDiagnosticsApi> {
  return page.evaluateHandle(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return api;
  }) as unknown as BrowserDiagnosticsApi;
}

async function getSnapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return api.snapshot();
  });
}

async function waitForScene(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes('MoonflowerGladeScene') === true;
  });
}

async function loadGlade(page: Page): Promise<void> {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page);
  await page.waitForTimeout(350);
}

async function setPlayerStart(page: Page): Promise<void> {
  await page.evaluate(
    ({ sceneKey, objectName, x, y }) => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      api.setArcadeSpritePosition(sceneKey, objectName, x, y);
    },
    { sceneKey: SCENE_KEY, objectName: PLAYER_NAME, x: START_X, y: START_Y },
  );
  await page.waitForTimeout(80);
}

async function playerPosition(page: Page): Promise<Point> {
  const snapshot = await getSnapshot(page);
  const player = snapshot.scenes
    .find((scene) => scene.key === SCENE_KEY)
    ?.objects.find((object) => object.name === PLAYER_NAME);
  if (!player) {
    throw new Error('Moonflower Glade player is unavailable.');
  }
  return { x: player.x, y: player.y };
}

async function sceneHealth(page: Page): Promise<DiagnosticSceneHealth> {
  const snapshot = await getSnapshot(page);
  const health = snapshot.health.scenes.find((scene) => scene.key === SCENE_KEY);
  if (!health) {
    throw new Error('Moonflower Glade health diagnostics are unavailable.');
  }
  return health;
}

async function browserPointForCanvasObject(page: Page, objectName: string): Promise<Point> {
  const snapshot = await getSnapshot(page);
  const object = snapshot.scenes
    .find((scene) => scene.key === SCENE_KEY)
    ?.objects.find(
      (candidate) =>
        candidate.name === objectName && candidate.visible && candidate.interactive,
    );
  if (!object) {
    throw new Error(`Visible interactive control ${objectName} is unavailable.`);
  }

  const canvas = page.locator('canvas').first();
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }

  return {
    x: bounds.x + (object.x / snapshot.width) * bounds.width,
    y: bounds.y + (object.y / snapshot.height) * bounds.height,
  };
}

async function browserPointForDomControl(page: Page, selector: string): Promise<Point> {
  const control = page.locator(selector);
  await expect(control).toBeVisible();
  const bounds = await control.boundingBox();
  if (!bounds) {
    throw new Error(`DOM movement control ${selector} has no browser bounds.`);
  }
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

async function movementControlPoints(
  page: Page,
  projectName: string,
  gallop: boolean,
): Promise<Point[]> {
  const phone = projectName.includes('mobile-touch');
  const right = phone
    ? await browserPointForDomControl(page, '.mobile-touch-right')
    : await browserPointForCanvasObject(page, 'touch-movement-right');

  if (!gallop) {
    return [right];
  }

  const gallopPoint = phone
    ? await browserPointForDomControl(page, '.mobile-touch-gallop')
    : await browserPointForCanvasObject(page, 'touch-movement-gallop');
  return [right, gallopPoint];
}

async function holdTouchPoints(
  cdp: CDPSession,
  page: Page,
  points: Point[],
  durationMs: number,
): Promise<void> {
  const touchPoints = points.map((point, index) => ({
    x: point.x,
    y: point.y,
    id: index + 1,
    radiusX: 2,
    radiusY: 2,
    force: 1,
  }));

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
  try {
    await page.waitForTimeout(durationMs);
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
}

async function measureMovement(
  page: Page,
  cdp: CDPSession,
  projectName: string,
  gallop: boolean,
): Promise<MovementMeasurement> {
  await setPlayerStart(page);
  const before = await playerPosition(page);
  const points = await movementControlPoints(page, projectName, gallop);

  await page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    api?.resetPerformance();
  });

  const touchPoints = points.map((point, index) => ({
    x: point.x,
    y: point.y,
    id: index + 1,
    radiusX: 2,
    radiusY: 2,
    force: 1,
  }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });

  try {
    await page.waitForTimeout(HOLD_MS);
    const after = await playerPosition(page);
    const performance = await page.evaluate(() => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      return api.performance();
    });
    return { distance: Math.hypot(after.x - before.x, after.y - before.y), performance };
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
}

test('R3.4 phone/tablet walking and Gallop stay consistent under slower frame timing', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const projectName = test.info().project.name;
  const supportedProject =
    projectName === 'chromium-tablet-touch' || projectName === 'chromium-mobile-touch';
  test.skip(!supportedProject, 'R3.4 movement evidence runs on Chromium tablet and phone profiles.');

  await seedIntroducedPip(page);
  const cdp = await page.context().newCDPSession(page);

  await loadGlade(page);
  const normalHealthBefore = await sceneHealth(page);
  const normalWalk = await measureMovement(page, cdp, projectName, false);
  const normalGallop = await measureMovement(page, cdp, projectName, true);
  await page.waitForTimeout(400);
  const normalHealthAfter = await sceneHealth(page);

  expect(normalWalk.distance).toBeGreaterThan(120);
  expect(normalGallop.distance / normalWalk.distance).toBeGreaterThan(1.48);
  expect(normalGallop.distance / normalWalk.distance).toBeLessThan(1.72);
  expect(normalHealthAfter.objectCount).toBeLessThanOrEqual(normalHealthBefore.objectCount + 4);
  expect(normalHealthAfter.tweenCount ?? 0).toBeLessThanOrEqual(
    (normalHealthBefore.tweenCount ?? 0) + 4,
  );

  await installThirtyFpsFrameConstraint(page);
  await loadGlade(page);
  const constrainedHealthBefore = await sceneHealth(page);
  const constrainedWalk = await measureMovement(page, cdp, projectName, false);
  const constrainedGallop = await measureMovement(page, cdp, projectName, true);
  await page.waitForTimeout(400);
  const constrainedHealthAfter = await sceneHealth(page);

  expect(constrainedWalk.distance / normalWalk.distance).toBeGreaterThan(0.85);
  expect(constrainedWalk.distance / normalWalk.distance).toBeLessThan(1.15);
  expect(constrainedGallop.distance / normalGallop.distance).toBeGreaterThan(0.85);
  expect(constrainedGallop.distance / normalGallop.distance).toBeLessThan(1.15);
  expect(constrainedGallop.distance / constrainedWalk.distance).toBeGreaterThan(1.48);
  expect(constrainedGallop.distance / constrainedWalk.distance).toBeLessThan(1.72);
  expect(constrainedWalk.performance.p95FrameMs).toBeLessThan(90);
  expect(constrainedGallop.performance.p95FrameMs).toBeLessThan(90);
  expect(constrainedWalk.performance.worstFrameMs).toBeLessThan(250);
  expect(constrainedGallop.performance.worstFrameMs).toBeLessThan(250);
  expect(constrainedHealthAfter.objectCount).toBeLessThanOrEqual(
    constrainedHealthBefore.objectCount + 4,
  );
  expect(constrainedHealthAfter.tweenCount ?? 0).toBeLessThanOrEqual(
    (constrainedHealthBefore.tweenCount ?? 0) + 4,
  );

  await cdp.detach();
});
