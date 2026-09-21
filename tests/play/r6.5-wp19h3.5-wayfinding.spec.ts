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

test('H3.5 uses physical village signs and gateway objects for wayfinding', async ({ page }) => {
  await page.goto('/?scene=village&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    return Boolean(
      village?.objects.some(
        ({ name }) => name === 'sunbeam-composition:gateway:moonflower-glade:sign',
      ) &&
        village.objects.some(
          ({ name }) => name === 'sunbeam-composition:gateway:rainbow-meadow:sign',
        ) &&
        village.objects.some(({ name }) => name === 'sunbeam-composition:willow-garden:sign'),
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

  at('sunbeam-composition:gateway:moonflower-glade', 125, 950);
  at('sunbeam-composition:gateway:rainbow-meadow', 2875, 950);

  for (const id of ['moonflower-glade', 'rainbow-meadow'] as const) {
    const sign = objects.find(({ name }) => name === `sunbeam-composition:gateway:${id}:sign`);
    const signText = objects.find(
      ({ name }) => name === `sunbeam-composition:gateway:${id}:sign:text`,
    );
    const northPost = objects.find(
      ({ name }) => name === `sunbeam-composition:gateway:${id}:post:north`,
    );
    const southPost = objects.find(
      ({ name }) => name === `sunbeam-composition:gateway:${id}:post:south`,
    );

    expect(sign?.type).toBe('Rectangle');
    expect(signText?.type).toBe('Text');
    expect(northPost?.type).toBe('Rectangle');
    expect(southPost?.type).toBe('Rectangle');
    expect(northPost?.y).toBeLessThan(0);
    expect(southPost?.y).toBeGreaterThan(0);
  }

  const gardenSign = objects.find(({ name }) => name === 'sunbeam-composition:willow-garden:sign');
  const gardenSignText = objects.find(
    ({ name }) => name === 'sunbeam-composition:willow-garden:sign:text',
  );
  expect(gardenSign?.type).toBe('Rectangle');
  expect(gardenSign?.y).toBeCloseTo(94, 0);
  expect(gardenSignText?.type).toBe('Text');

  for (const shopId of ['bakery', 'accessory-shop', 'library'] as const) {
    expect(objects.some(({ name }) => name === `village-shopfront:${shopId}:sign`)).toBe(true);
    expect(objects.some(({ name }) => name === `village-shopfront:${shopId}:entry-cue`)).toBe(
      false,
    );
  }
});
