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

test('H3.11.6 Bluebell Cottage is a distinct walkable sky-and-chime home', async ({ page }) => {
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
      interiorId: 'bluebell-cottage',
      returnScene: 'SunbeamVillageScene',
    });
  });

  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual(['VillageInteriorScene']);

  const interior = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  if (!interior) throw new Error('Missing VillageInteriorScene');
  const names = new Set(interior.objects.map(({ name }) => name));

  expect(names.has('village-interior:bluebell-cottage:blue-runner')).toBe(true);
  expect(names.has('village-interior:bluebell-cottage:bell-cabinet')).toBe(true);
  expect(names.has('village-interior:bluebell-cottage:daybed')).toBe(true);
  expect(names.has('village-interior:bluebell-cottage:sky-desk')).toBe(true);
  expect(names.has('village-interior:bluebell-cottage:chime-table')).toBe(true);
  expect(names.has('village-interior:bluebell-cottage:window-bench')).toBe(true);
  expect(names.has('village-interior:bluebell-cottage:foreground-chimes')).toBe(true);
  expect([...names].some((name) => name.startsWith('village-interior-resident:'))).toBe(false);

  const bellCollider = interior.objects.find(
    ({ name }) => name === 'village-interior-collider:bluebell-cottage:bluebell-bell-cabinet',
  );
  const chimeCollider = interior.objects.find(
    ({ name }) => name === 'village-interior-collider:bluebell-cottage:bluebell-chime-table',
  );
  expect(bellCollider).toMatchObject({ bodyWidth: 230, bodyHeight: 150 });
  expect(chimeCollider).toMatchObject({ bodyWidth: 300, bodyHeight: 145 });

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      480,
      720,
    );
  });
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.some(
        ({ name }) =>
          name === 'interaction-direct-zone:interaction:village-interior:bluebell-cottage:sky-desk',
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
