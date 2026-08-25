import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  active: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForNamedObject(page: Page, objectName: string): Promise<void> {
  await page.waitForFunction((expectedName) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics
      ?.snapshot()
      .scenes.find(({ key }) => key === 'FireflyLanternScene')
      ?.objects.some(({ name, active, visible }) => name === expectedName && active && visible);
  }, objectName);
}

async function waitForNamedObjectToDisappear(page: Page, objectName: string): Promise<void> {
  await page.waitForFunction((expectedName) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return (
      diagnostics
        ?.snapshot()
        .scenes.find(({ key }) => key === 'FireflyLanternScene')
        ?.objects.some(({ name, active }) => name === expectedName && active) === false
    );
  }, objectName);
}

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

  const scene = (await snapshot(page)).scenes.find(({ key }) => key === 'FireflyLanternScene');
  const ui = scene?.objects.find(({ name }) => name === 'firefly-lantern-ui');

  expect(browserErrors).toEqual([]);
  expect(scene).toBeTruthy();
  expect(ui?.visible).toBe(true);
  expect(ui?.active).toBe(true);
});

test('perfect first Normal completion unlocks replay modes and Normal difficulty selection', async ({
  page,
}) => {
  await page.goto('/?scene=firefly-lantern&diagnostics=1');

  for (let light = 0; light < 8; light += 1) {
    await waitForNamedObject(page, 'firefly-lantern-target');
    await page.keyboard.press('Enter', { delay: 50 });
    await waitForNamedObjectToDisappear(page, 'firefly-lantern-target');
  }

  await waitForNamedObject(page, 'firefly-result-panel');
  await page.keyboard.press('m');
  await waitForNamedObject(page, 'firefly-mode-selector');
  await page.keyboard.press('1');
  await waitForNamedObject(page, 'firefly-difficulty-selector');

  const scene = (await snapshot(page)).scenes.find(({ key }) => key === 'FireflyLanternScene');
  expect(scene?.objects.some(({ name }) => name === 'firefly-difficulty-selector')).toBe(true);
});
