import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  bodyWidth: number | null;
  bodyHeight: number | null;
  visible: boolean;
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
    if (!diagnostics) throw new Error('Diagnostics unavailable');
    return diagnostics.snapshot();
  });
}

test('H3.11.7 Sunpetal Cottage is a distinct walkable gardening-and-sunroom home', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .activeScenes.includes('TitleScene'),
    ),
  );

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene('VillageInteriorScene', {
      interiorId: 'sunpetal-cottage',
      returnScene: 'SunbeamVillageScene',
    });
  });

  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['VillageInteriorScene']);

  const interior = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  if (!interior) throw new Error('Missing VillageInteriorScene');
  const names = new Set(interior.objects.map(({ name }) => name));

  expect(names.has('village-interior:sunpetal-cottage:sun-rug')).toBe(true);
  expect(names.has('village-interior:sunpetal-cottage:seed-shelf')).toBe(true);
  expect(names.has('village-interior:sunpetal-cottage:sun-table')).toBe(true);
  expect(names.has('village-interior:sunpetal-cottage:potting-bench')).toBe(true);
  expect(names.has('village-interior:sunpetal-cottage:breakfast-nook')).toBe(true);
  expect(names.has('village-interior:sunpetal-cottage:boot-bench')).toBe(true);
  expect(names.has('village-interior:sunpetal-cottage:foreground-herbs')).toBe(true);
  expect([...names].some((name) => name.startsWith('village-interior-resident:'))).toBe(false);

  const seedCollider = interior.objects.find(
    ({ name }) => name === 'village-interior-collider:sunpetal-cottage:sunpetal-seed-shelf',
  );
  const pottingCollider = interior.objects.find(
    ({ name }) => name === 'village-interior-collider:sunpetal-cottage:sunpetal-potting-bench',
  );
  expect(seedCollider).toMatchObject({ bodyWidth: 250, bodyHeight: 150 });
  expect(pottingCollider).toMatchObject({ bodyWidth: 270, bodyHeight: 120 });

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      985,
      735,
    );
  });
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.some(
        ({ name }) =>
          name === 'interaction-direct-zone:interaction:village-interior:sunpetal-cottage:potting-bench',
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
