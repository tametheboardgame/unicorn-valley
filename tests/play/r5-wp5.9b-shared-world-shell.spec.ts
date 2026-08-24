import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  visible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expected);
  }, sceneKey);
  await page.waitForTimeout(500);
}

function sceneFrom(snapshotValue: DiagnosticSnapshot, sceneKey: string): DiagnosticScene {
  const scene = snapshotValue.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(
      `Expected ${sceneKey}; active scenes: ${snapshotValue.activeScenes.join(', ')}`,
    );
  }
  return scene;
}

function namedCount(scene: DiagnosticScene, name: string): number {
  return scene.objects.filter((object) => object.name === name).length;
}

const explorationScenes = [
  ['glade', 'MoonflowerGladeScene'],
  ['village', 'SunbeamVillageScene'],
  ['meadow', 'RainbowMeadowScene'],
  ['brook', 'CrystalBrookScene'],
  ['woods', 'WhisperingWoodsScene'],
] as const;

test.describe('R5-WP5.9B shared exploration shell', () => {
  for (const [alias, sceneKey] of explorationScenes) {
    test(`${sceneKey} exposes exactly one common shell`, async ({ page }) => {
      await page.goto(`/?scene=${alias}&diagnostics=1`);
      await waitForScene(page, sceneKey);
      const scene = sceneFrom(await snapshot(page), sceneKey);

      expect(namedCount(scene, 'exploration-shell-bag-button')).toBe(1);
      expect(namedCount(scene, 'exploration-shell-sound-button')).toBe(1);
      expect(namedCount(scene, 'exploration-controls-button')).toBe(1);
      expect(namedCount(scene, 'exploration-location-title')).toBe(1);
      expect(namedCount(scene, 'activity-suggestion-card')).toBe(1);
    });
  }

  test('Bag keyboard access works from Crystal Brook through the shared shell', async ({
    page,
  }) => {
    await page.goto('/?scene=brook&diagnostics=1');
    await waitForScene(page, 'CrystalBrookScene');
    await page.keyboard.press('i');
    await waitForScene(page, 'InventoryScene');
    expect((await snapshot(page)).activeScenes).toContain('InventoryScene');
  });

  test('new-region guidance describes actual traversal rather than a missing jump mechanic', async ({
    page,
  }) => {
    for (const [alias, sceneKey] of [
      ['brook', 'CrystalBrookScene'],
      ['woods', 'WhisperingWoodsScene'],
    ] as const) {
      await page.goto(`/?scene=${alias}&diagnostics=1`);
      await waitForScene(page, sceneKey);
      const scene = sceneFrom(await snapshot(page), sceneKey);
      expect(namedCount(scene, 'region-world-guidance')).toBe(1);
      expect(
        scene.objects.some((object) => object.text?.toLowerCase().includes('hop between')),
      ).toBe(false);
    }
  });
});
