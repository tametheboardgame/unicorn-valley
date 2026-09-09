import { expect, test, type Page } from '@playwright/test';

interface MapObject {
  name: string;
  text: string | null;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
}

async function snapshotObjects(page: Page, sceneKey: string): Promise<MapObject[]> {
  return page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: {
          snapshot(): { scenes: Array<{ key: string; objects: MapObject[] }> };
        };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().scenes.find((scene) => scene.key === key)?.objects ?? [];
  }, sceneKey);
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((key) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: {
          snapshot(): { activeScenes: string[] };
        };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(key) === true;
  }, sceneKey);
}

async function openMapFromHud(page: Page): Promise<void> {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'ExplorationHudOverlayScene');
  const button = (await snapshotObjects(page, 'ExplorationHudOverlayScene')).find(
    ({ name, visible, interactive }) =>
      name === 'exploration-hud-overlay-map-button' && visible && interactive,
  );
  if (button) {
    const canvas = await page.locator('canvas').boundingBox();
    if (!canvas) throw new Error('Game canvas is unavailable.');
    await page.mouse.click(
      canvas.x + (button.x / 1280) * canvas.width,
      canvas.y + (button.y / 720) * canvas.height,
    );
  } else {
    await page.getByRole('button', { name: 'Map', exact: true }).click();
  }
  await waitForScene(page, 'InventoryScene');
  await expect
    .poll(async () =>
      (await snapshotObjects(page, 'InventoryScene')).some(
        ({ name, visible }) => name === 'wp18j-map-pan-zone' && visible,
      ),
    )
    .toBe(true);
}

async function canvasPoint(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Game canvas is unavailable.');
  return { x: canvas.x + (x / 1280) * canvas.width, y: canvas.y + (y / 720) * canvas.height };
}

function visibleMapGeometry(objects: MapObject[]) {
  const geography = objects.find(({ name }) => name === 'bag-map-node:valley:rainbow-meadow');
  const content = objects.find(({ name }) => name === 'bag-map-content');
  const north = objects.find(({ name }) => name === 'wp18j-map-compass');
  const frame = objects.find(({ name }) => name === 'wp18j-map-pan-frame');
  if (!geography || !content || !north || !frame) throw new Error('Map visual owners are missing.');
  return {
    geography: { x: geography.x + content.x, y: geography.y + content.y },
    north: { x: north.x, y: north.y },
    frame: { x: frame.x, y: frame.y },
  };
}

async function assertMapChrome(page: Page): Promise<void> {
  const objects = await snapshotObjects(page, 'InventoryScene');
  expect(objects.some(({ name }) => name === 'inventory-view-badge')).toBe(false);
  expect(objects.some(({ text }) => text?.includes('Paths, places and little mysteries'))).toBe(
    false,
  );
  expect(objects.find(({ name }) => name === 'inventory-modal-title')?.text).toBe('Valley Map');
}

test('desktop mouse drag visibly moves geography while frame and North stay fixed', async ({
  page,
}) => {
  test.setTimeout(75_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openMapFromHud(page);
  await assertMapChrome(page);
  await expect(page.locator('[data-map-pan-surface="true"]')).toBeVisible();
  const before = visibleMapGeometry(await snapshotObjects(page, 'InventoryScene'));
  const start = await canvasPoint(page, 900, 410);
  const end = await canvasPoint(page, 760, 330);
  expect(
    await page.evaluate(
      ({ x, y }) => (document.elementFromPoint(x, y) as HTMLElement | null)?.dataset.mapPanSurface,
      start,
    ),
  ).toBe('true');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 10 });
  await page.mouse.up();

  const after = visibleMapGeometry(await snapshotObjects(page, 'InventoryScene'));
  expect(after.geography.x).toBeLessThan(before.geography.x - 40);
  expect(after.geography.y).toBeLessThan(before.geography.y - 40);
  expect(after.north).toEqual(before.north);
  expect(after.frame).toEqual(before.frame);
});

test('tablet touch drag visibly moves geography while frame and North stay fixed', async ({
  page,
}) => {
  test.setTimeout(75_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await openMapFromHud(page);
  await expect(page.locator('[data-map-pan-surface="true"]')).toBeVisible();
  const before = visibleMapGeometry(await snapshotObjects(page, 'InventoryScene'));
  const start = await canvasPoint(page, 780, 390);
  const end = await canvasPoint(page, 880, 450);
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x, y: start.y }],
  });
  for (let step = 1; step <= 8; step += 1) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          x: start.x + ((end.x - start.x) * step) / 8,
          y: start.y + ((end.y - start.y) * step) / 8,
        },
      ],
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  const after = visibleMapGeometry(await snapshotObjects(page, 'InventoryScene'));
  expect(after.geography.x).toBeGreaterThan(before.geography.x + 40);
  expect(after.geography.y).toBeGreaterThan(before.geography.y + 30);
  expect(after.north).toEqual(before.north);
  expect(after.frame).toEqual(before.frame);
});
