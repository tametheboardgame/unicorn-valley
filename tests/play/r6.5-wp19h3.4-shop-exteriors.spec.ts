import { expect, test } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  visible: boolean;
  x: number;
  y: number;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface BrowserDiagnosticsApi {
  snapshot(): { scenes: DiagnosticScene[] };
}

test('H3.4 gives each village shop a distinct atomic exterior identity', async ({ page }) => {
  await page.goto('/?scene=village&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    return Boolean(
      village?.objects.some(({ name }) => name === 'village-shopfront:bakery:identity') &&
        village.objects.some(
          ({ name }) => name === 'village-shopfront:accessory-shop:identity',
        ) &&
        village.objects.some(({ name }) => name === 'village-shopfront:library:identity'),
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

  const at = (name: string, x: number, y: number) => {
    const object = objects.find((candidate) => candidate.name === name);
    expect(object).toBeDefined();
    expect(object?.visible).toBe(true);
    expect(object?.x).toBeCloseTo(x, 0);
    expect(object?.y).toBeCloseTo(y, 0);
  };

  at('village-shopfront:bakery:wall', 700, 520);
  at('village-shopfront:accessory-shop:wall', 1450, 430);
  at('village-shopfront:library:wall', 2260, 540);

  for (const feature of [
    'village-shopfront:bakery:feature:chimney',
    'village-shopfront:accessory-shop:feature:turret',
    'village-shopfront:library:feature:chimney',
    'village-shopfront:library:feature:attic-window',
  ]) {
    expect(objects.some(({ name }) => name === feature)).toBe(true);
  }

  for (const [shopId, featureName] of [
    ['bakery', 'village-shopfront:bakery:feature:chimney'],
    ['accessory-shop', 'village-shopfront:accessory-shop:feature:turret'],
    ['library', 'village-shopfront:library:feature:chimney'],
  ] as const) {
    const featureIndex = objects.findIndex(({ name }) => name === featureName);
    const structureIndex = objects.findIndex(
      ({ name }) => name === `village-shopfront:${shopId}:structure`,
    );
    expect(featureIndex).toBeGreaterThanOrEqual(0);
    expect(structureIndex).toBeGreaterThan(featureIndex);
  }

  for (const shopId of ['bakery', 'accessory-shop', 'library'] as const) {
    expect(objects.some(({ name }) => name === `village-shopfront:${shopId}:sign`)).toBe(true);
    expect(objects.some(({ name }) => name === `village-shopfront:${shopId}:entry-cue`)).toBe(
      false,
    );
    const archIndex = objects.findIndex(
      ({ name }) => name === `village-shopfront:${shopId}:door-arch`,
    );
    const doorIndex = objects.findIndex(({ name }) => name === `village-shopfront:${shopId}:door`);
    expect(archIndex).toBeGreaterThanOrEqual(0);
    expect(doorIndex).toBeGreaterThan(archIndex);
  }

  const bakeryWindow = objects.find(
    ({ name }) => name === 'village-shopfront:bakery:window:left',
  );
  const accessoryWindow = objects.find(
    ({ name }) => name === 'village-shopfront:accessory-shop:window:left',
  );
  const storyWindow = objects.find(
    ({ name }) => name === 'village-shopfront:library:window:left',
  );

  expect(bakeryWindow?.type).toBe('Rectangle');
  expect(accessoryWindow?.type).toBe('Ellipse');
  expect(storyWindow?.type).toBe('Rectangle');

  const bakeryDoor = objects.find(({ name }) => name === 'village-shopfront:bakery:door');
  const accessoryDoor = objects.find(
    ({ name }) => name === 'village-shopfront:accessory-shop:door',
  );
  const storyDoor = objects.find(({ name }) => name === 'village-shopfront:library:door');

  expect(bakeryDoor?.x).toBeCloseTo(0, 0);
  expect(accessoryDoor?.x).toBeCloseTo(18, 0);
  expect(storyDoor?.x).toBeCloseTo(0, 0);

  const bakeryWindowArch = objects.findIndex(
    ({ name }) => name === 'village-shopfront:bakery:window:left:arch',
  );
  const bakeryWindowIndex = objects.findIndex(
    ({ name }) => name === 'village-shopfront:bakery:window:left',
  );
  expect(bakeryWindowArch).toBeGreaterThanOrEqual(0);
  expect(bakeryWindowIndex).toBeGreaterThan(bakeryWindowArch);

  const bakerySign = objects.find(({ name }) => name === 'village-shopfront:bakery:sign');
  const accessorySign = objects.find(
    ({ name }) => name === 'village-shopfront:accessory-shop:sign',
  );
  const storySign = objects.find(({ name }) => name === 'village-shopfront:library:sign');
  const accessoryRightWindow = objects.find(
    ({ name }) => name === 'village-shopfront:accessory-shop:window:right',
  );

  expect(bakerySign?.y).toBeCloseTo(-116, 0);
  expect(accessorySign?.x).toBeCloseTo(24, 0);
  expect(accessorySign?.y).toBeCloseTo(-102, 0);
  expect(storySign?.y).toBeCloseTo(-102, 0);
  expect(accessoryRightWindow?.x).toBeCloseTo(132, 0);
});
