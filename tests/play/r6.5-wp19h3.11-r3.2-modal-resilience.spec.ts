import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface Snapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface Diagnostics {
  snapshot(): Snapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

type InteriorId = 'bakery' | 'accessory-shop' | 'library';

test.use({ viewport: { width: 1280, height: 720 }, hasTouch: true });

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Diagnostics unavailable');
    return api.snapshot();
  });
}

async function openDiagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await expect.poll(async () => (await snapshot(page)).activeScenes.includes(sceneKey)).toBe(true);
}

async function waitForSceneClosed(page: Page, sceneKey: string): Promise<void> {
  await expect.poll(async () => (await snapshot(page)).activeScenes.includes(sceneKey)).toBe(false);
}

async function startInterior(page: Page, interiorId: InteriorId): Promise<void> {
  await page.evaluate((id) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    api?.startScene('VillageInteriorScene', {
      interiorId: id,
      returnScene: 'SunbeamVillageScene',
    });
  }, interiorId);
  await waitForScene(page, 'VillageInteriorScene');
  await waitForObject(page, 'VillageInteriorScene', `village-interior:${interiorId}:room-shell`);
  await waitForObject(page, 'VillageInteriorScene', 'exploration-shell-bag-button');
}

async function waitForObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await expect
    .poll(async () => {
      const scene = (await snapshot(page)).scenes.find(({ key }) => key === sceneKey);
      return scene?.objects.some(({ name, visible }) => name === objectName && visible) ?? false;
    })
    .toBe(true);
}

async function objectExists(page: Page, sceneKey: string, objectName: string): Promise<boolean> {
  const scene = (await snapshot(page)).scenes.find(({ key }) => key === sceneKey);
  return scene?.objects.some(({ name, visible }) => name === objectName && visible) ?? false;
}

async function clickNamedObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const state = await snapshot(page);
  const object = state.scenes
    .find(({ key }) => key === sceneKey)
    ?.objects.find(
      ({ name, visible, interactive }) => name === objectName && visible && interactive,
    );
  if (!object) {
    throw new Error(`Interactive ${sceneKey}/${objectName} is unavailable`);
  }
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Game canvas is unavailable');
  await page.mouse.click(
    box.x + (object.x / state.width) * box.width,
    box.y + (object.y / state.height) * box.height,
  );
}

async function playerPosition(page: Page): Promise<{ x: number; y: number }> {
  const scene = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  const player = scene?.objects.find(({ name }) => name === 'world-player-unicorn');
  if (!player) throw new Error('Village interior player is unavailable');
  return { x: player.x, y: player.y };
}

async function expectInteriorRestored(
  page: Page,
  interiorId: InteriorId,
  before: { x: number; y: number },
): Promise<void> {
  await waitForScene(page, 'VillageInteriorScene');
  await waitForObject(page, 'VillageInteriorScene', `village-interior:${interiorId}:room-shell`);
  await expect.poll(async () => playerPosition(page)).toEqual(before);
}

async function cycleInventory(
  page: Page,
  interiorId: InteriorId,
  initialTab: 'items' | 'map',
): Promise<void> {
  const before = await playerPosition(page);
  const sourceButton =
    initialTab === 'items' ? 'exploration-shell-bag-button' : 'exploration-shell-map-button';
  await clickNamedObject(page, 'VillageInteriorScene', sourceButton);
  await waitForScene(page, 'InventoryScene');
  await waitForSceneClosed(page, 'VillageInteriorScene');
  await waitForObject(
    page,
    'InventoryScene',
    initialTab === 'items' ? 'bag-pocket:food' : 'bag-map-current-location',
  );
  await clickNamedObject(page, 'InventoryScene', 'bag-close-button');
  await waitForSceneClosed(page, 'InventoryScene');
  await expectInteriorRestored(page, interiorId, before);
}

async function cycleSettings(page: Page, interiorId: InteriorId): Promise<void> {
  const before = await playerPosition(page);
  await clickNamedObject(page, 'VillageInteriorScene', 'exploration-shell-settings-nav-button');
  await waitForScene(page, 'SettingsScene');
  await waitForSceneClosed(page, 'VillageInteriorScene');
  await page.keyboard.press('Escape');
  await waitForSceneClosed(page, 'SettingsScene');
  await expectInteriorRestored(page, interiorId, before);
}

async function cycleWonderbook(page: Page, interiorId: InteriorId): Promise<void> {
  const before = await playerPosition(page);
  await clickNamedObject(page, 'VillageInteriorScene', 'exploration-shell-book-button');
  await waitForScene(page, 'WonderbookScene');
  await waitForSceneClosed(page, 'VillageInteriorScene');
  await clickNamedObject(page, 'WonderbookScene', 'wonderbook-close-button');
  await waitForSceneClosed(page, 'WonderbookScene');
  await expectInteriorRestored(page, interiorId, before);
}

for (const interiorId of ['bakery', 'accessory-shop', 'library'] as const) {
  test(`R3.2 keeps ${interiorId} stable across Bag, Map, Settings and Book cycles`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await openDiagnostics(page);
    await startInterior(page, interiorId);

    await cycleInventory(page, interiorId, 'items');
    await cycleInventory(page, interiorId, 'map');
    await cycleSettings(page, interiorId);
    await cycleWonderbook(page, interiorId);
    await cycleInventory(page, interiorId, 'items');
  });
}

test('R3.2 blocks Bag while the boutique overlay owns interaction, then restores it cleanly', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openDiagnostics(page);
  await startInterior(page, 'accessory-shop');

  await page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    api?.setArcadeSpritePosition('VillageInteriorScene', 'world-player-unicorn', 760, 650);
  });
  await page.keyboard.press('Enter');

  await expect
    .poll(async () => {
      const scene = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
      return (
        scene?.objects.filter(({ name }) => name.startsWith('dialogue-production-choice-'))
          .length ?? 0
      );
    })
    .toBe(2);

  await page.keyboard.press('Enter');
  await waitForObject(page, 'VillageInteriorScene', 'twinkle-shop-title');

  await page.keyboard.press('i');
  await page.waitForTimeout(250);
  expect((await snapshot(page)).activeScenes).not.toContain('InventoryScene');
  expect(await objectExists(page, 'VillageInteriorScene', 'twinkle-shop-title')).toBe(true);

  await page.keyboard.press('Escape');
  await expect
    .poll(async () => objectExists(page, 'VillageInteriorScene', 'twinkle-shop-title'))
    .toBe(false);

  await page.waitForTimeout(200);
  await cycleInventory(page, 'accessory-shop', 'items');
  expect(await objectExists(page, 'VillageInteriorScene', 'twinkle-shop-title')).toBe(false);
});
