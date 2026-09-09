import { expect, test, type Page } from '@playwright/test';

interface DiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: Array<{
    key: string;
    objects: Array<{
      name: string;
      text: string | null;
      visible: boolean;
      interactive: boolean;
      x: number;
      y: number;
    }>;
  }>;
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable on the deployed build.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expected) === true;
  }, sceneKey);
}

async function tapNamedObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const state = await snapshot(page);
  const target = state.scenes
    .find(({ key }) => key === sceneKey)
    ?.objects.find(
      ({ name, text, visible, interactive }) =>
        visible && interactive && (text === objectName || name === objectName),
    );
  if (!target) throw new Error(`Missing deployed interaction ${sceneKey}:${objectName}`);
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Deployed canvas has no bounds.');
  await page.mouse.click(
    canvas.x + (target.x / state.width) * canvas.width,
    canvas.y + (target.y / state.height) * canvas.height,
  );
}

test('immutable deployment starts, saves, reloads and Continues in isolated storage', async ({
  page,
}, testInfo) => {
  test.setTimeout(130_000);
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await tapNamedObject(page, 'TitleScene', 'New Game');
  await waitForScene(page, 'UnicornCreatorScene');
  await page.locator('.unicorn-name-input').fill('Actions Smoke');
  await tapNamedObject(page, 'UnicornCreatorScene', 'creator-action-confirm-new');
  await waitForScene(page, 'MoonflowerGladeScene');

  const saved = await page.evaluate(() => window.localStorage.getItem('unicorn-valley.save'));
  expect(saved).not.toBeNull();
  const parsed = JSON.parse(saved ?? '{}') as {
    schemaVersion?: number;
    profile?: { name?: string };
  };
  expect(parsed.schemaVersion).toBeGreaterThanOrEqual(1);
  expect(parsed.profile?.name).toBeTruthy();

  await page.reload();
  await waitForScene(page, 'TitleScene');

  const title = (await snapshot(page)).scenes.find(({ key }) => key === 'TitleScene');
  const continueButton = title?.objects.find(
    ({ text, visible, interactive }) => text === 'Continue' && visible && interactive,
  );
  expect(continueButton).toBeTruthy();
  const canvas = await page.locator('canvas').boundingBox();
  expect(canvas).not.toBeNull();
  if (!continueButton || !canvas) {
    return;
  }
  const dimensions = await snapshot(page);
  await page.mouse.click(
    canvas.x + (continueButton.x / dimensions.width) * canvas.width,
    canvas.y + (continueButton.y / dimensions.height) * canvas.height,
  );
  await waitForScene(page, 'MoonflowerGladeScene');

  await page.screenshot({
    path: testInfo.outputPath('deployment-continue.png'),
    animations: 'disabled',
  });
});
