import { expect, test, type Page } from '@playwright/test';
import { RAINBOW_MEADOW_LAYOUT } from '../../src/game/world/RainbowMeadowMap';
import { RAINBOW_RUN_HUB_LAYOUT } from '../../src/game/world/RainbowRunHubMap';

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

async function waitForNamedObject(page: Page, sceneKey: string, name: string): Promise<void> {
  await page.waitForFunction(
    ({ key, objectName }) => {
      const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__;
      return api?.snapshot().scenes.some(
        (scene) =>
          scene.key === key &&
          scene.objects.some((object) => object.name === objectName && object.visible),
      );
    },
    { key: sceneKey, objectName: name },
  );
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

  // Walk through the authored north boundary. This is independent of the nearby
  // explicit Enter Race Hub prompt and is preserved by the H4.7 replacement owner.
  const gate = RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance;
  await positionPlayer(page, 'RainbowMeadowScene', gate.position.x, gate.position.y);
  await waitForScene(page, 'RainbowRunEntryScene');
  await waitForNamedObject(page, 'RainbowRunEntryScene', PLAYER_NAME);

  const exit = RAINBOW_RUN_HUB_LAYOUT.meadowExit.walkThroughPosition;
  await positionPlayer(page, 'RainbowRunEntryScene', exit.x, exit.y);
  await waitForScene(page, 'RainbowMeadowScene');
  await waitForNamedObject(page, 'RainbowMeadowScene', PLAYER_NAME);

  const meadow = await sceneObjects(page, 'RainbowMeadowScene');
  const player = meadow.find(({ name }) => name === PLAYER_NAME);
  expect(player?.x).toBeCloseTo(gate.approach.x, 0);
  expect(player?.y).toBeCloseTo(gate.approach.y, 0);
});

test('H4.4A race exits return to the Race Hub rather than Rainbow Meadow', async ({ page }) => {
  await page.goto('/?scene=race&diagnostics=1');
  await waitForScene(page, 'RaceScene');
  // Wait for the real race HUD/input owner, not merely the scene-active flag,
  // before sending Escape (consistent with the passing ENG-WP1.2 reproduction).
  await waitForNamedObject(page, 'RaceScene', 'race-assistance-control');
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
