import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  name: string;
  textureKey: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
  interactive: boolean;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
}

interface BrowserRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const LANDSCAPE_MATRIX = [
  { name: '16:9', width: 1280, height: 720 },
  { name: '16:10', width: 1280, height: 800 },
  { name: '4:3', width: 1024, height: 768 },
  { name: 'smaller tablet', width: 960, height: 600 },
  { name: 'larger tablet', width: 1600, height: 1000 },
] as const;

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function getSnapshot(page: Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
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
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene) === true;
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, sceneData }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      diagnostics.startScene(key, sceneData);
    },
    { key: sceneKey, sceneData: data },
  );
  await waitForScene(page, sceneKey);
}

function getScene(snapshot: BrowserDiagnosticSnapshot, sceneKey: string): DiagnosticSceneSnapshot {
  const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${sceneKey}.`);
  }
  return scene;
}

async function waitForNamedObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ key, name }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const scene = diagnostics?.snapshot().scenes.find((candidate) => candidate.key === key);
      return scene?.objects.some((object) => object.name === name && object.visible) === true;
    },
    { key: sceneKey, name: objectName },
  );
}

function renderedObjectRectFromSnapshot(
  snapshot: BrowserDiagnosticSnapshot,
  canvas: BrowserRect,
  sceneKey: string,
  objectName: string,
): BrowserRect {
  const object = getScene(snapshot, sceneKey).objects.find(
    (candidate) => candidate.name === objectName && candidate.visible,
  );
  if (!object) {
    throw new Error(`Missing visible ${objectName} in ${sceneKey}.`);
  }
  const scaleX = canvas.width / snapshot.width;
  const scaleY = canvas.height / snapshot.height;
  return {
    x: canvas.x + (object.x - object.displayWidth / 2) * scaleX,
    y: canvas.y + (object.y - object.displayHeight / 2) * scaleY,
    width: object.displayWidth * scaleX,
    height: object.displayHeight * scaleY,
  };
}

async function renderedObjectRect(
  page: Page,
  sceneKey: string,
  objectName: string,
): Promise<BrowserRect> {
  const snapshot = await getSnapshot(page);
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) {
    throw new Error('Game canvas has no browser bounds.');
  }
  return renderedObjectRectFromSnapshot(snapshot, canvas, sceneKey, objectName);
}

function expectRectInsideViewport(
  rect: BrowserRect,
  viewport: { width: number; height: number },
): void {
  expect(rect.x).toBeGreaterThanOrEqual(-1);
  expect(rect.y).toBeGreaterThanOrEqual(-1);
  expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function expectNoPageOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    width: window.innerWidth,
    height: window.innerHeight,
    canvasTouchAction: getComputedStyle(document.querySelector('canvas') as HTMLCanvasElement)
      .touchAction,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.height);
  expect(metrics.canvasTouchAction).toBe('none');
}

test.describe('WP18G landscape tablet matrix', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: true });

  test('keeps the exploration shell and movement controls usable across representative landscape sizes', async ({
    page,
  }) => {
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'MoonflowerGladeScene');

    for (const viewport of LANDSCAPE_MATRIX) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(80);
      await expectNoPageOverflow(page);

      const snapshot = await getSnapshot(page);
      const canvas = await page.locator('canvas').boundingBox();
      expect(canvas, `${viewport.name} canvas`).not.toBeNull();
      if (!canvas) {
        continue;
      }
      expectRectInsideViewport(canvas, viewport);

      for (const name of [
        'exploration-shell-map-button',
        'exploration-shell-bag-button',
        'exploration-shell-book-button',
        'exploration-shell-settings-nav-button',
      ]) {
        const rect = renderedObjectRectFromSnapshot(snapshot, canvas, 'MoonflowerGladeScene', name);
        expectRectInsideViewport(rect, viewport);
        expect(
          Math.min(rect.width, rect.height),
          `${viewport.name} ${name}`,
        ).toBeGreaterThanOrEqual(40);
      }

      for (const name of [
        'touch-movement-up',
        'touch-movement-down',
        'touch-movement-left',
        'touch-movement-right',
        'touch-movement-gallop',
      ]) {
        const rect = renderedObjectRectFromSnapshot(snapshot, canvas, 'MoonflowerGladeScene', name);
        expectRectInsideViewport(rect, viewport);
        expect(
          Math.min(rect.width, rect.height),
          `${viewport.name} ${name}`,
        ).toBeGreaterThanOrEqual(64);
      }
    }
  });

  test('rebuilds exploration controls cleanly through a landscape to portrait to landscape cycle', async ({
    page,
  }) => {
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'MoonflowerGladeScene');
    await waitForNamedObject(page, 'MoonflowerGladeScene', 'tablet-movement-pad');
    await expect(page.locator('.mobile-touch-controls')).toHaveCount(0);

    await page.setViewportSize({ width: 600, height: 900 });
    await expect(page.locator('.mobile-touch-controls')).toBeVisible();
    await page.waitForFunction(() => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const scene = diagnostics
        ?.snapshot()
        .scenes.find((candidate) => candidate.key === 'MoonflowerGladeScene');
      return !scene?.objects.some(
        (object) => object.name === 'tablet-movement-pad' && object.visible,
      );
    });
    await expectNoPageOverflow(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.mobile-touch-controls')).toHaveCount(0);
    await waitForNamedObject(page, 'MoonflowerGladeScene', 'tablet-movement-pad');
    await expectNoPageOverflow(page);
  });

  test('keeps Bag, Map and Creator tablet controls contained at 16:10 and 4:3', async ({
    page,
  }) => {
    // This traverses three independently rendered modal owners at two sizes.
    // Retain every geometry assertion while allowing software rendering overhead.
    test.setTimeout(150_000);
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);

    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 1024, height: 768 },
    ]) {
      await page.setViewportSize(viewport);

      await startScene(page, 'InventoryScene', {
        returnScene: 'MoonflowerGladeScene',
        initialTab: 'items',
      });
      await waitForNamedObject(page, 'InventoryScene', 'bag-pocket:food');
      for (const name of [
        'bag-pocket:food',
        'bag-pocket:quest',
        'bag-pocket:decor',
        'bag-pocket:keepsakes',
        'bag-close-button',
      ]) {
        const rect = await renderedObjectRect(page, 'InventoryScene', name);
        expectRectInsideViewport(rect, viewport);
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(40);
      }

      await startScene(page, 'InventoryScene', {
        returnScene: 'MoonflowerGladeScene',
        initialTab: 'map',
      });
      await waitForNamedObject(page, 'InventoryScene', 'bag-map-content');
      const mapClose = await renderedObjectRect(page, 'InventoryScene', 'bag-close-button');
      expectRectInsideViewport(mapClose, viewport);

      await startScene(page, 'UnicornCreatorScene');
      await waitForNamedObject(page, 'UnicornCreatorScene', 'creator-category-colours');
      for (const name of [
        'creator-category-colours',
        'creator-category-colours',
        'creator-category-mane',
        'creator-category-horn',
        'creator-category-markings',
        'creator-category-accessories',
      ]) {
        const rect = await renderedObjectRect(page, 'UnicornCreatorScene', name);
        expectRectInsideViewport(rect, viewport);
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(40);
      }
      await expect(page.locator('.unicorn-name-input')).toBeVisible();
      await expectNoPageOverflow(page);
    }
  });

  test('keeps landscape tablet race controls at the edges with a clear central track corridor', async ({
    page,
  }) => {
    test.setTimeout(75_000);
    for (const viewport of LANDSCAPE_MATRIX) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/?scene=race&diagnostics=1');
      await waitForDiagnostics(page);
      await waitForScene(page, 'RaceScene');

      const overlay = page.locator('[data-race-mobile-controls="true"]');
      await expect(overlay).toBeVisible();
      await expect(overlay).toHaveClass(/is-landscape-tablet/);

      const run = await page.locator('[data-race-action="run"]').boundingBox();
      const jump = await page.locator('[data-race-action="jump"]').boundingBox();
      const pause = await page.locator('[data-race-action="pause"]').boundingBox();
      expect(run).not.toBeNull();
      expect(jump).not.toBeNull();
      expect(pause).not.toBeNull();
      if (!run || !jump || !pause) {
        continue;
      }

      for (const rect of [run, jump, pause]) {
        expectRectInsideViewport(rect, viewport);
      }
      expect(Math.min(run.width, run.height)).toBeGreaterThanOrEqual(118);
      expect(Math.min(jump.width, jump.height)).toBeGreaterThanOrEqual(118);
      expect(Math.min(pause.width, pause.height)).toBeGreaterThanOrEqual(50);
      expect(run.x + run.width).toBeLessThan(viewport.width * 0.35);
      expect(jump.x).toBeGreaterThan(viewport.width * 0.65);

      const canvas = await page.locator('canvas').boundingBox();
      expect(canvas).not.toBeNull();
      if (canvas) {
        expect(canvas.width).toBeGreaterThan(viewport.width * 0.6);
        expect(canvas.height).toBeGreaterThan(viewport.height * 0.6);
      }
      await expectNoPageOverflow(page);
    }
  });
});

test.describe('WP18G secondary desktop inputs', () => {
  test.use({ viewport: { width: 1280, height: 720 }, hasTouch: false });

  test('preserves desktop click-to-move and creator text entry without enabling touch overlays', async ({
    page,
  }) => {
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'MoonflowerGladeScene');
    await expect(page.locator('.mobile-touch-controls')).toHaveCount(0);

    const snapshot = await getSnapshot(page);
    const scene = getScene(snapshot, 'MoonflowerGladeScene');
    const playerBefore = scene.objects
      .filter((object) => object.textureKey?.startsWith('player-unicorn-'))
      .sort((left, right) => right.y - left.y)[0];
    expect(playerBefore).toBeDefined();

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox || !playerBefore) {
      throw new Error('Missing desktop canvas or player.');
    }
    await canvas.click({
      position: {
        x: (900 / 1280) * canvasBox.width,
        y: (360 / 720) * canvasBox.height,
      },
    });
    await page.waitForFunction(
      ({ startX }) => {
        const diagnostics = (
          window as typeof window & {
            __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
          }
        ).__UNICORN_VALLEY_DIAGNOSTICS__;
        const active = diagnostics
          ?.snapshot()
          .scenes.find((candidate) => candidate.key === 'MoonflowerGladeScene');
        const player = active?.objects
          .filter((object) => object.textureKey?.startsWith('player-unicorn-'))
          .sort((left, right) => right.y - left.y)[0];
        return player ? player.x - startX > 20 : false;
      },
      { startX: playerBefore.x },
    );

    await startScene(page, 'UnicornCreatorScene');
    const nameInput = page.locator('.unicorn-name-input');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Esme');
    await expect(nameInput).toHaveValue('Esme');

    await page.goto('/?scene=race&diagnostics=1');
    await waitForDiagnostics(page);
    await waitForScene(page, 'RaceScene');
    await expect(page.locator('[data-race-mobile-controls="true"]')).toHaveCount(0);
    await expectNoPageOverflow(page);
  });
});
