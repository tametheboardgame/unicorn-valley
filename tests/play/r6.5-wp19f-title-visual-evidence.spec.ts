import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  effectiveVisible: boolean;
  interactive: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: DiagnosticScene[];
  };
}

async function prepareFreshTitle(page: Page): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
}

async function openDiagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes('TitleScene') === true;
  });
}

async function waitForGeneratedArtwork(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const title = api?.snapshot().scenes.find((scene) => scene.key === 'TitleScene');
    return (
      title?.objects.some(
        (object) => object.name === 'title-generated-artwork' && object.effectiveVisible,
      ) === true
    );
  });
}

async function expectLiveCanvasMenu(page: Page): Promise<void> {
  const interactiveNames = await page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return (
      api
        ?.snapshot()
        .scenes.find((scene) => scene.key === 'TitleScene')
        ?.objects.filter((object) => object.effectiveVisible && object.interactive)
        .map((object) => object.name) ?? []
    );
  });

  expect(interactiveNames).toContain('title-menu-new-game');
  expect(interactiveNames).toContain('title-menu-settings');
}

async function expectLandscapeArtworkSelection(page: Page): Promise<void> {
  await expect(
    page.locator('link[rel="preload"][href$="/assets/title/wp19f-title-landscape.webp"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('link[rel="preload"][href$="/assets/title/wp19f-title-portrait.webp"]'),
  ).toHaveCount(0);
}

async function captureLandscape(
  page: Page,
  width: number,
  height: number,
  fileName: string,
): Promise<void> {
  await prepareFreshTitle(page);
  await page.setViewportSize({ width, height });
  await openDiagnostics(page);
  await waitForGeneratedArtwork(page);
  await expectLandscapeArtworkSelection(page);
  await expectLiveCanvasMenu(page);
  await expect(page.locator('[data-title-portrait-controls="true"]')).toBeHidden();
  await expect(page.locator('canvas')).not.toHaveCSS('pointer-events', 'none');
  await page.screenshot({ path: test.info().outputPath(fileName), fullPage: true });
}

test.describe('R6.5-WP19F generated title visual evidence', () => {
  test('desktop renders generated landscape art beneath the live title controls', async ({
    page,
  }) => {
    await captureLandscape(page, 1440, 900, 'wp19f-title-desktop.png');
  });

  test('tablet landscape renders generated landscape art without changing menu semantics', async ({
    page,
  }) => {
    await captureLandscape(page, 1024, 768, 'wp19f-title-tablet-landscape.png');
  });

  test('phone landscape keeps the generated landscape composition and live canvas controls', async ({
    page,
  }) => {
    await captureLandscape(page, 844, 390, 'wp19f-title-phone-landscape.png');
  });
});

test.describe('R6.5-WP19F phone portrait generated title visual evidence', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('phone portrait uses a scenic canvas banner and one live DOM menu', async ({ page }) => {
    await prepareFreshTitle(page);
    await openDiagnostics(page);
    await waitForGeneratedArtwork(page);

    await expect(
      page.locator('link[rel="preload"][href$="/assets/title/wp19f-title-portrait.webp"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('link[rel="preload"][href$="/assets/title/wp19f-title-landscape.webp"]'),
    ).toHaveCount(0);

    const controls = page.locator('[data-title-portrait-controls="true"]');
    await expect(controls).toBeVisible();
    await expect(page.locator('[data-title-portrait-brand="true"]')).toHaveText('Unicorn Valley');
    await expect(page.locator('[data-title-action="title-menu-new-game"]')).toBeVisible();
    await expect(page.locator('[data-title-action="title-menu-settings"]')).toBeVisible();
    await expect(controls.locator('.title-portrait-status')).toHaveText(
      'First, make a unicorn that feels like yours.',
    );
    await expect(page.locator('canvas')).toHaveCSS('pointer-events', 'none');

    const controlsBounds = await controls.boundingBox();
    expect(controlsBounds).not.toBeNull();
    expect(controlsBounds?.width ?? 0).toBeGreaterThanOrEqual(300);
    expect((controlsBounds?.y ?? 0) + (controlsBounds?.height ?? 0)).toBeLessThanOrEqual(844);

    await page.screenshot({
      path: test.info().outputPath('wp19f-title-phone-portrait.png'),
      fullPage: true,
    });
  });
});
