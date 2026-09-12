import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  interactive: boolean;
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
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene);
  }, sceneKey);
}

async function sceneObjects(page: Page, sceneKey: string): Promise<DiagnosticObject[]> {
  return page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().scenes.find((scene) => scene.key === key)?.objects ?? [];
  }, sceneKey);
}

async function clickGamePoint(page: Page, x: number, y: number): Promise<void> {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Game canvas is not available');
  }
  await page.mouse.click(box.x + (x / 1280) * box.width, box.y + (y / 720) * box.height);
}

async function dragGamePoint(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Game canvas is not available');
  }

  const startX = box.x + (from.x / 1280) * box.width;
  const startY = box.y + (from.y / 720) * box.height;
  const endX = box.x + (to.x / 1280) * box.width;
  const endY = box.y + (to.y / 720) * box.height;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 6 });
  await page.mouse.up();
}

async function expectCanonicalLandscapeShell(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const objects = await sceneObjects(page, 'MoonflowerGladeScene');
      return objects.filter(
        ({ name, visible, interactive }) =>
          visible &&
          interactive &&
          [
            'exploration-shell-map-button',
            'exploration-shell-bag-button',
            'exploration-shell-book-button',
            'exploration-shell-settings-nav-button',
          ].includes(name),
      ).length;
    })
    .toBe(4);

  const objects = await sceneObjects(page, 'MoonflowerGladeScene');
  expect(
    objects.some(({ name, visible }) => name === 'exploration-shell-nav-group' && visible),
  ).toBe(true);
  expect(
    objects.some(({ name, visible }) => name === 'exploration-shell-shimmer-panel' && visible),
  ).toBe(true);
  expect(
    objects.some(({ name, visible }) => name === 'exploration-location-title-panel' && visible),
  ).toBe(true);
  expect(objects.some(({ name, visible }) => name === 'tablet-movement-pad' && visible)).toBe(true);

  expect(objects.some(({ name }) => name === 'exploration-shell-sound-button')).toBe(false);
  expect(objects.some(({ name }) => name === 'exploration-controls-button')).toBe(false);
  expect(objects.some(({ name }) => name === 'activity-suggestion-card')).toBe(false);
}

