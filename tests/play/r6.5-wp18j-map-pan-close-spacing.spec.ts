import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  interactive: boolean;
  alpha: number;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: Array<{ key: string; objects: DiagnosticObject[] }>;
  };
  startScene(sceneKey: string, data?: object): void;
}

async function openDiagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, sceneData }) => {
      const api = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are not installed.');
      }
      api.startScene(key, sceneData);
    },
    { key: sceneKey, sceneData: data },
  );
  await page.waitForFunction((key) => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(key) ?? false;
  }, sceneKey);
}

async function sceneObjects(page: Page, sceneKey: string): Promise<DiagnosticObject[]> {
  return page.evaluate((key) => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().scenes.find((scene) => scene.key === key)?.objects ?? [];
  }, sceneKey);
}

async function waitForObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await expect
    .poll(async () => {
      const objects = await sceneObjects(page, sceneKey);
      return objects.some(({ name, visible }) => name === objectName && visible);
    })
    .toBe(true);
}

async function dragCanvasLogical(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  const box = await page.locator('canvas').boundingBox();
  if (!box) {
    throw new Error('Game canvas is not visible.');
  }
  const screenPoint = ({ x, y }: { x: number; y: number }) => ({
    x: box.x + (box.width * x) / 1280,
    y: box.y + (box.height * y) / 720,
  });
  const start = screenPoint(from);
  const end = screenPoint(to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
}

test.use({ viewport: { width: 1280, height: 720 }, hasTouch: true });

test('Bag uses a glyph-only close control and a lower aligned pocket row', async ({ page }) => {
  await openDiagnostics(page);
  await startScene(page, 'InventoryScene', { returnScene: 'TitleScene', initialTab: 'items' });
  await waitForObject(page, 'InventoryScene', 'wp18j-inventory-close-icon');

  const objects = await sceneObjects(page, 'InventoryScene');
  const closeHitArea = objects.find(({ name }) => name === 'bag-close-button');
  const closeIcon = objects.find(({ name }) => name === 'wp18j-inventory-close-icon');
  const foodTab = objects.find(({ name }) => name === 'bag-pocket:food');
  const shimmer = objects.find(({ name }) => name === 'bag-shimmer-balance');

  expect(closeHitArea?.interactive).toBe(true);
  expect(closeHitArea?.alpha ?? 1).toBeLessThanOrEqual(0.01);
  expect(closeHitArea?.displayWidth ?? 0).toBeGreaterThanOrEqual(70);
  expect(closeHitArea?.displayHeight ?? 0).toBeGreaterThanOrEqual(60);
  expect(closeIcon?.visible).toBe(true);
  expect(
    objects.some(({ name, visible }) => name === 'wp18j-inventory-close-visual' && visible),
  ).toBe(false);
  expect(
    objects.some(
      ({ name, visible }) => name === 'concept-modal-surface:bag-close-button' && visible,
    ),
  ).toBe(false);
  expect(foodTab?.y ?? 0).toBeGreaterThanOrEqual(153);
  expect(shimmer?.y ?? 0).toBeGreaterThanOrEqual(153);
});

test('Map keeps a glyph-only close target and can be dragged inside its clipped viewport', async ({
  page,
}) => {
  await openDiagnostics(page);
  await startScene(page, 'InventoryScene', { returnScene: 'TitleScene', initialTab: 'map' });
  await waitForObject(page, 'InventoryScene', 'wp18j-map-pan-zone');
  await waitForObject(page, 'InventoryScene', 'wp18j-map-pan-hint');

  const before = await sceneObjects(page, 'InventoryScene');
  const closeHitArea = before.find(({ name }) => name === 'bag-close-button');
  const mapContentBefore = before.find(({ name }) => name === 'bag-map-content');

  expect(closeHitArea?.interactive).toBe(true);
  expect(closeHitArea?.alpha ?? 1).toBeLessThanOrEqual(0.01);
  expect(
    before.some(({ name, visible }) => name === 'wp18j-inventory-close-visual' && visible),
  ).toBe(false);
  expect(
    before.some(
      ({ name, visible }) => name === 'concept-modal-surface:bag-close-button' && visible,
    ),
  ).toBe(false);
  expect(mapContentBefore?.x ?? 999).toBe(0);
  expect(mapContentBefore?.y ?? 999).toBe(0);

  await dragCanvasLogical(page, { x: 900, y: 410 }, { x: 770, y: 340 });

  await expect
    .poll(async () => {
      const objects = await sceneObjects(page, 'InventoryScene');
      const content = objects.find(({ name }) => name === 'bag-map-content');
      return { x: content?.x ?? 0, y: content?.y ?? 0 };
    })
    .toEqual({ x: -130, y: -70 });
});
