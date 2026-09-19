import { expect, test, type Page } from '@playwright/test';

interface ObjectSnapshot {
  name: string;
  text: string | null;
  x: number;
  y: number;
  bodyWidth: number | null;
  bodyHeight: number | null;
  interactive: boolean;
  visible: boolean;
}
interface SceneSnapshot {
  key: string;
  objects: ObjectSnapshot[];
}
interface Snapshot {
  activeScenes: string[];
  scenes: SceneSnapshot[];
}
interface Diagnostics {
  snapshot(): Snapshot;
  startScene(key: string, data?: object): void;
  setArcadeSpritePosition(key: string, objectName: string, x: number, y: number): void;
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

async function startScene(page: Page, key: string): Promise<void> {
  await page.waitForFunction(
    () =>
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .activeScenes.includes('TitleScene'),
    undefined,
    { timeout: 10_000 },
  );
  await page.evaluate((sceneKey) => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(sceneKey);
  }, key);
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual([key]);
}

async function setPlayerPosition(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ playerX, playerY }) =>
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
        'CottageInteriorScene',
        'world-player-unicorn',
        playerX,
        playerY,
      ),
    { playerX: x, playerY: y },
  );
}

test('H2.9 binds the strange egg and its hatch flow to the canonical cottage nest', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');

  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}');
    save.world.flags['flag:pip-strange-egg-found'] = true;
    save.collections.memoryIds = Array.from(
      new Set([...(save.collections.memoryIds ?? []), 'memory:pip-egg:pending-growth']),
    );
    const serialised = JSON.stringify(save);
    localStorage.setItem('unicorn-valley.save', serialised);
    localStorage.setItem(`unicorn-valley.save.schema.${save.schemaVersion}`, serialised);
  });

  await expect
    .poll(async () => {
      const cottage = scene(await snapshot(page), 'CottageInteriorScene');
      const egg = cottage.objects.find(({ name }) => name === 'cottage-story:egg-nest:found');
      const blocker = cottage.objects.find(({ name }) => name === 'pip-egg-collider:cottage');
      return egg && blocker
        ? {
            egg: { x: egg.x, y: egg.y },
            blocker: { width: blocker.bodyWidth, height: blocker.bodyHeight },
          }
        : null;
    })
    .toEqual({
      egg: { x: 420, y: 900 },
      blocker: { width: 70, height: 36 },
    });

  await setPlayerPosition(page, 520, 885);
  await page.waitForTimeout(100);
  await page.keyboard.press('e');

  await expect
    .poll(async () =>
      scene(await snapshot(page), 'CottageInteriorScene').objects.some(
        ({ name }) => name === 'cottage-story:egg-nest:warm',
      ),
    )
    .toBe(true);

  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}');
    save.collections.memoryIds = Array.from(
      new Set([
        ...(save.collections.memoryIds ?? []).filter(
          (id: string) => id !== 'memory:pip-egg:pending-growth',
        ),
        'memory:pip-egg:stage-cracking',
        'memory:pip-egg:pending-growth',
      ]),
    );
    const serialised = JSON.stringify(save);
    localStorage.setItem('unicorn-valley.save', serialised);
    localStorage.setItem(`unicorn-valley.save.schema.${save.schemaVersion}`, serialised);
  });

  await expect
    .poll(async () =>
      scene(await snapshot(page), 'CottageInteriorScene').objects.some(
        ({ name }) => name === 'cottage-story:egg-nest:cracking',
      ),
    )
    .toBe(true);

  await setPlayerPosition(page, 520, 885);
  await page.waitForTimeout(100);
  await page.keyboard.press('e');

  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual(['PipEggHatchScene']);

  await page.waitForTimeout(1_400);
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Canvas unavailable');
  await page.mouse.click(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['CottageInteriorScene']);

  const flags = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}');
    return save.world.flags;
  });
  expect(flags['flag:pip-strange-egg-hatch-ready']).toBe(false);
  expect(flags['flag:companion-luma-hatched']).toBe(true);
});

test('H2.9 uses the smaller detailed strange egg with collision in Moonflower Glade', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');

  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}');
    save.collections.discoveryIds = Array.from(
      new Set([...(save.collections.discoveryIds ?? []), 'discovery:moonflower-sparkle']),
    );
    save.world.uniqueDiscoveryIds = Array.from(
      new Set([...(save.world.uniqueDiscoveryIds ?? []), 'discovery:moonflower-sparkle']),
    );
    save.world.flags['flag:pip-intro-appeared'] = true;
    save.world.flags['flag:pip-welcome-complete'] = true;
    save.quests.byQuestId['quest:pips-strange-egg'] = {
      status: 'active',
      currentStepId: 'quest-step:pips-strange-egg:4',
      completedAt: null,
    };
    const serialised = JSON.stringify(save);
    localStorage.setItem('unicorn-valley.save', serialised);
    localStorage.setItem(`unicorn-valley.save.schema.${save.schemaVersion}`, serialised);
  });

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene('MoonflowerGladeScene');
  });
  await expect.poll(async () => (await snapshot(page)).activeScenes).toEqual(['MoonflowerGladeScene']);

  await expect
    .poll(async () => {
      const glade = scene(await snapshot(page), 'MoonflowerGladeScene');
      const egg = glade.objects.find(
        ({ name }) => name === 'pip-trail:interaction:pip-strange-egg',
      );
      const art = glade.objects.find(({ name }) => name === 'pip-egg-art:found');
      const blocker = glade.objects.find(({ name }) => name === 'pip-egg-collider:glade');
      return egg && art && blocker
        ? {
            egg: { x: egg.x, y: egg.y },
            artVisible: art.visible,
            blocker: { width: blocker.bodyWidth, height: blocker.bodyHeight },
          }
        : null;
    })
    .toEqual({
      egg: { x: 2075, y: 1260 },
      artVisible: true,
      blocker: { width: 66, height: 34 },
    });
});

test('H2.9 reserves an inert architectural bay for future portal content', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');

  await expect
    .poll(async () => {
      const bay = scene(await snapshot(page), 'CottageInteriorScene').objects.find(
        ({ name }) => name === 'cottage-story:future-portal-bay',
      );
      return bay ? { x: bay.x, y: bay.y, interactive: bay.interactive } : null;
    })
    .toEqual({ x: 1280, y: 530, interactive: false });

  const cottage = scene(await snapshot(page), 'CottageInteriorScene');
  expect(
    cottage.objects.some(
      ({ name, interactive }) =>
        name.includes('portal') && name !== 'cottage-story:future-portal-bay' && interactive,
    ),
  ).toBe(false);
});
