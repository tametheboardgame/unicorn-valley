import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  visible: boolean;
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
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForBrook(page: Page): Promise<DiagnosticScene> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
  await page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Browser diagnostics are unavailable.');
    api.startScene('CrystalBrookScene');
  });

  await page.waitForFunction(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const brook = api?.snapshot().scenes.find(({ key }) => key === 'CrystalBrookScene');
    return (
      api?.snapshot().activeScenes.includes('CrystalBrookScene') === true &&
      brook?.objects.some(({ name }) => name.startsWith('crystal-brook:boundary:rock:')) === true
    );
  });

  return page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const brook = api?.snapshot().scenes.find(({ key }) => key === 'CrystalBrookScene');
    if (!brook) throw new Error('Crystal Brook diagnostics unavailable.');
    return brook;
  });
}

test('H6.4 renders a varied physical rock perimeter while preserving route openings', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?diagnostics=1');

  const brook = await waitForBrook(page);
  const rocks = brook.objects.filter(
    ({ name, visible }) => visible && name.startsWith('crystal-brook:boundary:rock:'),
  );

  expect(rocks.length).toBeGreaterThanOrEqual(50);
  for (const kind of ['rounded', 'slab', 'lopsided', 'spire', 'stack', 'shelf']) {
    expect(rocks.some(({ name }) => name.includes(`:${kind}:`))).toBe(true);
  }

  const nearestRockDistance = (x: number, y: number): number =>
    Math.min(...rocks.map((rock) => Math.hypot(rock.x - x, rock.y - y)));

  expect(nearestRockDistance(120, 1090)).toBeGreaterThan(430);
  expect(nearestRockDistance(2860, 120)).toBeGreaterThan(250);
  expect(nearestRockDistance(3400, 1580)).toBeGreaterThan(190);
  expect(nearestRockDistance(2440, 2070)).toBeGreaterThan(320);

  expect(
    brook.objects.some(({ name }) => name === 'crystal-brook:meadow-gorge:rainbow-meadow-sign'),
  ).toBe(true);
  expect(brook.objects.some(({ name }) => name === 'crystal-brook:main-path')).toBe(true);
  expect(brook.objects.some(({ name }) => name === 'crystal-brook:east-woodland')).toBe(true);
  const woodsSign = brook.objects.find(
    ({ name }) => name === 'crystal-brook:whispering-woods-sign',
  );
  expect(woodsSign).toBeDefined();
  expect(woodsSign?.x).toBeLessThan(3100);
  expect(rocks.filter(({ x }) => x > 3300).length).toBeGreaterThanOrEqual(10);
});


test('H6.4 galloping along the rock perimeter does not snag on collision seams', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?diagnostics=1');

  await waitForBrook(page);
  await page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Browser diagnostics are unavailable.');
    api.setArcadeSpritePosition('CrystalBrookScene', 'world-player-unicorn', 900, 245);
  });

  const before = await page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const brook = api?.snapshot().scenes.find(({ key }) => key === 'CrystalBrookScene');
    const player = brook?.objects.find(({ name }) => name === 'world-player-unicorn');
    if (!player) throw new Error('Crystal Brook player unavailable.');
    return { x: player.x, y: player.y };
  });

  await page.keyboard.down('Shift');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(650);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Shift');

  const after = await page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const brook = api?.snapshot().scenes.find(({ key }) => key === 'CrystalBrookScene');
    const player = brook?.objects.find(({ name }) => name === 'world-player-unicorn');
    if (!player) throw new Error('Crystal Brook player unavailable.');
    return { x: player.x, y: player.y };
  });

  expect(after.x - before.x).toBeGreaterThan(180);
  expect(Math.abs(after.y - before.y)).toBeLessThan(18);
});
