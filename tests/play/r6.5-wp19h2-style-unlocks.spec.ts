import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';

interface ObjectSnapshot {
  name: string;
  visible: boolean;
  effectiveVisible?: boolean;
}
interface SceneSnapshot {
  key: string;
  objects: ObjectSnapshot[];
}
interface Snapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: SceneSnapshot[];
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
  await page.waitForFunction(
    () =>
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .activeScenes.includes('TitleScene'),
    undefined,
    { timeout: 10_000 },
  );
  await page.evaluate((sceneKey) => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(sceneKey);
  }, key);
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual([key]);
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
  const current = value.scenes.find(({ key }) => key === sceneKey);
  return (
    current?.objects.some(
      ({ name, visible, effectiveVisible }) =>
        name === objectName && visible && effectiveVisible !== false,
    ) ?? false
  );
}

test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

test('H2.10 unlocks a previously unavailable cottage style and persists the entitlement', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageStyleScene');

  let value = await snapshot(page);
  expect(
    hasObject(value, 'CottageStyleScene', 'cottage-style-locked:cottage-wall:sea-glass'),
  ).toBe(true);

  await tapScreen(page, 1150, 326);
  await tapScreen(page, 1080, 652);
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual([
    'CottageInteriorScene',
  ]);

  let stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SAVE_KEY);
  expect(stored.home.style.walls.back.wallColourId).toBe('cottage-wall:moon-cream');
  expect(stored.home.unlockedStyleIds).not.toContain('cottage-wall:sea-glass');

  await page.goto('/?diagnostics=1&homeStyleUnlock=cottage-wall:sea-glass');
  await startScene(page, 'CottageStyleScene');

  value = await snapshot(page);
  expect(
    hasObject(value, 'CottageStyleScene', 'cottage-style-locked:cottage-wall:sea-glass'),
  ).toBe(false);

  await tapScreen(page, 1150, 326);
  await tapScreen(page, 1080, 652);
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual([
    'CottageInteriorScene',
  ]);

  stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SAVE_KEY);
  expect(stored.home.style.walls.back.wallColourId).toBe('cottage-wall:sea-glass');
  expect(stored.home.unlockedStyleIds).toContain('cottage-wall:sea-glass');

  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');

  expect(
    hasObject(
      await snapshot(page),
      'CottageInteriorScene',
      'cottage-style-wall:back:cottage-wall:sea-glass',
    ),
  ).toBe(true);
});
