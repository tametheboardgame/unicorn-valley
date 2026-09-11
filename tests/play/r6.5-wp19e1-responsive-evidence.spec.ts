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

async function positionPlayer(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ objectName, targetX, targetY }) => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      api.setArcadeSpritePosition('CrystalBrookScene', objectName, targetX, targetY);
    },
    { objectName: WORLD_PLAYER_NAME, targetX: x, targetY: y },
  );
}

async function openCrystalBrook(page: Page, x = 3130, y = 1850): Promise<void> {
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
  await positionPlayer(page, x, y);
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

    test('keeps reference guidance readable and clear of the contextual action', async ({
      page,
    }, testInfo) => {
      await captureGuidanceEvidence(page, testInfo, portraitDomAction);
    });
  });
}

registerEvidenceCase('desktop', { width: 1280, height: 720 }, false, false);
registerEvidenceCase('tablet-landscape', { width: 1280, height: 800 }, true, false);
registerEvidenceCase('phone-landscape', { width: 844, height: 390 }, true, false);
registerEvidenceCase('phone-portrait', { width: 390, height: 844 }, true, true);

test.describe('R6.5-WP19E1 semantic distinction evidence', () => {
  test.use({ viewport: { width: 1280, height: 720 }, hasTouch: false });

  test('captures a local Shallow Brook reaction beside its source', async ({ page }, testInfo) => {
    await openCrystalBrook(page, 1900, 1260);
    await expect
      .poll(async () => {
        const scene = await sceneSnapshot(page);
        return scene.objects.find(
          (object) => object.name === 'exploration-tablet-hint' && object.effectiveVisible,
        )?.text;
      })
      .toBe('Shallow Brook');

    await page.keyboard.press('KeyE');
    await expect
      .poll(async () => {
        const scene = await sceneSnapshot(page);
        return scene.objects.find(
          (object) => object.name === 'world-feedback-reaction-text' && object.effectiveVisible,
        )?.text;
      })
      .toContain('Splish!');

    await page.screenshot({ path: testInfo.outputPath('wp19e1-reaction.png'), fullPage: true });
  });

  test('captures dedicated Wonderbook discovery feedback without the legacy top duplicate', async ({
    page,
  }, testInfo) => {
    await openCrystalBrook(page, 920, 590);

    await expect
      .poll(async () => {
        const scene = await sceneSnapshot(page);
        return scene.objects.find(
          (object) => object.effectiveVisible && object.text === 'New discovery for your Wonderbook!',
        )?.text;
      })
      .toBe('New discovery for your Wonderbook!');

    const scene = await sceneSnapshot(page);
    expect(
      scene.objects.some(
        (object) =>
          object.effectiveVisible &&
          object.scrollFactorX === 0 &&
          object.y < 190 &&
          (object.text?.startsWith('Found River Crystal!') ?? false),
      ),
    ).toBe(false);

    await page.screenshot({ path: testInfo.outputPath('wp19e1-discovery.png'), fullPage: true });
  });
});
