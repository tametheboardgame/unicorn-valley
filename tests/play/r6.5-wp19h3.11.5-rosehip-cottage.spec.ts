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

test('H3.11.5 Rosehip Cottage is a distinct walkable lived-in home', async ({ page }) => {
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
      interiorId: 'rosehip-cottage',
      returnScene: 'SunbeamVillageScene',
    });
  });

  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual(['VillageInteriorScene']);

  const interior = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  if (!interior) throw new Error('Missing VillageInteriorScene');
  const names = new Set(interior.objects.map(({ name }) => name));

  expect(names.has('village-interior:rosehip-cottage:rose-rug')).toBe(true);
  expect(names.has('village-interior:rosehip-cottage:bed')).toBe(true);
  expect(names.has('village-interior:rosehip-cottage:tea-dresser')).toBe(true);
  expect(names.has('village-interior:rosehip-cottage:garden-journal')).toBe(true);
  expect(names.has('village-interior:rosehip-cottage:tea-table')).toBe(true);
  expect(names.has('village-interior:rosehip-cottage:reading-chair')).toBe(true);
  expect(names.has('village-interior:rosehip-cottage:foreground-plant')).toBe(true);
  expect([...names].some((name) => name.startsWith('village-interior-resident:'))).toBe(false);

  const bedCollider = interior.objects.find(
    ({ name }) => name === 'village-interior-collider:rosehip-cottage:rosehip-bed',
  );
  const teaCollider = interior.objects.find(
    ({ name }) => name === 'village-interior-collider:rosehip-cottage:rosehip-tea-table',
  );
  expect(bedCollider).toMatchObject({ bodyWidth: 360, bodyHeight: 190 });
  expect(teaCollider).toMatchObject({ bodyWidth: 210, bodyHeight: 145 });

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      390,
      585,
    );
  });
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
      return current?.objects.some(
        ({ name }) =>
          name ===
          'interaction-direct-zone:interaction:village-interior:rosehip-cottage:journal',
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
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual(['SunbeamVillageScene']);
});
