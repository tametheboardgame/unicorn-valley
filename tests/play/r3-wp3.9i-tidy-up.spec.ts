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
}

async function logicalClick(page: Page, logicalX: number, logicalY: number): Promise<void> {
  const snapshot = await getSnapshot(page);
  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (logicalX / snapshot.width) * bounds.width,
    bounds.y + (logicalY / snapshot.height) * bounds.height,
  );
}

function sceneSnapshot(
  snapshot: BrowserDiagnosticSnapshot,
  sceneKey: string,
): DiagnosticSceneSnapshot {
  const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${sceneKey}.`);
  }
  return scene;
}

function playerObject(scene: DiagnosticSceneSnapshot): DiagnosticObjectSnapshot {
  const player = scene.objects.find(
    (object) =>
      object.name === 'world-player-unicorn' ||
      object.textureKey?.startsWith('player-unicorn-rainbow-meadow'),
  );
  if (!player) {
    throw new Error('Missing world player diagnostic object.');
  }
  return player;
}

test('exploration chrome uses stable zones, visible help, touch toggle and a centred canvas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  const canvas = await page.locator('canvas').boundingBox();
  expect(canvas).not.toBeNull();
  if (!canvas) {
    return;
  }
  const leftGutter = canvas.x;
  const rightGutter = 1440 - (canvas.x + canvas.width);
  expect(Math.abs(leftGutter - rightGutter)).toBeLessThanOrEqual(2);

  let snapshot = await getSnapshot(page);
  let glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  expect(
    glade.objects.some(
      (object) =>
        object.name === 'exploration-location-title' &&
        object.text === 'Moonflower Glade' &&
        object.visible,
    ),
  ).toBe(true);
  expect(
    glade.objects.some(
      (object) => object.name === 'exploration-controls-button' && object.interactive,
    ),
  ).toBe(true);
  expect(
    glade.objects.some((object) => object.visible && object.text?.startsWith('Pip is nearby.')),
  ).toBe(false);
  expect(
    glade.objects.some(
      (object) => object.name === 'activity-suggestion-card' && object.visible && object.y < 140,
    ),
  ).toBe(true);

  await logicalClick(page, 422, 46);
  await page.waitForTimeout(80);
  snapshot = await getSnapshot(page);
  glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  expect(
    glade.objects.some(
      (object) =>
        object.name === 'activity-suggestion-reopen' && object.visible && object.interactive,
    ),
  ).toBe(true);
  expect(
    glade.objects.some((object) => object.name === 'activity-suggestion-card' && object.visible),
  ).toBe(false);

  await logicalClick(page, 52, 102);
  await page.waitForTimeout(80);
  snapshot = await getSnapshot(page);
  glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  expect(
    glade.objects.some((object) => object.name === 'activity-suggestion-card' && object.visible),
  ).toBe(true);

  await logicalClick(page, 1168, 682);
  await page.waitForTimeout(80);
  snapshot = await getSnapshot(page);
  glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  expect(
    glade.objects.some((object) => object.name === 'exploration-controls-panel' && object.visible),
  ).toBe(true);
  expect(
    glade.objects.some(
      (object) =>
        object.name === 'exploration-controls-help' &&
        object.visible &&
        object.text?.includes('Click/tap the ground: walk there'),
    ),
  ).toBe(true);
  expect(
    glade.objects.some((object) => object.name === 'touch-movement-left' && object.visible),
  ).toBe(false);

  await logicalClick(page, 1090, 612);
  await page.waitForTimeout(80);
  snapshot = await getSnapshot(page);
  glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  expect(
    glade.objects.some(
      (object) => object.name === 'touch-movement-left' && object.visible && object.interactive,
    ),
  ).toBe(true);
});

test('clicking open ground moves the unicorn again', async ({ page }) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  let snapshot = await getSnapshot(page);
  let glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  const before = playerObject(glade);

  await logicalClick(page, 900, 360);
  await page.waitForTimeout(1200);

  snapshot = await getSnapshot(page);
  glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  const after = playerObject(glade);
  expect(after.x - before.x).toBeGreaterThan(60);
});

test('held movement carries through an automatic world transition on the first pass', async ({
  page,
}) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  await page.keyboard.down('ArrowRight');
  await waitForScene(page, 'SunbeamVillageScene');

  let snapshot = await getSnapshot(page);
  let village = sceneSnapshot(snapshot, 'SunbeamVillageScene');
  const arrived = playerObject(village);
  await page.waitForTimeout(300);
  snapshot = await getSnapshot(page);
  village = sceneSnapshot(snapshot, 'SunbeamVillageScene');
  const stillHeld = playerObject(village);
  expect(stillHeld.x - arrived.x).toBeGreaterThan(20);

  await page.keyboard.up('ArrowRight');
});

test('Nova keeps her canonical identity and returns the player to the exact conversation point', async ({
  page,
}) => {
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForScene(page, 'RainbowMeadowScene');

  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const meadow = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'RainbowMeadowScene');
    return meadow?.objects.some(
      (object) => object.name === 'nova-canonical-world' && object.visible,
    );
  });

  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(
    () => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
      };
      const meadow = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.find((scene) => scene.key === 'RainbowMeadowScene');
      return meadow?.objects.some(
        (object) => object.visible && object.text?.includes('Talk: Nova'),
      );
    },
    undefined,
    { timeout: 20_000 },
  );
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(80);

  let snapshot = await getSnapshot(page);
  const beforeConversation = playerObject(sceneSnapshot(snapshot, 'RainbowMeadowScene'));
  await page.keyboard.press('e');
  await waitForScene(page, 'NovaStoryScene');

  snapshot = await getSnapshot(page);
  const story = sceneSnapshot(snapshot, 'NovaStoryScene');
  expect(
    story.objects.some((object) => object.name === 'nova-canonical-identity' && object.visible),
  ).toBe(true);

  await page.keyboard.press('Escape');
  await waitForScene(page, 'RainbowMeadowScene');
  await page.waitForTimeout(100);

  snapshot = await getSnapshot(page);
  const afterConversation = playerObject(sceneSnapshot(snapshot, 'RainbowMeadowScene'));
  expect(Math.abs(afterConversation.x - beforeConversation.x)).toBeLessThan(1);
  expect(Math.abs(afterConversation.y - beforeConversation.y)).toBeLessThan(1);
});

test('finishing a Nova conversation offers a direct race choice and races use canonical Nova', async ({
  page,
}) => {
  await page.goto('/?scene=nova-story&diagnostics=1');
  await waitForScene(page, 'NovaStoryScene');

  for (let index = 0; index < 12; index += 1) {
    const snapshot = await getSnapshot(page);
    const story = sceneSnapshot(snapshot, 'NovaStoryScene');
    if (story.objects.some((object) => object.name === 'nova-race-decision' && object.visible)) {
      break;
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(90);
  }

  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const story = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'NovaStoryScene');
    return story?.objects.some((object) => object.name === 'nova-race-decision' && object.visible);
  });

  const snapshot = await getSnapshot(page);
  const story = sceneSnapshot(snapshot, 'NovaStoryScene');
  expect(
    story.objects.some((object) => object.name === 'nova-race-decision' && object.visible),
  ).toBe(true);
  expect(
    story.objects.some((object) => object.name === 'nova-race-decision-yes' && object.interactive),
  ).toBe(true);
  expect(
    story.objects.some((object) => object.name === 'nova-race-decision-no' && object.interactive),
  ).toBe(true);

  await page.keyboard.press('Enter');
  await waitForScene(page, 'NovaTutorialRaceScene');
  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const race = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'NovaTutorialRaceScene');
    return race?.objects.some((object) => object.name === 'nova-canonical-racer' && object.visible);
  });

  const raceSnapshot = await getSnapshot(page);
  const race = sceneSnapshot(raceSnapshot, 'NovaTutorialRaceScene');
  expect(
    race.objects.some((object) => object.name === 'nova-canonical-racer' && object.visible),
  ).toBe(true);
});
