import { expect, test, type Page } from '@playwright/test';

const PLAYER_NAME = 'world-player-unicorn';
const MARIGOLD_APPROACH = { x: 820, y: 860 } as const;
const RACE_ENTRANCE_APPROACH = { x: 2970, y: 1040 } as const;

interface DiagnosticObject {
  name: string;
  text: string | null;
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
    if (!diagnostics) throw new Error('Browser diagnostics are unavailable.');
    return diagnostics.snapshot();
  });
}

async function sceneSnapshot(page: Page, sceneKey: string): Promise<DiagnosticScene> {
  const scene = (await snapshot(page)).scenes.find(({ key }) => key === sceneKey);
  if (!scene) throw new Error(`Missing diagnostic scene ${sceneKey}.`);
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
    if (!diagnostics) throw new Error('Browser diagnostics are unavailable.');
    diagnostics.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
}

async function positionPlayer(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ key, targetX, targetY }) => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) throw new Error('Browser diagnostics are unavailable.');
      diagnostics.setArcadeSpritePosition(key, 'world-player-unicorn', targetX, targetY);
    },
    { key: sceneKey, targetX: x, targetY: y },
  );
}

async function waitForVisibleObject(page: Page, sceneKey: string, name: string): Promise<void> {
  await expect
    .poll(async () => {
      const scene = await sceneSnapshot(page, sceneKey);
      return scene.objects.some((object) => object.name === name && object.visible);
    })
    .toBe(true);
}

async function waitForHiddenObject(page: Page, sceneKey: string, name: string): Promise<void> {
  await expect
    .poll(async () => {
      const scene = await sceneSnapshot(page, sceneKey);
      return scene.objects.some((object) => object.name === name && object.visible);
    })
    .toBe(false);
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

function visiblePanelY(scene: DiagnosticScene): number | undefined {
  return scene.objects.find(
    (object) => object.name === 'dialogue-production-panel' && object.visible,
  )?.y;
}

function compactLinePanelY(scene: DiagnosticScene): number {
  const panelY = visiblePanelY(scene);
  const actionY = scene.objects.find(
    (object) => object.name === 'dialogue-production-continue' && object.visible,
  )?.y;
  if (panelY === undefined || actionY === undefined) {
    throw new Error('Expected a visible compact dialogue panel and continue control.');
  }
  // Compact and expanded cards intentionally use different outer geometry. Assert the
  // compact card by the relative action-to-panel spacing rather than a canvas-specific Y.
  expect(actionY - panelY).toBeLessThan(80);
  return panelY;
}

test('Marigold dialogue stays compact and Meet Nova works when Nova is already at the picnic', async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);

  await startScene(page, 'SunbeamVillageScene');
  await positionPlayer(page, 'SunbeamVillageScene', MARIGOLD_APPROACH.x, MARIGOLD_APPROACH.y);
  await waitForTalkTarget(page, 'SunbeamVillageScene', 'Marigold');
  await page.keyboard.press('KeyE');
  await waitForVisibleObject(page, 'SunbeamVillageScene', 'dialogue-production-panel');

  let village = await sceneSnapshot(page, 'SunbeamVillageScene');
  const introPanelY = compactLinePanelY(village);

  await page.keyboard.press('KeyE');
  await waitForVisibleObject(page, 'SunbeamVillageScene', 'dialogue-production-choice-1');
  village = await sceneSnapshot(page, 'SunbeamVillageScene');
  expect(visiblePanelY(village)).toBe(introPanelY);
  expect(
    village.objects.filter(
      (object) => object.name.startsWith('dialogue-production-choice-') && object.visible,
    ),
  ).toHaveLength(3);

  await page.keyboard.press('Enter');
  await expect
    .poll(async () => {
      const scene = await sceneSnapshot(page, 'SunbeamVillageScene');
      return (
        scene.objects.find((object) => object.name === 'dialogue-production-body' && object.visible)
          ?.text ?? ''
      );
    })
    .toContain('Sunshine it is!');
  village = await sceneSnapshot(page, 'SunbeamVillageScene');
  expect(compactLinePanelY(village)).toBe(introPanelY);
  await page.keyboard.press('KeyE');

  await startScene(page, 'RainbowMeadowScene');
  await waitForVisibleObject(page, 'RainbowMeadowScene', 'core-npc:nova:picnic');
  const meadowBeforeRace = await sceneSnapshot(page, 'RainbowMeadowScene');
  const picnicNova = meadowBeforeRace.objects.find(
    (object) => object.name === 'core-npc:nova:picnic' && object.visible,
  );
  expect(picnicNova).toBeTruthy();

  await positionPlayer(
    page,
    'RainbowMeadowScene',
    RACE_ENTRANCE_APPROACH.x,
    RACE_ENTRANCE_APPROACH.y,
  );
  await waitForVisibleObject(page, 'RainbowMeadowScene', 'race-entry-confirmation');
  await page.keyboard.press('Enter');
  await waitForVisibleObject(page, 'RainbowMeadowScene', 'dialogue-production-panel');

  let meadowAfterMeet = await sceneSnapshot(page, 'RainbowMeadowScene');
  const activeScenes = (await snapshot(page)).activeScenes;
  const player = meadowAfterMeet.objects.find((object) => object.name === PLAYER_NAME);
  const speaker = meadowAfterMeet.objects.find(
    (object) => object.name === 'dialogue-production-speaker-name' && object.visible,
  );
  const novaIntroPanelY = compactLinePanelY(meadowAfterMeet);

  expect(activeScenes).toContain('RainbowMeadowScene');
  expect(activeScenes).not.toContain('NovaStoryScene');
  expect(speaker?.text).toBe('Nova');
  expect(player).toBeTruthy();
  expect(picnicNova).toBeTruthy();
  expect(Math.abs((player?.x ?? 0) - ((picnicNova?.x ?? 0) - 120))).toBeLessThan(6);
  expect(Math.abs((player?.y ?? 0) - (picnicNova?.y ?? 0))).toBeLessThan(6);

  await page.keyboard.press('KeyE');
  await expect
    .poll(async () => {
      const scene = await sceneSnapshot(page, 'RainbowMeadowScene');
      return (
        scene.objects.find((object) => object.name === 'dialogue-production-body' && object.visible)
          ?.text ?? ''
      );
    })
    .toContain('Hold RIGHT or D');
  meadowAfterMeet = await sceneSnapshot(page, 'RainbowMeadowScene');
  expect(compactLinePanelY(meadowAfterMeet)).toBe(novaIntroPanelY);

  await page.keyboard.press('Escape');
  await waitForHiddenObject(page, 'RainbowMeadowScene', 'dialogue-production-panel');
  await waitForTalkTarget(page, 'RainbowMeadowScene', 'Nova');
});
