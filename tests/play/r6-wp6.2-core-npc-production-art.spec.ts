import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  textureKey: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
  active: boolean;
  interactive: boolean;
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: Array<{ key: string; objects: DiagnosticObject[] }>;
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expected) === true;
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, payload }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: {
            startScene(scene: string, data?: object): void;
          };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      diagnostics.startScene(key, payload);
    },
    { key: sceneKey, payload: data },
  );
  await waitForScene(page, sceneKey);
  await page.waitForTimeout(260);
}

async function findObject(
  page: Page,
  sceneKey: string,
  objectName: string,
): Promise<DiagnosticObject | null> {
  return page.evaluate(
    ({ key, name }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return (
        diagnostics
          ?.snapshot()
          .scenes.find((scene) => scene.key === key)
          ?.objects.find((object) => object.name === name) ?? null
      );
    },
    { key: sceneKey, name: objectName },
  );
}

const STORY_CASES = [
  ['NovaStoryScene', 'nova', 'RainbowMeadowScene'],
  ['WillowStoryScene', 'willow', 'SunbeamVillageScene'],
  ['PipEggStoryScene', 'pip', 'MoonflowerGladeScene'],
  ['PebbleStoryScene', 'pebble', 'SunbeamVillageScene'],
  ['LumiStoryScene', 'lumi', 'WhisperingWoodsScene'],
  ['MarigoldPicnicScene', 'marigold', 'SunbeamVillageScene'],
] as const;

test.describe('R6-WP6.2 core NPC production art', () => {
  test('all six core story portraits use canonical production identities', async ({ page }) => {
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');

    for (const [sceneKey, id, returnScene] of STORY_CASES) {
      await startScene(page, sceneKey, { returnScene });
      const portrait = await findObject(page, sceneKey, `core-npc:${id}:portrait`);
      expect(portrait, `${id} portrait should exist`).toBeTruthy();
      expect(portrait?.visible).toBe(true);
      expect(portrait?.active).toBe(true);
      expect(portrait?.textureKey).toBe(`core-npc-production:${id}:happy`);
      expect(portrait?.displayWidth ?? 0).toBeGreaterThan(160);
      expect(portrait?.displayHeight ?? 0).toBeGreaterThan(125);
    }
  });

  test('production identities replace the main overworld placeholders', async ({ page }) => {
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');
    await page.waitForTimeout(300);

    const pip = await findObject(page, 'MoonflowerGladeScene', 'core-npc:pip:world');
    expect(pip?.visible).toBe(true);
    expect(pip?.textureKey).toBe('core-npc-production:pip:neutral');

    await startScene(page, 'SunbeamVillageScene');
    for (const id of ['willow', 'marigold', 'pebble'] as const) {
      const npc = await findObject(page, 'SunbeamVillageScene', `core-npc:${id}:world`);
      expect(npc, `${id} overworld sprite should exist`).toBeTruthy();
      expect(npc?.visible).toBe(true);
      expect(npc?.displayWidth ?? 0).toBeGreaterThan(90);
    }

    await startScene(page, 'RainbowMeadowScene');
    const nova = await findObject(page, 'RainbowMeadowScene', 'core-npc:nova:world');
    expect(nova?.visible).toBe(true);
    expect(nova?.textureKey).toBe('core-npc-production:nova:neutral');
  });
});
