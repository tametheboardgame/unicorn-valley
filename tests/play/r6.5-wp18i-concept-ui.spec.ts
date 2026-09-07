import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  name: string;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    diagnostics.startScene(key);
  }, sceneKey);
  await page.waitForFunction((expectedScene) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene) === true;
  }, sceneKey);
}

async function getScene(page: Page, sceneKey: string): Promise<DiagnosticSceneSnapshot> {
  return page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics?.snapshot().scenes.find((candidate) => candidate.key === key);
    if (!scene) {
      throw new Error(`Missing scene ${key}.`);
    }
    return scene;
  }, sceneKey);
}

function objectByName(scene: DiagnosticSceneSnapshot, name: string): DiagnosticObjectSnapshot {
  const object = scene.objects.find((candidate) => candidate.name === name);
  if (!object) {
    throw new Error(`Missing ${name}.`);
  }
  return object;
}

const TABLET_VIEWPORTS = [
  { name: '16:9', width: 1280, height: 720 },
  { name: '16:10 reference', width: 1280, height: 800 },
  { name: '4:3', width: 1024, height: 768 },
  { name: 'small landscape', width: 960, height: 600 },
  { name: 'large landscape', width: 1600, height: 1000 },
] as const;

const CORE_HUD_OBJECTS = [
  'exploration-shell-map-button',
  'exploration-shell-bag-button',
  'exploration-shell-book-button',
  'exploration-shell-settings-nav-button',
  'exploration-shell-shimmer-panel',
  'exploration-location-title-panel',
  'tablet-movement-pad',
  'touch-movement-gallop',
  'exploration-tablet-hint-panel',
] as const;

test.describe('R6.5-WP18I concept-grade tablet HUD', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: true });

  test('uses the approved concept hierarchy instead of scattered HUD boxes', async ({ page }) => {
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'MoonflowerGladeScene');
    const scene = await getScene(page, 'MoonflowerGladeScene');

    const map = objectByName(scene, 'exploration-shell-map-button');
    const bag = objectByName(scene, 'exploration-shell-bag-button');
    const book = objectByName(scene, 'exploration-shell-book-button');
    const settings = objectByName(scene, 'exploration-shell-settings-nav-button');
    for (const item of [map, bag, book, settings]) {
      expect(item.visible).toBe(true);
      expect(item.y).toBeCloseTo(52, 0);
      expect(item.displayHeight).toBeGreaterThanOrEqual(64);
    }
    expect(map.x).toBeLessThan(bag.x);
    expect(bag.x).toBeLessThan(book.x);
    expect(book.x).toBeLessThan(settings.x);
    expect(settings.x - map.x).toBeLessThan(430);

    const shimmer = objectByName(scene, 'exploration-shell-shimmer-panel');
    const location = objectByName(scene, 'exploration-location-title-panel');
    expect(shimmer.visible).toBe(true);
    expect(location.visible).toBe(true);
    expect(shimmer.y).toBeCloseTo(52, 0);
    expect(location.y).toBeCloseTo(52, 0);
    expect(shimmer.x).toBeGreaterThan(settings.x);
    expect(location.x).toBeGreaterThan(shimmer.x);

    const movementPad = objectByName(scene, 'tablet-movement-pad');
    const gallop = objectByName(scene, 'touch-movement-gallop');
    const hint = objectByName(scene, 'exploration-tablet-hint-panel');
    expect(movementPad.visible).toBe(true);
    expect(movementPad.x).toBeLessThan(280);
    expect(movementPad.y).toBeGreaterThan(470);
    expect(gallop.visible).toBe(true);
    expect(gallop.x).toBeGreaterThan(1120);
    expect(gallop.y).toBeGreaterThan(500);
    expect(hint.visible).toBe(true);
    expect(hint.x).toBeGreaterThan(420);
    expect(hint.x).toBeLessThan(860);
    expect(hint.y).toBeGreaterThan(630);

    const contextualAction = objectByName(scene, 'exploration-interaction-prompt');
    expect(contextualAction.x).toBeGreaterThan(930);
    expect(contextualAction.x).toBeLessThan(gallop.x);
    expect(contextualAction.y).toBeGreaterThan(500);
  });

  test('keeps the concept composition contained across the landscape tablet matrix', async ({
    page,
  }) => {
    for (const viewport of TABLET_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/?diagnostics=1');
      await waitForDiagnostics(page);
      await startScene(page, 'RainbowMeadowScene');

      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      }));
      expect(metrics.scrollWidth, `${viewport.name} horizontal overflow`).toBeLessThanOrEqual(
        metrics.width,
      );
      expect(metrics.scrollHeight, `${viewport.name} vertical overflow`).toBeLessThanOrEqual(
        metrics.height,
      );

      const scene = await getScene(page, 'RainbowMeadowScene');
      for (const name of CORE_HUD_OBJECTS) {
        expect(objectByName(scene, name).visible, `${viewport.name}: ${name}`).toBe(true);
      }
    }
  });

  test('reconciles Bag and Settings controls into the shared rounded surface system', async ({
    page,
  }) => {
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await page.waitForTimeout(700);

    await startScene(page, 'InventoryScene');
    await page.waitForTimeout(250);
    const bag = await getScene(page, 'InventoryScene');
    for (const name of [
      'concept-modal-surface:inventory-modal-panel',
      'concept-modal-surface:bag-close-button',
      'concept-modal-surface:bag-list-panel',
      'concept-modal-surface:bag-detail-panel',
      'concept-modal-surface:bag-shop-button',
    ]) {
      expect(objectByName(bag, name).visible, name).toBe(true);
    }

    await startScene(page, 'SettingsScene');
    await page.waitForTimeout(250);
    const settings = await getScene(page, 'SettingsScene');
    for (const name of [
      'concept-modal-surface:settings-panel',
      'concept-modal-surface:settings-done',
      'concept-modal-surface:settings-row-muted',
    ]) {
      expect(objectByName(settings, name).visible, name).toBe(true);
    }
  });
});
