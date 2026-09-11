import { expect, test } from '@playwright/test';
import type { BrowserDiagnosticSnapshot } from '../../src/game/testing/BrowserDiagnostics';

async function getSnapshot(page: import('@playwright/test').Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: import('@playwright/test').Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    return (
      diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.some((scene) => scene.key === expectedScene && scene.active) === true
    );
  }, sceneKey);
}

async function waitForPlayer(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    return (
      diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.some((scene) =>
          scene.objects.some((object) => object.name === 'world-player-unicorn'),
        ) === true
    );
  });
}

test('portrait creator uses large grouped controls without changing creator save behaviour', async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto('/?diagnostics=1');

  await page.locator('.title-action-new-game').click();
  await expect(page.locator('.portrait-creator-controls')).toBeVisible();
  await expect(page.locator('.portrait-creator-section-tab')).toHaveCount(4);

  const bodyTab = page.locator('.portrait-creator-section-tab').filter({ hasText: 'Body' });
  const coloursTab = page.locator('.portrait-creator-section-tab').filter({ hasText: 'Colours' });
  const maneTab = page.locator('.portrait-creator-section-tab').filter({ hasText: 'Mane' });
  const accessoriesTab = page.locator('.portrait-creator-section-tab').filter({
    hasText: 'Accessories',
  });

  const minTouchSize = async (locator: ReturnType<typeof page.locator>): Promise<void> => {
    const box = await locator.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  };

  await minTouchSize(bodyTab);
  await minTouchSize(coloursTab);
  await minTouchSize(maneTab);
  await minTouchSize(accessoriesTab);

  await coloursTab.click();
  await expect(page.locator('.portrait-creator-option-grid')).toBeVisible();
  await minTouchSize(page.locator('.portrait-creator-option-button').first());

  await maneTab.click();
  await expect(page.locator('.portrait-creator-option-button').first()).toBeVisible();

  await accessoriesTab.click();
  await expect(page.locator('.portrait-creator-option-button').first()).toBeVisible();

  await bodyTab.click();
  await page.locator('.portrait-creator-option-button').nth(1).click();

  await page.locator('.portrait-creator-done').click();
  await waitForScene(page, 'MoonflowerGladeScene');
  await waitForPlayer(page);

  const snapshot = await getSnapshot(page);
  const glade = snapshot.scenes.find((scene) => scene.key === 'MoonflowerGladeScene');
  expect(glade).toBeDefined();
  expect(
    glade?.objects.some(
      (object) =>
        object.name === 'world-player-unicorn' &&
        object.visible &&
        object.textureKey?.startsWith('player-unicorn'),
    ),
  ).toBe(true);
});

test('portrait exploration presents Talk to Pip as a large explicit action button', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');
  await waitForPlayer(page);

  const canvas = page.locator('canvas');
  await canvas.dispatchEvent('pointerdown', {
    clientX: 134,
    clientY: 221,
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 1,
  });
  await page.waitForTimeout(700);
  await canvas.dispatchEvent('pointerup', {
    clientX: 134,
    clientY: 221,
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 0,
  });

  const action = page.locator('.mobile-interaction-button');
  await expect(action).toHaveText('Talk to Pip');
  const actionBox = await action.boundingBox();
  expect(actionBox?.height ?? 0).toBeGreaterThanOrEqual(62);
  await expect(page.locator('.mobile-interaction-hint')).toHaveText('Pip');

  await action.dispatchEvent('pointerdown', {
    pointerId: 2,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 1,
  });
  await action.dispatchEvent('pointerup', {
    pointerId: 2,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 0,
  });
  await page.waitForTimeout(200);

  const snapshot = await getSnapshot(page);
  const glade = snapshot.scenes.find((scene) => scene.key === 'MoonflowerGladeScene');
  expect(
    glade?.objects.some(
      (object) => object.name === 'dialogue-production-panel' && object.visible,
    ),
  ).toBe(true);
});
