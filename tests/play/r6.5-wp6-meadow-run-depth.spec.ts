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

test('Rainbow Meadow exposes a dense set of non-race reasons to stop', async ({ page }) => {
  await waitForDiagnostics(page);
  await startScene(page, 'RainbowMeadowScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    return scene?.objects.some(({ name }) => name === 'meadow-depth:windmill-landmark') ?? false;
  });

  const meadow = await sceneSnapshot(page, 'RainbowMeadowScene');
  const depthObjects = meadow.objects.filter(({ name }) => name.startsWith('meadow-depth:'));
  expect(depthObjects.some(({ name }) => name === 'meadow-depth:windmill-story')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'meadow-depth:rainbow-pond')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'meadow-depth:picnic-hill')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'meadow-depth:flower-circle')).toBe(true);
  expect(depthObjects.some(({ name }) => name === 'meadow-depth:rainbow-cup-board')).toBe(true);
  expect(depthObjects.length).toBeGreaterThanOrEqual(10);

  expect(meadow.objects.some(({ name }) => name === 'supporting-resident:resident:clover')).toBe(
    true,
  );
  expect(meadow.objects.some(({ name }) => name === 'supporting-resident:resident:breeze')).toBe(
    true,
  );
  expect(meadow.objects.some(({ name }) => name === 'supporting-resident:resident:maple')).toBe(
    true,
  );
});

test('Windmill Lookout is a real movable micro-location rather than a decorative marker', async ({
  page,
}) => {
  await waitForDiagnostics(page);
  await startScene(page, 'WindmillLookoutScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics?.snapshot().scenes.find(({ key }) => key === 'WindmillLookoutScene');
    return scene?.objects.some(({ name }) => name === 'windmill-lookout:tower') ?? false;
  });

  const lookout = await sceneSnapshot(page, 'WindmillLookoutScene');
  expect(lookout.objects.some(({ name }) => name === 'windmill-lookout:sky')).toBe(true);
  expect(lookout.objects.some(({ name }) => name === 'windmill-lookout:tower')).toBe(true);
  expect(lookout.objects.some(({ name }) => name === 'windmill-lookout:rail')).toBe(true);
  expect(lookout.objects.some(({ name }) => name === 'windmill-lookout:sky-glint')).toBe(true);
  expect(lookout.objects.some(({ name }) => name === 'windmill-lookout:exit')).toBe(true);
});
