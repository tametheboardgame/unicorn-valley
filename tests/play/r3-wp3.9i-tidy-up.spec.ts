import { expect, type Page, test } from '@playwright/test';

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

async function positionAtNovaContextualAction(page: Page): Promise<void> {
  await page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: {
          setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
        };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    diagnostics?.setArcadeSpritePosition('RainbowMeadowScene', 'world-player-unicorn', 2_380, 950);
  });
  await page.waitForFunction(
    () => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const meadow = diagnostics
        ?.snapshot()
        .scenes.find((scene) => scene.key === 'RainbowMeadowScene');
      return (
        meadow?.objects.some(
          (object) => object.name === 'exploration-interaction-prompt' && object.visible,
        ) === true &&
        meadow.objects.some(
          (object) =>
            object.name === 'exploration-tablet-hint' &&
            object.visible &&
            object.text?.includes('Nova'),
        )
      );
    },
    undefined,
    { timeout: 5_000 },
  );
}

async function waitForVisibleObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ expectedScene, expectedObject }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const scene = diagnostics
        ?.snapshot()
        .scenes.find((candidate) => candidate.key === expectedScene);
      return scene?.objects.some(
        (object) => object.name === expectedObject && object.visible,
      );
    },
    { expectedScene: sceneKey, expectedObject: objectName },
  );
}

test('exploration chrome uses the canonical static HUD and a centred canvas', async ({ page }) => {
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

  const snapshot = await getSnapshot(page);
  const glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  expect(
    glade.objects.some(
      (object) =>
        object.name === 'exploration-location-title' &&
        object.text === 'Moonflower Glade' &&
        object.visible,
    ),
  ).toBe(true);
  expect(glade.objects.some((object) => object.name === 'exploration-controls-button')).toBe(false);
  expect(
    glade.objects.some((object) => object.visible && object.text?.startsWith('Pip is nearby.')),
  ).toBe(false);
  expect(glade.objects.some((object) => object.name === 'activity-suggestion-card')).toBe(false);
  expect(snapshot.activeScenes).toContain('ExplorationHudOverlayScene');
});

test('clicking open ground moves the unicorn again', async ({ page }) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  const snapshot = await getSnapshot(page);
  const glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  const before = playerObject(glade);

  await logicalClick(page, 900, 360);
  await expect
    .poll(
      async () => {
        const current = await getSnapshot(page);
        const player = playerObject(sceneSnapshot(current, 'MoonflowerGladeScene'));
        return player.x - before.x;
      },
      { timeout: 5_000 },
    )
    .toBeGreaterThan(60);
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

test('Nova keeps her canonical identity and conversation stays at the exact world point', async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForScene(page, 'RainbowMeadowScene');

  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const meadow = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'RainbowMeadowScene');
    return (
      meadow?.objects.some(
        (object) =>
          object.name === 'core-npc:nova:world' &&
          object.visible &&
          object.textureKey === 'core-npc-production:nova:neutral',
      ) === true &&
      !meadow.objects.some((object) => object.name === 'nova-canonical-world' && object.visible)
    );
  });

  await positionAtNovaContextualAction(page);

  let snapshot = await getSnapshot(page);
  let meadow = sceneSnapshot(snapshot, 'RainbowMeadowScene');
  expect(
    meadow.objects.some(
      (object) =>
        object.name === 'exploration-interaction-prompt-label' &&
        object.visible &&
        object.text === 'Talk',
    ),
  ).toBe(true);
  const beforeConversation = playerObject(meadow);

  await page.keyboard.press('e', { delay: 50 });
  await waitForVisibleObject(page, 'RainbowMeadowScene', 'dialogue-production-panel');

  snapshot = await getSnapshot(page);
  meadow = sceneSnapshot(snapshot, 'RainbowMeadowScene');
  expect(snapshot.activeScenes).toContain('RainbowMeadowScene');
  expect(snapshot.activeScenes).not.toContain('NovaStoryScene');
  expect(
    meadow.objects.some(
      (object) =>
        object.name === 'dialogue-production-speaker-name' && object.visible && object.text === 'Nova',
    ),
  ).toBe(true);
  expect(
    meadow.objects.some(
      (object) =>
        object.name === 'dialogue-production-portrait-nova' &&
        object.visible &&
        object.textureKey === 'core-npc-production:nova:neutral',
    ),
  ).toBe(true);

  await page.keyboard.press('Escape', { delay: 50 });
  await expect
    .poll(async () => {
      const current = sceneSnapshot(await getSnapshot(page), 'RainbowMeadowScene');
      return current.objects.some(
        (object) => object.name === 'dialogue-production-panel' && object.visible,
      );
    })
    .toBe(false);

  snapshot = await getSnapshot(page);
  meadow = sceneSnapshot(snapshot, 'RainbowMeadowScene');
  const afterConversation = playerObject(meadow);
  expect(Math.abs(afterConversation.x - beforeConversation.x)).toBeLessThan(1);
  expect(Math.abs(afterConversation.y - beforeConversation.y)).toBeLessThan(1);
});

test('finishing Nova conversation offers an in-world race choice and uses canonical Nova', async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForScene(page, 'RainbowMeadowScene');
  await positionAtNovaContextualAction(page);
  await page.keyboard.press('e', { delay: 50 });
  await waitForVisibleObject(page, 'RainbowMeadowScene', 'dialogue-production-panel');

  for (let index = 0; index < 12; index += 1) {
    const current = sceneSnapshot(await getSnapshot(page), 'RainbowMeadowScene');
    if (current.objects.some((object) => object.name === 'nova-race-decision' && object.visible)) {
      break;
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(90);
  }

  await waitForVisibleObject(page, 'RainbowMeadowScene', 'nova-race-decision');

  let snapshot = await getSnapshot(page);
  let meadow = sceneSnapshot(snapshot, 'RainbowMeadowScene');
  expect(snapshot.activeScenes).not.toContain('NovaStoryScene');
  expect(
    meadow.objects.some((object) => object.name === 'nova-race-decision-yes' && object.interactive),
  ).toBe(true);
  expect(
    meadow.objects.some((object) => object.name === 'nova-race-decision-no' && object.interactive),
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

  snapshot = await getSnapshot(page);
  const race = sceneSnapshot(snapshot, 'NovaTutorialRaceScene');
  expect(
    race.objects.some((object) => object.name === 'nova-canonical-racer' && object.visible),
  ).toBe(true);
});
