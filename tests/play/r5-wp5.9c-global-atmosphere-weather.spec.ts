import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  visible: boolean;
  scrollFactorX: number;
  scrollFactorY: number;
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
  await page.waitForTimeout(450);
}

async function waitForObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ expectedScene, expectedObject }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return (
        diagnostics
          ?.snapshot()
          .scenes.find(({ key }) => key === expectedScene)
          ?.objects.some(({ name }) => name === expectedObject) === true
      );
    },
    { expectedScene: sceneKey, expectedObject: objectName },
  );
}

function sceneFrom(value: DiagnosticSnapshot, sceneKey: string): DiagnosticScene {
  const scene = value.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Expected ${sceneKey}; active scenes: ${value.activeScenes.join(', ')}`);
  }
  return scene;
}

const outdoorScenes = [
  ['glade', 'MoonflowerGladeScene'],
  ['village', 'SunbeamVillageScene'],
  ['meadow', 'RainbowMeadowScene'],
  ['brook', 'CrystalBrookScene'],
  ['woods', 'WhisperingWoodsScene'],
] as const;

test.describe('R5-WP5.9C global atmosphere and weather', () => {
  for (const [alias, sceneKey] of outdoorScenes) {
    test(`${sceneKey} receives shared atmosphere and weather controls`, async ({ page }) => {
      await page.goto(`/?scene=${alias}&diagnostics=1`);
      await waitForScene(page, sceneKey);
      const scene = sceneFrom(await snapshot(page), sceneKey);

      expect(
        scene.objects.filter((object) => object.name === 'atmospheric-time-presentation'),
      ).toHaveLength(1);
      expect(
        scene.objects.filter((object) => object.name === 'atmospheric-time-control'),
      ).toHaveLength(1);
      expect(
        scene.objects.filter((object) => object.name === 'magical-weather-control'),
      ).toHaveLength(1);
    });
  }

  test('Moonflower Patch inherits the outdoor atmosphere layer without bespoke scene wiring', async ({
    page,
  }) => {
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');
    await page.evaluate(() => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { startScene(sceneKey: string): void };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      diagnostics?.startScene('MoonflowerPatchScene');
    });
    await waitForScene(page, 'MoonflowerPatchScene');
    const scene = sceneFrom(await snapshot(page), 'MoonflowerPatchScene');

    expect(scene.objects.some((object) => object.name === 'atmospheric-time-presentation')).toBe(
      true,
    );
    expect(scene.objects.some((object) => object.name === 'magical-weather-control')).toBe(true);
  });

  test('manual atmosphere and weather state survive an outdoor scene change', async ({ page }) => {
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');

    await page.keyboard.press('t');
    await page.keyboard.press('t');
    await page.keyboard.press('y');
    await page.keyboard.press('y');
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { startScene(sceneKey: string): void };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      diagnostics?.startScene('SunbeamVillageScene');
    });
    await waitForScene(page, 'SunbeamVillageScene');
    const village = sceneFrom(await snapshot(page), 'SunbeamVillageScene');
    const timeControl = village.objects.find(
      (object) => object.name === 'atmospheric-time-control',
    );
    const weatherControl = village.objects.find(
      (object) => object.name === 'magical-weather-control',
    );

    expect(timeControl?.text).toContain('Afternoon');
    expect(weatherControl?.text).toContain('Gentle Rain');
  });

  test('sparkle weather is a world-space field rather than camera glass', async ({ page }) => {
    await page.goto('/?scene=woods&diagnostics=1');
    await waitForScene(page, 'WhisperingWoodsScene');
    await page.keyboard.press('y');
    await page.keyboard.press('y');
    await page.keyboard.press('y');
    await waitForObject(page, 'WhisperingWoodsScene', 'magical-weather-sparkle-world');

    const woods = sceneFrom(await snapshot(page), 'WhisperingWoodsScene');
    const sparkleField = woods.objects.find(
      (object) => object.name === 'magical-weather-sparkle-world',
    );
    expect(sparkleField).toBeDefined();
    expect(sparkleField?.scrollFactorX).toBe(1);
    expect(sparkleField?.scrollFactorY).toBe(1);
  });
});
