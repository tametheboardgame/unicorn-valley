import { expect, type Page, test } from '@playwright/test';

const WORLD_PLAYER_NAME = 'world-player-unicorn';

interface DiagnosticObjectSnapshot {
  name: string;
  text: string | null;
  x: number;
  y: number;
  displayHeight: number;
  visible: boolean;
  effectiveVisible: boolean;
  scrollFactorX: number;
}

interface DiagnosticSceneSnapshot {
  key: string;
  camera: {
    worldX: number;
    worldY: number;
    worldWidth: number;
    worldHeight: number;
  };
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((key) => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(key) === true;
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    api.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
}

async function getScene(page: Page, sceneKey: string): Promise<DiagnosticSceneSnapshot> {
  return page.evaluate((key) => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find((candidate) => candidate.key === key);
    if (!scene) {
      throw new Error(`Missing diagnostic scene ${key}.`);
    }
    return scene;
  }, sceneKey);
}

async function positionPlayer(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ key, objectName, targetX, targetY }) => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      api.setArcadeSpritePosition(key, objectName, targetX, targetY);
    },
    { key: sceneKey, objectName: WORLD_PLAYER_NAME, targetX: x, targetY: y },
  );
}

async function waitForInteraction(page: Page, sceneKey: string, label: string): Promise<void> {
  await expect
    .poll(async () => {
      const scene = await getScene(page, sceneKey);
      return scene.objects.find(
        (object) => object.name === 'exploration-tablet-hint' && object.effectiveVisible,
      )?.text;
    })
    .toBe(label);
}

async function visibleObject(
  page: Page,
  sceneKey: string,
  name: string,
): Promise<DiagnosticObjectSnapshot> {
  await expect
    .poll(async () => {
      const scene = await getScene(page, sceneKey);
      return scene.objects.find((object) => object.name === name && object.effectiveVisible)?.name;
    })
    .toBe(name);
  const scene = await getScene(page, sceneKey);
  const object = scene.objects.find(
    (candidate) => candidate.name === name && candidate.effectiveVisible,
  );
  if (!object) {
    throw new Error(`Missing visible ${name} in ${sceneKey}.`);
  }
  return object;
}

test.describe('R6.5-WP19E1 contextual feedback placement', () => {
  test.use({ viewport: { width: 1280, height: 720 }, hasTouch: false });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'CrystalBrookScene');
    await page.waitForTimeout(250);
  });

  test('closed Prism Grotto uses lower non-modal guidance without covering the top HUD', async ({
    page,
  }) => {
    await positionPlayer(page, 'CrystalBrookScene', 3130, 1850);
    await waitForInteraction(page, 'CrystalBrookScene', 'Crystal Grotto');
    await page.keyboard.press('KeyE');

    const guidance = await visibleObject(page, 'CrystalBrookScene', 'world-feedback-guidance-text');
    expect(guidance.text).toContain('Prism Grotto trail');
    expect(guidance.scrollFactorX).toBe(0);
    expect(guidance.y).toBeGreaterThan(500);

    const scene = await getScene(page, 'CrystalBrookScene');
    expect(
      scene.objects.some(
        (object) =>
          object.effectiveVisible &&
          object.scrollFactorX === 0 &&
          object.y < 190 &&
          (object.text?.includes('Prism Grotto trail') ?? false),
      ),
    ).toBe(false);
    expect(
      scene.objects.some(
        (object) => object.name === 'exploration-interaction-prompt' && object.effectiveVisible,
      ),
    ).toBe(true);
  });

  test('small brook reactions stay world-anchored, viewport-safe and replace rapid repeats', async ({
    page,
  }) => {
    await positionPlayer(page, 'CrystalBrookScene', 1900, 1260);
    await waitForInteraction(page, 'CrystalBrookScene', 'Shallow Brook');
    await page.keyboard.press('KeyE');

    let reaction = await visibleObject(page, 'CrystalBrookScene', 'world-feedback-reaction-text');
    expect(reaction.text).toContain('Splish!');
    expect(reaction.scrollFactorX).toBe(1);

    let scene = await getScene(page, 'CrystalBrookScene');
    expect(reaction.y).toBeGreaterThan(scene.camera.worldY + 126);
    expect(reaction.y).toBeLessThan(scene.camera.worldY + scene.camera.worldHeight - 92);
    expect(
      scene.objects.some(
        (object) =>
          object.effectiveVisible &&
          object.scrollFactorX === 0 &&
          object.y < 190 &&
          (object.text?.includes('Splish!') ?? false),
      ),
    ).toBe(false);

    await page.keyboard.press('KeyE');
    await page.waitForTimeout(120);
    scene = await getScene(page, 'CrystalBrookScene');
    const reactions = scene.objects.filter(
      (object) => object.name === 'world-feedback-reaction-text' && object.effectiveVisible,
    );
    expect(reactions).toHaveLength(1);
    reaction = reactions[0];
    expect(reaction.text).toContain('Splish!');
  });
});
