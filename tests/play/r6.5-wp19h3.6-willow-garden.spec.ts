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

test('H3.6 makes Willow garden a physical south-west village district', async ({ page }) => {
  await page.goto('/?scene=village&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    return Boolean(
      village?.objects.some(({ name }) => name === 'sunbeam-composition:willow-garden') &&
        village.objects.some(({ name }) => name === 'core-npc:willow:world') &&
        village.objects.some(
          ({ name }) => name === 'sunbeam-composition:willow-garden:fence:west',
        ) &&
        village.objects.some(
          ({ name }) => name === 'sunbeam-composition:willow-garden:bed:north-west',
        ) &&
        village.objects.some(({ name }) => name === 'sunbeam-composition:village-boundary') &&
        village.objects.some(({ name }) => name === 'sunbeam-composition:base') &&
        village.objects.some(
          ({ name }) => name === 'environment-production:sunbeam-village:south-west-tree',
        ) &&
        village.objects.some(
          ({ name }) => name === 'environment-production:sunbeam-village:south-west-tree:canopy',
        ),
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

  const garden = objects.find(({ name }) => name === 'sunbeam-composition:willow-garden');
  expect(garden).toBeDefined();
  expect(garden?.visible).toBe(true);
  expect(garden?.x).toBeCloseTo(430, 0);
  expect(garden?.y).toBeCloseTo(1540, 0);
  expect(garden?.x ?? 9999).toBeLessThan(650);
  expect(garden?.y ?? 0).toBeGreaterThan(1470);

  const willow = objects.find(({ name }) => name === 'core-npc:willow:world');
  expect(willow).toBeDefined();
  expect(willow?.visible).toBe(true);
  expect(willow?.x).toBeCloseTo(535, 0);
  expect(willow?.x ?? 9999).toBeLessThan(680);
  expect(willow?.y ?? 0).toBeGreaterThan(1335);
  expect(willow?.y ?? 9999).toBeLessThan(1360);

  const beds = objects.filter(({ name }) =>
    name.startsWith('sunbeam-composition:willow-garden:bed:'),
  );
  expect(beds).toHaveLength(4);
  for (const bed of beds) {
    expect(bed.visible).toBe(true);
    expect(bed.type).toBe('Rectangle');
    expect(bed.displayWidth).toBeGreaterThanOrEqual(145);
  }

  const fenceIds = ['west', 'south', 'east-lower', 'north-left'] as const;
  for (const id of fenceIds) {
    const fence = objects.find(
      ({ name }) => name === `sunbeam-composition:willow-garden:fence:${id}`,
    );
    expect(fence).toBeDefined();
    expect(fence?.visible).toBe(true);
    expect(fence?.type).toBe('Rectangle');
  }

  const gardenPostIds = [
    'north-west',
    'south-west',
    'south-east',
    'gate-north',
    'gate-east',
  ] as const;
  for (const id of gardenPostIds) {
    const post = objects.find(
      ({ name }) => name === `sunbeam-composition:willow-garden:post:${id}`,
    );
    expect(post).toBeDefined();
    expect(post?.visible).toBe(true);
    expect(post?.type).toBe('Rectangle');
  }

  expect(objects.some(({ name }) => name === 'sunbeam-composition:base')).toBe(true);
  expect(objects.some(({ name }) => name === 'sunbeam-composition:grass')).toBe(false);

  const boundaryFenceIds = [
    'north',
    'south-left',
    'south-right',
    'west-north',
    'west-south',
    'east-north',
    'east-south',
  ] as const;
  for (const id of boundaryFenceIds) {
    expect(
      objects.some(
        ({ name, visible }) =>
          name === `sunbeam-composition:village-boundary:fence:${id}` && visible,
      ),
    ).toBe(true);
  }

  for (const id of ['south-left', 'south-right'] as const) {
    const southBoundary = objects.find(
      ({ name }) => name === `sunbeam-composition:village-boundary:fence:${id}`,
    );
    expect(southBoundary).toBeDefined();
    expect(southBoundary?.visible).toBe(true);
    expect(southBoundary?.y).toBeCloseTo(1891, 0);
  }

  const southWestTree = objects.find(
    ({ name }) => name === 'environment-production:sunbeam-village:south-west-tree',
  );
  const southWestTreeCanopy = objects.find(
    ({ name }) => name === 'environment-production:sunbeam-village:south-west-tree:canopy',
  );
  expect(southWestTree).toBeDefined();
  expect(southWestTree?.visible).toBe(true);
  expect(southWestTree?.x).toBeCloseTo(185, 0);
  expect(southWestTree?.y).toBeCloseTo(1835, 0);
  expect(southWestTreeCanopy).toBeDefined();
  expect(southWestTreeCanopy?.visible).toBe(true);
  expect(southWestTreeCanopy?.x).toBeCloseTo(185, 0);
  expect(southWestTreeCanopy?.y).toBeCloseTo(1835, 0);

  const sign = objects.find(({ name }) => name === 'sunbeam-composition:willow-garden:sign');
  const signText = objects.find(
    ({ name }) => name === 'sunbeam-composition:willow-garden:sign:text',
  );
  expect(sign?.type).toBe('Rectangle');
  expect(sign?.displayWidth).toBeCloseTo(286, 0);
  expect(sign?.y).toBeGreaterThan(150);
  expect(signText?.type).toBe('Text');
  expect(signText?.text).toMatch(/^WILLOW'S (GARDEN|MOONFLOWERS)$/);

  expect(objects.some(({ name, visible }) => name === 'village-npc-label:willow' && visible)).toBe(
    false,
  );
});
