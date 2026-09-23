import { expect, test } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  visible: boolean;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  boundsX: number;
  boundsY: number;
  boundsWidth: number;
  boundsHeight: number;
  depth: number;
  text: string | null;
  textureKey: string | null;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface BrowserDiagnosticsApi {
  snapshot(): { scenes: DiagnosticScene[] };
}

test('H3.8 recomposes village-life detail and grounds static core residents', async ({ page }) => {
  await page.goto('/?scene=village&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const village = api?.snapshot().scenes.find(({ key }) => key === 'SunbeamVillageScene');
    const names = new Set(village?.objects.map(({ name }) => name));

    return (
      names.has('sunbeam-composition:bunting') &&
      names.has('village-shopfront:accessory-shop:window-display') &&
      names.has('village-life:notice-board') &&
      names.has('village-life:sundial') &&
      names.has('village-life:bench') &&
      names.has('core-npc:willow:world') &&
      names.has('core-npc:marigold:world') &&
      names.has('core-npc:pebble:world')
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

  const bunting = objects.find(({ name }) => name === 'sunbeam-composition:bunting');
  const windowDisplay = objects.find(
    ({ name }) => name === 'village-shopfront:accessory-shop:window-display',
  );
  expect(bunting?.visible).toBe(true);
  expect(windowDisplay?.visible).toBe(true);

  // WorldOcclusionManager used to redraw the retired pre-H3 bunting as one depth-90
  // Graphics occluder from x=800..2200, y=745..804. That duplicate must never return.
  const legacyBuntingOccluder = objects.find(
    (object) =>
      object.visible &&
      object.type === 'Graphics' &&
      Math.abs(object.depth - 90) < 0.01 &&
      object.boundsX <= 810 &&
      object.boundsX + object.boundsWidth >= 2190 &&
      object.boundsY <= 750 &&
      object.boundsY + object.boundsHeight >= 800,
  );
  expect(legacyBuntingOccluder).toBeUndefined();

  for (const expected of [
    { name: 'village-life:notice-board', x: 1110, y: 1200 },
    { name: 'village-life:sundial', x: 1830, y: 1320 },
    { name: 'village-life:bench', x: 1180, y: 1560 },
  ] as const) {
    const prop = objects.find(({ name }) => name === expected.name);
    expect(prop?.visible).toBe(true);
    expect(prop?.x).toBeCloseTo(expected.x, 0);
    expect(prop?.y).toBeCloseTo(expected.y, 0);
  }

  expect(objects.some(({ text, visible }) => visible && text === '🎀  ✨')).toBe(false);
  expect(objects.some(({ text, visible }) => visible && text === '💧')).toBe(false);

  for (const expected of [
    { name: 'core-npc:willow:world', x: 535, y: 1349 },
    { name: 'core-npc:marigold:world', x: 1080, y: 924 },
    { name: 'core-npc:pebble:world', x: 2220, y: 1205 },
  ] as const) {
    const npc = objects.find(({ name }) => name === expected.name);
    expect(npc?.visible).toBe(true);
    expect(npc?.x).toBeCloseTo(expected.x, 0);
    expect(npc?.y).toBeCloseTo(expected.y, 0);
    expect(npc?.textureKey).toBe(`village-core-resident:${expected.name.split(':')[1]}:idle`);
    expect(npc?.displayWidth).toBeCloseTo(165, 0);
    expect(npc?.displayHeight).toBeCloseTo(109, 0);
  }
});
