import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  effectiveVisible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: DiagnosticScene[];
  };
}

async function meadowSnapshot(page: Page): Promise<DiagnosticScene> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
  await page.waitForFunction(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes('RainbowMeadowScene') === true;
  });

  return page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    if (!scene) {
      throw new Error('Rainbow Meadow diagnostics unavailable.');
    }
    return scene;
  });
}

test('H4.11 Rainbow Meadow owns its canonical traversal presentation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');

  const meadow = await meadowSnapshot(page);
  const names = meadow.objects.map(({ name }) => name);

  expect(names.filter((name) => name === 'rainbow-meadow:path-network')).toHaveLength(1);
  expect(names).toContain('rainbow-meadow:sunbeam-village-sign');
  expect(names.some((name) => name.startsWith('rainbow-meadow:sunbeam-threshold:post:'))).toBe(
    true,
  );
});

test('H4.11 leaves no compatibility-era Meadow presentation owners', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');

  const meadow = await meadowSnapshot(page);
  const names = meadow.objects.map(({ name }) => name);
  const texts = meadow.objects
    .filter(({ effectiveVisible, text }) => effectiveVisible && text !== null)
    .map(({ text }) => text);

  expect(names).not.toContain('world-traversal-polish-detail');
  expect(names).not.toContain('visual-tightening-detail');
  expect(names.some((name) => name.startsWith('environment-production:rainbow-meadow:'))).toBe(
    false,
  );
  expect(texts).not.toContain('← Sunbeam Village');
});
