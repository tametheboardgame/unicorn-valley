import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  text: string | null;
  visible: boolean;
  effectiveVisible: boolean;
  interactive: boolean;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticHealthScene {
  key: string;
  lifecycleState: string;
}

interface DiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: DiagnosticScene[];
    health: { scenes: DiagnosticHealthScene[] };
  };
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function snapshotScene(page: Page, key: string): Promise<DiagnosticScene> {
  return page.evaluate((sceneKey) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find((candidate) => candidate.key === sceneKey);
    if (!scene) throw new Error(`Missing diagnostic scene ${sceneKey}.`);
    return scene;
  }, key);
}

async function setMeadowPlayerPosition(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ targetX, targetY }) => {
      const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) throw new Error('Browser diagnostics unavailable.');
      api.setArcadeSpritePosition('RainbowMeadowScene', 'world-player-unicorn', targetX, targetY);
    },
    { targetX: x, targetY: y },
  );
}

async function waitForActiveScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((key) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(key) === true;
  }, sceneKey);
}

async function dragDiscToReceiver(page: Page): Promise<void> {
  const scene = await snapshotScene(page, 'RainbowDiscActivityScene');
  const disc = scene.objects.find(
    ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:disc' && effectiveVisible,
  );
  const receiver = scene.objects.find(
    ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:receiver:1' && effectiveVisible,
  );
  if (!disc || !receiver) {
    throw new Error('Rainbow Disc throw objects are unavailable.');
  }

  await page.mouse.move(disc.x, disc.y);
  await page.mouse.down();
  await page.mouse.move(receiver.x, receiver.y, { steps: 8 });
  await page.mouse.up();
}

test('H4.9 Rainbow Disc lawn is alive before interaction and returns cleanly after a score', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForActiveScene(page, 'RainbowMeadowScene');

  await page.waitForFunction(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const meadow = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    return meadow?.objects.some(
      ({ name, effectiveVisible }) => name === 'rainbow-disc:ambient-disc' && effectiveVisible,
    );
  });

  const meadow = await snapshotScene(page, 'RainbowMeadowScene');
  const fieldPlayers = meadow.objects.filter(
    ({ name, effectiveVisible }) => name.startsWith('rainbow-disc:player:') && effectiveVisible,
  );
  expect(fieldPlayers).toHaveLength(5);

  const widths = fieldPlayers.map(({ displayWidth }) => displayWidth);
  const heights = fieldPlayers.map(({ displayHeight }) => displayHeight);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);

  const initialPositions = new Map(fieldPlayers.map(({ name, x, y }) => [name, { x, y }] as const));
  await page.waitForTimeout(1200);
  const movingMeadow = await snapshotScene(page, 'RainbowMeadowScene');
  const movedPlayers = movingMeadow.objects
    .filter(
      ({ name, effectiveVisible }) => name.startsWith('rainbow-disc:player:') && effectiveVisible,
    )
    .filter(({ name, x, y }) => {
      const initial = initialPositions.get(name);
      if (!initial) return false;
      return Math.hypot(x - initial.x, y - initial.y) >= 10;
    });
  expect(movedPlayers.length).toBeGreaterThanOrEqual(3);
  expect(
    meadow.objects.some(
      ({ name, effectiveVisible }) => name === 'rainbow-disc:lawn' && effectiveVisible,
    ),
  ).toBe(true);
  const sign = meadow.objects.find(
    ({ name, effectiveVisible }) => name === 'rainbow-disc:sign' && effectiveVisible,
  );
  expect(sign).toBeDefined();
  expect(sign?.y ?? 9999).toBeLessThan(1200);
  expect((sign?.x ?? 0) + (sign?.displayWidth ?? 0) / 2).toBeLessThan(760);

  const ambientDisc = meadow.objects.find(
    ({ name, effectiveVisible }) => name === 'rainbow-disc:ambient-disc' && effectiveVisible,
  );
  expect(ambientDisc?.type).toBe('Graphics');
  expect(
    meadow.objects.some(
      ({ name, effectiveVisible }) => name === 'rainbow-disc:practice-range' && effectiveVisible,
    ),
  ).toBe(true);
  expect(
    meadow.objects.some(
      ({ name, effectiveVisible }) => name === 'rainbow-disc:practice-sign' && effectiveVisible,
    ),
  ).toBe(true);

  for (let index = 0; index < 4; index += 1) {
    const post = meadow.objects.find(({ name }) => name === `rainbow-disc:pennant-post:${index}`);
    const pennant = meadow.objects.find(({ name }) => name === `rainbow-disc:pennant:${index}`);
    expect(post).toBeDefined();
    expect(pennant).toBeDefined();
    expect(pennant?.x).toBeCloseTo(post?.x ?? 0, 0);
    expect(pennant?.y).toBeCloseTo((post?.y ?? 0) - 35, 0);
  }

  await setMeadowPlayerPosition(page, 505, 1475);
  await expect
    .poll(async () => {
      const current = await snapshotScene(page, 'RainbowMeadowScene');
      return current.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt' && effectiveVisible,
      );
    })
    .toBe(true);

  await page.keyboard.press('E');
  await waitForActiveScene(page, 'RainbowDiscActivityScene');

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
          .__UNICORN_VALLEY_DIAGNOSTICS__;
        return api?.snapshot().health.scenes.find(({ key }) => key === 'RainbowMeadowScene')
          ?.lifecycleState;
      }),
    )
    .toBe('paused');

  for (let pass = 0; pass < 3; pass += 1) {
    await dragDiscToReceiver(page);
    if (pass < 2) {
      const expectedFilled = '●'.repeat(pass + 1);
      await expect
        .poll(async () => {
          const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
          return activity.objects.some(
            ({ text, effectiveVisible }) =>
              effectiveVisible && text?.includes(`Catch chain: ${expectedFilled}`) === true,
          );
        })
        .toBe(true);
      await page.waitForTimeout(520);
    }
  }

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:result' && effectiveVisible,
      );
    })
    .toBe(true);

  await page.keyboard.press('Escape');
  await waitForActiveScene(page, 'RainbowMeadowScene');
});



