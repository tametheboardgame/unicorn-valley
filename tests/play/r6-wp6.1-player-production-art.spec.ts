import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
  active: boolean;
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

async function playerSnapshot(page: Page): Promise<DiagnosticObject> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const player = diagnostics
      ?.snapshot()
      .scenes.find(({ key }) => key === 'MoonflowerGladeScene')
      ?.objects.find(({ name }) => name === 'world-player-unicorn');
    if (!player) {
      throw new Error('Production player unicorn was not found.');
    }
    return player;
  });
}

async function waitForPlayerTravel(page: Page, startX: number, distance: number): Promise<void> {
  await page.waitForFunction(
    ({ originX, requiredDistance }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const player = diagnostics
        ?.snapshot()
        .scenes.find(({ key }) => key === 'MoonflowerGladeScene')
        ?.objects.find(({ name }) => name === 'world-player-unicorn');
      return Boolean(player && player.x - originX > requiredDistance);
    },
    { originX: startX, requiredDistance: distance },
    { timeout: 4000 },
  );
}

test.describe('R6-WP6.1 player production art', () => {
  test('upgraded player remains readable and moves at world scale', async ({ page }) => {
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');
    await page.waitForTimeout(500);

    const before = await playerSnapshot(page);
    expect(before.visible).toBe(true);
    expect(before.active).toBe(true);
    expect(before.displayWidth).toBeGreaterThan(90);
    expect(before.displayHeight).toBeGreaterThan(70);

    await page.keyboard.down('d');
    try {
      await waitForPlayerTravel(page, before.x, 60);
    } finally {
      await page.keyboard.up('d');
    }
    const after = await playerSnapshot(page);
    expect(after.x - before.x).toBeGreaterThan(60);
  });

  test('gallop keeps the same production unicorn within sane display bounds', async ({ page }) => {
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');
    await page.waitForTimeout(450);

    await page.keyboard.down('Shift');
    await page.keyboard.down('d');
    await page.waitForTimeout(800);
    const during = await playerSnapshot(page);
    await page.keyboard.up('d');
    await page.keyboard.up('Shift');

    expect(during.displayWidth).toBeGreaterThan(90);
    expect(during.displayWidth).toBeLessThan(150);
    expect(during.displayHeight).toBeGreaterThan(70);
    expect(during.displayHeight).toBeLessThan(125);
  });
});
