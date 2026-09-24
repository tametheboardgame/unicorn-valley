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

test('H3.7 composes a main residential road with frontage side roads', async ({ page }) => {
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
      names.has('sunbeam-composition:village-boundary:locked-south-gate:sign') &&
      names.has('sunbeam-composition:unicorn-playground') &&
      names.has('sunbeam-playground:slide') &&
      names.has('sunbeam-playground:climbing-frame') &&
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
    { id: 'rosehip-cottage', x: 1630, y: 1450 },
    { id: 'bluebell-cottage', x: 2045, y: 1470 },
    { id: 'sunpetal-cottage', x: 2580, y: 1220 },
  ] as const;

  for (const home of expectedHomes) {
    const residence = objects.find(({ name }) => name === `sunbeam-residence:${home.id}`);
    const door = objects.find(({ name }) => name === `sunbeam-residence:${home.id}:door`);
    const step = objects.find(({ name }) => name === `sunbeam-residence:${home.id}:step`);

    expect(residence).toBeDefined();
    expect(residence?.visible).toBe(true);
    expect(residence?.x).toBeCloseTo(home.x, 0);
    expect(residence?.y).toBeCloseTo(home.y, 0);

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
    objects.some(({ name, visible }) => name === 'sunbeam-composition:path-network' && visible),
  ).toBe(true);

  const willowGarden = objects.find(({ name }) => name === 'sunbeam-composition:willow-garden');
  const southLeft = objects.find(
    ({ name }) => name === 'sunbeam-composition:village-boundary:fence:south-left',
  );
  const southRight = objects.find(
    ({ name }) => name === 'sunbeam-composition:village-boundary:fence:south-right',
  );
  const lockedGate = objects.find(
    ({ name }) => name === 'sunbeam-composition:village-boundary:locked-south-gate:sign',
  );
  const lockedGateText = objects.find(
    ({ name }) => name === 'sunbeam-composition:village-boundary:locked-south-gate:sign:text',
  );
  expect(willowGarden?.x).toBeCloseTo(430, 0);
  expect(willowGarden?.y).toBeCloseTo(1540, 0);
  const playground = objects.find(({ name }) => name === 'sunbeam-composition:unicorn-playground');
  const playgroundChildren = objects.filter(({ name }) =>
    name.startsWith('sunbeam-playground:child:'),
  );
  const removedCornerTree = objects.find(
    ({ name }) => name === 'environment-production:sunbeam-village:foreground',
  );

  expect(southLeft?.y).toBeCloseTo(1891, 0);
  expect(southRight?.y).toBeCloseTo(1891, 0);
  expect(lockedGate?.visible).toBe(true);
  expect(lockedGate?.x).toBeCloseTo(2340, 0);
  expect(lockedGateText?.text).toBe('CANDYLAND\nOPENING SOON');

  expect(playground?.visible).toBe(true);
  expect(playground?.x).toBeCloseTo(2660, 0);
  expect(playground?.y).toBeCloseTo(1698, 0);
  expect(playgroundChildren).toHaveLength(0);
  expect(objects.some(({ name, visible }) => name === 'sunbeam-playground:slide' && visible)).toBe(
    true,
  );
  expect(
    objects.some(({ name, visible }) => name === 'sunbeam-playground:climbing-frame' && visible),
  ).toBe(true);
  expect(
    objects.filter(({ name, visible }) => name === 'sunbeam-playground:shrub' && visible).length,
  ).toBeGreaterThanOrEqual(5);
  expect(
    objects.some(
      ({ name, visible }) =>
        name === 'sunbeam-composition:village-boundary:locked-south-gate:sign-layer' && visible,
    ),
  ).toBe(true);
  expect(removedCornerTree).toBeUndefined();
});
