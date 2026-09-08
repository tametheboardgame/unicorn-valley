import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
}

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: Array<{ key: string; objects: DiagnosticObject[] }>;
  };
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene);
  }, sceneKey);
}

async function sceneObjects(page: Page, sceneKey: string): Promise<DiagnosticObject[]> {
  return page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().scenes.find((scene) => scene.key === key)?.objects ?? [];
  }, sceneKey);
}

async function expectCanonicalLandscapeShell(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const objects = await sceneObjects(page, 'MoonflowerGladeScene');
      return objects.filter(
        ({ name, visible, interactive }) =>
          visible &&
          interactive &&
          [
            'exploration-shell-map-button',
            'exploration-shell-bag-button',
            'exploration-shell-book-button',
            'exploration-shell-settings-nav-button',
          ].includes(name),
      ).length;
    })
    .toBe(4);

  const objects = await sceneObjects(page, 'MoonflowerGladeScene');
  expect(
    objects.some(({ name, visible }) => name === 'exploration-shell-nav-group' && visible),
  ).toBe(true);
  expect(
    objects.some(({ name, visible }) => name === 'exploration-shell-shimmer-panel' && visible),
  ).toBe(true);
  expect(
    objects.some(({ name, visible }) => name === 'exploration-location-title-panel' && visible),
  ).toBe(true);
  expect(objects.some(({ name, visible }) => name === 'tablet-movement-pad' && visible)).toBe(true);

  expect(objects.some(({ name }) => name === 'exploration-shell-sound-button')).toBe(false);
  expect(objects.some(({ name }) => name === 'exploration-controls-button')).toBe(false);
  expect(objects.some(({ name }) => name === 'activity-suggestion-card')).toBe(false);
}

test.describe('WP18J shared responsive concept UI', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test('short landscape phone cannot fall back to the retired exploration layout', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 280 });
    await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
    await waitForScene(page, 'MoonflowerGladeScene');

    await expectCanonicalLandscapeShell(page);

    await page.screenshot({
      path: test.info().outputPath('wp18j-phone-landscape-short.png'),
      fullPage: true,
    });
  });

  test('rotating portrait to landscape restores the concept canvas shell, never legacy UI', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
    await waitForScene(page, 'MoonflowerGladeScene');

    await expect(page.locator('.mobile-exploration-concept-dock')).toBeVisible();

    await page.setViewportSize({ width: 844, height: 280 });
    await expect(page.locator('.mobile-exploration-concept-dock')).toHaveCount(0);
    await expectCanonicalLandscapeShell(page);

    await page.screenshot({
      path: test.info().outputPath('wp18j-phone-portrait-to-landscape.png'),
      fullPage: true,
    });
  });
});
