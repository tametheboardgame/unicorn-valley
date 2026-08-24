import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  x: number;
  y: number;
  visible: boolean;
  active: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface DiagnosticApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((target) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    diagnostics.startScene(target);
  }, sceneKey);
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expected) === true;
  }, sceneKey);
  await page.waitForTimeout(450);
}

function sceneFrom(value: DiagnosticSnapshot, sceneKey: string): DiagnosticScene {
  const scene = value.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Expected ${sceneKey}; active scenes: ${value.activeScenes.join(', ')}`);
  }
  return scene;
}

const branchCues = [
  ['glade', 'MoonflowerGladeScene', 'region-branch-cue:moonflower-field'],
  ['meadow', 'RainbowMeadowScene', 'region-branch-cue:rainbow-run'],
  ['brook', 'CrystalBrookScene', 'region-branch-cue:prism-grotto'],
  ['woods', 'WhisperingWoodsScene', 'region-branch-cue:lantern-clearing'],
] as const;

test.describe('R5-WP5.9G world layout and density', () => {
  for (const [alias, sceneKey, cueName] of branchCues) {
    test(`${sceneKey} exposes a world-space cue to optional side content`, async ({ page }) => {
      await page.goto(`/?scene=${alias}&diagnostics=1`);
      await waitForScene(page, sceneKey);
      const scene = sceneFrom(await snapshot(page), sceneKey);
      const cue = scene.objects.find((object) => object.name === cueName);

      expect(cue?.visible).toBe(true);
      expect(cue?.active).toBe(true);
    });
  }

  test('branch presentation is rebuilt exactly once after revisiting a region', async ({ page }) => {
    await page.goto('/?scene=brook&diagnostics=1');
    await waitForScene(page, 'CrystalBrookScene');
    await startScene(page, 'WhisperingWoodsScene');
    await waitForScene(page, 'WhisperingWoodsScene');
    await startScene(page, 'CrystalBrookScene');
    await waitForScene(page, 'CrystalBrookScene');

    const brook = sceneFrom(await snapshot(page), 'CrystalBrookScene');
    expect(
      brook.objects.filter(({ name }) => name === 'region-branch-cue:prism-grotto'),
    ).toHaveLength(1);
    expect(
      brook.objects.filter(({ name }) => name === 'exploration-geometry-presentation-anchor'),
    ).toHaveLength(1);
  });

  test('Bag map shows side branches, a homeward route and a reason to revisit Crystal Brook', async ({
    page,
  }) => {
    await page.goto('/?scene=brook&diagnostics=1');
    await waitForScene(page, 'CrystalBrookScene');
    await page.keyboard.press('i');
    await waitForScene(page, 'InventoryScene');

    let inventory = sceneFrom(await snapshot(page), 'InventoryScene');
    const mapTab = inventory.objects.find((object) => object.name === 'bag-map-tab');
    if (!mapTab) {
      throw new Error('Bag map tab was not found.');
    }
    await page.mouse.click(mapTab.x, mapTab.y);
    await page.waitForTimeout(250);

    inventory = sceneFrom(await snapshot(page), 'InventoryScene');
    expect(
      inventory.objects.some(({ name }) => name === 'bag-map-node:valley:moonflower-field'),
    ).toBe(true);
    expect(inventory.objects.some(({ name }) => name === 'bag-map-node:valley:rainbow-run')).toBe(
      true,
    );
    expect(inventory.objects.some(({ name }) => name === 'bag-map-node:valley:prism-grotto')).toBe(
      true,
    );
    expect(
      inventory.objects.some(({ name }) => name === 'bag-map-node:valley:lantern-clearing'),
    ).toBe(true);

    const guidance = inventory.objects.find(({ name }) => name === 'bag-map-guidance');
    expect(guidance?.text).toContain('Way home: Rainbow Meadow');
    expect(guidance?.text).toContain('Prism Grotto');
  });
});
