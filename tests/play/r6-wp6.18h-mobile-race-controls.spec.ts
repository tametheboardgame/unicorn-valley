import { expect, test, type Page } from '@playwright/test';

const SCENE_WAIT_TIMEOUT_MS = 12_000;
const STANDARD_RACE_SCENE = 'RaceScene';
const TUTORIAL_RACE_SCENE = 'NovaTutorialRaceScene';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  interactive: boolean;
}

interface DiagnosticSceneState {
  raceStarted: boolean | null;
  raceGrounded: boolean | null;
  forwardControlMultiplier: number | null;
}

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: Array<{
      key: string;
      objects: DiagnosticObject[];
    }>;
  };
  sceneState(sceneKey: string): DiagnosticSceneState | null;
  startScene(sceneKey: string, data?: object): void;
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction(
    (expectedScene) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .activeScenes.includes(expectedScene);
    },
    sceneKey,
    { timeout: SCENE_WAIT_TIMEOUT_MS },
  );
}

async function startRace(page: Page, sceneKey = STANDARD_RACE_SCENE): Promise<void> {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await page.evaluate((raceSceneKey) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(raceSceneKey);
  }, sceneKey);
  await waitForScene(page, sceneKey);
  await expect(page.locator('[data-race-mobile-controls="true"]')).toBeVisible();
}

async function namedObject(
  page: Page,
  sceneKey: string,
  name: string,
): Promise<DiagnosticObject | null> {
  return page.evaluate(
    ({ activeSceneKey, objectName }) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      const race = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.find((scene) => scene.key === activeSceneKey);
      return race?.objects.find((object) => object.name === objectName) ?? null;
    },
    { activeSceneKey: sceneKey, objectName: name },
  );
}

async function expectControlsBelowCanvas(page: Page): Promise<void> {
  const canvasBox = await page.locator('canvas').first().boundingBox();
  const controlsBox = await page.locator('[data-race-mobile-controls="true"]').boundingBox();
  expect(canvasBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect(controlsBox?.y ?? 0).toBeGreaterThanOrEqual(
    (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) - 2,
  );
}

async function expectCanvasControlsDisabled(page: Page, sceneKey: string): Promise<void> {
  for (const name of [
    'r6-wp6.18h:canvas-jump-target',
    'r6-wp6.18h:canvas-jump-shadow',
    'r6-wp6.18h:canvas-jump-label',
    'r6-wp6.18h:canvas-jump-hint',
    'r6-wp6.18h:canvas-exit',
    'race-run-button',
    'race-run-label',
    'race-run-hint',
    'race-assistance-control',
  ]) {
    const object = await namedObject(page, sceneKey, name);
    expect(object, `Expected ${name} in ${sceneKey}`).not.toBeNull();
    expect(object?.visible).toBe(false);
  }

  for (const name of [
    'r6-wp6.18h:canvas-jump-target',
    'r6-wp6.18h:canvas-exit',
    'race-run-touch-zone',
    'race-assistance-toggle',
  ]) {
    const object = await namedObject(page, sceneKey, name);
    expect(object, `Expected ${name} input in ${sceneKey}`).not.toBeNull();
    expect(object?.interactive).toBe(false);
  }
}

async function waitForRunState(page: Page, sceneKey: string, running: boolean): Promise<void> {
  await page.waitForFunction(
    ({ activeSceneKey, expectedRunning }) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      const multiplier = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.sceneState(
        activeSceneKey,
      )?.forwardControlMultiplier;
      return expectedRunning ? Number(multiplier) > 0.5 : multiplier === 0;
    },
    { activeSceneKey: sceneKey, expectedRunning: running },
  );
}

async function setRunHeld(page: Page, sceneKey: string, held: boolean): Promise<void> {
  const run = page.locator('[data-race-action="run"]');
  await run.dispatchEvent(held ? 'pointerdown' : 'pointerup', {
    pointerId: 7,
    pointerType: 'touch',
    isPrimary: true,
    buttons: held ? 1 : 0,
  });
  await waitForRunState(page, sceneKey, held);
}

