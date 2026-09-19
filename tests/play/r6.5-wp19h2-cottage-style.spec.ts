import { expect, test, type Page } from '@playwright/test';

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

async function startScene(page: Page, key: string, data?: object): Promise<void> {
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
  await page.evaluate(
    ({ sceneKey, sceneData }) => {
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(sceneKey, sceneData);
    },
    { sceneKey: key, sceneData: data },
  );
  await page.waitForFunction((sceneKey) => {
    const activeScenes = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot().activeScenes;
    return activeScenes?.length === 1 && activeScenes[0] === sceneKey;
  }, key);
}

async function switchScene(page: Page, key: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ sceneKey, sceneData }) => {
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(sceneKey, sceneData);
    },
    { sceneKey: key, sceneData: data },
  );
  await page.waitForFunction((sceneKey) => {
    const activeScenes = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot().activeScenes;
    return activeScenes?.length === 1 && activeScenes[0] === sceneKey;
  }, key);
}

function scene(value: Snapshot, key: string): SceneSnapshot {
  const found = value.scenes.find((candidate) => candidate.key === key);
  if (!found) throw new Error(`Missing ${key}`);
  return found;
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
  return scene(value, sceneKey).objects.some(
    ({ name, visible, effectiveVisible }) =>
      name === objectName && visible && effectiveVisible !== false,
  );
}

test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

test('H2.6 styles four walls independently and persists every surface', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');

  let value = await snapshot(page);
  expect(hasObject(value, 'CottageInteriorScene', 'cottage-style-marker:room')).toBe(false);
  expect(hasObject(value, 'CottageInteriorScene', 'touch-cottage-room-style')).toBe(false);
  expect(
    hasObject(value, 'CottageInteriorScene', 'cottage-style-wall:back:cottage-wall:moon-cream'),
  ).toBe(true);
  expect(
    hasObject(value, 'CottageInteriorScene', 'cottage-style-floor:cottage-floor:honey-oak'),
  ).toBe(true);

  await tapScreen(page, 1200, 600);
  await expect
    .poll(async () =>
      hasObject(await snapshot(page), 'CottageInteriorScene', 'touch-cottage-room-style'),
    )
    .toBe(true);
  expect(
    scene(await snapshot(page), 'CottageInteriorScene').objects.some(
      ({ name }) => name === 'cottage-style-marker:room',
    ),
  ).toBe(false);

  await tapScreen(page, 1200, 462);
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual(['CottageStyleScene']);

  value = await snapshot(page);
  expect(
    scene(value, 'CottageStyleScene').objects.some(({ name }) =>
      name.startsWith(
        'cottage-style-preview:back:cottage-wall:moon-cream|cottage-wallpaper:plain|cottage-floor:honey-oak',
      ),
    ),
  ).toBe(true);
  expect(
    hasObject(value, 'CottageStyleScene', 'cottage-style-wall-swatch-cottage-wall:moon-cream'),
  ).toBe(true);

  // Back wall: Blush Dawn.
  await tapScreen(page, 882, 326);

  // Left wall: Misty Lilac + Moon Sprigs.
  await tapScreen(page, 886, 238);
  await tapScreen(page, 1016, 326);
  await tapScreen(page, 878, 176);
  await tapScreen(page, 882, 326);

  // Front / door wall: Moon Sprigs.
  await tapScreen(page, 1138, 238);
  await tapScreen(page, 882, 326);

  // Floor: Rosewood.
  await tapScreen(page, 1021, 176);
  await tapScreen(page, 882, 292);

  await expect
    .poll(async () =>
      scene(await snapshot(page), 'CottageStyleScene').objects.some(({ name }) =>
        name.startsWith(
          'cottage-style-preview:front:cottage-wall:moon-cream|cottage-wallpaper:moon-sprigs|cottage-floor:rosewood',
        ),
      ),
    )
    .toBe(true);

  await tapScreen(page, 1080, 652);
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['CottageInteriorScene']);

  value = await snapshot(page);
  expect(
    hasObject(value, 'CottageInteriorScene', 'cottage-style-wall:back:cottage-wall:blush-dawn'),
  ).toBe(true);
  expect(
    hasObject(
      value,
      'CottageInteriorScene',
      'cottage-style-wallpaper:left:cottage-wallpaper:moon-sprigs',
    ),
  ).toBe(true);
  expect(
    hasObject(value, 'CottageInteriorScene', 'cottage-style-wall:left:cottage-wall:misty-lilac'),
  ).toBe(true);
  expect(
    hasObject(
      value,
      'CottageInteriorScene',
      'cottage-style-wallpaper:front:cottage-wallpaper:star-scatter',
    ),
  ).toBe(true);
  expect(
    hasObject(value, 'CottageInteriorScene', 'cottage-style-floor:cottage-floor:rosewood'),
  ).toBe(true);

  await page.reload();
  await startScene(page, 'CottageInteriorScene');

  value = await snapshot(page);
  expect(
    hasObject(value, 'CottageInteriorScene', 'cottage-style-wall:back:cottage-wall:blush-dawn'),
  ).toBe(true);
  expect(
    hasObject(
      value,
      'CottageInteriorScene',
      'cottage-style-wallpaper:left:cottage-wallpaper:moon-sprigs',
    ),
  ).toBe(true);
  expect(
    hasObject(value, 'CottageInteriorScene', 'cottage-style-wall:left:cottage-wall:misty-lilac'),
  ).toBe(true);
  expect(
    hasObject(
      value,
      'CottageInteriorScene',
      'cottage-style-wallpaper:front:cottage-wallpaper:star-scatter',
    ),
  ).toBe(true);
  expect(
    hasObject(value, 'CottageInteriorScene', 'cottage-style-floor:cottage-floor:rosewood'),
  ).toBe(true);

  // Exact regression: an editor return resumes Decorate mode once, Done clears it, and a later
  // ordinary leave/re-entry must not resurrect that transient editor-return state.
  await switchScene(page, 'CottageInteriorScene', { decorateMode: true });
  await expect
    .poll(async () =>
      hasObject(await snapshot(page), 'CottageInteriorScene', 'touch-cottage-room-style'),
    )
    .toBe(true);
  await tapScreen(page, 1200, 600);
  await expect
    .poll(async () =>
      hasObject(await snapshot(page), 'CottageInteriorScene', 'touch-cottage-room-style'),
    )
    .toBe(false);

  await switchScene(page, 'MoonflowerGladeScene');
  await switchScene(page, 'CottageInteriorScene');

  value = await snapshot(page);
  expect(hasObject(value, 'CottageInteriorScene', 'touch-cottage-room-style')).toBe(false);
  expect(
    scene(value, 'CottageInteriorScene').objects.filter(({ name }) =>
      name.startsWith('cottage-decorate-marker:'),
    ),
  ).toHaveLength(0);
});
