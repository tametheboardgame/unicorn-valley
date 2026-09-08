import { expect, type Page, test } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
  textureKey: string | null;
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
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene) === true;
  }, sceneKey);
}

async function waitForObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ expectedScene, expectedName }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return (
        diagnostics
          ?.snapshot()
          .scenes.find(({ key }) => key === expectedScene)
          ?.objects.some(({ name }) => name === expectedName) === true
      );
    },
    { expectedScene: sceneKey, expectedName: objectName },
  );
}

function namedObject(scene: DiagnosticScene, name: string): DiagnosticObject {
  const object = scene.objects.find((candidate) => candidate.name === name);
  if (!object) {
    throw new Error(`Missing diagnostic object: ${name}`);
  }
  return object;
}

async function startRegisteredScene(page: Page, sceneKey: string): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
  await expect
    .poll(async () =>
      page.evaluate((key) => {
        const api = (
          window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
        ).__UNICORN_VALLEY_DIAGNOSTICS__;
        if (!api) {
          return false;
        }
        try {
          api.startScene(key, { returnScene: 'MoonflowerGladeScene' });
          return true;
        } catch {
          return false;
        }
      }, sceneKey),
    )
    .toBe(true);
  await waitForScene(page, sceneKey);
}

test('production storybook shell is present on the core modal UI scenes', async ({ page }) => {
  test.setTimeout(75_000);
  for (const [route, sceneKey] of [
    ['inventory', 'InventoryScene'],
    ['shop', 'ShopScene'],
    ['wonderbook', 'WonderbookScene'],
  ] as const) {
    await startRegisteredScene(page, sceneKey);
    const canonicalAnchor =
      sceneKey === 'InventoryScene'
        ? 'inventory-modal-panel'
        : sceneKey === 'WonderbookScene'
          ? 'wonderbook-page-content'
          : `ui-production:${sceneKey}:anchor`;
    await waitForObject(page, sceneKey, canonicalAnchor);
    const scene = (await snapshot(page)).scenes.find(({ key }) => key === sceneKey);
    expect(scene).toBeTruthy();
    if (sceneKey === 'ShopScene') {
      expect(
        scene?.objects.some(({ name }) => name === `ui-production:${sceneKey}:ornaments`),
      ).toBe(true);
    }
    await page.screenshot({ path: `playtest-artifacts/screenshots/wp6.4-${route}.png` });
  }
});

test('Wonderbook production tabs remain large interactive navigation controls', async ({
  page,
}) => {
  test.setTimeout(75_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await startRegisteredScene(page, 'WonderbookScene');
  await waitForObject(page, 'WonderbookScene', 'wonderbook-tab-secrets');

  let scene = (await snapshot(page)).scenes.find(({ key }) => key === 'WonderbookScene');
  expect(scene).toBeTruthy();
  if (!scene) {
    return;
  }

  const allTab = namedObject(scene, 'wonderbook-tab-all');
  const secretsTab = namedObject(scene, 'wonderbook-tab-secrets');
  expect(allTab.interactive).toBe(true);
  expect(secretsTab.interactive).toBe(true);
  const canvas = await page.locator('canvas').boundingBox();
  expect(canvas).not.toBeNull();
  const renderedScale = (canvas?.height ?? 0) / 720;
  expect(allTab.displayHeight * renderedScale).toBeGreaterThanOrEqual(48);
  expect(secretsTab.displayHeight * renderedScale).toBeGreaterThanOrEqual(48);
  expect(Math.abs(secretsTab.x - allTab.x)).toBeGreaterThan(150);

  await page.mouse.click(secretsTab.x, secretsTab.y);
  await page.waitForTimeout(300);
  scene = (await snapshot(page)).scenes.find(({ key }) => key === 'WonderbookScene');
  expect(scene).toBeTruthy();
  expect(scene?.objects.some(({ name }) => name === 'wonderbook-page-content')).toBe(true);
});

test('dialogue and sound settings expose explicit production interaction states', async ({
  page,
}) => {
  test.setTimeout(75_000);
  await page.goto('/?scene=lumi-story&diagnostics=1');
  await waitForScene(page, 'LumiStoryScene');
  await waitForObject(page, 'LumiStoryScene', 'dialogue-production-panel');
  let scene = (await snapshot(page)).scenes.find(({ key }) => key === 'LumiStoryScene');
  expect(scene).toBeTruthy();
  if (scene) {
    expect(namedObject(scene, 'dialogue-production-continue').interactive).toBe(true);
  }

  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');
  await waitForObject(page, 'MoonflowerGladeScene', 'exploration-shell-settings-nav-button');
  scene = (await snapshot(page)).scenes.find(({ key }) => key === 'MoonflowerGladeScene');
  expect(scene).toBeTruthy();
  if (!scene) {
    return;
  }

  const settingsButton = namedObject(scene, 'exploration-shell-settings-nav-button');
  expect(settingsButton.interactive).toBe(true);
  await page.mouse.click(settingsButton.x, settingsButton.y);
  await waitForScene(page, 'SettingsScene');
  await waitForObject(page, 'SettingsScene', 'settings-row-muted');
  scene = (await snapshot(page)).scenes.find(({ key }) => key === 'SettingsScene');
  expect(scene).toBeTruthy();
  if (scene) {
    for (const name of [
      'settings-row-muted',
      'settings-row-music',
      'settings-row-ambience',
      'settings-row-sfx',
    ]) {
      expect(namedObject(scene, name).interactive).toBe(true);
    }
  }
});
