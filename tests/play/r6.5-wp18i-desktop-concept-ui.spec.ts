import { expect, test } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  type: string;
  name: string;
  text: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  depth: number;
  alpha: number;
  visible: boolean;
  scrollFactorX: number;
  scrollFactorY: number;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  startScene(sceneKey: string): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForDiagnostics(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function sceneSnapshot(
  page: import('@playwright/test').Page,
  sceneKey: string,
): Promise<DiagnosticSceneSnapshot> {
  return page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics?.snapshot().scenes.find((candidate) => candidate.key === key);
    if (!scene) {
      throw new Error(`Missing scene ${key}.`);
    }
    return scene;
  }, sceneKey);
}

test.describe('R6.5-WP18I desktop concept HUD cleanup', () => {
  test.use({ viewport: { width: 1280, height: 720 }, hasTouch: false });

  test('uses the concept HUD without legacy controls and keeps atmosphere choices in Settings', async ({
    page,
  }) => {
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForDiagnostics(page);
    await page.waitForFunction(() => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return diagnostics?.snapshot().activeScenes.includes('MoonflowerGladeScene') === true;
    });
    await page.waitForTimeout(700);

    await page.waitForFunction(() => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return diagnostics?.snapshot().activeScenes.includes('ExplorationHudOverlayScene') === true;
    });
    let scene = await sceneSnapshot(page, 'ExplorationHudOverlayScene');
    const map = scene.objects.find(
      (object) => object.name === 'exploration-hud-overlay-map-button',
    );
    expect(map?.visible).toBe(true);
    expect(map?.alpha ?? 0).toBeGreaterThan(0.9);

    const location = scene.objects.find(
      (object) => object.text === 'Moonflower Glade' && object.x > 800 && object.visible,
    );
    expect(location?.alpha ?? 0).toBeGreaterThan(0.9);

    const worldScene = await sceneSnapshot(page, 'MoonflowerGladeScene');
    const legacyControls = worldScene.objects.find(
      (object) => object.name === 'exploration-controls-button',
    );
    const legacySound = worldScene.objects.find(
      (object) => object.name === 'exploration-shell-sound-button',
    );
    expect(legacyControls?.alpha ?? 0).toBeLessThanOrEqual(0.01);
    expect(legacySound?.alpha ?? 0).toBeLessThanOrEqual(0.01);

    const visibleAtmosphereHud = worldScene.objects.filter(
      (object) =>
        [
          'atmospheric-time-control',
          'atmospheric-time-hint',
          'magical-weather-control',
          'magical-weather-hint',
        ].includes(object.name) && object.visible,
    );
    expect(visibleAtmosphereHud).toEqual([]);

    await page.evaluate(() => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      diagnostics?.setArcadeSpritePosition(
        'MoonflowerGladeScene',
        'world-player-unicorn',
        840,
        825,
      );
    });
    await page.waitForTimeout(350);
    scene = await sceneSnapshot(page, 'MoonflowerGladeScene');

    const newTalk = scene.objects.find(
      (object) => object.name === 'exploration-interaction-prompt' && object.visible,
    );
    expect(newTalk?.alpha ?? 0).toBeGreaterThan(0.9);

    const promptLabel = scene.objects.find(
      (object) => object.name === 'exploration-interaction-prompt-label',
    );
    expect(promptLabel?.visible).toBe(true);
    expect(promptLabel?.text).toContain('Talk');

    const lingeringLegacyActionCopy = scene.objects.filter((object) => {
      if (object.type !== 'Text' || !object.text || object.depth >= 190 || object.alpha <= 0.05) {
        return false;
      }
      const action =
        /^(talk(?:\s+to)?|speak(?:\s+to)?|sit|enter|inspect|interact|start|play|buy|shop|use|read|look|visit|open|pick|choose|place)\b/i;
      const oldInput = /(?:\be\s*\/\s*enter\b|\benter\s*\/|\/\s*tap\b|\btap\s*:)/i;
      return action.test(object.text.trim()) && oldInput.test(object.text.trim());
    });
    expect(lingeringLegacyActionCopy).toEqual([]);

    const settingsButton = (await sceneSnapshot(page, 'ExplorationHudOverlayScene')).objects.find(
      (object) => object.name === 'exploration-hud-overlay-settings-nav-button',
    );
    expect(settingsButton?.visible).toBe(true);
    if (!settingsButton) {
      throw new Error('Missing canonical Settings navigation control.');
    }
    await page.mouse.click(settingsButton.x, settingsButton.y);
    await page.waitForFunction(() => {
      const diagnostics = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return diagnostics?.snapshot().activeScenes.includes('SettingsScene') === true;
    });
    await page.waitForTimeout(250);

    const settings = await sceneSnapshot(page, 'SettingsScene');
    const timeControl = settings.objects.find(
      (object) => object.name === 'settings-atmosphere-time' && object.visible,
    );
    const weatherControl = settings.objects.find(
      (object) => object.name === 'settings-atmosphere-weather' && object.visible,
    );
    const timeLabel = settings.objects.find(
      (object) => object.name === 'settings-atmosphere-time-label' && object.visible,
    );
    const weatherLabel = settings.objects.find(
      (object) => object.name === 'settings-atmosphere-weather-label' && object.visible,
    );
    expect(timeControl).toBeDefined();
    expect(weatherControl).toBeDefined();
    expect(timeLabel?.text).toMatch(/^Time: .+ · (Auto|Manual)$/);
    expect(weatherLabel?.text).toMatch(/^Weather: .+ · (Auto|Manual)$/);
  });
});
