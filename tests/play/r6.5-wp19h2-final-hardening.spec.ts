import { expect, test, type Page } from '@playwright/test';

interface ObjectSnapshot {
  name: string;
  text: string | null;
  x: number;
  y: number;
  alpha: number;
  visible: boolean;
  interactive: boolean;
}

interface SceneSnapshot {
  key: string;
  objects: ObjectSnapshot[];
}

interface Snapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: SceneSnapshot[];
}

interface Diagnostics {
  snapshot(): Snapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Diagnostics unavailable');
    return api.snapshot();
  });
}

function scene(value: Snapshot, key: string): SceneSnapshot {
  const found = value.scenes.find((candidate) => candidate.key === key);
  if (!found) throw new Error(`Missing ${key}`);
  return found;
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.waitForFunction(() =>
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes('TitleScene'),
  );
  await page.evaluate(
    ({ key, payload }) =>
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(key, payload),
    { key: sceneKey, payload: data },
  );
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual([sceneKey]);
}

async function setPlayerPosition(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ nextX, nextY }) =>
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
        'CottageInteriorScene',
        'world-player-unicorn',
        nextX,
        nextY,
      ),
    { nextX: x, nextY: y },
  );
}

async function tapNamedCanvasObject(
  page: Page,
  sceneKey: string,
  objectName: string,
): Promise<void> {
  const value = await snapshot(page);
  const object = scene(value, sceneKey).objects.find(
    (candidate) => candidate.name === objectName && candidate.visible && candidate.interactive,
  );
  if (!object) throw new Error(`Missing interactive ${objectName}`);
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Canvas bounds unavailable');
  await page.touchscreen.tap(
    canvas.x + (object.x / value.width) * canvas.width,
    canvas.y + (object.y / value.height) * canvas.height,
  );
}

test('H2.11 retires the legacy cottage depth owner and uses the shared interaction route', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');
  await setPlayerPosition(page, 1075, 735);

  await expect
    .poll(
      async () =>
        scene(await snapshot(page), 'CottageInteriorScene').objects.find(
          ({ name }) => name === 'exploration-interaction-prompt-label',
        )?.text,
    )
    .toBe('Sit');

  const value = await snapshot(page);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(({ name }) =>
      name.startsWith('cottage-depth:'),
    ),
  ).toBe(false);

  await page.keyboard.press('e');
  await expect
    .poll(
      async () =>
        scene(await snapshot(page), 'CottageInteriorScene').objects.find(
          ({ name, visible }) => name === 'wp19d-interaction-feedback' && visible,
        )?.text,
    )
    .toContain('Cosy sofa');
});

test('H2.11 Reduced Motion keeps decorate markers static with one canonical direct hit zone', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'unicorn-valley:accessibility-settings:v1',
      JSON.stringify({ reducedMotion: true, highVisibilityInteractions: false }),
    );
  });
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene', { decorateMode: true });
  await setPlayerPosition(page, 750, 790);

  await expect
    .poll(async () =>
      scene(await snapshot(page), 'CottageInteriorScene').objects.some(
        ({ name, interactive }) =>
          name === 'cottage-decorate-hit:cottage-slot:centre-rug' && interactive,
      ),
    )
    .toBe(true);

  let value = await snapshot(page);
  const markerBefore = scene(value, 'CottageInteriorScene').objects.find(
    ({ name }) => name === 'cottage-decorate-marker:cottage-slot:centre-rug',
  );
  const sparkle = scene(value, 'CottageInteriorScene').objects.find(
    ({ name }) => name === 'cottage-decorate-sparkle:cottage-slot:centre-rug',
  );
  expect(markerBefore?.interactive).toBe(false);
  expect(sparkle?.interactive).toBe(false);

  await page.waitForTimeout(1250);
  value = await snapshot(page);
  const markerAfter = scene(value, 'CottageInteriorScene').objects.find(
    ({ name }) => name === 'cottage-decorate-marker:cottage-slot:centre-rug',
  );
  expect(markerAfter?.alpha).toBe(markerBefore?.alpha);
});

test.describe('H2.11 portrait cottage editors', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('portrait touch exposes readable Decorate and Room Style companion controls', async ({
    page,
  }) => {
    await page.goto('/?diagnostics=1');
    await startScene(page, 'CottageInteriorScene', { decorateMode: true });
    await setPlayerPosition(page, 750, 790);
    await expect
      .poll(
        async () =>
          scene(await snapshot(page), 'CottageInteriorScene').objects.find(
            ({ name }) => name === 'exploration-interaction-prompt-label',
          )?.text,
      )
      .toBe('Decorate here');
    await page.keyboard.press('e');

    const decorate = page.locator('[data-mobile-modal-companion="cottage-decorate"]');
    await expect(decorate).toBeVisible();
    const decorateButtons = decorate.locator('.mobile-modal-button');
    expect(await decorateButtons.count()).toBeGreaterThanOrEqual(2);
    const firstDecorateButton = await decorateButtons.first().boundingBox();
    expect(firstDecorateButton?.height ?? 0).toBeGreaterThanOrEqual(48);

    await decorate.locator('[data-mobile-modal-action="back"]').click();
    await expect
      .poll(async () => (await snapshot(page)).activeScenes)
      .toEqual(['CottageInteriorScene']);

    const roomStyleButton = page.locator('.mobile-touch-style');
    await expect(roomStyleButton).toBeVisible();
    await roomStyleButton.click();

    const style = page.locator('[data-mobile-modal-companion="cottage-style"]');
    await expect(style).toBeVisible();
    const styleButtons = style.locator('.mobile-modal-button');
    expect(await styleButtons.count()).toBeGreaterThanOrEqual(6);
    const firstStyleButton = await styleButtons.first().boundingBox();
    expect(firstStyleButton?.height ?? 0).toBeGreaterThanOrEqual(48);
    await expect(style.locator('[data-mobile-modal-action="apply"]')).toBeVisible();
  });
});
