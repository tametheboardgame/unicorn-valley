import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';

interface ObjectSnapshot {
  name: string;
  visible: boolean;
  effectiveVisible?: boolean;
}
interface Snapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: Array<{ key: string; objects: ObjectSnapshot[] }>;
}
interface Diagnostics {
  snapshot(): Snapshot;
  startScene(key: string, data?: object): void;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Diagnostics unavailable');
    return api.snapshot();
  });
}

async function startScene(page: Page, key: string): Promise<void> {
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
  await page.evaluate((sceneKey) => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(sceneKey);
  }, key);
  await page.waitForFunction((sceneKey) => {
    const scenes = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot().activeScenes;
    return scenes?.length === 1 && scenes[0] === sceneKey;
  }, key);
}

async function tapScreen(page: Page, x: number, y: number): Promise<void> {
  const value = await snapshot(page);
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Canvas unavailable');
  await page.touchscreen.tap(
    canvas.x + (x / value.width) * canvas.width,
    canvas.y + (y / value.height) * canvas.height,
  );
}

function hasObject(value: Snapshot, sceneKey: string, objectName: string): boolean {
  return (
    value.scenes
      .find(({ key }) => key === sceneKey)
      ?.objects.some(
        ({ name, visible, effectiveVisible }) =>
          name === objectName && visible && effectiveVisible !== false,
      ) ?? false
  );
}

test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

test('H2.7 furniture variants preview and persist without replacing canonical furniture', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');

  await tapScreen(page, 1200, 600);
  await expect
    .poll(async () =>
      hasObject(await snapshot(page), 'CottageInteriorScene', 'touch-cottage-room-style'),
    )
    .toBe(true);

  await tapScreen(page, 1200, 462);
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual(['CottageStyleScene']);

  await tapScreen(page, 1164, 176);
  await expect
    .poll(async () =>
      hasObject(await snapshot(page), 'CottageStyleScene', 'cottage-style-furniture-selector-bed'),
    )
    .toBe(true);

  // Bed: Rose Dream.
  await tapScreen(page, 882, 326);

  // Sofa: Starlight.
  await tapScreen(page, 886, 238);
  await tapScreen(page, 1016, 326);

  // Tea set: Rosewood.
  await tapScreen(page, 1012, 238);
  await tapScreen(page, 882, 326);

  // Fireplace: Moonstone.
  await tapScreen(page, 1138, 238);
  await tapScreen(page, 882, 326);

  await expect
    .poll(async () =>
      (await snapshot(page)).scenes
        .find(({ key }) => key === 'CottageStyleScene')
        ?.objects.some(
          ({ name }) =>
            name.startsWith('cottage-style-preview:back:') &&
            name.endsWith('|cottage-furniture:fireplace:moonstone'),
        ),
    )
    .toBe(true);

  await tapScreen(page, 1080, 652);
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['CottageInteriorScene']);

  let stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SAVE_KEY,
  );
  expect(stored.home.style.furnitureVariants).toEqual({
    bed: 'cottage-furniture:bed:rose-dream',
    sofa: 'cottage-furniture:sofa:starlight',
    teaSet: 'cottage-furniture:tea-set:rosewood',
    fireplace: 'cottage-furniture:fireplace:moonstone',
  });

  let value = await snapshot(page);
  expect(hasObject(value, 'CottageInteriorScene', 'cottage-furniture:bed-rear')).toBe(true);
  expect(hasObject(value, 'CottageInteriorScene', 'cottage-furniture:sofa')).toBe(true);
  expect(hasObject(value, 'CottageInteriorScene', 'cottage-furniture:tea-table')).toBe(true);
  expect(hasObject(value, 'CottageInteriorScene', 'cottage-furniture:fireplace')).toBe(true);

  await page.reload();
  await startScene(page, 'CottageInteriorScene');

  stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SAVE_KEY);
  expect(stored.home.style.furnitureVariants).toEqual({
    bed: 'cottage-furniture:bed:rose-dream',
    sofa: 'cottage-furniture:sofa:starlight',
    teaSet: 'cottage-furniture:tea-set:rosewood',
    fireplace: 'cottage-furniture:fireplace:moonstone',
  });

  value = await snapshot(page);
  expect(hasObject(value, 'CottageInteriorScene', 'cottage-furniture:bed-foreground')).toBe(true);
  expect(hasObject(value, 'CottageInteriorScene', 'cottage-furniture:sofa')).toBe(true);
});
