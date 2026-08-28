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

async function waitForGlade(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes('MoonflowerGladeScene');
  });
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

test('portrait touch layout pins the game high and provides thumb-sized working controls', async ({
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
  await waitForGlade(page);

  const canvas = page.locator('canvas').first();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  expect(canvasBox?.y ?? 999).toBeLessThanOrEqual(2);

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
});