test('H4.9B practice range launches a five-throw target challenge', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForActiveScene(page, 'RainbowMeadowScene');

  await setMeadowPlayerPosition(page, 1160, 1510);
  await expect
    .poll(async () => {
      const current = await snapshotScene(page, 'RainbowMeadowScene');
      return current.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt' && effectiveVisible,
      );
    })
    .toBe(true);

  await page.keyboard.press('E');
  await waitForActiveScene(page, 'RainbowDiscActivityScene');

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ text, effectiveVisible }) =>
          effectiveVisible && text === 'Rainbow Disc Practice',
      );
    })
    .toBe(true);

  const activityStart = await snapshotScene(page, 'RainbowDiscActivityScene');
  expect(
    activityStart.objects.some(
      ({ name, effectiveVisible }) =>
        name === 'rainbow-disc-activity:practice-targets' && effectiveVisible,
    ),
  ).toBe(true);
  expect(
    activityStart.objects.find(
      ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:disc' && effectiveVisible,
    )?.type,
  ).toBe('Graphics');

  for (let throwIndex = 0; throwIndex < 5; throwIndex += 1) {
    const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
    const disc = activity.objects.find(
      ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:disc' && effectiveVisible,
    );
    if (!disc) throw new Error('Practice disc is unavailable.');

    await page.mouse.move(disc.x, disc.y);
    await page.mouse.down();
    await page.mouse.move(960, 370, { steps: 8 });
    await page.mouse.up();

    if (throwIndex < 4) {
      await page.waitForTimeout(520);
    }
  }

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ text, effectiveVisible }) =>
          effectiveVisible && text === 'PRACTICE COMPLETE!',
      );
    })
    .toBe(true);

  await page.keyboard.press('Escape');
  await waitForActiveScene(page, 'RainbowMeadowScene');
});
