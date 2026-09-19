import { expect, test, type Page } from '@playwright/test';

interface ObjectSnapshot {
  name: string;
  x: number;
  y: number;
  visible: boolean;
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
  setArcadeSpritePosition(key: string, objectName: string, x: number, y: number): void;
}

async function startSceneWithData(page: Page, key: string, data: object): Promise<void> {
  await page.evaluate(
    ({ sceneKey, sceneData }) =>
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(sceneKey, sceneData),
    { sceneKey: key, sceneData: data },
  );
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual([key]);
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

test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

test('H2.5 keeps normal play clean, replaces Gallop with Decorate, and confirms doorway exit', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');

  let value = await snapshot(page);
  expect(
    scene(value, 'CottageInteriorScene').objects.filter(({ name }) =>
      name.startsWith('cottage-decorate-marker:'),
    ),
  ).toHaveLength(0);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(
      ({ name, visible }) => name === 'touch-movement-decorate' && visible,
    ),
  ).toBe(true);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(
      ({ name }) => name === 'touch-movement-gallop',
    ),
  ).toBe(false);

  await tapScreen(page, 1200, 600);
  await expect
    .poll(async () => {
      const current = await snapshot(page);
      return scene(current, 'CottageInteriorScene').objects.filter(({ name }) =>
        name.startsWith('cottage-decorate-marker:'),
      ).length;
    })
    .toBe(9);

  await page.evaluate(() =>
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'CottageInteriorScene',
      'world-player-unicorn',
      750,
      790,
    ),
  );
  await page.waitForTimeout(150);

  value = await snapshot(page);
  expect(
    scene(value, 'CottageInteriorScene').objects.find(
      ({ name }) => name === 'exploration-interaction-prompt',
    )?.visible,
  ).toBe(true);

  await tapScreen(page, 1040, 578);
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['CottageDecorateScene']);

  await page.keyboard.press('Escape');
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['CottageInteriorScene']);
  await expect
    .poll(async () => {
      const current = await snapshot(page);
      return scene(current, 'CottageInteriorScene').objects.filter(({ name }) =>
        name.startsWith('cottage-decorate-marker:'),
      ).length;
    })
    .toBe(9);

  await page.evaluate(() =>
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'CottageInteriorScene',
      'world-player-unicorn',
      750,
      850,
    ),
  );
  await page.waitForTimeout(180);
  value = await snapshot(page);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(
      ({ name, visible }) => name === 'cottage-finish-decorating-title' && visible,
    ),
  ).toBe(false);

  await page.evaluate(() =>
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'CottageInteriorScene',
      'world-player-unicorn',
      750,
      970,
    ),
  );
  await expect
    .poll(async () => {
      const current = await snapshot(page);
      return scene(current, 'CottageInteriorScene').objects.some(
        ({ name, visible }) => name === 'cottage-finish-decorating-title' && visible,
      );
    })
    .toBe(true);

  await tapScreen(page, 752, 427);
  await expect
    .poll(async () => {
      const current = await snapshot(page);
      return scene(current, 'CottageInteriorScene').objects.filter(({ name }) =>
        name.startsWith('cottage-decorate-marker:'),
      ).length;
    })
    .toBe(0);
  value = await snapshot(page);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(
      ({ name, visible }) => name === 'cottage-finish-decorating-title' && visible,
    ),
  ).toBe(false);
});

test('H2.8 visibly places, persists and explicitly removes a decoration', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');
  await page.evaluate(() => {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key !== 'unicorn-valley.save' && !key?.startsWith('unicorn-valley.save.schema.'))
        continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const save = JSON.parse(raw);
      save.inventory.itemQuantities['item:moonflower-lantern'] = 1;
      localStorage.setItem(key, JSON.stringify(save));
    }
  });

  await startSceneWithData(page, 'CottageDecorateScene', {
    slotId: 'cottage-slot:window-nook',
    returnToDecorateMode: true,
  });
  let value = await snapshot(page);
  expect(
    scene(value, 'CottageDecorateScene').objects.some(
      ({ name }) => name === 'cottage-decoration-choice:item:moonflower-lantern',
    ),
  ).toBe(true);
  await tapScreen(page, 640, 664);
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['CottageInteriorScene']);
  value = await snapshot(page);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(
      ({ name }) => name === 'cottage-decoration-art:item:moonflower-lantern',
    ),
  ).toBe(true);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(({ name }) => name === 'Moonflower Lantern'),
  ).toBe(false);

  await page.reload();
  await startScene(page, 'CottageInteriorScene');
  value = await snapshot(page);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(
      ({ name }) => name === 'cottage-decoration-art:item:moonflower-lantern',
    ),
  ).toBe(true);

  await startSceneWithData(page, 'CottageDecorateScene', {
    slotId: 'cottage-slot:window-nook',
    returnToDecorateMode: true,
  });
  await tapScreen(page, 260, 664);
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['CottageInteriorScene']);
  expect(
    await page.evaluate(() => {
      const save = JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}');
      return save.home.furnitureBySlot['cottage-slot:window-nook'];
    }),
  ).toBeUndefined();
  expect(
    scene(await snapshot(page), 'CottageInteriorScene').objects.filter(({ name }) =>
      name.startsWith('cottage-decorate-marker:'),
    ),
  ).toHaveLength(9);
});