function navigationGeometry(objects: DiagnosticObject[]): Array<{
  name: string;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}> {
  const wanted = new Set([
    'exploration-shell-map-icon',
    'exploration-shell-bag-icon',
    'exploration-shell-book-icon',
    'exploration-shell-settings-nav-icon',
    'exploration-shell-map-label',
    'exploration-shell-bag-label',
    'exploration-shell-book-label',
    'exploration-shell-settings-nav-label',
  ]);
  return objects
    .filter(({ name }) => wanted.has(name))
    .map(({ name, x, y, displayWidth, displayHeight }) => ({
      name,
      x,
      y,
      displayWidth,
      displayHeight,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

test.describe('WP18J shared responsive concept UI', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test('short landscape phone cannot fall back to the retired exploration layout', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 280 });
    await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
    await waitForScene(page, 'MoonflowerGladeScene');

    await expectCanonicalLandscapeShell(page);

    await page.screenshot({
      path: test.info().outputPath('wp18j-phone-landscape-short.png'),
      fullPage: true,
    });
  });

  test('rotating portrait to landscape restores the concept canvas shell, never legacy UI', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
    await waitForScene(page, 'MoonflowerGladeScene');

    await expect(page.locator('.mobile-exploration-concept-dock')).toBeVisible();

    await page.setViewportSize({ width: 844, height: 280 });
    await expect(page.locator('.mobile-exploration-concept-dock')).toHaveCount(0);
    await expectCanonicalLandscapeShell(page);

    await page.screenshot({
      path: test.info().outputPath('wp18j-phone-portrait-to-landscape.png'),
      fullPage: true,
    });
  });

  test('opening and closing Bag cannot leave the main navigation geometry misaligned', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1180, height: 664 });
    await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
    await waitForScene(page, 'MoonflowerGladeScene');
    await expectCanonicalLandscapeShell(page);

    const before = navigationGeometry(await sceneObjects(page, 'MoonflowerGladeScene'));
    expect(before).toHaveLength(8);

    await clickGamePoint(page, 210, 52);
    await waitForScene(page, 'InventoryScene');

    await expect
      .poll(async () => {
        const objects = await sceneObjects(page, 'InventoryScene');
        return objects.find(({ name }) => name === 'bag-close-button')?.displayWidth ?? 0;
      })
      .toBeGreaterThanOrEqual(96);

    const bagObjects = await sceneObjects(page, 'InventoryScene');
    const pocketTabs = bagObjects
      .filter(({ name }) => name.startsWith('bag-pocket-visual:'))
      .sort((left, right) => left.x - right.x);
    expect(pocketTabs).toHaveLength(4);
    for (let index = 1; index < pocketTabs.length; index += 1) {
      const previous = pocketTabs[index - 1];
      const current = pocketTabs[index];
      const gap = current.x - current.displayWidth / 2 - (previous.x + previous.displayWidth / 2);
      expect(gap).toBeGreaterThanOrEqual(24);
    }

    const shop = bagObjects.find(({ name }) => name === 'bag-shop-button');
    expect(shop?.visible ?? false).toBe(false);
    expect(shop?.interactive ?? false).toBe(false);

    await clickGamePoint(page, 1172, 76);
    await waitForScene(page, 'MoonflowerGladeScene');
    await expectCanonicalLandscapeShell(page);

    await expect
      .poll(async () => navigationGeometry(await sceneObjects(page, 'MoonflowerGladeScene')))
      .toEqual(before);
  });

  test('Map clips draggable geography under its frame and keeps North fixed', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 664 });
    await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
    await waitForScene(page, 'MoonflowerGladeScene');

    await clickGamePoint(page, 83, 52);
    await waitForScene(page, 'InventoryScene');

    await expect
      .poll(async () => {
        const objects = await sceneObjects(page, 'InventoryScene');
        const close = objects.find(({ name }) => name === 'bag-close-button');
        const icon = objects.find(({ name }) => name === 'wp18j-inventory-close-icon');
        const boxedVisual = objects.find(({ name }) => name === 'wp18j-inventory-close-visual');
        const frame = objects.find(({ name }) => name === 'wp18j-map-pan-frame');
        const compass = objects.find(({ name }) => name === 'wp18j-map-compass');
        const compassLabel = objects.find(({ name }) => name === 'wp18j-map-compass-label');
        return {
          closeWidthAtLeast96: (close?.displayWidth ?? 0) >= 96,
          closeHeightAtLeast84: (close?.displayHeight ?? 0) >= 84,
          closeX: close?.x ?? 0,
          iconPresent: Boolean(icon?.visible),
          boxedVisualPresent: Boolean(boxedVisual?.visible),
          framePresent: Boolean(frame?.visible),
          compassX: compass?.x ?? 0,
          compassY: compass?.y ?? 0,
          compassLabelPresent: Boolean(compassLabel?.visible),
        };
      })
      .toEqual({
        closeWidthAtLeast96: true,
        closeHeightAtLeast84: true,
        closeX: 1172,
        iconPresent: true,
        boxedVisualPresent: false,
        framePresent: true,
        compassX: 170,
        compassY: 192,
        compassLabelPresent: true,
      });

    const beforeDrag = await sceneObjects(page, 'InventoryScene');
    const contentBefore = beforeDrag.find(({ name }) => name === 'bag-map-content');
    const compassBefore = beforeDrag.find(({ name }) => name === 'wp18j-map-compass');
    expect(contentBefore).toBeDefined();
    expect(compassBefore).toBeDefined();

    await dragGamePoint(page, { x: 720, y: 390 }, { x: 590, y: 300 });

    await expect
      .poll(async () => {
        const objects = await sceneObjects(page, 'InventoryScene');
        const content = objects.find(({ name }) => name === 'bag-map-content');
        const compass = objects.find(({ name }) => name === 'wp18j-map-compass');
        return {
          contentMoved: (content?.x ?? 0) < (contentBefore?.x ?? 0) - 20,
          compassX: compass?.x ?? 0,
          compassY: compass?.y ?? 0,
        };
      })
      .toEqual({ contentMoved: true, compassX: 170, compassY: 192 });

    await page.screenshot({
      path: test.info().outputPath('wp18j-map-panned-clipped.png'),
      fullPage: true,
    });
  });
});
