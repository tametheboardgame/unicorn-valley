import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
  };
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
}

function skipUnlessPortraitTouch(): void {
  const viewport = test.info().project.use.viewport;
  const projectName = test.info().project.name;
  test.skip(
    !viewport ||
      viewport.width > 700 ||
      viewport.height <= viewport.width ||
      !projectName.includes('mobile-touch'),
    'R6-WP6.18A portrait regressions run only on the mobile touch compatibility projects.',
  );
}

test('portrait creator uses large grouped controls without changing creator save behaviour', async ({
  page,
}) => {
  skipUnlessPortraitTouch();

  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await page.locator('[data-title-action="title-menu-new-game"]').click();
  await waitForScene(page, 'UnicornCreatorScene');

  const canvasBox = await page.locator('canvas').first().boundingBox();
  expect(canvasBox).not.toBeNull();

  const root = page.locator('[data-creator-portrait-controls="true"]');
  await expect(root).toBeVisible();
  const rootBox = await root.boundingBox();
  expect(rootBox).not.toBeNull();
  expect(rootBox?.y ?? 0).toBeGreaterThanOrEqual((canvasBox?.height ?? 0) - 2);

  const name = page.locator('.creator-portrait-name-input');
  await expect(name).toBeVisible();
  const nameBox = await name.boundingBox();
  expect(nameBox?.height ?? 0).toBeGreaterThanOrEqual(54);
  await name.fill('Rosie Spark');

  const coloursTab = page.locator('[data-creator-section="colours"]');
  const hairTab = page.locator('[data-creator-section="hair"]');
  const magicTab = page.locator('[data-creator-section="magic"]');
  await expect(coloursTab).toHaveAttribute('aria-pressed', 'true');
  await expect(hairTab).toHaveAttribute('aria-pressed', 'false');
  await expect(magicTab).toHaveAttribute('aria-pressed', 'false');

  const peach = page.locator('[data-creator-choice="bodyColour:peach"]');
  const peachBox = await peach.boundingBox();
  expect(peachBox?.height ?? 0).toBeGreaterThanOrEqual(50);
  await peach.click();
  await expect(peach).toHaveAttribute('aria-pressed', 'true');

  await hairTab.click();
  await expect(hairTab).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-creator-section-panel="colours"]')).toBeHidden();
  await expect(page.locator('[data-creator-section-panel="hair"]')).toBeVisible();

  const nextMane = page.getByRole('button', { name: 'Next Mane style' });
  const nextManeBox = await nextMane.boundingBox();
  expect(nextManeBox?.width ?? 0).toBeGreaterThanOrEqual(54);
  expect(nextManeBox?.height ?? 0).toBeGreaterThanOrEqual(54);
  await nextMane.click();

  const save = page.locator('[data-creator-action="creator-action-confirm-new"]');
  await expect(save).toBeVisible();
  const saveBox = await save.boundingBox();
  expect(saveBox?.height ?? 0).toBeGreaterThanOrEqual(60);
  await save.click();
  await waitForScene(page, 'MoonflowerGladeScene');

  const stored = await page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'),
    SAVE_KEY,
  );
  expect(stored.profile.name).toBe('Rosie Spark');
  expect(stored.profile.appearance.bodyColour).toBe('peach');
  expect(stored.profile.appearance.maneStyle).toBe('fluffy');
});

test('portrait exploration presents Talk to Pip as a large explicit action button', async ({
  page,
}) => {
  skipUnlessPortraitTouch();

  await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
  await waitForScene(page, 'MoonflowerGladeScene');

  const prompt = page.locator('[data-mobile-interaction-prompt="true"]');
  await expect(prompt).toBeHidden();

  const right = page.locator('.mobile-touch-right');
  await expect(right).toBeVisible();
  await right.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 1,
  });
  try {
    await expect(prompt).toBeVisible({ timeout: 4000 });
  } finally {
    await right.dispatchEvent('pointerup', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      buttons: 0,
    });
  }

  const action = page.locator('.mobile-interaction-button');
  await expect(action).toHaveText('Talk to Pip');
  const actionBox = await action.boundingBox();
  expect(actionBox?.height ?? 0).toBeGreaterThanOrEqual(62);
  await expect(page.locator('.mobile-interaction-hint')).toContainText('big action button');

  await action.dispatchEvent('pointerdown', {
    pointerId: 2,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 1,
  });
  await page.waitForTimeout(80);
  await action.dispatchEvent('pointerup', {
    pointerId: 2,
    pointerType: 'touch',
    isPrimary: true,
    buttons: 0,
  });
  await expect(prompt).toBeHidden();
});
