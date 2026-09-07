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

test.describe('WP18J shared responsive concept UI', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test('landscape phone uses the same concept shell family as a tablet', async ({ page }) => {
    await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
    await waitForScene(page, 'MoonflowerGladeScene');

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
    expect(objects.some(({ name, visible }) => name === 'exploration-shell-nav-group' && visible)).toBe(
      true,
    );
    expect(
      objects.some(({ name, visible }) => name === 'exploration-shell-shimmer-panel' && visible),
    ).toBe(true);
    expect(
      objects.some(({ name, visible }) => name === 'exploration-location-title-panel' && visible),
    ).toBe(true);
    expect(objects.some(({ name, visible }) => name === 'tablet-movement-pad' && visible)).toBe(true);
    expect(
      objects.some(({ name, visible }) => name === 'exploration-shell-sound-button' && visible),
    ).toBe(false);
    expect(objects.some(({ name }) => name === 'activity-suggestion-card')).toBe(false);
  });
});
