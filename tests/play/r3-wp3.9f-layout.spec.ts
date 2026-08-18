import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  name: string;
  textureKey: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
  scrollFactorX: number;
  scrollFactorY: number;
}

interface DiagnosticSceneSnapshot {
  key: string;
  camera: {
    worldX: number;
    worldY: number;
  };
  state: {
    raceStarted: boolean | null;
  };
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

async function getSnapshot(page: Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
  await page.waitForTimeout(350);
}

function overlapArea(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
): number {
  const overlapWidth = Math.max(
    0,
    Math.min(left.x + left.width / 2, right.x + right.width / 2) -
      Math.max(left.x - left.width / 2, right.x - right.width / 2),
  );
  const overlapHeight = Math.max(
    0,
    Math.min(left.y + left.height / 2, right.y + right.height / 2) -
      Math.max(left.y - left.height / 2, right.y - right.height / 2),
  );
  return overlapWidth * overlapHeight;
}

for (const [alias, sceneKey] of [
  ['village', 'SunbeamVillageScene'],
  ['meadow', 'RainbowMeadowScene'],
] as const) {
  test(`${sceneKey} suggestion card stays clear of the player spawn`, async ({ page }) => {
    await page.goto(`/?scene=${alias}&diagnostics=1`);
    await waitForScene(page, sceneKey);

    const snapshot = await getSnapshot(page);
    const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
    expect(scene).toBeTruthy();

    const player = scene?.objects.find((object) => object.textureKey?.startsWith('player-unicorn-'));
    const card = scene?.objects.find((object) => object.name === 'activity-suggestion-card');
    expect(player).toBeTruthy();
    expect(card).toBeTruthy();

    if (!scene || !player || !card) {
      return;
    }

    const playerScreen = {
      x: player.x - scene.camera.worldX,
      y: player.y - scene.camera.worldY,
      width: player.displayWidth,
      height: player.displayHeight,
    };
    const overlap = overlapArea(playerScreen, {
      x: card.x,
      y: card.y,
      width: card.displayWidth,
      height: card.displayHeight,
    });

    expect(overlap).toBe(0);
  });
}

test('Sunrise Sprint never exposes off-screen speed streaks as fixed UI', async ({ page }) => {
  await page.goto('/?scene=race&diagnostics=1');
  await waitForScene(page, 'RaceScene');
  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'RaceScene')?.state.raceStarted === true;
  });

  await page.keyboard.down('d');
  await page.waitForTimeout(900);
  await page.keyboard.up('d');
  await page.waitForTimeout(350);

  const snapshot = await getSnapshot(page);
  const scene = snapshot.scenes.find((candidate) => candidate.key === 'RaceScene');
  expect(scene).toBeTruthy();

  const visibleStreaks =
    scene?.objects.filter((object) => object.name === 'race-speed-streak' && object.visible) ?? [];
  expect(visibleStreaks.length).toBeGreaterThan(0);

  for (const streak of visibleStreaks) {
    expect(streak.scrollFactorX).toBe(0);
    expect(streak.scrollFactorY).toBe(0);
    expect(streak.x).toBeLessThan(snapshot.width);
    expect(streak.x + streak.displayWidth).toBeGreaterThan(0);
  }
});
