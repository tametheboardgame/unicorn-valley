import { expect, test, type Page } from '@playwright/test';

const PLAYER_NAME = 'world-player-unicorn';
const RACE_HUB_GATE = { x: 2950, y: 90 } as const;

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
    ({ key, playerName, targetX, targetY }) => {
      const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      api.setArcadeSpritePosition(key, playerName, targetX, targetY);
    },
    { key: sceneKey, playerName: PLAYER_NAME, targetX: x, targetY: y },
  );
}

test('H4.7 makes Rainbow Run an off-map destination instead of a Meadow race venue', async ({
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
      ({ name, visible }) => name === 'rainbow-meadow:rainbow-run-hub-sign' && visible,
    );
  });

  const meadow = await sceneSnapshot(page, 'RainbowMeadowScene');

  expect(
    meadow.objects.some(
      ({ name, visible }) => name === 'rainbow-meadow:district:north-east-meadow' && visible,
    ),
  ).toBe(true);
  expect(meadow.objects.some(({ name }) => name === 'rainbow-meadow:district:rainbow-run')).toBe(
    false,
  );

  const sign = meadow.objects.find(
    ({ name, visible }) => name === 'rainbow-meadow:rainbow-run-hub-sign' && visible,
  );
  expect(sign?.x).toBeCloseTo(3088, 0);
  expect(sign?.y).toBeCloseTo(138, 0);
  expect(sign?.displayWidth ?? 999).toBeLessThanOrEqual(215);

  expect(
    meadow.objects.some(
      ({ name, visible }) => name === 'rainbow-meadow:rainbow-run-wayfinding-post' && visible,
    ),
  ).toBe(true);
  expect(
    meadow.objects.some(
      ({ name, visible }) => name === 'rainbow-meadow:tree:race-reclaim-west' && visible,
    ),
  ).toBe(true);
  expect(
    meadow.objects.some(
      ({ name, visible }) => name === 'rainbow-meadow:tree:race-reclaim-east' && visible,
    ),
  ).toBe(true);

  expect(
    meadow.objects.filter(({ name }) => name.startsWith('collision:race-hub-gateway-')),
  ).toHaveLength(0);
  expect(meadow.objects.some(({ name }) => name === 'meadow-depth:rainbow-cup-board')).toBe(false);
  expect(meadow.objects.some(({ name }) => name.includes('finish-line'))).toBe(false);
  expect(meadow.objects.some(({ name }) => name.includes('podium'))).toBe(false);

  await positionPlayer(page, 'RainbowMeadowScene', RACE_HUB_GATE.x, RACE_HUB_GATE.y);
  await waitForScene(page, 'RainbowRunEntryScene');
});

for (const viewport of [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'phone', width: 844, height: 390 },
] as const) {
  test(`H4.7 Race Hub north route remains reachable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/?scene=meadow&diagnostics=1');
    await waitForDiagnostics(page);
    await waitForScene(page, 'RainbowMeadowScene');

    await positionPlayer(page, 'RainbowMeadowScene', RACE_HUB_GATE.x, RACE_HUB_GATE.y);
    await waitForScene(page, 'RainbowRunEntryScene');
  });
}
