import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  text: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  alpha: number;
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
    return diagnostics?.snapshot().activeScenes.includes(expected) === true;
  }, sceneKey);
  await page.waitForTimeout(350);
}

function sceneFrom(value: DiagnosticSnapshot, sceneKey: string): DiagnosticScene {
  const scene = value.scenes.find(({ key }) => key === sceneKey);
  if (!scene) {
    throw new Error(`Expected ${sceneKey}; active scenes: ${value.activeScenes.join(', ')}`);
  }
  return scene;
}

async function waitForNamedObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ expectedScene, expectedName }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return diagnostics
        ?.snapshot()
        .scenes.find(({ key }) => key === expectedScene)
        ?.objects.some(({ name, visible, active }) => name === expectedName && visible && active);
    },
    { expectedScene: sceneKey, expectedName: objectName },
  );
}

test.describe('R5-WP5.10 final tightening', () => {
  test('Wonderbook closes back to the exact paused world position', async ({ page }) => {
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');

    await page.keyboard.down('d');
    await page.waitForTimeout(850);
    await page.keyboard.up('d');
    await page.waitForTimeout(120);

    let glade = sceneFrom(await snapshot(page), 'MoonflowerGladeScene');
    const before = glade.objects.find(({ name }) => name === 'world-player-unicorn');
    if (!before) {
      throw new Error('World player was not found before opening the Wonderbook.');
    }

    await page.keyboard.press('b');
    await waitForScene(page, 'WonderbookScene');
    await page.keyboard.press('Escape');
    await waitForScene(page, 'MoonflowerGladeScene');

    glade = sceneFrom(await snapshot(page), 'MoonflowerGladeScene');
    const after = glade.objects.find(({ name }) => name === 'world-player-unicorn');
    expect(after).toBeTruthy();
    expect(Math.abs((after?.x ?? 0) - before.x)).toBeLessThan(3);
    expect(Math.abs((after?.y ?? 0) - before.y)).toBeLessThan(3);
  });

  test('Firefly mode buttons stay inside their selector panel', async ({ page }) => {
    await page.goto('/?scene=firefly-lantern&diagnostics=1');
    await waitForScene(page, 'FireflyLanternScene');

    for (let light = 0; light < 8; light += 1) {
      await waitForNamedObject(page, 'FireflyLanternScene', 'firefly-lantern-target');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => {
        const diagnostics = (
          window as typeof window & {
            __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
          }
        ).__UNICORN_VALLEY_DIAGNOSTICS__;
        return (
          diagnostics
            ?.snapshot()
            .scenes.find(({ key }) => key === 'FireflyLanternScene')
            ?.objects.some(({ name, active }) => name === 'firefly-lantern-target' && active) === false
        );
      });
    }

    await waitForNamedObject(page, 'FireflyLanternScene', 'firefly-result-panel');
    await page.keyboard.press('m');
    await waitForNamedObject(page, 'FireflyLanternScene', 'firefly-mode-selector');
    await waitForNamedObject(page, 'FireflyLanternScene', 'r5-final-firefly-selector-button:3');

    const firefly = sceneFrom(await snapshot(page), 'FireflyLanternScene');
    const panel = firefly.objects.find(
      ({ type, x, y, displayWidth, displayHeight }) =>
        type === 'Rectangle' &&
        Math.abs(x - 640) < 2 &&
        Math.abs(y - 370) < 2 &&
        Math.abs(displayWidth - 850) < 2 &&
        Math.abs(displayHeight - 390) < 2,
    );
    const buttons = firefly.objects.filter(({ name }) =>
      name.startsWith('r5-final-firefly-selector-button:'),
    );
    if (!panel) {
      throw new Error('Firefly selector panel was not found.');
    }

    expect(buttons).toHaveLength(3);
    const panelLeft = panel.x - panel.displayWidth / 2;
    const panelRight = panel.x + panel.displayWidth / 2;
    for (const button of buttons) {
      expect(button.x - button.displayWidth / 2).toBeGreaterThan(panelLeft + 8);
      expect(button.x + button.displayWidth / 2).toBeLessThan(panelRight - 8);
    }
  });

  test('suggestion footer stays visibly inside its card', async ({ page }) => {
    await page.goto('/?scene=village&diagnostics=1');
    await waitForScene(page, 'SunbeamVillageScene');
    await waitForNamedObject(page, 'SunbeamVillageScene', 'r5-final-suggestion-footer');

    const village = sceneFrom(await snapshot(page), 'SunbeamVillageScene');
    const panel = village.objects.find(({ name }) => name === 'activity-suggestion-card');
    const footer = village.objects.find(({ name }) => name === 'r5-final-suggestion-footer');
    if (!panel || !footer) {
      throw new Error('Suggestion card geometry was not found.');
    }

    expect(footer.y + footer.displayHeight / 2).toBeLessThan(
      panel.y + panel.displayHeight / 2 - 5,
    );
  });

  test('gentle rain remains readable on light outdoor regions', async ({ page }) => {
    await page.goto('/?scene=village&diagnostics=1');
    await waitForScene(page, 'SunbeamVillageScene');

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const village = sceneFrom(await snapshot(page), 'SunbeamVillageScene');
      const weather = village.objects.find(({ name }) => name === 'magical-weather-control');
      if (weather?.text?.includes('Gentle Rain')) {
        break;
      }
      await page.keyboard.press('y');
      await page.waitForTimeout(180);
    }

    await waitForNamedObject(page, 'SunbeamVillageScene', 'r5-final-rain-drop');
    const village = sceneFrom(await snapshot(page), 'SunbeamVillageScene');
    const drops = village.objects.filter(({ name }) => name === 'r5-final-rain-drop');
    expect(drops.length).toBeGreaterThanOrEqual(20);
    expect(drops.every(({ alpha }) => alpha >= 0.65)).toBe(true);
    expect(drops.every(({ displayWidth }) => displayWidth >= 4)).toBe(true);
  });

  test('cottage windows read as wall fixtures above a clear baseboard', async ({ page }) => {
    await page.goto('/?scene=cottage&diagnostics=1');
    await waitForScene(page, 'CottageInteriorScene');
    await waitForNamedObject(page, 'CottageInteriorScene', 'r5-final-cottage-wall-anchor');

    const cottage = sceneFrom(await snapshot(page), 'CottageInteriorScene');
    const wall = cottage.objects.find(({ name }) => name === 'r5-final-cottage-wall-anchor');
    const baseboard = cottage.objects.find(({ name }) => name === 'r5-final-cottage-baseboard');
    const sills = cottage.objects.filter(({ name }) => name === 'r5-final-cottage-window-sill');

    expect(wall?.visible).toBe(true);
    expect(baseboard?.visible).toBe(true);
    expect(sills).toHaveLength(2);
    expect(sills.every(({ y }) => y < (baseboard?.y ?? 0))).toBe(true);
  });
});
