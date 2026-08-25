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
  const runTouch = { id: 1, x: 142, y: 618 } as const;
  const jumpTouch = { id: 2, x: 1152, y: 618 } as const;
  await dispatchLogicalTouch(page, 'touchstart', [runTouch], [runTouch]);
  await waitForForwardControl(page, true);
  await page.waitForTimeout(450);

  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  const beforeJump = getPlayer(race);
  expect(beforeJump.x - start.x).toBeGreaterThan(20);

  await dispatchLogicalTouch(page, 'touchstart', [runTouch, jumpTouch], [jumpTouch]);
  await page.waitForTimeout(140);
  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  const airborne = getPlayer(race);
  expect(airborne.y).toBeLessThan(beforeJump.y - 3);
  await dispatchLogicalTouch(page, 'touchend', [runTouch], [jumpTouch]);

  await page.waitForTimeout(120);
  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  expect(Number(race.state.forwardControlMultiplier)).toBeGreaterThan(0.5);
  const afterSecondFinger = getPlayer(race);
  await page.waitForTimeout(280);
  snapshot = await getSnapshot(page);
  race = getScene(snapshot, 'RaceScene');
  expect(getPlayer(race).x - afterSecondFinger.x).toBeGreaterThan(10);

  await dispatchLogicalTouch(page, 'touchend', [], [runTouch]);
  await waitForForwardControl(page, false);

  await logicalTap(page, 1130, 165, 3);
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
