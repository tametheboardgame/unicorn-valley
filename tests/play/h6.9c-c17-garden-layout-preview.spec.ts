import { expect, test } from '@playwright/test';

const PREVIEW = '/design-previews/crystalarium-c17-illustrated-layout.html';

test.describe('H6.9C17 non-saving illustrated Garden composition', () => {
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ]) {
    test(`renders separate artwork, 42 sockets and reachable growers at ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto(PREVIEW);
      await expect(page.getByRole('heading', { name: /Crystalarium/ })).toBeVisible();
      await expect(page.locator('#board .cell')).toHaveCount(42);
      await expect(page.locator('.wells .well')).toHaveCount(3);
      await expect(page.locator('#orders .order-card')).toHaveCount(5);
      await expect(page.locator('#stock')).toHaveText('100 / 100');
      await expect(page.locator('#low')).toBeVisible();

      // A 320px screen can scroll its 42 real-size sockets horizontally,
      // rather than shrinking away game controls or clipping the first row.
      const first = await page.locator('#board .cell').first().boundingBox();
      expect(first).not.toBeNull();
      expect(first!.y).toBeGreaterThanOrEqual(0);
      expect(first!.y).toBeLessThan(viewport.height);
      if (viewport.width <= 390) {
        const size = await page
          .locator('#board .cell')
          .first()
          .evaluate((node) => node.getBoundingClientRect().width);
        expect(size).toBeGreaterThanOrEqual(48);
      }

      for (const image of [
        '.potion img',
        '.wells .well img',
        '.board-foot img',
        '#orders .order-card .goal img',
      ]) {
        await expect
          .poll(() =>
            page
              .locator(image)
              .first()
              .evaluate((node) => {
                const img = node as HTMLImageElement;
                return img.complete && img.naturalWidth > 0;
              }),
          )
          .toBe(true);
      }
      await page.screenshot({
        path: testInfo.outputPath(`c17-layout-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      });
    });
  }

  test('order rail, storage, help and potion preview stay isolated from adventure saves', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PREVIEW);
    const rail = page.locator('#orders');
    const before = await rail.evaluate((el) => el.scrollLeft);
    await page.locator('#next').click();
    await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);

    await page.locator('#storage').click();
    await expect(page.locator('#storage-dialog')).toBeVisible();
    await expect(page.locator('#stored-sample .cell')).toHaveCount(12);
    await page.keyboard.press('Escape');
    await expect(page.locator('#storage-dialog')).toBeHidden();

    await page.locator('#help').click();
    await expect(page.locator('#low')).toHaveClass(/focus-target/);
    await page.locator('#skip').click();
    await expect(page.locator('#guide')).toBeHidden();

    await page.locator('#low').click();
    await expect(page.locator('#stock')).toHaveText('99 / 100');
    expect(
      await page.evaluate(() => ({
        adventure: localStorage.getItem('unicorn-valley.save'),
        sandbox: localStorage.getItem('unicorn-valley:just-games:crystalarium:v1'),
      })),
    ).toEqual({ adventure: null, sandbox: null });
  });
});
