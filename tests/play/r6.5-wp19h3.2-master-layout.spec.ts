import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  x: number;
  y: number;
  visible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface BrowserDiagnosticsApi {
  snapshot(): { scenes: DiagnosticScene[] };
}

async function villageObjects(page: Page): Promise<DiagnosticObject[]> {
  return page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    if (!village) {
      throw new Error('Missing Sunbeam Village diagnostics.');
    }
    return village.objects;
  });
}

test('H3.2 composes Sunbeam around the canonical district layout', async ({ page }) => {
  await page.goto('/?scene=village&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    return Boolean(
      village?.objects.some(({ name }) => name === 'sunbeam-district:residential') &&
        village.objects.some(({ name }) => name === 'village-shopfront:library:wall') &&
        village.objects.some(({ name }) => name === 'sunbeam-fountain:basin'),
    );
  });

  const objects = await villageObjects(page);
  const at = (name: string, x: number, y: number) => {
    const object = objects.find((candidate) => candidate.name === name);
    expect(object).toBeDefined();
    expect(object?.visible).toBe(true);
    expect(object?.x).toBeCloseTo(x, 0);
    expect(object?.y).toBeCloseTo(y, 0);
  };

  for (const district of [
    'west-approach',
    'high-street',
    'central-plaza',
    'willow-garden',
    'residential',
    'east-approach',
  ]) {
    expect(objects.some(({ name }) => name === `sunbeam-district:${district}`)).toBe(true);
  }

  at('village-shopfront:bakery:wall', 700, 520);
  at('village-shopfront:accessory-shop:wall', 1450, 430);
  at('village-shopfront:library:wall', 2260, 540);
  at('sunbeam-fountain:basin', 1500, 1060);

  expect(objects.some(({ name }) => name === 'exploration-path-polish')).toBe(false);

  const legacyBakeryWindows = objects.filter(
    ({ type, x, y }) =>
      type === 'Rectangle' &&
      Math.abs(y - 474) <= 2 &&
      (Math.abs(x - 774) <= 2 || Math.abs(x - 1026) <= 2),
  );
  expect(legacyBakeryWindows).toEqual([]);

  at('village-life:thread-window', 1305, 770);
});
