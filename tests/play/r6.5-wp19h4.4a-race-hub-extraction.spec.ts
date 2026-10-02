import { expect, test, type Page } from '@playwright/test';

const PLAYER_NAME = 'world-player-unicorn';

interface DiagnosticObject {
  type: string;
  name: string;
  visible: boolean;
  x: number;
  y: number;
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

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(expected) === true;
  }, sceneKey);
}

async function sceneObjects(page: Page, sceneKey: string): Promise<DiagnosticObject[]> {
  return page.evaluate((key) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find((candidate) => candidate.key === key);
    if (!scene) {
      throw new Error(`Missing diagnostic scene ${key}.`);
    }
    return scene.objects;
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

test('H4.4A moves all Rainbow Run infrastructure into a standalone hub', async ({ page }) => {
  await page.goto('/?scene=race-hub&diagnostics=1');
  await waitForScene(page, 'RainbowRunEntryScene');

  await page.waitForFunction(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const hub = api?.snapshot().scenes.find(({ key }) => key === 'RainbowRunEntryScene');
    return (
      hub?.objects.some(({ name }) => name === 'rainbow-run-hub:race-gate') &&
      hub.objects.some(({ name }) => name === 'r6.5-wp12-race-entry:petal-parade') &&
      hub.objects.some(({ name }) => name === 'r6.5-wp12-race-entry:rainbow-cup')
    );
  });

  const objects = await sceneObjects(page, 'RainbowRunEntryScene');
  for (const name of [
    'rainbow-run-hub:ground',
    'rainbow-run-hub:tent',
    'rainbow-run-hub:ribbon-board',
    'rainbow-run-hub:cup-board',
    'rainbow-run-hub:course-poster',
    'rainbow-run-hub:race-gate',
    'core-npc:nova:race-hub',
    'r6.5-wp12-race-entry:petal-parade',
    'r6.5-wp12-race-entry:rainbow-cup',
  ]) {
    expect(objects.some((object) => object.name === name && object.visible)).toBe(true);
  }
});

test('H4.4A walks through the Meadow/Hub gateway in both directions', async ({ page }) => {
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForScene(page, 'RainbowMeadowScene');

  await positionPlayer(page, 'RainbowMeadowScene', 2950, 190);
  await waitForScene(page, 'RainbowRunEntryScene');

  await positionPlayer(page, 'RainbowRunEntryScene', 1100, 1240);
  await waitForScene(page, 'RainbowMeadowScene');

  const meadow = await sceneObjects(page, 'RainbowMeadowScene');
  const player = meadow.find(({ name }) => name === PLAYER_NAME);
  expect(player?.x).toBeCloseTo(2950, 0);
  expect(player?.y).toBeCloseTo(390, 0);
});

test('H4.4A race exits return to the Race Hub rather than Rainbow Meadow', async ({ page }) => {
  await page.goto('/?scene=race&diagnostics=1');
  await waitForScene(page, 'RaceScene');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'RainbowRunEntryScene');

  const snapshot = await page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot();
  });
  expect(snapshot?.activeScenes).toContain('RainbowRunEntryScene');
  expect(snapshot?.activeScenes).not.toContain('RainbowMeadowScene');
});
