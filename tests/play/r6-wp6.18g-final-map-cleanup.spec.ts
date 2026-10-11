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
  await startScene(page, 'SunbeamVillageScene');
  await expect
    .poll(async () => {
      const village = await sceneSnapshot(page, 'SunbeamVillageScene');
      return village.objects.find((object) => object.name === 'core-npc:pebble:world')?.visible;
    })
    .toBe(true);

  const village = await sceneSnapshot(page, 'SunbeamVillageScene');
  expect(named(village, 'core-npc:pebble:world').visible).toBe(true);
  expect(village.objects.some((object) => object.name === 'r6-wp6.18g:pebble-story-cover')).toBe(
    false,
  );
  expect(village.objects.some((object) => object.name === 'r6-wp6.18g:pebble-story-icon')).toBe(
    false,
  );
  expect(village.objects.some((object) => object.text?.startsWith('Pebble Talk'))).toBe(false);
});
