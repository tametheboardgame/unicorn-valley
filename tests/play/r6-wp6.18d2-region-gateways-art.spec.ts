import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
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

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
  await page.waitForTimeout(220);
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

function expectNamed(scene: DiagnosticScene, name: string): DiagnosticObject {
  const object = scene.objects.find((candidate) => candidate.name === name);
  expect(object, `Expected ${name} in ${scene.key}`).toBeTruthy();
  return object as DiagnosticObject;
}

test('Rainbow Meadow keeps the accepted Crystal Brook waterfall basin', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'RainbowMeadowScene');

  const meadow = await sceneSnapshot(page, 'RainbowMeadowScene');
  expectNamed(meadow, 'r6-region-gateway-art:meadow-crystal-brook:pool');
  expectNamed(meadow, 'r6-region-gateway-art:meadow-crystal-brook:waterfall');
  expectNamed(meadow, 'r6-region-gateway-art:meadow-crystal-brook:outlet-stream');
  expectNamed(meadow, 'r6-region-gateway-art:meadow-crystal-brook:sign');
});

test('Crystal Brook owns its gorge while keeping the current east routes area-authored', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'CrystalBrookScene');

  const brook = await sceneSnapshot(page, 'CrystalBrookScene');
  expectNamed(brook, 'crystal-brook:meadow-gorge:recess');
  expectNamed(brook, 'crystal-brook:meadow-gorge:path-floor');
  expectNamed(brook, 'crystal-brook:meadow-gorge:water-throat');
  expectNamed(brook, 'r6-region-gateway-art:crystal-brook:east-woodland');
  expectNamed(brook, 'r6-region-gateway-art:crystal-cup-raceway:edge-exit');
  expectNamed(brook, 'r6-region-gateway-art:crystal-brook:production-upgrade');

  expect(
    brook.objects.some((object) => object.name === 'r6-region-gateway-art:brook-meadow:cave-mouth'),
  ).toBe(false);
});

test('Whispering Woods opens through a woodland threshold and denser forest treatment', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'WhisperingWoodsScene');

  const woods = await sceneSnapshot(page, 'WhisperingWoodsScene');
  expectNamed(woods, 'r6-region-gateway-art:woods-brook:woodland-threshold');
  expectNamed(woods, 'r6-region-gateway-art:woods-entry-trail:path');
  expectNamed(woods, 'r6-region-gateway-art:whispering-woods:production-upgrade');
  expectNamed(woods, 'r6-region-gateway-art:whispering-woods:light-shafts');
});
