import { expect, test } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  visible: boolean;
  x: number;
  y: number;
  displayWidth: number;
  text: string | null;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface BrowserDiagnosticsApi {
  snapshot(): { scenes: DiagnosticScene[] };
}

test('H3.7 expands Sunbeam with a restrained southern residential arc', async ({ page }) => {
  await page.goto('/?scene=village&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    const names = new Set(village?.objects.map(({ name }) => name));

    return (
      names.has('sunbeam-residence:rosehip-cottage') &&
      names.has('sunbeam-residence:bluebell-cottage') &&
      names.has('sunbeam-residence:sunpetal-cottage') &&
      names.has('sunbeam-residence:rosehip-cottage:door') &&
      names.has('sunbeam-residence:bluebell-cottage:door') &&
      names.has('sunbeam-residence:sunpetal-cottage:door')
    );
  });

  const objects = await page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    if (!village) {
      throw new Error('Missing Sunbeam Village diagnostics.');
    }
    return village.objects;
  });

  const expectedHomes = [
    { id: 'rosehip-cottage', x: 1750, y: 1390 },
    { id: 'bluebell-cottage', x: 2200, y: 1410 },
    { id: 'sunpetal-cottage', x: 2640, y: 1380 },
  ] as const;

  for (const home of expectedHomes) {
    const residence = objects.find(({ name }) => name === `sunbeam-residence:${home.id}`);
    const door = objects.find(({ name }) => name === `sunbeam-residence:${home.id}:door`);
    const step = objects.find(({ name }) => name === `sunbeam-residence:${home.id}:step`);

    expect(residence).toBeDefined();
    expect(residence?.visible).toBe(true);
    expect(residence?.x).toBeCloseTo(home.x, 0);
    expect(residence?.y).toBeCloseTo(home.y, 0);
    expect(residence?.y ?? 0).toBeGreaterThan(1350);
    expect(residence?.y ?? 9999).toBeLessThan(1500);

    expect(door).toBeDefined();
    expect(door?.visible).toBe(true);
    expect(door?.y ?? -1).toBeGreaterThan(0);
    expect(step).toBeDefined();
    expect(step?.visible).toBe(true);
    expect(step?.y ?? -1).toBeGreaterThan(door?.y ?? 0);
  }

  const visibleResidenceText = objects.filter(
    ({ name, type, visible }) =>
      visible && type === 'Text' && name.startsWith('sunbeam-residence:'),
  );
  expect(visibleResidenceText).toEqual([]);

  expect(
    objects.some(
      ({ name, visible }) => name === 'sunbeam-composition:path-network' && visible,
    ),
  ).toBe(true);

  const willowGarden = objects.find(
    ({ name }) => name === 'sunbeam-composition:willow-garden',
  );
  const southBoundary = objects.find(
    ({ name }) => name === 'sunbeam-composition:village-boundary:fence:south',
  );
  expect(willowGarden?.x).toBeCloseTo(430, 0);
  expect(willowGarden?.y).toBeCloseTo(1540, 0);
  expect(southBoundary?.y).toBeCloseTo(1891, 0);
});
