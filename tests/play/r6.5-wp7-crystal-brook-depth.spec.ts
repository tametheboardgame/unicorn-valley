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

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    try {
      diagnostics?.startScene(key);
      return diagnostics?.snapshot().activeScenes.includes(key) ?? false;
    } catch {
      return false;
    }
  }, sceneKey);
}

async function sceneSnapshot(page: Page, sceneKey: string): Promise<DiagnosticScene> {
  return page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics?.snapshot().scenes.find((candidate) => candidate.key === key);
    if (!scene) {
      throw new Error(`Missing diagnostics for ${key}.`);
    }
    return scene;
  }, sceneKey);
}

test('Crystal Brook exposes repeated non-race curiosity and an Echo resident', async ({ page }) => {
  await waitForDiagnostics(page);
  await startScene(page, 'CrystalBrookScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics?.snapshot().scenes.find(({ key }) => key === 'CrystalBrookScene');
    return (
      scene?.objects.some(({ name }) => name === 'brook-depth:crystal-grotto-entrance') ?? false
    );
  });

  const brook = await sceneSnapshot(page, 'CrystalBrookScene');
  const depthObjects = brook.objects.filter(({ name }) => name.startsWith('brook-depth:'));
  expect(depthObjects.some(({ name }) => name === 'brook-depth:echo-crystal-song')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'brook-depth:crystal-grotto')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'brook-depth:waterfall-mist')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'brook-depth:reflection-pool')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'brook-depth:stepping-chime')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'brook-depth:singing-crystals')).toBe(true);
  expect(depthObjects.length).toBeGreaterThanOrEqual(10);
  expect(brook.objects.some(({ name }) => name === 'supporting-resident:resident:echo')).toBe(true);
});

test('Crystal Grotto is a real movable micro-location with three authored notes', async ({
  page,
}) => {
  await waitForDiagnostics(page);
  await startScene(page, 'CrystalGrottoScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics?.snapshot().scenes.find(({ key }) => key === 'CrystalGrottoScene');
    return scene?.objects.some(({ name }) => name === 'crystal-grotto:room') ?? false;
  });

  const grotto = await sceneSnapshot(page, 'CrystalGrottoScene');
  expect(grotto.objects.some(({ name }) => name === 'crystal-grotto:room')).toBe(true);
  expect(grotto.objects.some(({ name }) => name === 'crystal-grotto:pool')).toBe(true);
  expect(grotto.objects.some(({ name }) => name === 'crystal-grotto:low-crystal')).toBe(true);
  expect(grotto.objects.some(({ name }) => name === 'crystal-grotto:bright-crystal')).toBe(true);
  expect(grotto.objects.some(({ name }) => name === 'crystal-grotto:bell-crystal')).toBe(true);
  expect(grotto.objects.some(({ name }) => name === 'crystal-grotto:exit')).toBe(true);
});
