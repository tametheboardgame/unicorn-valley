import { expect, test } from '@playwright/test';

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    health: {
      heartbeatAgeMs: number;
      lastError: { detail: string } | null;
      rendererContextLost: boolean;
    };
  };
}

test('WP18G browser hardening keeps the game surface contained and healthy', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
  await expect(page.locator('canvas')).toBeVisible();

  const state = await page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error('Game canvas is unavailable.');
    }
    const viewportMeta =
      document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';
    const snapshot = diagnostics.snapshot();
    return {
      viewportMeta,
      touchAction: getComputedStyle(canvas).touchAction,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      width: window.innerWidth,
      height: window.innerHeight,
      heartbeatAgeMs: snapshot.health.heartbeatAgeMs,
      lastError: snapshot.health.lastError?.detail ?? null,
      rendererContextLost: snapshot.health.rendererContextLost,
      activeScenes: snapshot.activeScenes,
    };
  });

  expect(state.viewportMeta).toContain('viewport-fit=cover');
  expect(state.touchAction).toBe('none');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.width);
  expect(state.scrollHeight).toBeLessThanOrEqual(state.height);
  expect(state.heartbeatAgeMs).toBeLessThan(2_000);
  expect(state.lastError).toBeNull();
  expect(state.rendererContextLost).toBe(false);
  expect(state.activeScenes.length).toBeGreaterThan(0);
});
