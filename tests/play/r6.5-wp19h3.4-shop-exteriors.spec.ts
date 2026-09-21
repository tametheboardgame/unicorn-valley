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
    'village-shopfront:library:feature:attic-window',
  ]) {
    expect(objects.some(({ name }) => name === feature)).toBe(true);
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
});
