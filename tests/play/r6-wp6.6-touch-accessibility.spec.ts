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
    .sort((left, right) => right.y - left.y)[0];
  if (!player) {
    throw new Error(`Missing player in ${scene.key}.`);
  }
  return player;
}

async function logicalPointer(
  page: Page,
  type: 'pointerdown' | 'pointerup',
  logicalX: number,
  logicalY: number,
  pointerId: number,
): Promise<void> {
  const snapshot = await getSnapshot(page);
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }

  const clientX = bounds.x + (logicalX / snapshot.width) * bounds.width;
  const clientY = bounds.y + (logicalY / snapshot.height) * bounds.height;
  await canvas.evaluate(
    (element, event) => {
      element.dispatchEvent(
        new PointerEvent(event.type, {
          pointerId: event.pointerId,
          pointerType: 'touch',
          isPrimary: event.pointerId === 1,
          bubbles: true,
          cancelable: true,
          clientX: event.clientX,
          clientY: event.clientY,
          button: 0,
          buttons: event.type === 'pointerdown' ? 1 : 0,
          pressure: event.type === 'pointerdown' ? 0.5 : 0,
        }),
      );
    },
    { type, pointerId, clientX, clientY },
  );
}

async function logicalTap(page: Page, x: number, y: number, pointerId = 1): Promise<void> {
  await logicalPointer(page, 'pointerdown', x, y, pointerId);
  await page.waitForTimeout(70);
  await logicalPointer(page, 'pointerup', x, y, pointerId);
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
  test.setTimeout(60_000);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await logicalTap(page, 640, 447);
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
  for (const name of ['exploration-shell-book-button', 'exploration-shell-bag-button']) {
    const target = glade.objects.find((object) => object.name === name);
    expect(target?.visible).toBe(true);
    expect(target?.interactive).toBe(true);
    expect(Math.min(target?.displayWidth ?? 0, target?.displayHeight ?? 0)).toBeGreaterThanOrEqual(
      48,
    );
  }

  const before = getPlayer(glade);
  await logicalTap(page, 900, 360);
  await page.waitForTimeout(1200);
  snapshot = await getSnapshot(page);
  glade = getScene(snapshot, 'MoonflowerGladeScene');
  expect(getPlayer(glade).x - before.x).toBeGreaterThan(60);

  await logicalTap(page, 870, 58);
  await waitForScene(page, 'WonderbookScene');
  await logicalTap(page, 640, 682);
  await waitForScene(page, 'MoonflowerGladeScene');

  await logicalTap(page, 1168, 682);
  await page.waitForTimeout(100);
  await logicalTap(page, 1090, 500);
  await logicalTap(page, 1090, 556);
  await page.waitForTimeout(300);

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('unicorn-valley:accessibility-settings:v1') ?? '{}'),
  );
  expect(stored).toEqual({ reducedMotion: true, highVisibilityInteractions: true });

  snapshot = await getSnapshot(page);
  glade = getScene(snapshot, 'MoonflowerGladeScene');
  expect(
    glade.objects.some(
      (object) =>
        object.name === 'exploration-reduced-motion-toggle-label' && object.text?.endsWith('On'),
    ),
  ).toBe(true);
  expect(
    glade.objects.some(
      (object) =>
        object.name === 'exploration-high-visibility-toggle-label' && object.text?.endsWith('On'),
    ),
  ).toBe(true);

  const npcBefore = glade.objects.find((object) => object.name.startsWith('core-npc:'));
  expect(npcBefore).toBeDefined();
  await page.waitForTimeout(650);
  snapshot = await getSnapshot(page);
  glade = getScene(snapshot, 'MoonflowerGladeScene');
  const npcAfter = glade.objects.find((object) => object.name === npcBefore?.name);
  expect(npcAfter).toBeDefined();
  expect(Math.abs((npcAfter?.y ?? 0) - (npcBefore?.y ?? 0))).toBeLessThan(0.2);
});

test('target-tablet race supports simultaneous RUN and JUMP plus touch assistance', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=race&diagnostics=1');
  await waitForScene(page, 'RaceScene');
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
  await waitForForwardControl(page, false);

  let snapshot = await getSnapshot(page);
  let race = getScene(snapshot, 'RaceScene');
  const runZone = race.objects.find((object) => object.name === 'race-run-touch-zone');
  expect(runZone?.interactive).toBe(true);
  expect(runZone?.displayWidth).toBeGreaterThanOrEqual(244);
  expect(runZone?.displayHeight).toBeGreaterThanOrEqual(108);

  const start = getPlayer(race);
  await logicalPointer(page, 'pointerdown', 142, 618, 1);
  await waitForForwardControl(page, true);
  await page.waitForTimeout(450);

  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  const beforeJump = getPlayer(race);
  expect(beforeJump.x - start.x).toBeGreaterThan(20);

  await logicalPointer(page, 'pointerdown', 1152, 618, 2);
  await page.waitForTimeout(140);
  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  const airborne = getPlayer(race);
  expect(airborne.y).toBeLessThan(beforeJump.y - 3);
  await logicalPointer(page, 'pointerup', 1152, 618, 2);

  await page.waitForTimeout(120);
  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  expect(Number(race.state.forwardControlMultiplier)).toBeGreaterThan(0.5);
  const afterSecondFinger = getPlayer(race);
  await page.waitForTimeout(280);
  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  expect(getPlayer(race).x - afterSecondFinger.x).toBeGreaterThan(10);

  await logicalPointer(page, 'pointerup', 142, 618, 1);
  await waitForForwardControl(page, false);

  await logicalTap(page, 1130, 165);
  const raceSettings = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('unicorn-valley:race-settings:v1') ?? '{}'),
  );
  expect(raceSettings.assistanceMode).toBe('extra-help');
});
