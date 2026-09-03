import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  interactive: boolean;
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
  await page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are not installed.');
    }
    diagnostics.startScene(key);
  }, sceneKey);
  await page.waitForFunction((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(key) ?? false;
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

test('WP11 exposes the exploration-discovered Brook thread on a fresh save', async ({ page }) => {
  await waitForDiagnostics(page);
  await startScene(page, 'CrystalBrookScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const brook = diagnostics?.snapshot().scenes.find(({ key }) => key === 'CrystalBrookScene');
    return brook?.objects.some(({ name }) => name === 'wp11-story:odd-stone-bank') ?? false;
  });

  const brook = await sceneSnapshot(page, 'CrystalBrookScene');
  const oddStone = brook.objects.find(({ name }) => name === 'wp11-story:odd-stone-bank');
  expect(oddStone).toBeTruthy();
  expect(oddStone?.visible).toBe(true);
  expect(oddStone?.interactive).toBe(true);
});

test('WP11 does not expose later Meadow route beats before their story prerequisites', async ({
  page,
}) => {
  await waitForDiagnostics(page);
  await startScene(page, 'RainbowMeadowScene');
  await page.waitForTimeout(250);

  const meadow = await sceneSnapshot(page, 'RainbowMeadowScene');
  const wp11Objects = meadow.objects.filter(({ name }) => name.startsWith('wp11-story:'));
  expect(wp11Objects.some(({ name }) => name === 'wp11-story:clover-route-card')).toBe(false);
  expect(wp11Objects.some(({ name }) => name === 'wp11-story:no-finish-pond-turn')).toBe(false);
  expect(wp11Objects.some(({ name }) => name === 'wp11-story:no-finish-picnic-turn')).toBe(false);
  expect(wp11Objects.some(({ name }) => name === 'wp11-story:no-finish-windmill-turn')).toBe(false);
});
