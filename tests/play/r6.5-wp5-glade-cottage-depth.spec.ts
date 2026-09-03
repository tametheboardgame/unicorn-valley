import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
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

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const value = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
    if (!value) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return value;
  });
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(key);
  }, sceneKey);
  await page.waitForFunction((key) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot().activeScenes.includes(key);
  }, sceneKey);
}

function sceneFrom(value: DiagnosticSnapshot, key: string): DiagnosticScene {
  const scene = value.scenes.find((candidate) => candidate.key === key);
  if (!scene) {
    throw new Error(`Missing diagnostics for ${key}.`);
  }
  return scene;
}

test('Moonflower Glade gains authored home-depth interactions', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
  await startScene(page, 'MoonflowerGladeScene');
  await page.waitForFunction(() =>
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find(({ key }) => key === 'MoonflowerGladeScene')
      ?.objects.some(({ name }) => name === 'glade-depth:hollow-tree'),
  );

  const glade = sceneFrom(await snapshot(page), 'MoonflowerGladeScene');
  expect(glade.objects.some(({ name }) => name === 'glade-depth:hollow-tree')).toBe(true);
  expect(glade.objects.some(({ name }) => name === 'glade-depth:moonflower-bridge')).toBe(true);
  expect(glade.objects.some(({ name }) => name === 'glade-depth:garden-corner')).toBe(true);
});

test('Hollow Tree Nook is a real usable micro-location and Cottage has tactile home verbs', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );

  await startScene(page, 'HollowTreeNookScene');
  let current = sceneFrom(await snapshot(page), 'HollowTreeNookScene');
  expect(current.objects.some(({ name }) => name === 'hollow-tree-nook:room')).toBe(true);
  expect(current.objects.some(({ name }) => name === 'hollow-tree-nook:heart-shelf')).toBe(true);
  expect(current.objects.some(({ name }) => name === 'hollow-tree-nook:exit')).toBe(true);

  await startScene(page, 'CottageInteriorScene');
  await page.waitForFunction(() =>
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find(({ key }) => key === 'CottageInteriorScene')
      ?.objects.some(({ name }) => name === 'cottage-depth:bed'),
  );
  current = sceneFrom(await snapshot(page), 'CottageInteriorScene');
  expect(current.objects.some(({ name }) => name === 'cottage-depth:bed')).toBe(true);
  expect(current.objects.some(({ name }) => name === 'cottage-depth:sofa')).toBe(true);
  expect(current.objects.some(({ name }) => name === 'cottage-depth:companion-corner')).toBe(true);
});
