import { expect, test, type Page } from '@playwright/test';

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
  };
  startScene(sceneKey: string, data?: object): void;
}

test.use({ viewport: { width: 412, height: 915 }, hasTouch: true });

async function diagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, sceneData }) => {
      const api = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are not installed.');
      }
      api.startScene(key, sceneData);
    },
    { key: sceneKey, sceneData: data },
  );
  await page.waitForFunction((key) => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(key) ?? false;
  }, sceneKey);
}

async function expectReadableCompanion(page: Page, id: string): Promise<void> {
  const root = page.locator(`[data-mobile-modal-companion="${id}"]`);
  await expect(root).toBeVisible();

  const introSize = await root
    .locator('.mobile-modal-intro')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(introSize).toBeGreaterThanOrEqual(16);

  const buttons = root.locator('.mobile-modal-button');
  expect(await buttons.count()).toBeGreaterThan(0);
  for (let index = 0; index < (await buttons.count()); index += 1) {
    const button = buttons.nth(index);
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(54);
    const fontSize = await button.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(17);
  }
}

test('portrait phone can read and complete Maple baking through large companion controls', async ({
  page,
}) => {
  await diagnostics(page);
  await startScene(page, 'MapleBakingActivityScene', { returnScene: 'TitleScene' });
  await expectReadableCompanion(page, 'maple-baking');

  const root = page.locator('[data-mobile-modal-companion="maple-baking"]');
  await root.locator('[data-mobile-modal-action="choice-1"]').click();
  await expect(root.locator('.mobile-modal-heading')).toContainText('Pick a topping');
  await root.locator('[data-mobile-modal-action="choice-2"]').click();
  await expect(root.locator('.mobile-modal-heading')).toContainText('finishing touch');
  await root.locator('[data-mobile-modal-action="choice-3"]').click();

  await expect(root.locator('[data-mobile-modal-card="result"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="again"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="back"]')).toBeVisible();
});

test('portrait phone can read and complete Coral beachcombing through large companion controls', async ({
  page,
}) => {
  await diagnostics(page);
  await startScene(page, 'CoralBeachcombingActivityScene', { returnScene: 'TitleScene' });
  await expectReadableCompanion(page, 'coral-beachcombing');

  const root = page.locator('[data-mobile-modal-companion="coral-beachcombing"]');
  for (const action of ['spot-1', 'spot-2', 'spot-3', 'spot-4']) {
    await root.locator(`[data-mobile-modal-action="${action}"]`).click();
  }

  await expect(root.locator('[data-mobile-modal-card="result"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="again"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="back"]')).toBeVisible();
});

test('portrait phone can read and navigate the expanded Wonderbook without tiny canvas tabs', async ({
  page,
}) => {
  await diagnostics(page);
  await startScene(page, 'WonderbookScene', { returnScene: 'TitleScene' });
  await expectReadableCompanion(page, 'wonderbook');

  const root = page.locator('[data-mobile-modal-companion="wonderbook"]');
  await expect(root.locator('[data-mobile-modal-action="section-discoveries"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await root.locator('[data-mobile-modal-action="section-places"]').click();
  await expect(root.locator('.mobile-modal-heading')).toContainText('Places');
  await expect(root.locator('[data-mobile-modal-card="region:moonflower-glade"]')).toBeVisible();

  await root.locator('[data-mobile-modal-action="section-goals"]').click();
  await expect(root.locator('.mobile-modal-heading')).toContainText('Long-term Goals');
  await expect(root.locator('[data-mobile-modal-card="goal:valley-explorer"]')).toBeVisible();
  await expect(root.locator('[data-mobile-modal-action="close"]')).toBeVisible();
});