async function performRealJump(page: Page, sceneKey: string): Promise<void> {
  const jump = page.locator('[data-race-action="jump"]');
  await page.waitForFunction((activeSceneKey) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const state = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.sceneState(activeSceneKey);
    return state?.raceStarted === true && state.raceGrounded === true;
  }, sceneKey);

  await jump.dispatchEvent('pointerdown', {
    pointerId: 8,
    pointerType: 'touch',
    isPrimary: false,
    buttons: 1,
  });
  try {
    await page.waitForFunction((activeSceneKey) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      return (
        diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.sceneState(activeSceneKey)
          ?.raceGrounded === false
      );
    }, sceneKey);
  } finally {
    await jump.dispatchEvent('pointerup', {
      pointerId: 8,
      pointerType: 'touch',
      isPrimary: false,
      buttons: 0,
    });
  }
}

test.describe('portrait mobile race controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('keeps large standard race controls outside the play area and drives the real inputs', async ({
    page,
  }) => {
    await startRace(page);
    await expectControlsBelowCanvas(page);

    const run = page.locator('[data-race-action="run"]');
    const jump = page.locator('[data-race-action="jump"]');
    const help = page.locator('[data-race-action="help"]');
    const leave = page.locator('[data-race-action="leave"]');

    const runBox = await run.boundingBox();
    const jumpBox = await jump.boundingBox();
    const helpBox = await help.boundingBox();
    const leaveBox = await leave.boundingBox();
    expect(runBox?.height ?? 0).toBeGreaterThanOrEqual(140);
    expect(jumpBox?.height ?? 0).toBeGreaterThanOrEqual(140);
    expect(helpBox?.height ?? 0).toBeGreaterThanOrEqual(64);
    expect(leaveBox?.height ?? 0).toBeGreaterThanOrEqual(64);

    await expectCanvasControlsDisabled(page, STANDARD_RACE_SCENE);

    await expect(help).toContainText('Race help:');
    const helpBefore = await help.textContent();
    await help.tap();
    await expect.poll(() => help.textContent()).not.toBe(helpBefore);

    await setRunHeld(page, STANDARD_RACE_SCENE, true);
    await performRealJump(page, STANDARD_RACE_SCENE);
    await waitForRunState(page, STANDARD_RACE_SCENE, true);
    await setRunHeld(page, STANDARD_RACE_SCENE, false);

    await leave.tap();
    await waitForScene(page, 'RainbowMeadowScene');
    await expect(page.locator('[data-race-mobile-controls="true"]')).toBeHidden();
  });

  test('uses the same large control deck for Nova first-run tutorial', async ({ page }) => {
    await startRace(page, TUTORIAL_RACE_SCENE);
    await expectControlsBelowCanvas(page);
    await expectCanvasControlsDisabled(page, TUTORIAL_RACE_SCENE);

    const run = page.locator('[data-race-action="run"]');
    const jump = page.locator('[data-race-action="jump"]');
    const runBox = await run.boundingBox();
    const jumpBox = await jump.boundingBox();
    expect(runBox?.height ?? 0).toBeGreaterThanOrEqual(140);
    expect(jumpBox?.height ?? 0).toBeGreaterThanOrEqual(140);

    await setRunHeld(page, TUTORIAL_RACE_SCENE, true);
    await performRealJump(page, TUTORIAL_RACE_SCENE);
    await waitForRunState(page, TUTORIAL_RACE_SCENE, true);
    await setRunHeld(page, TUTORIAL_RACE_SCENE, false);

    await page.locator('[data-race-action="leave"]').tap();
    await waitForScene(page, 'RainbowMeadowScene');
    await expect(page.locator('[data-race-mobile-controls="true"]')).toBeHidden();
  });
});

test.describe('landscape mobile race controls', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test('reserves a dedicated bottom control bar instead of covering race graphics', async ({
    page,
  }) => {
    await startRace(page);
    await expectControlsBelowCanvas(page);

    const rootBox = await page.locator('[data-race-mobile-controls="true"]').boundingBox();
    expect(rootBox?.height ?? 0).toBeGreaterThanOrEqual(90);

    for (const action of ['run', 'jump', 'help', 'leave']) {
      const box = await page.locator(`[data-race-action="${action}"]`).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(74);
    }
  });
});