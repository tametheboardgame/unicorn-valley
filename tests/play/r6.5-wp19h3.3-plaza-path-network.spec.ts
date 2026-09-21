import { expect, test } from '@playwright/test';

interface DiagnosticObject {
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

test('H3.3 renders one scene-owned plaza and routed village path network', async ({ page }) => {
  await page.goto('/?scene=village&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    return Boolean(
      village?.objects.some(({ name }) => name === 'sunbeam-composition:plaza') &&
        village.objects.some(({ name }) => name === 'sunbeam-composition:path-network') &&
        village.objects.filter(({ name }) => name === 'sunbeam-composition:plaza-marker').length ===
          4 &&
        village.objects.some(({ name }) => name === 'village-life:bench'),
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

  for (const name of ['sunbeam-composition:plaza', 'sunbeam-composition:path-network']) {
    const object = objects.find((candidate) => candidate.name === name);
    expect(object).toBeDefined();
    expect(object?.visible).toBe(true);
  }

  expect(objects.filter(({ name }) => name === 'sunbeam-composition:plaza-marker')).toHaveLength(4);
  expect(objects.some(({ name }) => name === 'sunbeam-composition:path:fountain')).toBe(false);

  expect(objects.some(({ name }) => name === 'exploration-path-polish')).toBe(false);
  expect(objects.some(({ name }) => name === 'world-traversal-polish-detail')).toBe(false);
  expect(objects.some(({ name }) => name === 'visual-tightening-detail')).toBe(false);

  const fountain = objects.find(({ name }) => name === 'sunbeam-fountain:basin');
  expect(fountain?.x).toBeCloseTo(1500, 0);
  expect(fountain?.y).toBeCloseTo(1060, 0);

  const bench = objects.find(({ name }) => name === 'village-life:bench');
  expect(bench?.x).toBeCloseTo(1840, 0);
  expect(bench?.y).toBeCloseTo(1330, 0);
});
