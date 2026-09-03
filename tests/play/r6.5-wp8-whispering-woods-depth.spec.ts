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

test('Whispering Woods has dense WP8 curiosity, Fern life and a physical Lantern state', async ({
  page,
}) => {
  await waitForDiagnostics(page);
  await startScene(page, 'WhisperingWoodsScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const woods = diagnostics?.snapshot().scenes.find(({ key }) => key === 'WhisperingWoodsScene');
    return (
      woods?.objects.some(({ name }) => name === 'woods-depth:firefly-grove-entrance') &&
      woods.objects.some(({ name }) => name === 'supporting-resident:resident:fern') &&
      woods.objects.some(({ name }) => name === 'firefly-lantern-world-status')
    );
  });

  const woods = await sceneSnapshot(page, 'WhisperingWoodsScene');
  const depthObjects = woods.objects.filter(({ name }) => name.startsWith('woods-depth:'));
  expect(depthObjects.some(({ name }) => name === 'woods-depth:fern-firefly-clue')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'woods-depth:firefly-grove')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'woods-depth:mooncap-sequence')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'woods-depth:mushroom-ring')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'woods-depth:tiny-tracks')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'woods-depth:hidden-leaf-path')).toBe(true);
  expect(depthObjects.length).toBeGreaterThanOrEqual(11);

  const lanternStatus = woods.objects.find(({ name }) => name === 'firefly-lantern-world-status');
  expect(lanternStatus?.text).toContain('golden lights');
});

test('Firefly Grove is a real movable micro-location with authored story landmarks', async ({
  page,
}) => {
  await waitForDiagnostics(page);
  await startScene(page, 'FireflyGroveScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const grove = diagnostics?.snapshot().scenes.find(({ key }) => key === 'FireflyGroveScene');
    return grove?.objects.some(({ name }) => name === 'firefly-grove:room') ?? false;
  });

  const grove = await sceneSnapshot(page, 'FireflyGroveScene');
  expect(grove.objects.some(({ name }) => name === 'firefly-grove:room')).toBe(true);
  expect(grove.objects.some(({ name }) => name === 'firefly-grove:pool')).toBe(true);
  expect(grove.objects.some(({ name }) => name === 'firefly-grove:friendly-tree')).toBe(true);
  expect(grove.objects.some(({ name }) => name === 'firefly-grove:lantern-plant')).toBe(true);
  expect(grove.objects.some(({ name }) => name === 'firefly-grove:exit')).toBe(true);
});
