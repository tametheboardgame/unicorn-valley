import { expect, test, type Page } from '@playwright/test';

interface BrowserDiagnosticsApi {
  snapshot(): { activeScenes: string[] };
}

async function waitForGlade(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes('MoonflowerGladeScene');
  });
}

async function expectResponsiveCanvas(page: Page): Promise<void> {
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  const viewport = page.viewportSize();
  const box = await canvas.boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();

  if (!viewport || !box) {
    return;
  }

  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  expect(box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.height).toBeLessThanOrEqual(viewport.height + 1);
}

test('production build boots cleanly, uses fingerprinted local assets and survives reload', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const failedResponses: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'unknown failure'}`,
    );
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle('Unicorn Valley');
  await waitForGlade(page);
  await expectResponsiveCanvas(page);

  const firstLoadAssets = await page.evaluate(() => {
    const origin = globalThis.location.origin;
    return performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => new URL(url).pathname.startsWith('/assets/'))
      .map((url) => ({ url, sameOrigin: new URL(url).origin === origin }));
  });

  expect(firstLoadAssets.length).toBeGreaterThan(1);
  expect(firstLoadAssets.every((asset) => asset.sameOrigin)).toBe(true);
  expect(
    firstLoadAssets.every((asset) =>
      /\/assets\/[^/?]+-[A-Za-z0-9_-]{6,}\.(?:js|css)$/.test(new URL(asset.url).pathname),
    ),
  ).toBe(true);

  const firstAssetPaths = firstLoadAssets.map((asset) => new URL(asset.url).pathname).sort();

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page).toHaveTitle('Unicorn Valley');
  await waitForGlade(page);
  await expectResponsiveCanvas(page);

  const reloadAssetPaths = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => new URL(entry.name).pathname)
      .filter((path) => path.startsWith('/assets/'))
      .sort(),
  );
  expect(reloadAssetPaths).toEqual(firstAssetPaths);

  expect(consoleErrors, 'browser console errors').toEqual([]);
  expect(pageErrors, 'uncaught page errors').toEqual([]);
  expect(failedRequests, 'failed browser requests').toEqual([]);
  expect(failedResponses, 'HTTP error responses').toEqual([]);
});
