import { expect, test, type Page } from '@playwright/test';

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: Array<{
      key: string;
      objects: Array<{ name: string; x: number; y: number }>;
    }>;
  };
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
}

async function playerPosition(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const glade = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'MoonflowerGladeScene');
    const player = glade?.objects.find((object) => object.name === 'world-player-unicorn');
    if (!player) {
      throw new Error('Moonflower Glade player was not available to diagnostics.');
    }
    return { x: player.x, y: player.y };
  });
}

test('portrait touch layout pins the game high and moves concept controls below gameplay', async ({
  page,
}) => {
  const viewport = page.viewportSize();
  const projectName = test.info().project.name;
  test.skip(
    !viewport ||
      viewport.width > 700 ||
      viewport.height <= viewport.width ||
      !projectName.includes('mobile-touch'),
    'Portrait touch regression runs only on the mobile touch compatibility projects.',
  );

  await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
  await waitForScene(page, 'MoonflowerGladeScene');

  const canvas = page.locator('canvas').first();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  expect(canvasBox?.y ?? 999).toBeLessThanOrEqual(2);

  const dock = page.locator('.mobile-exploration-concept-dock');
  await expect(dock).toBeVisible();
  const dockBox = await dock.boundingBox();
  expect(dockBox).not.toBeNull();
  expect(dockBox?.y ?? 0).toBeGreaterThanOrEqual(
    (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) - 3,
  );
  await expect(page.locator('.mobile-exploration-location')).toContainText('Moonflower Glade');
  await expect(page.locator('.mobile-exploration-shimmer')).toContainText('Shimmer');

  for (const action of ['Map', 'Bag', 'Book', 'Settings']) {
    const button = page.getByRole('button', { name: action, exact: true });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(60);
  }

  const controls = page.locator('.mobile-touch-controls');
  await expect(controls).toBeVisible();

  for (const direction of ['up', 'down', 'left', 'right']) {
    const button = page.locator(`.mobile-touch-${direction}`);
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(54);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(54);
  }

  const gallop = page.locator('.mobile-touch-gallop');
  await expect(gallop).toBeVisible();
  await expect(gallop).toContainText('Gallop');
  const gallopBox = await gallop.boundingBox();
  expect(gallopBox).not.toBeNull();
  expect(gallopBox?.width ?? 0).toBeGreaterThanOrEqual(88);
  expect(gallopBox?.height ?? 0).toBeGreaterThanOrEqual(88);

  const before = await playerPosition(page);
  const right = page.locator('.mobile-touch-right');
  await right.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 1,
  });
  try {
    await expect.poll(async () => (await playerPosition(page)).x).toBeGreaterThan(before.x + 15);
  } finally {
    await right.dispatchEvent('pointerup', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      buttons: 0,
    });
  }

  await page.screenshot({
    path: test.info().outputPath('wp18j-phone-portrait.png'),
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await waitForScene(page, 'InventoryScene');
  await expect(dock).toBeHidden();
});
