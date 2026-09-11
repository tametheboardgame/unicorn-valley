import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  visible: boolean;
  effectiveVisible: boolean;
  interactive: boolean;
  x: number;
  y: number;
  boundsX: number;
  boundsY: number;
  boundsWidth: number;
  boundsHeight: number;
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
  startScene(sceneKey: string, data?: object): void;
}

async function diagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, sceneData }) => {
      const api = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      api.startScene(key, sceneData);
    },
    { key: sceneKey, sceneData: data },
  );
  await page.waitForFunction((key) => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(key) === true;
  }, sceneKey);
}

async function snapshot(page: Page): Promise<ReturnType<BrowserDiagnosticsApi['snapshot']>> {
  return page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return api.snapshot();
  });
}

function sceneFrom(
  current: ReturnType<BrowserDiagnosticsApi['snapshot']>,
  key: string,
): DiagnosticScene {
  const scene = current.scenes.find((candidate) => candidate.key === key);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${key}.`);
  }
  return scene;
}

function overlaps(left: DiagnosticObject, right: DiagnosticObject): boolean {
  return !(
    left.boundsX + left.boundsWidth <= right.boundsX ||
    right.boundsX + right.boundsWidth <= left.boundsX ||
    left.boundsY + left.boundsHeight <= right.boundsY ||
    right.boundsY + right.boundsHeight <= left.boundsY
  );
}

test.describe('R6.5-WP19F UI consistency', () => {
  test('Bag category and close controls retain at least 40 CSS-pixel touch bounds at 1024x768', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await diagnostics(page);
    await startScene(page, 'InventoryScene', { returnScene: 'TitleScene', initialTab: 'items' });

    const current = await snapshot(page);
    const bag = sceneFrom(current, 'InventoryScene');
    const canvas = await page.locator('canvas').boundingBox();
    expect(canvas).not.toBeNull();
    if (!canvas) return;

    const scaleX = canvas.width / 1280;
    const scaleY = canvas.height / 720;
    const controls = [
      bag.objects.find((object) => object.name === 'bag-close-button'),
      ...bag.objects.filter((object) => object.name.startsWith('bag-pocket:')),
    ];
    expect(controls.every(Boolean)).toBe(true);
    expect(controls.length).toBeGreaterThanOrEqual(5);

    for (const control of controls) {
      if (!control) continue;
      expect(control.interactive, `${control.name} interactive`).toBe(true);
      expect(control.boundsWidth * scaleX, `${control.name} CSS width`).toBeGreaterThanOrEqual(40);
      expect(control.boundsHeight * scaleY, `${control.name} CSS height`).toBeGreaterThanOrEqual(
        40,
      );
    }

    await page.screenshot({
      path: test.info().outputPath('wp19f-bag-touch-targets-1024x768.png'),
      fullPage: true,
    });
  });

  test('Hollow Tree Nook title sits below the top HUD rather than competing with it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await diagnostics(page);
    await startScene(page, 'HollowTreeNookScene');
    await page.waitForTimeout(250);

    const current = await snapshot(page);
    const nook = sceneFrom(current, 'HollowTreeNookScene');
    const titlePanel = nook.objects.find(
      (object) => object.name === 'nook-room-title-panel' && object.effectiveVisible,
    );
    const title = nook.objects.find(
      (object) => object.name === 'nook-room-title' && object.effectiveVisible,
    );
    expect(titlePanel).toBeDefined();
    expect(title).toBeDefined();
    if (!titlePanel || !title) return;

    expect(titlePanel.boundsY).toBeGreaterThanOrEqual(110);

    const overlay = current.scenes.find((scene) => scene.key === 'ExplorationHudOverlayScene');
    if (overlay) {
      const hudObjects = overlay.objects.filter(
        (object) =>
          object.effectiveVisible &&
          object.name.startsWith('exploration-hud-overlay-') &&
          object.boundsWidth > 0 &&
          object.boundsHeight > 0,
      );
      for (const hudObject of hudObjects) {
        expect(
          overlaps(titlePanel, hudObject),
          `${titlePanel.name} must not overlap ${hudObject.name}`,
        ).toBe(false);
      }
    }

    await page.screenshot({
      path: test.info().outputPath('wp19f-hollow-tree-nook-title-hud.png'),
      fullPage: true,
    });
  });

  test('Whispering Woods does not stack retired discovery banners over contextual feedback', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addInitScript(() => window.localStorage.clear());
    await diagnostics(page);
    await startScene(page, 'WhisperingWoodsScene');
    await page.waitForTimeout(350);

    const woods = sceneFrom(await snapshot(page), 'WhisperingWoodsScene');
    const visibleFeedback = woods.objects.filter(
      (object) =>
        object.effectiveVisible &&
        (object.name.startsWith('world-feedback-') || object.name === 'whispering-woods-feedback'),
    );
    const retiredDiscovery = woods.objects.filter(
      (object) =>
        object.effectiveVisible &&
        Boolean(object.text?.match(/New place discovered|New discovery|Discovered:|Collected:/i)),
    );

    expect(retiredDiscovery).toHaveLength(0);
    expect(visibleFeedback.length).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: test.info().outputPath('wp19f-whispering-woods-feedback.png'),
      fullPage: true,
    });
  });

  test('landscape title preloads only the landscape artwork and keeps the live menu usable on image failure', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.route('**/assets/title/wp19f-title-*.webp', async (route) => route.abort());
    await diagnostics(page);
    await page.waitForFunction(() =>
      document.querySelector(
        'link[rel="preload"][href$="/assets/title/wp19f-title-landscape.webp"]',
      ),
    );

    await expect(
      page.locator('link[rel="preload"][href$="/assets/title/wp19f-title-landscape.webp"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('link[rel="preload"][href$="/assets/title/wp19f-title-portrait.webp"]'),
    ).toHaveCount(0);

    const title = sceneFrom(await snapshot(page), 'TitleScene');
    expect(
      title.objects.some((object) => object.name === 'title-art:sky' && object.effectiveVisible),
    ).toBe(true);
    expect(
      title.objects.some((object) => object.name === 'title-menu-new-game' && object.interactive),
    ).toBe(true);
    expect(
      title.objects.some((object) => object.name === 'title-menu-settings' && object.interactive),
    ).toBe(true);
  });

  test.describe('phone portrait title artwork selection', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test('portrait presentation selects only the portrait derivative and keeps live controls above it', async ({
      page,
    }) => {
      await page.route('**/assets/title/wp19f-title-*.webp', async (route) => route.abort());
      await diagnostics(page);
      await page.waitForFunction(() =>
        document.querySelector(
          'link[rel="preload"][href$="/assets/title/wp19f-title-portrait.webp"]',
        ),
      );

      await expect(
        page.locator('link[rel="preload"][href$="/assets/title/wp19f-title-portrait.webp"]'),
      ).toHaveCount(1);
      await expect(
        page.locator('link[rel="preload"][href$="/assets/title/wp19f-title-landscape.webp"]'),
      ).toHaveCount(0);

      const controls = page.locator('[data-title-portrait-controls="true"]');
      await expect(controls).toBeVisible();
      const backgroundImage = await controls.evaluate(
        (element) => getComputedStyle(element).backgroundImage,
      );
      expect(backgroundImage).toContain('/assets/title/wp19f-title-portrait.webp');
      await expect(page.locator('[data-title-action="title-menu-new-game"]')).toBeVisible();
      await expect(page.locator('[data-title-action="title-menu-settings"]')).toBeVisible();
    });
  });
});
