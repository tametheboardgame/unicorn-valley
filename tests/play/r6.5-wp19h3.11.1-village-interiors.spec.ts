import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  bodyWidth: number | null;
  bodyHeight: number | null;
  visible: boolean;
  textureKey: string | null;
}
interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}
interface Snapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}
interface Diagnostics {
  snapshot(): Snapshot;
  startScene(key: string, data?: object): void;
  setArcadeSpritePosition(key: string, objectName: string, x: number, y: number): void;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const diagnostics = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Diagnostics unavailable');
    }
    return diagnostics.snapshot();
  });
}

async function startInterior(page: Page, interiorId: string): Promise<void> {
  await page.waitForFunction(() =>
    Boolean(
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .activeScenes.includes('TitleScene'),
    ),
  );
  await page.evaluate((id) => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene('VillageInteriorScene', { interiorId: id });
  }, interiorId);
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['VillageInteriorScene']);
}

test('H3.11.1 makes VillageInteriorScene a walkable semantic interior with physical collision', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startInterior(page, 'bakery');

  const interior = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  if (!interior) {
    throw new Error('Missing VillageInteriorScene');
  }

  const player = interior.objects.find(({ name }) => name === 'world-player-unicorn');
  const shell = interior.objects.find(({ name }) => name === 'village-interior:bakery:room-shell');
  const counter = interior.objects.find(({ name }) => name === 'village-interior:bakery:counter');
  const counterCollider = interior.objects.find(
    ({ name }) => name === 'village-interior-collider:bakery:counter',
  );
  const cinnamon = interior.objects.find(
    ({ name }) => name === 'village-interior-resident:resident:cinnamon',
  );
  const shellMapButton = interior.objects.find(
    ({ name }) => name === 'exploration-shell-map-button',
  );
  const shellLocation = interior.objects.find(({ name }) => name === 'exploration-location-title');

  expect(player).toMatchObject({ x: 750, y: 870, visible: true });
  expect(player?.textureKey?.startsWith('player-unicorn-village-interior:bakery')).toBe(true);
  expect(shell?.visible).toBe(true);
  expect(counter?.visible).toBe(true);
  expect(counterCollider).toMatchObject({ bodyWidth: 390, bodyHeight: 86 });
  expect(cinnamon?.visible).toBe(true);
  expect(interior.objects.some(({ name }) => name === 'village-interior:bakery:exit-gap')).toBe(
    true,
  );
  expect(shellMapButton?.visible).toBe(true);
  expect(shellLocation?.visible).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:patisserie-case'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:magic-cake-dome'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:bread-counter'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:doughnut-display'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:cupcake-display'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:cupcake-plaque'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:doughnut-plaque'),
  ).toBe(true);
  expect(
    interior.objects.some(
      ({ name }) =>
        name === 'interaction-direct-zone:interaction:village-interior:bakery:doughnuts',
    ),
  ).toBe(true);
  expect(
    interior.objects.some(
      ({ name }) => name === 'interaction-direct-zone:interaction:village-interior:bakery:cupcakes',
    ),
  ).toBe(true);
  expect(
    interior.objects.filter(({ name }) => name === 'village-interior:bakery:cafe-stool').length,
  ).toBe(2);

  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowLeft');
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.find(({ name }) => name === 'world-player-unicorn')?.x ?? 750;
    })
    .toBeLessThan(740);

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      410,
      565,
    );
  });
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.some(
        ({ name }) =>
          name === 'interaction-direct-zone:interaction:village-interior:bakery:counter',
      );
    })
    .toBe(true);

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      750,
      900,
    );
  });
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['SunbeamVillageScene']);
});

test('H3.11.2 does not clone outdoor residents into unfinished interiors', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await startInterior(page, 'library');

  const interior = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  if (!interior) {
    throw new Error('Missing VillageInteriorScene');
  }
  const names = new Set(interior.objects.map(({ name }) => name));

  expect(names.has('village-interior-resident:resident:tansy')).toBe(false);
  expect(names.has('village-interior-resident:resident:maple')).toBe(false);
  expect(names.has('village-interior:library:story-table')).toBe(true);
});

test('H3.11.2 Cinnamon uses the production dialogue menu to open the Bakery shop', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startInterior(page, 'bakery');

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      750,
      545,
    );
  });
  await page.keyboard.press('Enter');

  await expect
    .poll(async () => {
      const interior = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return interior?.objects.filter(({ name }) => name.startsWith('dialogue-production-choice-'))
        .length;
    })
    .toBe(2);

  await page.keyboard.press('Enter');

  await expect
    .poll(async () => {
      const interior = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return interior?.objects.some(({ name }) => name === 'bakery-shop-title') ?? false;
    })
    .toBe(true);
});

test('H3.11.3 gives Twinkle & Thread a dedicated walkable boutique and shopkeeper', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startInterior(page, 'accessory-shop');

  const interior = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  if (!interior) throw new Error('Missing VillageInteriorScene');

  const names = new Set(interior.objects.map(({ name }) => name));
  expect(names.has('village-interior-resident:resident:velvet')).toBe(true);
  expect(names.has('village-interior:accessory-shop:counter')).toBe(true);
  expect(names.has('village-interior:accessory-shop:wall-rack')).toBe(true);
  expect(names.has('village-interior:accessory-shop:display-ribbons')).toBe(true);
  expect(names.has('village-interior:accessory-shop:display-home')).toBe(true);
  expect(names.has('village-interior:accessory-shop:mirror')).toBe(true);
  expect(
    names.has('interaction-direct-zone:interaction:village-interior:accessory-shop:wall-rack'),
  ).toBe(true);
  expect(
    names.has('interaction-direct-zone:interaction:village-interior:accessory-shop:home-display'),
  ).toBe(true);

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      1010,
      555,
    );
  });
  await page.keyboard.press('Enter');

  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.filter(({ name }) => name.startsWith('dialogue-production-choice-'))
        .length;
    })
    .toBe(2);

  await page.keyboard.press('Enter');

  await expect
    .poll(async () => {
      const snapshotState = await snapshot(page);
      const current = snapshotState.scenes.find(({ key }) => key === 'VillageInteriorScene');
      return {
        activeScenes: snapshotState.activeScenes,
        hasShop: current?.objects.some(({ name }) => name === 'twinkle-shop-title') ?? false,
      };
    })
    .toEqual({
      activeScenes: ['VillageInteriorScene'],
      hasShop: true,
    });
});
