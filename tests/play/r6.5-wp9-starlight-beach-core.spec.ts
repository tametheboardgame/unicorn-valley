import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  active: boolean;
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
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene) === true;
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    diagnostics?.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
}

async function movePlayer(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ key, nextX, nextY }) => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      diagnostics?.setArcadeSpritePosition(key, 'world-player-unicorn', nextX, nextY);
    },
    { key: sceneKey, nextX: x, nextY: y },
  );
}

test('Starlight Beach boots as a playable first-class exploration region', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/?scene=beach&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForScene(page, 'StarlightBeachScene');
  await page.waitForTimeout(450);

  const snapshot = await page.evaluate(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot() ?? null;
  });
  const beach = snapshot?.scenes.find(({ key }) => key === 'StarlightBeachScene');
  const player = beach?.objects.find(({ name }) => name === 'world-player-unicorn');

  expect(browserErrors).toEqual([]);
  expect(beach).toBeTruthy();
  expect(player?.visible).toBe(true);
  expect(player?.active).toBe(true);
  expect(
    beach?.objects.some(({ name }) => name === 'gateway:starlight-beach-whispering-woods'),
  ).toBe(true);
});

test('Whispering Woods and Starlight Beach connect through the physical walk-through gateway', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'WhisperingWoodsScene');

  await movePlayer(page, 'WhisperingWoodsScene', 3180, 1690);
  await waitForScene(page, 'StarlightBeachScene');

  await movePlayer(page, 'StarlightBeachScene', 120, 1140);
  await waitForScene(page, 'WhisperingWoodsScene');

  const activeScenes = await page.evaluate(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes ?? [];
  });
  expect(activeScenes).toContain('WhisperingWoodsScene');
  expect(activeScenes).not.toContain('StarlightBeachScene');
});
