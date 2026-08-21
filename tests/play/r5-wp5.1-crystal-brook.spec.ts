import { expect, test } from '@playwright/test';

test('Crystal Brook boots as a playable world scene without browser errors', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/?scene=brook&diagnostics=1');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): { activeScenes: string[] } };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes('CrystalBrookScene') === true;
  });
  await page.waitForTimeout(450);

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

  const scene = snapshot?.scenes.find(({ key }) => key === 'CrystalBrookScene');
  const player = scene?.objects.find(({ name }) => name === 'world-player');
  expect(browserErrors).toEqual([]);
  expect(scene).toBeTruthy();
  expect(player?.visible).toBe(true);
  expect(player?.active).toBe(true);
});
