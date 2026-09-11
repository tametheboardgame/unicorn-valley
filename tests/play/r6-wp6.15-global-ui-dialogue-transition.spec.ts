import { expect, test, type Page } from '@playwright/test';

const PLAYER_NAME = 'world-player-unicorn';
const PIP_APPROACH = { x: 1060, y: 825 } as const;
const WILLOW_APPROACH = { x: 1160, y: 1160 } as const;
const MARIGOLD_APPROACH = { x: 820, y: 860 } as const;
const NOVA_APPROACH = { x: 2590, y: 930 } as const;
const RETIRED_CONVERSATION_SCENES = [
  'WillowStoryScene',
  'MarigoldPicnicScene',
  'NovaStoryScene',
  'LumiStoryScene',
  'PebbleStoryScene',
  'RippleStoryScene',
  'PipEggStoryScene',
] as const;

interface DiagnosticObject {
  name: string;
  text: string | null;
  textureKey: string | null;
  alpha: number;
  visible: boolean;
  interactive: boolean;
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
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function sceneSnapshot(page: Page, sceneKey: string): Promise<DiagnosticScene> {
  const scene = (await snapshot(page)).scenes.find(({ key }) => key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${sceneKey}.`);
  }
  return scene;
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene) === true;
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    diagnostics.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
}

async function positionPlayer(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ key, playerName, targetX, targetY }) => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      diagnostics.setArcadeSpritePosition(key, playerName, targetX, targetY);
    },
    { key: sceneKey, playerName: PLAYER_NAME, targetX: x, targetY: y },
  );
}

function namedObject(scene: DiagnosticScene, name: string): DiagnosticObject {
  const object = scene.objects.find((candidate) => candidate.name === name);
  if (!object) {
    throw new Error(`Missing diagnostic object: ${name}`);
  }
  return object;
}

async function waitForVisibleObject(page: Page, sceneKey: string, name: string): Promise<void> {
  await expect
    .poll(async () => {
      const scene = await sceneSnapshot(page, sceneKey);
      return scene.objects.find((object) => object.name === name)?.visible ?? false;
    })
    .toBe(true);
}

async function waitForTalkTarget(page: Page, sceneKey: string, label: string): Promise<void> {
  await expect
    .poll(async () => {
      const scene = await sceneSnapshot(page, sceneKey);
      const action = scene.objects.find(
        (object) => object.name === 'exploration-interaction-prompt-label' && object.visible,
      );
      const hint = scene.objects.find(
        (object) => object.name === 'exploration-tablet-hint' && object.visible,
      );
      return `${action?.text ?? ''}|${hint?.text ?? ''}`;
    })
    .toBe(`Talk|${label}`);
}

async function openPipConversation(page: Page): Promise<void> {
  await startScene(page, 'MoonflowerGladeScene');
  await positionPlayer(page, 'MoonflowerGladeScene', PIP_APPROACH.x, PIP_APPROACH.y);
  await waitForTalkTarget(page, 'MoonflowerGladeScene', 'Pip');
  await page.keyboard.press('KeyE');
  await waitForVisibleObject(page, 'MoonflowerGladeScene', 'dialogue-production-panel');
}

async function assertMigratedConversationStarts(
  page: Page,
  sceneKey: 'SunbeamVillageScene' | 'RainbowMeadowScene',
  speaker: 'Willow' | 'Marigold' | 'Nova',
  position: { x: number; y: number },
): Promise<void> {
  await startScene(page, sceneKey);
  await positionPlayer(page, sceneKey, position.x, position.y);
  await waitForTalkTarget(page, sceneKey, speaker);
  await page.keyboard.press('KeyE');
  await waitForVisibleObject(page, sceneKey, 'dialogue-production-panel');

  const scene = await sceneSnapshot(page, sceneKey);
  expect(namedObject(scene, 'dialogue-production-speaker-name').text).toBe(speaker);
  expect(namedObject(scene, 'dialogue-production-body').visible).toBe(true);
  expect(namedObject(scene, 'dialogue-production-continue').interactive).toBe(true);
  for (const retiredScene of RETIRED_CONVERSATION_SCENES) {
    expect((await snapshot(page)).activeScenes).not.toContain(retiredScene);
  }

  await page.keyboard.press('Escape');
}

test('ordinary Pip conversation stays in-world, compact and explicitly paced', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);
  await openPipConversation(page);

  let scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
  const positionAtOpen = namedObject(scene, PLAYER_NAME);
  const panel = namedObject(scene, 'dialogue-production-panel');
  expect(panel.y).toBeGreaterThan(590);
  expect(namedObject(scene, 'dialogue-production-speaker-name').text).toBe('Pip');
  expect(namedObject(scene, 'dialogue-production-body').text).toBe(
    "Hi! I'm Pip. I was hoping you'd arrive!",
  );
  expect(namedObject(scene, 'dialogue-production-continue-label').text).toBe('Continue');
  expect(namedObject(scene, 'exploration-interaction-prompt').visible).toBe(false);
  expect(namedObject(scene, 'exploration-tablet-hint-panel').visible).toBe(false);

  await waitForVisibleObject(page, 'MoonflowerGladeScene', 'dialogue-production-portrait-pip');
  scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
  expect(namedObject(scene, 'dialogue-production-portrait-pip').textureKey).toBe(
    'core-npc-production:pip:happy',
  );

  const activeScenes = (await snapshot(page)).activeScenes;
  expect(activeScenes).toContain('MoonflowerGladeScene');
  for (const retiredScene of RETIRED_CONVERSATION_SCENES) {
    expect(activeScenes).not.toContain(retiredScene);
  }

  await page.waitForTimeout(400);
  scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
  const positionDuringConversation = namedObject(scene, PLAYER_NAME);
  expect(positionDuringConversation.x).toBeCloseTo(positionAtOpen.x, 1);
  expect(positionDuringConversation.y).toBeCloseTo(positionAtOpen.y, 1);

  await page.screenshot({ path: 'playtest-artifacts/screenshots/wp19e-pip-compact-desktop.png' });

  await page.keyboard.press('KeyE');
  await expect
    .poll(
      async () =>
        namedObject(await sceneSnapshot(page, 'MoonflowerGladeScene'), 'dialogue-production-body')
          .text,
    )
    .toBe('Try a little exploring. I saw something sparkling beside the path. No rush!');
  scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
  expect(namedObject(scene, 'dialogue-production-continue-label').text).toBe('Done');

  await page.keyboard.press('KeyE');
  await expect
    .poll(
      async () =>
        namedObject(await sceneSnapshot(page, 'MoonflowerGladeScene'), 'dialogue-production-panel')
          .visible,
    )
    .toBe(false);
});

test('supporting resident uses the same compact family with readable fallback identity', async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);
  await startScene(page, 'MoonflowerGladeScene');

  await expect
    .poll(async () => {
      const scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
      return scene.objects.some((object) => object.name === 'supporting-resident:resident:juniper');
    })
    .toBe(true);
  let scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
  const resident = namedObject(scene, 'supporting-resident:resident:juniper');
  await positionPlayer(page, 'MoonflowerGladeScene', resident.x + 84, resident.y);
  await waitForTalkTarget(page, 'MoonflowerGladeScene', 'Juniper');
  await page.keyboard.press('KeyE');
  await waitForVisibleObject(page, 'MoonflowerGladeScene', 'dialogue-production-panel');

  scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
  expect(namedObject(scene, 'dialogue-production-panel').y).toBeGreaterThan(590);
  expect(namedObject(scene, 'dialogue-production-speaker-name').text).toBe('Juniper');
  expect(namedObject(scene, 'dialogue-production-portrait-fallback').visible).toBe(true);
  expect(namedObject(scene, 'dialogue-production-continue-label').text).toBe('Done');
  await page.screenshot({
    path: 'playtest-artifacts/screenshots/wp19e-juniper-compact-desktop.png',
  });
});

test('Willow, Marigold and Nova migrated conversations activate from the shared Talk action', async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);

  await assertMigratedConversationStarts(page, 'SunbeamVillageScene', 'Willow', WILLOW_APPROACH);
  await assertMigratedConversationStarts(page, 'SunbeamVillageScene', 'Marigold', MARIGOLD_APPROACH);
  await assertMigratedConversationStarts(page, 'RainbowMeadowScene', 'Nova', NOVA_APPROACH);
});

test('Reduced Motion keeps conversation reveal and advance decoration static', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      'unicorn-valley:accessibility-settings:v1',
      JSON.stringify({ reducedMotion: true, highVisibilityInteractions: false }),
    );
  });
  await page.reload();
  await waitForDiagnostics(page);
  await openPipConversation(page);

  let scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
  const firstIndicator = namedObject(scene, 'dialogue-production-advance-indicator');
  const firstBody = namedObject(scene, 'dialogue-production-body');
  expect(firstBody.alpha).toBeCloseTo(1, 4);

  await page.waitForTimeout(800);
  scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
  const secondIndicator = namedObject(scene, 'dialogue-production-advance-indicator');
  const secondBody = namedObject(scene, 'dialogue-production-body');
  expect(secondBody.alpha).toBeCloseTo(1, 4);
  expect(secondIndicator.x).toBeCloseTo(firstIndicator.x, 4);
});

test('compact Pip card renders across all four supported display classes', async ({ page }) => {
  const viewports = [
    ['desktop', { width: 1280, height: 720 }],
    ['tablet-landscape', { width: 1180, height: 820 }],
    ['phone-landscape', { width: 844, height: 390 }],
    ['phone-portrait', { width: 390, height: 844 }],
  ] as const;

  for (const [label, viewport] of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/?diagnostics=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForDiagnostics(page);
    await openPipConversation(page);

    const scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
    expect(namedObject(scene, 'dialogue-production-panel').visible).toBe(true);
    expect(namedObject(scene, 'dialogue-production-speaker-name').text).toBe('Pip');
    expect(namedObject(scene, 'dialogue-production-continue').interactive).toBe(true);
    await page.screenshot({
      path: `playtest-artifacts/screenshots/wp19e-pip-compact-${label}.png`,
    });
  }
});
