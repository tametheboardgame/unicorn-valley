import { expect, test, type Page } from '@playwright/test';

const PLAYER_NAME = 'world-player-unicorn';
const MEADOW_GATE = { x: 3300, y: 1035 } as const;
const MEADOW_RETURN = { x: 3150, y: 1100 } as const;
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

test('H4.4C makes Crystal Brook a blocked deep basin with a four-strand reactive waterfall', async ({
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

  for (const name of [
    'r6-region-gateway-art:meadow-crystal-brook:pool',
    'r6-region-gateway-art:meadow-crystal-brook:shallow-water',
    'r6-region-gateway-art:meadow-crystal-brook:deep-water',
    'r6-region-gateway-art:meadow-crystal-brook:outlet-stream',
    'r6-region-gateway-art:meadow-crystal-brook:deep-outlet-channel',
    'r6-region-gateway-art:meadow-crystal-brook:hidden-recess',
    'r6-region-gateway-art:meadow-crystal-brook:sign',
    'r6-region-gateway-art:meadow-crystal-brook:waterfall',
  ]) {
    expect(meadow.objects.some((object) => object.name === name && object.visible)).toBe(true);
  }

  expect(
    meadow.objects.filter(
      ({ name, visible }) =>
        name.startsWith('r6-region-gateway-art:meadow-crystal-brook:stepping-stone:') && visible,
    ),
  ).toHaveLength(6);
  expect(
    meadow.objects.filter(
      ({ name, visible }) =>
        name.startsWith('r6-region-gateway-art:meadow-crystal-brook:gateway-rock:') && visible,
    ),
  ).toHaveLength(7);
  expect(
    meadow.objects.filter(
      ({ name, visible }) =>
        name.startsWith('r6-region-gateway-art:meadow-crystal-brook:gateway-crystal:') && visible,
    ).length,
  ).toBeGreaterThanOrEqual(4);

  expect(
    meadow.objects.filter(({ name }) => name.startsWith('collision:crystal-brook-gateway-rock:')),
  ).toHaveLength(7);
  expect(
    meadow.objects.filter(({ name }) => name.startsWith('collision:crystal-brook-deep-water:')),
  ).toHaveLength(7);

  expect(meadow.objects.some(({ name }) => name.endsWith('meadow-crystal-brook:cave-mouth'))).toBe(
    false,
  );
  expect(
    meadow.objects.some(
      ({ name, visible }) => name === 'rainbow-meadow:rainbow-run-hub-sign' && visible,
    ),
  ).toBe(true);
  expect(meadow.objects.some(({ name }) => name === 'meadow-depth:rainbow-cup-board')).toBe(false);
  expect(meadow.objects.some(({ name }) => name === 'core-npc:nova:world')).toBe(false);
  expect(
    meadow.objects.some(
      ({ name }) => name === 'r6-region-gateway-art:meadow-crystal-brook:dry-landing',
    ),
  ).toBe(false);
  expect(
    meadow.objects.some(
      ({ name }) => name === 'r6-region-gateway-art:meadow-crystal-brook:bank-sign',
    ),
  ).toBe(false);

  const closedCurtains = new Map(
    [
      'outer-left',
      'inner-left',
      'inner-right',
      'outer-right',
    ].map((id) => [
      id,
      meadow.objects.find(
        ({ name }) =>
          name === `r6-region-gateway-art:meadow-crystal-brook:waterfall-curtain-${id}`,
      ),
    ]),
  );
  for (const curtain of closedCurtains.values()) {
    expect(curtain).toBeDefined();
  }

  await positionPlayer(page, 'RainbowMeadowScene', 3100, 1100);
  await page.waitForTimeout(650);

  const openedMeadow = await sceneSnapshot(page, 'RainbowMeadowScene');
  for (const [id, closed] of closedCurtains.entries()) {
    const opened = openedMeadow.objects.find(
      ({ name }) =>
        name === `r6-region-gateway-art:meadow-crystal-brook:waterfall-curtain-${id}`,
    );
    expect(opened).toBeDefined();
    if (id.includes('left')) {
      expect(opened?.x ?? 9999).toBeLessThan((closed?.x ?? 0) - 35);
    } else {
      expect(opened?.x ?? 0).toBeGreaterThan((closed?.x ?? 9999) + 35);
    }
  }

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
