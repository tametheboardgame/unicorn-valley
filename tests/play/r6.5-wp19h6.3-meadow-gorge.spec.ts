import { expect, test, type Page } from '@playwright/test';

const PLAYER_NAME = 'world-player-unicorn';

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  visible: boolean;
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: Array<{ key: string; objects: DiagnosticObject[] }>;
}

interface DiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
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

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await expect
    .poll(async () => (await snapshot(page)).activeScenes.includes(sceneKey), { timeout: 8_000 })
    .toBe(true);
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    api.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
  await page.waitForTimeout(220);
}

async function setPlayerPosition(
  page: Page,
  sceneKey: string,
  x: number,
  y: number,
): Promise<void> {
  await page.evaluate(
    ({ key, targetX, targetY }) => {
      const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      api.setArcadeSpritePosition(key, PLAYER_NAME, targetX, targetY);
    },
    { key: sceneKey, targetX: x, targetY: y },
  );
}

async function playerPosition(page: Page, sceneKey: string): Promise<{ x: number; y: number }> {
  const scene = (await snapshot(page)).scenes.find((candidate) => candidate.key === sceneKey);
  const player = scene?.objects.find((object) => object.name === PLAYER_NAME && object.visible);
  if (!player) {
    throw new Error(`Missing visible player in ${sceneKey}.`);
  }
  return { x: player.x, y: player.y };
}

test('Rainbow Meadow and Crystal Brook share one gorge transition without arrival bounce-back', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'RainbowMeadowScene');

  const meadow = (await snapshot(page)).scenes.find((scene) => scene.key === 'RainbowMeadowScene');
  expect(
    meadow?.objects.some(
      (object) => object.name === 'r6-region-gateway-art:meadow-crystal-brook:pool',
    ),
  ).toBe(true);
  expect(
    meadow?.objects.some(
      (object) => object.name === 'r6-region-gateway-art:meadow-crystal-brook:waterfall',
    ),
  ).toBe(true);

  await setPlayerPosition(page, 'RainbowMeadowScene', 3300, 1035);
  await waitForScene(page, 'CrystalBrookScene');

  let position = await playerPosition(page, 'CrystalBrookScene');
  expect(position.x).toBeCloseTo(340, 0);
  expect(position.y).toBeCloseTo(1090, 0);

  let brook = (await snapshot(page)).scenes.find((scene) => scene.key === 'CrystalBrookScene');
  expect(brook?.objects.some((object) => object.name === 'crystal-brook:meadow-gorge:recess')).toBe(
    true,
  );
  expect(brook?.objects.some((object) => object.name === 'crystal-brook:meadow-gorge:rocks')).toBe(
    true,
  );
  expect(
    brook?.objects.some((object) => object.name === 'crystal-brook:meadow-gorge:path-floor'),
  ).toBe(true);
  expect(
    brook?.objects.some((object) => object.name === 'crystal-brook:meadow-gorge:water-throat'),
  ).toBe(true);
  expect(
    brook?.objects.some(
      (object) => object.name === 'crystal-brook:meadow-gorge:rainbow-meadow-sign',
    ),
  ).toBe(true);
  expect(
    brook?.objects.some(
      (object) => object.name === 'r6-region-gateway-art:brook-meadow:cave-mouth',
    ),
  ).toBe(false);

  await page.waitForTimeout(450);
  expect((await snapshot(page)).activeScenes).toContain('CrystalBrookScene');

  await setPlayerPosition(page, 'CrystalBrookScene', 120, 1090);
  await waitForScene(page, 'RainbowMeadowScene');

  position = await playerPosition(page, 'RainbowMeadowScene');
  expect(position.x).toBeCloseTo(3150, 0);
  expect(position.y).toBeCloseTo(1100, 0);

  await page.waitForTimeout(450);
  expect((await snapshot(page)).activeScenes).toContain('RainbowMeadowScene');
});
