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
  bodyVelocityX: number | null;
  bodyVelocityY: number | null;
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
  speed: number;
  performance: FramePerformanceSnapshot;
}

const SCENE_KEY = 'MoonflowerGladeScene';
const PLAYER_NAME = 'world-player-unicorn';
const START_X = 1600;
const START_Y = 900;
const MOVEMENT_SAMPLE_FRAMES = 18;

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

        window.setTimeout(() => {
          const now = performance.now();
          lastCallbackAt = now;
          callback(now);
        }, waitMs);
      });
  });
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
      (candidate) => candidate.name === objectName && candidate.visible && candidate.interactive,
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
    // Under loaded CI runners the synthetic touch can be queued for several frames before the
    // game consumes it. Synchronise the timed sample to observed movement rather than measuring
    // runner/input latency as if it were player movement performance.
    await page.waitForFunction(
      ({ sceneKey, objectName, startX, startY }) => {
        const api = (
          window as typeof window & {
            __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
          }
        ).__UNICORN_VALLEY_DIAGNOSTICS__;
        const player = api
          ?.snapshot()
          .scenes.find((scene) => scene.key === sceneKey)
          ?.objects.find((object) => object.name === objectName);
        return player ? Math.hypot(player.x - startX, player.y - startY) >= 8 : false;
      },
      {
        sceneKey: SCENE_KEY,
        objectName: PLAYER_NAME,
        startX: before.x,
        startY: before.y,
      },
      { timeout: 3_000 },
    );

    const activeStart = await playerPosition(page);
    await page.evaluate(() => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      api?.resetPerformance();
    });

    // Sample a fixed number of actual game frames rather than a fixed amount of wall-clock time.
    // Loaded CI runners can stall the browser between frames, which previously made a healthy
    // velocity look like a movement regression simply because fewer simulation frames occurred
    // during the 600 ms hold window.
    await page.waitForFunction(
      (requiredSamples) => {
        const api = (
          window as typeof window & {
            __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
          }
        ).__UNICORN_VALLEY_DIAGNOSTICS__;
        return (api?.performance().sampleCount ?? 0) >= requiredSamples;
      },
      MOVEMENT_SAMPLE_FRAMES,
      { timeout: 8_000 },
    );

    const snapshot = await getSnapshot(page);
    const player = snapshot.scenes
      .find((scene) => scene.key === SCENE_KEY)
      ?.objects.find((object) => object.name === PLAYER_NAME);
    if (!player || player.bodyVelocityX === null || player.bodyVelocityY === null) {
      throw new Error('Moonflower Glade player velocity diagnostics are unavailable.');
    }

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
    return {
      distance: Math.hypot(player.x - activeStart.x, player.y - activeStart.y),
      speed: Math.hypot(player.bodyVelocityX, player.bodyVelocityY),
      performance,
    };
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
  test.skip(
    !supportedProject,
    'R3.4 movement evidence runs on Chromium tablet and phone profiles.',
  );

  await seedIntroducedPip(page);
  const cdp = await page.context().newCDPSession(page);

  await loadGlade(page);
  const normalHealthBefore = await sceneHealth(page);
  const normalWalk = await measureMovement(page, cdp, projectName, false);
  const normalGallop = await measureMovement(page, cdp, projectName, true);
  await page.waitForTimeout(400);
  const normalHealthAfter = await sceneHealth(page);

  expect(normalWalk.distance).toBeGreaterThan(8);
  expect(normalWalk.speed).toBeGreaterThan(240);
  expect(normalGallop.speed / normalWalk.speed).toBeGreaterThan(1.48);
  expect(normalGallop.speed / normalWalk.speed).toBeLessThan(1.72);
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

  expect(constrainedWalk.distance).toBeGreaterThan(8);
  expect(constrainedWalk.speed / normalWalk.speed).toBeGreaterThan(0.85);
  expect(constrainedWalk.speed / normalWalk.speed).toBeLessThan(1.15);
  expect(constrainedGallop.speed / normalGallop.speed).toBeGreaterThan(0.85);
  expect(constrainedGallop.speed / normalGallop.speed).toBeLessThan(1.15);
  expect(constrainedGallop.speed / constrainedWalk.speed).toBeGreaterThan(1.48);
  expect(constrainedGallop.speed / constrainedWalk.speed).toBeLessThan(1.72);
  expect(constrainedWalk.performance.sampleCount).toBeGreaterThanOrEqual(MOVEMENT_SAMPLE_FRAMES);
  expect(constrainedGallop.performance.sampleCount).toBeGreaterThanOrEqual(MOVEMENT_SAMPLE_FRAMES);
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
