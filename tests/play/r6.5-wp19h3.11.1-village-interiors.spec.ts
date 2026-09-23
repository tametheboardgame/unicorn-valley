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
  const maple = interior.objects.find(
    ({ name }) => name === 'village-interior-resident:resident:maple',
  );

  expect(player).toMatchObject({ x: 750, y: 870, visible: true });
  expect(player?.textureKey?.startsWith('player-unicorn-village-interior:bakery')).toBe(true);
  expect(shell?.visible).toBe(true);
  expect(counter?.visible).toBe(true);
  expect(counterCollider).toMatchObject({ bodyWidth: 520, bodyHeight: 88 });
  expect(maple?.visible).toBe(true);

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
      760,
      650,
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

test('H3.11.1 assigns only the interior-appropriate resident', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await startInterior(page, 'library');

  const interior = (await snapshot(page)).scenes.find(
    ({ key }) => key === 'VillageInteriorScene',
  );
  if (!interior) {
    throw new Error('Missing VillageInteriorScene');
  }
  const names = new Set(interior.objects.map(({ name }) => name));

  expect(names.has('village-interior-resident:resident:tansy')).toBe(true);
  expect(names.has('village-interior-resident:resident:maple')).toBe(false);
  expect(names.has('village-interior:library:story-table')).toBe(true);
});
