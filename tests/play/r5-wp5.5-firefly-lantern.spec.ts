import { expect, test } from '@playwright/test';

test('Firefly Lantern boots as a touch-friendly optional activity without browser errors', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/?scene=firefly-lantern&diagnostics=1');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): { activeScenes: string[] } };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes('FireflyLanternScene') === true;
  });
  await page.waitForTimeout(700);

  const snapshot = await page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: {
          snapshot(): {
            scenes: Array<{
              key: string;
              objects: Array<{ name: string; visible: boolean; active: boolean }>;
            }>;
          };
        };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot() ?? null;
  });

  const scene = snapshot?.scenes.find(({ key }) => key === 'FireflyLanternScene');
  const ui = scene?.objects.find(({ name }) => name === 'firefly-lantern-ui');
  expect(browserErrors).toEqual([]);
  expect(scene).toBeTruthy();
  expect(ui?.visible).toBe(true);
  expect(ui?.active).toBe(true);
});
