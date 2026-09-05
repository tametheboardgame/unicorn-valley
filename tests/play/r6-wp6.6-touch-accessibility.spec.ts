import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  type: string;
  name: string;
  text: string | null;
  textureKey: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  depth: number;
  visible: boolean;
  interactive: boolean;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
  state: Record<string, unknown>;
}

interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface LogicalTouchPoint {
  id: number;
  x: number;
  y: number;
}

test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });

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
}

async function waitForRaceStarted(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    return (
      diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.find((scene) => scene.key === 'RaceScene')?.state.raceStarted === true
    );
  });
}

function getScene(snapshot: BrowserDiagnosticSnapshot, sceneKey: string): DiagnosticSceneSnapshot {
  const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${sceneKey}.`);
  }
  return scene;
}

function getPlayer(scene: DiagnosticSceneSnapshot): DiagnosticObjectSnapshot {
  const player = scene.objects
    .filter((object) => object.textureKey?.startsWith('player-unicorn-'))
    .sort((left, right) => right.depth - left.depth)[0];
  if (!player) {
    throw new Error(`Missing player in ${scene.key}.`);
  }
  return player;
}

async function dispatchLogicalTouch(
  page: Page,
  type: 'touchstart' | 'touchend',
  touches: readonly LogicalTouchPoint[],
  changedTouches: readonly LogicalTouchPoint[],
): Promise<void> {
  const snapshot = await getSnapshot(page);
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }

  const toClient = ({ id, x, y }: LogicalTouchPoint) => ({
    id,
    clientX: bounds.x + (x / snapshot.width) * bounds.width,
    clientY: bounds.y + (y / snapshot.height) * bounds.height,
  });

  await canvas.evaluate(
    (element, event) => {
      const makeTouch = (point: { id: number; clientX: number; clientY: number }): Touch =>
        new Touch({
          identifier: point.id,
          target: element,
          clientX: point.clientX,
          clientY: point.clientY,
          screenX: point.clientX,
          screenY: point.clientY,
          pageX: point.clientX,
          pageY: point.clientY,
          radiusX: 1,
          radiusY: 1,
          rotationAngle: 0,
          force: event.type === 'touchstart' ? 0.5 : 0,
        });

      const active = event.touches.map(makeTouch);
      const changed = event.changedTouches.map(makeTouch);
      element.dispatchEvent(
        new TouchEvent(event.type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          touches: active,
          targetTouches: active,
          changedTouches: changed,
        }),
      );
    },
    {
      type,
      touches: touches.map(toClient),
      changedTouches: changedTouches.map(toClient),
    },
  );
}

async function logicalTap(page: Page, x: number, y: number, pointerId = 1): Promise<void> {
  const touch = { id: pointerId, x, y };
  await dispatchLogicalTouch(page, 'touchstart', [touch], [touch]);
  await page.waitForTimeout(70);
  await dispatchLogicalTouch(page, 'touchend', [], [touch]);
}

async function waitForForwardControl(page: Page, running: boolean): Promise<void> {
  await page.waitForFunction((expectedRunning) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const multiplier = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'RaceScene')?.state.forwardControlMultiplier;
    return expectedRunning ? Number(multiplier) > 0.5 : multiplier === 0;
  }, running);
}

test('target-tablet touch completes creator, exploration, Book and accessibility flow', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await logicalTap(page, 955, 238);
  await waitForScene(page, 'UnicornCreatorScene');

  let snapshot = await getSnapshot(page);
  const creator = getScene(snapshot, 'UnicornCreatorScene');
  const creatorTargets = creator.objects.filter((object) => object.visible && object.interactive);
  expect(creatorTargets.length).toBeGreaterThanOrEqual(20);
  for (const target of creatorTargets) {
    expect(
      Math.min(target.displayWidth, target.displayHeight),
      `Creator target at ${target.x},${target.y} is too small`,
    ).toBeGreaterThanOrEqual(48);
  }

  await logicalTap(page, 1080, 675);
  await waitForScene(page, 'MoonflowerGladeScene');

  snapshot = await getSnapshot(page);
  let glade = getScene(snapshot, 'MoonflowerGladeScene');
  for (const name of [
    'exploration-shell-map-button',
    'exploration-shell-bag-button',
    'exploration-shell-book-button',
    'exploration-shell-settings-nav-button',
  ]) {
    const target = glade.objects.find((object) => object.name === name);
    expect(target?.visible).toBe(true);
    expect(target?.interactive).toBe(true);
    expect(Math.min(target?.displayWidth ?? 0, target?.displayHeight ?? 0)).toBeGreaterThanOrEqual(
      48,
    );
  }

  for (const name of [
    'touch-movement-up',
    'touch-movement-down',
    'touch-movement-left',
    'touch-movement-right',
    'touch-movement-gallop',
  ]) {
    const target = glade.objects.find((object) => object.name === name);
    expect(target?.visible).toBe(true);
    expect(target?.interactive).toBe(true);
    expect(Math.min(target?.displayWidth ?? 0, target?.displayHeight ?? 0)).toBeGreaterThanOrEqual(
      80,
    );
  }

  expect(
    glade.objects.some(
      (object) =>
        object.name === 'exploration-tablet-hint' &&
        object.visible &&
        object.text?.includes('Tap the path'),
    ),
  ).toBe(true);
  expect(
    glade.objects.some(
      (object) => object.name === 'exploration-controls-button' && object.visible,
    ),
  ).toBe(false);

  const before = getPlayer(glade);
  await logicalTap(page, 900, 360);
  await page.waitForFunction(
    ({ startX }) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
      };
      const scene = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.find((candidate) => candidate.key === 'MoonflowerGladeScene');
      const player = scene?.objects
        .filter((object) => object.textureKey?.startsWith('player-unicorn-'))
        .sort((left, right) => right.depth - left.depth)[0];
      return player ? player.x - startX > 60 : false;
    },
    { startX: before.x },
  );

  await logicalTap(page, 340, 46);
  await waitForScene(page, 'WonderbookScene');
  await logicalTap(page, 640, 682);
  await waitForScene(page, 'MoonflowerGladeScene');

  await logicalTap(page, 486, 46);
  await waitForScene(page, 'SettingsScene');
  await logicalTap(page, 640, 418);
  await logicalTap(page, 640, 484);
  await page.waitForTimeout(300);

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('unicorn-valley:accessibility-settings:v1') ?? '{}'),
  );
  expect(stored).toEqual({ reducedMotion: true, highVisibilityInteractions: true });

  await logicalTap(page, 640, 666);
  await waitForScene(page, 'MoonflowerGladeScene');

  snapshot = await getSnapshot(page);
  glade = getScene(snapshot, 'MoonflowerGladeScene');
  const npcBefore = glade.objects.find((object) => object.name.startsWith('core-npc:'));
  expect(npcBefore).toBeDefined();
  await page.waitForTimeout(650);
  snapshot = await getSnapshot(page);
  glade = getScene(snapshot, 'MoonflowerGladeScene');
  const npcAfter = glade.objects.find((object) => object.name === npcBefore?.name);
  expect(npcAfter).toBeDefined();
  expect(Math.abs((npcAfter?.y ?? 0) - (npcBefore?.y ?? 0))).toBeLessThan(0.2);
});

test('target-tablet race supports simultaneous RUN and JUMP without cancelling RUN', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=race&diagnostics=1');
  await waitForScene(page, 'RaceScene');
  await waitForRaceStarted(page);
  await waitForForwardControl(page, false);

  await expect(page.locator('[data-race-mobile-controls="true"]')).toBeVisible();
  const runButton = page.locator('[data-race-action="run"]');
  const jumpButton = page.locator('[data-race-action="jump"]');
  const runBox = await runButton.boundingBox();
  const jumpBox = await jumpButton.boundingBox();
  expect(Math.min(runBox?.width ?? 0, runBox?.height ?? 0)).toBeGreaterThanOrEqual(96);
  expect(Math.min(jumpBox?.width ?? 0, jumpBox?.height ?? 0)).toBeGreaterThanOrEqual(96);
  expect(runBox?.x ?? 9999).toBeLessThan(220);
  expect((jumpBox?.x ?? 0) + (jumpBox?.width ?? 0)).toBeGreaterThan(800);

  const controlDeckHeight = await page
    .locator('[data-race-mobile-controls="true"]')
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(controlDeckHeight).toBeLessThan(180);

  let snapshot = await getSnapshot(page);
  let race = getScene(snapshot, 'RaceScene');
  const legacyRunZone = race.objects.find((object) => object.name === 'race-run-touch-zone');
  expect(legacyRunZone?.interactive).toBe(false);

  const start = getPlayer(race);
  await runButton.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 1,
  });
  await waitForForwardControl(page, true);
  await page.waitForTimeout(450);

  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  const beforeJump = getPlayer(race);
  expect(beforeJump.x - start.x).toBeGreaterThan(20);

  await jumpButton.dispatchEvent('pointerdown', {
    pointerId: 2,
    pointerType: 'touch',
    isPrimary: false,
    buttons: 1,
  });
  await page.waitForTimeout(140);
  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  const airborne = getPlayer(race);
  expect(airborne.y).toBeLessThan(beforeJump.y - 3);
  await jumpButton.dispatchEvent('pointerup', {
    pointerId: 2,
    pointerType: 'touch',
    isPrimary: false,
    buttons: 0,
  });

  await page.waitForTimeout(120);
  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  expect(Number(race.state.forwardControlMultiplier)).toBeGreaterThan(0.5);
  const afterSecondFinger = getPlayer(race);
  await page.waitForTimeout(280);
  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  expect(getPlayer(race).x - afterSecondFinger.x).toBeGreaterThan(10);

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await waitForForwardControl(page, false);

  await runButton.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 0,
  });
});

test('target-tablet race assistance can be changed with the replacement touch control', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=race&diagnostics=1');
  await waitForScene(page, 'RaceScene');

  await expect(page.locator('[data-race-mobile-controls="true"]')).toBeVisible();
  const help = page.locator('[data-race-action="help"]');
  const helpBox = await help.boundingBox();
  expect(Math.min(helpBox?.width ?? 0, helpBox?.height ?? 0)).toBeGreaterThanOrEqual(48);

  const snapshot = await getSnapshot(page);
  const race = getScene(snapshot, 'RaceScene');
  const control = race.objects.find((object) => object.name === 'race-assistance-control');
  const toggle = race.objects.find((object) => object.name === 'race-assistance-toggle');
  expect(control?.visible).toBe(false);
  expect(toggle?.interactive).toBe(false);

  if (!helpBox) {
    throw new Error('Missing replacement race assistance control.');
  }
  await page.touchscreen.tap(helpBox.x + helpBox.width / 2, helpBox.y + helpBox.height / 2);
  await page.waitForFunction(
    () => {
      const stored = JSON.parse(
        window.localStorage.getItem('unicorn-valley:race-settings:v1') ?? '{}',
      ) as { assistanceMode?: string };
      return stored.assistanceMode === 'extra-help';
    },
    undefined,
    { timeout: 5_000 },
  );

  const raceSettings = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('unicorn-valley:race-settings:v1') ?? '{}'),
  );
  expect(raceSettings.assistanceMode).toBe('extra-help');
});
