import { expect, test, type Page } from '@playwright/test';
import { INTERACTIVE_GATEWAY_RADIUS } from '../../src/game/world/RegionGatewayRules';

const WORLD_PLAYER_NAME = 'world-player-unicorn';
const CASCADE_TAP_TARGET = 'r6-wp6.18ij:crystal-cascade-tap-target';
const SUNRISE_SPRINT_RACE_ID = 'race-course:rainbow-run-sunrise-sprint';
const CASCADE_GATE_POSITION = { x: 2860, y: 850 } as const;
const CASCADE_APPROACH_POSITION = { x: 2745, y: 930 } as const;

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  depth: number;
  visible: boolean;
  interactive: boolean;
}

interface DiagnosticScene {
  key: string;
  camera: {
    worldX: number;
    worldY: number;
    worldWidth: number;
    worldHeight: number;
  };
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
  await page.waitForTimeout(420);
}

async function sceneSnapshot(page: Page, sceneKey: string): Promise<DiagnosticScene> {
  return page.evaluate((key) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const scene = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((candidate) => candidate.key === key);
    if (!scene) {
      throw new Error(`Missing diagnostics for ${key}.`);
    }
    return scene;
  }, sceneKey);
}

function named(scene: DiagnosticScene, name: string): DiagnosticObject {
  const object = scene.objects.find((candidate) => candidate.name === name);
  expect(object, `Expected ${name} in ${scene.key}`).toBeTruthy();
  return object as DiagnosticObject;
}

async function unlockCrystalCascade(page: Page): Promise<void> {
  await page.evaluate((raceId) => {
    const primaryKey = 'unicorn-valley.save';
    const checkpointKey = `${primaryKey}.schema.2`;
    const raw = localStorage.getItem(checkpointKey) ?? localStorage.getItem(primaryKey);
    if (!raw) {
      throw new Error('Expected Crystal Brook to create a save before unlocking the race.');
    }
    const save = JSON.parse(raw) as {
      activities: { racesById: Record<string, { bestTimeMs: number | null; ribbonIds: string[] }> };
    };
    save.activities.racesById[raceId] = { bestTimeMs: 12_345, ribbonIds: [] };
    const serialised = JSON.stringify(save);
    localStorage.setItem(primaryKey, serialised);
    localStorage.setItem(checkpointKey, serialised);
  }, SUNRISE_SPRINT_RACE_ID);
}

async function positionPlayerAtCascadeGate(page: Page): Promise<void> {
  await page.evaluate(
    ({ sceneKey, objectName, x, y }) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      diagnostics.setArcadeSpritePosition(sceneKey, objectName, x, y);
    },
    {
      sceneKey: 'CrystalBrookScene',
      objectName: WORLD_PLAYER_NAME,
      x: CASCADE_APPROACH_POSITION.x,
      y: CASCADE_APPROACH_POSITION.y,
    },
  );

  await expect
    .poll(async () => {
      const brook = await sceneSnapshot(page, 'CrystalBrookScene');
      const player = brook.objects.find((object) => object.name === WORLD_PLAYER_NAME);
      if (!player) {
        return Number.POSITIVE_INFINITY;
      }
      return Math.hypot(
        player.x - CASCADE_GATE_POSITION.x,
        player.y - CASCADE_GATE_POSITION.y,
      );
    })
    .toBeLessThanOrEqual(INTERACTIVE_GATEWAY_RADIUS);
}

async function tapWorldObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const point = await page.evaluate(
    ({ key, name }) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      const scene = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.find((candidate) => candidate.key === key);
      const target = scene?.objects.find((candidate) => candidate.name === name);
      const canvas = document.querySelector<HTMLCanvasElement>('#game-container canvas');
      if (!scene || !target || !canvas) {
        throw new Error(`Cannot map ${name} to the visible game canvas.`);
      }
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + ((target.x - scene.camera.worldX) / scene.camera.worldWidth) * rect.width,
        y: rect.top + ((target.y - scene.camera.worldY) / scene.camera.worldHeight) * rect.height,
      };
    },
    { key: sceneKey, name: objectName },
  );
  await page.touchscreen.tap(point.x, point.y);
}

test.use({ hasTouch: true, viewport: { width: 412, height: 915 } });

test('gateway path branches use the native map path treatment instead of coloured overlays', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await startScene(page, 'RainbowMeadowScene');
  const meadow = await sceneSnapshot(page, 'RainbowMeadowScene');
  expect(named(meadow, 'r6-region-gateway-art:meadow-crystal-brook:path').visible).toBe(false);
  const meadowPath = named(meadow, 'r6-wp6.18g:meadow-crystal-brook:path');
  expect(meadowPath.visible).toBe(true);
  expect(meadowPath.depth).toBeLessThan(3);

  await startScene(page, 'CrystalBrookScene');
  const brook = await sceneSnapshot(page, 'CrystalBrookScene');
  expect(named(brook, 'r6-region-gateway-art:brook-woods:path').visible).toBe(false);
  expect(named(brook, 'r6-region-gateway-art:crystal-cascade:path').visible).toBe(false);

  const woodsPath = named(brook, 'r6-wp6.18ij:brook-woods:path');
  const cascadePath = named(brook, 'r6-wp6.18ij:crystal-cascade:path');
  expect(woodsPath.visible).toBe(true);
  expect(cascadePath.visible).toBe(true);
  expect(woodsPath.depth).toBeLessThan(3);
  expect(cascadePath.depth).toBeLessThan(3);
});

test('a real mobile tap on the enlarged Crystal Cascade gate enters the race', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'CrystalBrookScene');
  await unlockCrystalCascade(page);
  await positionPlayerAtCascadeGate(page);

  await expect
    .poll(async () => {
      const brook = await sceneSnapshot(page, 'CrystalBrookScene');
      const target = brook.objects.find((object) => object.name === CASCADE_TAP_TARGET);
      return target?.visible === true && target.interactive === true;
    })
    .toBe(true);

  await page.waitForTimeout(300);
  await tapWorldObject(page, 'CrystalBrookScene', CASCADE_TAP_TARGET);
  await waitForScene(page, 'RaceScene');

  await expect
    .poll(async () => {
      const race = await sceneSnapshot(page, 'RaceScene');
      return race.objects.some((object) => object.name === 'crystal-cascade-course-presentation');
    })
    .toBe(true);
});
