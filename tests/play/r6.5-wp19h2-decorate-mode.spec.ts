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

async function tapNamedObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const object = scene(await snapshot(page), sceneKey).objects.find(
    ({ name }) => name === objectName,
  );
  if (!object) throw new Error(`Missing ${objectName} in ${sceneKey}`);
  await tapScreen(page, object.x, object.y);
}

async function editSlot(page: Page, slotId: string, itemId?: string): Promise<void> {
  await startSceneWithData(page, 'CottageDecorateScene', {
    slotId,
    returnToDecorateMode: true,
  });
  if (itemId) {
    await tapNamedObject(page, 'CottageDecorateScene', `cottage-decoration-choice:${itemId}`);
    await tapScreen(page, 640, 664);
  } else {
    await tapScreen(page, 260, 664);
  }
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['CottageInteriorScene']);
}

async function savedPlacements(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}');
    return save.home?.furnitureBySlot ?? {};
  });
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
      const player = scene(await snapshot(page), 'CottageInteriorScene').objects.find(
        ({ name }) => name === 'world-player-unicorn',
      );
      return player ? { x: Math.round(player.x), y: Math.round(player.y) } : null;
    })
    .toEqual({ x: 750, y: 790 });
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

test('H2.8 fresh-game starters support place, replace, move, remove and persistence', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');

  const freshInventory = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}');
    return { quantities: save.inventory?.itemQuantities, placements: save.home?.furnitureBySlot };
  });
  expect(freshInventory.placements).toEqual({});
  expect(freshInventory.quantities).toMatchObject({
    'item:starter-moonflower-hoop': 1,
    'item:starter-star-bunting': 1,
    'item:starter-meadow-rug': 1,
    'item:starter-daisy-vase': 1,
  });

  await editSlot(page, 'cottage-slot:left-wall', 'item:starter-star-bunting');
  expect(await savedPlacements(page)).toMatchObject({
    'cottage-slot:left-wall': 'item:starter-star-bunting',
  });

  await editSlot(page, 'cottage-slot:left-wall', 'item:starter-moonflower-hoop');
  expect(await savedPlacements(page)).toMatchObject({
    'cottage-slot:left-wall': 'item:starter-moonflower-hoop',
  });

  await editSlot(page, 'cottage-slot:right-wall', 'item:starter-moonflower-hoop');
  expect(await savedPlacements(page)).not.toHaveProperty('cottage-slot:left-wall');
  expect(await savedPlacements(page)).toMatchObject({
    'cottage-slot:right-wall': 'item:starter-moonflower-hoop',
  });

  await editSlot(page, 'cottage-slot:right-wall');
  expect(await savedPlacements(page)).not.toHaveProperty('cottage-slot:right-wall');

  await editSlot(page, 'cottage-slot:tea-table', 'item:starter-daisy-vase');
  await editSlot(page, 'cottage-slot:treasure-shelf', 'item:starter-daisy-vase');
  await editSlot(page, 'cottage-slot:centre-rug', 'item:starter-meadow-rug');
  expect(await savedPlacements(page)).toMatchObject({
    'cottage-slot:treasure-shelf': 'item:starter-daisy-vase',
    'cottage-slot:centre-rug': 'item:starter-meadow-rug',
  });
  expect(await savedPlacements(page)).not.toHaveProperty('cottage-slot:tea-table');

  await startSceneWithData(page, 'CottageDecorateScene', {
    slotId: 'cottage-slot:ribbon-display',
    returnToDecorateMode: true,
  });
  const editor = scene(await snapshot(page), 'CottageDecorateScene');
  expect(editor.objects.some(({ name }) => name === 'cottage-decorate-main-panel')).toBe(true);
  expect(editor.objects.some(({ name }) => name === 'cottage-decorate-preview-panel')).toBe(true);
  expect(
    editor.objects.some(
      ({ name }) => name === 'cottage-decoration-choice:item:starter-daisy-vase',
    ),
  ).toBe(true);
  await page.keyboard.press('Escape');

  await page.reload();
  await startScene(page, 'CottageInteriorScene');
  const value = await snapshot(page);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(
      ({ name }) => name === 'cottage-decoration-art:item:starter-daisy-vase',
    ),
  ).toBe(true);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(
      ({ name }) => name === 'cottage-decoration-art:item:starter-meadow-rug',
    ),
  ).toBe(true);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(({ name }) => name === 'Daisy Vase'),
  ).toBe(false);
});
