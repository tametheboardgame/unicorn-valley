import { expect, test, type Page } from '@playwright/test';

const PLAYER_NAME = 'world-player-unicorn';
const MEADOW_GATE = { x: 3300, y: 1580 } as const;
const MEADOW_RETURN = { x: 3130, y: 1645 } as const;
const BROOK_GATE = { x: 120, y: 1090 } as const;
const BROOK_ARRIVAL = { x: 340, y: 1090 } as const;

interface DiagnosticObject {
  type: string;
  name: string;
  text: string | null;
  visible: boolean;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface DiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return api.snapshot();
  });
}

async function sceneSnapshot(page: Page, sceneKey: string): Promise<DiagnosticScene> {
  const scene = (await snapshot(page)).scenes.find(({ key }) => key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${sceneKey}.`);
  }
  return scene;
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(expected) === true;
  }, sceneKey);
}

async function positionPlayer(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ key, targetX, targetY }) => {
      const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      api.setArcadeSpritePosition(key, 'world-player-unicorn', targetX, targetY);
    },
    { key: sceneKey, targetX: x, targetY: y },
  );
}

test('H4.4 makes Crystal Brook a waterfall, pool and stepping-stone Meadow threshold', async ({
  page,
}) => {
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForScene(page, 'RainbowMeadowScene');

  await page.waitForFunction(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const meadow = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    return meadow?.objects.some(
      ({ name, visible }) =>
        name === 'r6-region-gateway-art:meadow-crystal-brook:waterfall' && visible,
    );
  });

  const meadow = await sceneSnapshot(page, 'RainbowMeadowScene');
  const waterfall = meadow.objects.find(
    ({ name }) => name === 'r6-region-gateway-art:meadow-crystal-brook:waterfall',
  );
  expect(waterfall).toBeDefined();

  expect(
    meadow.objects.some(
      ({ name, visible }) => name === 'r6-region-gateway-art:meadow-crystal-brook:pool' && visible,
    ),
  ).toBe(true);
  expect(
    meadow.objects.filter(
      ({ name, visible }) =>
        name.startsWith('r6-region-gateway-art:meadow-crystal-brook:stepping-stone:') && visible,
    ),
  ).toHaveLength(5);
  expect(
    meadow.objects.filter(
      ({ name, visible }) =>
        name.startsWith('r6-region-gateway-art:meadow-crystal-brook:gateway-rock:') && visible,
    ),
  ).toHaveLength(6);
  expect(
    meadow.objects.filter(
      ({ name, visible }) =>
        name.startsWith('r6-region-gateway-art:meadow-crystal-brook:gateway-crystal:') && visible,
    ).length,
  ).toBeGreaterThanOrEqual(4);

  expect(
    meadow.objects.filter(({ name }) => name.startsWith('collision:crystal-brook-gateway-rock:')),
  ).toHaveLength(6);

  expect(
    meadow.objects.some(
      ({ type, x, y, displayWidth, displayHeight, visible }) =>
        type === 'Rectangle' &&
        visible &&
        Math.abs(x - 2670) < 2 &&
        Math.abs(y - 1080) < 2 &&
        Math.abs(displayWidth - 1180) < 2 &&
        Math.abs(displayHeight - 1120) < 2,
    ),
  ).toBe(false);

  expect(
    meadow.objects.some(({ name }) => name.endsWith('meadow-crystal-brook:cave-mouth')),
  ).toBe(false);

  const cupBoard = meadow.objects.find(({ name }) => name === 'meadow-depth:rainbow-cup-board');
  expect(cupBoard?.x).toBeCloseTo(2860, 0);
  expect(cupBoard?.y).toBeCloseTo(755, 0);

  await positionPlayer(page, 'RainbowMeadowScene', MEADOW_GATE.x, MEADOW_GATE.y);
  await waitForScene(page, 'CrystalBrookScene');

  const brook = await sceneSnapshot(page, 'CrystalBrookScene');
  let player = brook.objects.find(({ name }) => name === PLAYER_NAME);
  expect(player?.x).toBeCloseTo(BROOK_ARRIVAL.x, 0);
  expect(player?.y).toBeCloseTo(BROOK_ARRIVAL.y, 0);

  await positionPlayer(page, 'CrystalBrookScene', BROOK_GATE.x, BROOK_GATE.y);
  await waitForScene(page, 'RainbowMeadowScene');

  const returnedMeadow = await sceneSnapshot(page, 'RainbowMeadowScene');
  player = returnedMeadow.objects.find(({ name }) => name === PLAYER_NAME);
  expect(player?.x).toBeCloseTo(MEADOW_RETURN.x, 0);
  expect(player?.y).toBeCloseTo(MEADOW_RETURN.y, 0);
});
