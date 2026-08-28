import { expect, test, type Page } from '@playwright/test';

interface BrowserDiagnosticObject {
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
  originX: number;
  originY: number;
  depth: number;
  visible: boolean;
  alpha: number;
  text?: string;
  textureKey?: string;
}

interface BrowserDiagnosticScene {
  key: string;
  active: boolean;
  visible: boolean;
  objects: BrowserDiagnosticObject[];
}

interface BrowserDiagnosticSnapshot {
  activeScenes: string[];
  scenes: BrowserDiagnosticScene[];
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

async function getSnapshot(page: Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const snapshot = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
    if (!snapshot) {
      throw new Error('Browser diagnostics are not installed.');
    }
    return snapshot;
  });
}

function sceneSnapshot(
  snapshot: BrowserDiagnosticSnapshot,
  sceneKey: string,
): BrowserDiagnosticScene {
  const scene = snapshot.scenes.find((entry) => entry.key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${sceneKey}.`);
  }
  return scene;
}

function playerObject(scene: BrowserDiagnosticScene): BrowserDiagnosticObject {
  const player = scene.objects.find(
    (object) => object.visible && object.name === 'player-unicorn',
  );
  if (!player) {
    throw new Error(`Missing player unicorn in ${scene.key}.`);
  }
  return player;
}

test('exploration chrome uses stable zones, visible help, touch toggle and a centred canvas', async ({
  page,
}) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - 640)).toBeLessThan(3);

  let snapshot = await getSnapshot(page);
  const glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');

  const topChrome = glade.objects.find((object) => object.name === 'exploration-top-chrome');
  const bottomChrome = glade.objects.find((object) => object.name === 'exploration-bottom-chrome');
  expect(topChrome?.visible).toBe(true);
  expect(bottomChrome?.visible).toBe(true);

  const helpButton = glade.objects.find((object) => object.name === 'exploration-help-button');
  const touchButton = glade.objects.find((object) => object.name === 'exploration-touch-button');
  expect(helpButton?.visible).toBe(true);
  expect(touchButton?.visible).toBe(true);

  await page.keyboard.press('h');
  await page.waitForTimeout(100);
  snapshot = await getSnapshot(page);
  expect(
    sceneSnapshot(snapshot, 'MoonflowerGladeScene').objects.some(
      (object) => object.visible && object.text?.includes('Move'),
    ),
  ).toBe(true);

  await page.keyboard.press('h');
});

test('clicking open ground moves the unicorn again', async ({ page }) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  let snapshot = await getSnapshot(page);
  let glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  const before = playerObject(glade);

  await page.mouse.click(860, 490);
  await page.waitForTimeout(800);

  snapshot = await getSnapshot(page);
  glade = sceneSnapshot(snapshot, 'MoonflowerGladeScene');
  const after = playerObject(glade);
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(40);
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
        (object) => object.visible && object.text?.includes('Talk to Nova'),
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

  await page.keyboard.press('Escape', { delay: 50 });
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
  await page.goto('/?scene=nova&diagnostics=1');
  await waitForScene(page, 'NovaStoryScene');

  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }

  let snapshot = await getSnapshot(page);
  let story = sceneSnapshot(snapshot, 'NovaStoryScene');
  expect(
    story.objects.some(
      (object) => object.visible && object.text?.includes('Race Nova now'),
    ),
  ).toBe(true);

  await page.keyboard.press('Enter');
  await waitForScene(page, 'NovaTutorialRaceScene');

  snapshot = await getSnapshot(page);
  const race = sceneSnapshot(snapshot, 'NovaTutorialRaceScene');
  expect(
    race.objects.some(
      (object) =>
        object.name === 'nova-canonical-race' &&
        object.visible &&
        object.textureKey === 'core-npc-production:nova:neutral',
    ),
  ).toBe(true);
});
