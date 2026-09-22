import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  text: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
}

async function villageSnapshot(page: Page): Promise<DiagnosticScene> {
  const value = await page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return api.snapshot();
  });
  const village = value.scenes.find(({ key }) => key === 'SunbeamVillageScene');
  if (!village) {
    throw new Error('Missing Sunbeam Village diagnostics.');
  }
  return village;
}

test('H3.1 removes legacy square, through-path residue and fake shopkeeper presentation', async ({
  page,
}) => {
  await page.goto('/?scene=village&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    return Boolean(
      village?.objects.some(({ name }) => name === 'sunbeam-composition:base') &&
        village.objects.some(
          ({ name }) => name === 'environment-production:sunbeam-village:anchor',
        ),
    );
  });

  const village = await villageSnapshot(page);

  expect(village.objects.some(({ name }) => name === 'sunbeam-composition:base')).toBe(true);
  expect(village.objects.some(({ name }) => name === 'sunbeam-composition:grass')).toBe(false);

  const legacySquare = village.objects.find(
    (object) =>
      object.type === 'Rectangle' &&
      Math.abs(object.x - 1500) <= 1 &&
      Math.abs(object.y - 1050) <= 1 &&
      Math.abs(object.displayWidth - 1220) <= 1 &&
      Math.abs(object.displayHeight - 690) <= 1,
  );
  expect(legacySquare).toBeUndefined();
  expect(village.objects.some(({ text }) => text === 'Shopkeeper')).toBe(false);
  expect(
    village.objects.some(
      ({ type, name }) => type === 'Graphics' && name === 'world-traversal-polish-detail',
    ),
  ).toBe(false);

  for (const layer of ['anchor', 'background', 'signature', 'foreground', 'ambient']) {
    expect(
      village.objects.some(
        ({ name }) => name === `environment-production:sunbeam-village:${layer}`,
      ),
    ).toBe(true);
  }

  for (const shopId of ['bakery', 'accessory-shop', 'library']) {
    expect(village.objects.some(({ name }) => name === `village-shopfront:${shopId}:wall`)).toBe(
      true,
    );
  }
});
