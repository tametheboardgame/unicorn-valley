import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  effectiveVisible: boolean;
  x: number;
  y: number;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: DiagnosticScene[];
  };
}

async function waitForMeadow(page: Page): Promise<DiagnosticScene> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
  await page.waitForFunction(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes('RainbowMeadowScene') === true;
  });

  return page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    if (!scene) throw new Error('Rainbow Meadow diagnostics unavailable.');
    return scene;
  });
}

test('H4.10 Meadow renders distinct authored boundary treatments', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');

  const meadow = await waitForMeadow(page);
  const visibleNames = meadow.objects
    .filter(({ effectiveVisible }) => effectiveVisible)
    .map(({ name }) => name);

  expect(visibleNames.filter((name) => name.startsWith('rainbow-meadow:boundary:hedge:')).length)
    .toBeGreaterThanOrEqual(6);
  expect(
    visibleNames.filter((name) => name.startsWith('rainbow-meadow:boundary:race-fence:')).length,
  ).toBe(2);
  expect(
    visibleNames.filter((name) => name.startsWith('rainbow-meadow:boundary:crystal-rock:')).length,
  ).toBeGreaterThanOrEqual(5);
  expect(
    visibleNames.filter((name) => name.startsWith('rainbow-meadow:boundary:wildflowers:')).length,
  ).toBeGreaterThanOrEqual(4);
});

test('H4.10 boundary presentation preserves the three visual route openings', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');

  const meadow = await waitForMeadow(page);
  const boundaries = meadow.objects.filter(
    ({ name, effectiveVisible }) =>
      effectiveVisible && name.startsWith('rainbow-meadow:boundary:'),
  );

  const nearestBoundaryDistance = (x: number, y: number): number =>
    Math.min(...boundaries.map((object) => Math.hypot(object.x - x, object.y - y)));

  expect(nearestBoundaryDistance(145, 1050)).toBeGreaterThan(180);
  expect(nearestBoundaryDistance(2950, 160)).toBeGreaterThan(170);
  expect(nearestBoundaryDistance(3290, 1035)).toBeGreaterThan(180);
});
