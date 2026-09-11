import { expect, type Page, test, type TestInfo } from '@playwright/test';

const WORLD_PLAYER_NAME = 'world-player-unicorn';

interface DiagnosticObjectSnapshot {
  name: string;
  text: string | null;
  y: number;
  effectiveVisible: boolean;
  scrollFactorX: number;
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
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function sceneSnapshot(page: Page): Promise<DiagnosticSceneSnapshot> {
  return page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find((candidate) => candidate.key === 'CrystalBrookScene');
    if (!scene) {
      throw new Error('Crystal Brook diagnostics are unavailable.');
    }
    return scene;
  });
}

async function openCrystalBrook(page: Page): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);
  await page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    api.startScene('CrystalBrookScene');
  });
  await page.waitForFunction(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes('CrystalBrookScene') === true;
  });
  await page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    api.setArcadeSpritePosition('CrystalBrookScene', WORLD_PLAYER_NAME, 3130, 1850);
  });
}

async function showReferenceGuidance(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const scene = await sceneSnapshot(page);
      return scene.objects.find(
        (object) => object.name === 'exploration-tablet-hint' && object.effectiveVisible,
      )?.text;
    })
    .toBe('Crystal Grotto');

  await page.keyboard.press('KeyE');
  await expect
    .poll(async () => {
      const scene = await sceneSnapshot(page);
      return scene.objects.find(
        (object) => object.name === 'world-feedback-guidance-text' && object.effectiveVisible,
      )?.text;
    })
    .toContain('Prism Grotto trail');
}

async function captureGuidanceEvidence(
  page: Page,
  testInfo: TestInfo,
  portraitDomAction: boolean,
): Promise<void> {
  await openCrystalBrook(page);
  await showReferenceGuidance(page);

  const scene = await sceneSnapshot(page);
  const guidance = scene.objects.find(
    (object) => object.name === 'world-feedback-guidance-text' && object.effectiveVisible,
  );
  expect(guidance?.y).toBeGreaterThan(500);
  expect(guidance?.scrollFactorX).toBe(0);
  expect(
    scene.objects.some(
      (object) =>
        object.effectiveVisible &&
        object.scrollFactorX === 0 &&
        object.y < 190 &&
        (object.text?.includes('Prism Grotto trail') ?? false),
    ),
  ).toBe(false);

  const domPrompt = page.locator('[data-mobile-interaction-prompt="true"]');
  if (portraitDomAction) {
    await expect(domPrompt).toBeVisible();
    await expect(domPrompt).toContainText('Crystal Grotto');
  } else {
    await expect(domPrompt).toBeHidden();
    expect(
      scene.objects.some(
        (object) => object.name === 'exploration-interaction-prompt' && object.effectiveVisible,
      ),
    ).toBe(true);
  }

  await page.screenshot({ path: testInfo.outputPath('wp19e1-guidance.png'), fullPage: true });
}

function registerEvidenceCase(
  name: string,
  viewport: { width: number; height: number },
  hasTouch: boolean,
  portraitDomAction: boolean,
): void {
  test.describe(`R6.5-WP19E1 ${name} evidence`, () => {
    test.use({ viewport, hasTouch });

    test('keeps reference guidance readable and clear of the contextual action', async ({ page }, testInfo) => {
      await captureGuidanceEvidence(page, testInfo, portraitDomAction);
    });
  });
}

registerEvidenceCase('desktop', { width: 1280, height: 720 }, false, false);
registerEvidenceCase('tablet-landscape', { width: 1280, height: 800 }, true, false);
registerEvidenceCase('phone-landscape', { width: 844, height: 390 }, true, false);
registerEvidenceCase('phone-portrait', { width: 390, height: 844 }, true, true);
