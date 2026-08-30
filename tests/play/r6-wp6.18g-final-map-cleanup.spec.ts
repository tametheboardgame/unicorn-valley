import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  text: string | null;
  x: number;
  y: number;
  visible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
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

async function startScene(page: Page, sceneKey: string): Promise<DiagnosticScene> {
  await page.evaluate((key) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
  await page.waitForTimeout(420);
  return sceneSnapshot(page, sceneKey);
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

test('Pebble uses production character art without the legacy story circle', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  const village = await startScene(page, 'SunbeamVillageScene');

  expect(named(village, 'core-npc:pebble:world').visible).toBe(true);
  expect(named(village, 'r6-wp6.18g:pebble-story-cover').visible).toBe(false);
  expect(named(village, 'r6-wp6.18g:pebble-story-icon').visible).toBe(false);
  expect(village.objects.some((object) => object.text?.startsWith('Talk: Pebble'))).toBe(true);
});

test('Crystal Brook meadow branch replaces the ribbon-board crossing', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  const meadow = await startScene(page, 'RainbowMeadowScene');

  expect(named(meadow, 'r6-region-gateway-art:meadow-crystal-brook:path').visible).toBe(false);
  expect(named(meadow, 'r6-region-gateway-art:meadow-crystal-brook:divider').visible).toBe(false);
  expect(named(meadow, 'r6-wp6.18g:meadow-crystal-brook:path').visible).toBe(true);
  expect(named(meadow, 'r6-region-gateway-art:meadow-crystal-brook:cave-mouth').visible).toBe(true);
});

test('production region gateways suppress their legacy R5 sign labels', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  const meadow = await startScene(page, 'RainbowMeadowScene');
  expect(named(meadow, 'r6-wp6.18g:legacy-gateway-label:meadow-crystal-brook').visible).toBe(false);

  const brook = await startScene(page, 'CrystalBrookScene');
  for (const id of [
    'crystal-brook-meadow',
    'crystal-brook-whispering-woods',
    'crystal-brook-crystal-cascade',
  ]) {
    expect(named(brook, `r6-wp6.18g:legacy-gateway-label:${id}`).visible).toBe(false);
  }

  const woods = await startScene(page, 'WhisperingWoodsScene');
  expect(
    named(woods, 'r6-wp6.18g:legacy-gateway-label:whispering-woods-crystal-brook').visible,
  ).toBe(false);
});
