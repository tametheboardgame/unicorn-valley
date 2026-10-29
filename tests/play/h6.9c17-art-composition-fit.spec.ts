import { expect, test } from '@playwright/test';

const preview = '/design-previews/crystalarium-c17-final-composition.html';

async function geometry(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>('#frame');
    const board = document.querySelector<HTMLElement>('#board-scroll');
    const rail = document.querySelector<HTMLElement>('#rail');
    const cells = Array.from(document.querySelectorAll<HTMLElement>('#board-cells > .socket'));
    if (!frame || !board || !rail || cells.length !== 42) {
      throw new Error('Incomplete C17 review composition');
    }
    const bounds = frame.getBoundingClientRect();
    const boxes = cells.map((cell) => cell.getBoundingClientRect());
    return {
      count: boxes.length,
      fits: boxes.every(
        (box) =>
          box.left >= bounds.left &&
          box.right <= bounds.right &&
          box.top >= bounds.top &&
          box.bottom <= bounds.bottom,
      ),
      width: Math.min(...boxes.map((box) => box.width)),
      height: Math.min(...boxes.map((box) => box.height)),
      pageExtraHeight: document.documentElement.scrollHeight - innerHeight,
      pageExtraWidth: document.documentElement.scrollWidth - innerWidth,
      boardExtraWidth: board.scrollWidth - board.clientWidth,
      railExtraWidth: rail.scrollWidth - rail.clientWidth,
    };
  });
}

test.describe('C17 no-save artwork frame-fit regression', () => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 1534, height: 682 },
  ]) {
    test(`desktop ${viewport.width}x${viewport.height} has no page scroll or frame overlap`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(preview);
      const result = await geometry(page);
      expect(result.count).toBe(42);
      expect(result.fits).toBe(true);
      expect(result.width).toBeGreaterThanOrEqual(48);
      expect(result.height).toBeGreaterThanOrEqual(48);
      expect(result.pageExtraHeight).toBeLessThanOrEqual(1);
      expect(result.pageExtraWidth).toBeLessThanOrEqual(1);
      expect(result.railExtraWidth).toBeGreaterThan(0);
      await page.locator('#open-storage').click();
      await expect(page.locator('#storage')).toBeVisible();
      await page.locator('#storage-close').click();
      await expect(page.locator('#storage')).toBeHidden();
    });
  }

  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
  ]) {
    test(`mobile ${viewport.width}x${viewport.height} keeps 48px board targets and internal pan`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(preview);
      const result = await geometry(page);
      expect(result.count).toBe(42);
      expect(result.fits).toBe(true);
      expect(result.width).toBeGreaterThanOrEqual(48);
      expect(result.height).toBeGreaterThanOrEqual(48);
      expect(result.pageExtraWidth).toBeLessThanOrEqual(1);
      expect(result.boardExtraWidth).toBeGreaterThan(0);
      expect(result.railExtraWidth).toBeGreaterThan(0);
      await page.locator('#help').click();
      await expect(page.locator('#guide')).toBeVisible();
      await page.locator('#guide-exit').click();
      await expect(page.locator('#guide')).toBeHidden();
    });
  }
});
