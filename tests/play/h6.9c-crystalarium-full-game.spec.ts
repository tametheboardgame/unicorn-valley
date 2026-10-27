import { expect, test, type Page } from '@playwright/test';
import { createDefaultSave } from '../../src/game/save/createDefaultSave';
import {
  createCrystalariumFullState,
  type CrystalariumFullState,
} from '../../src/game/minigames/crystalarium/CrystalariumFullRules';
import { CRYSTAL_BROOK_CRYSTALARIUM_NURSERY } from '../../src/game/world/CrystalBrookMap';
import {
  clickNamedObject,
  dragNamedObjectTo,
  getDiagnosticSnapshot,
  openDiagnostics,
  setArcadeSpritePosition,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

const SCENE = 'CrystalariumActivityScene';
const SANDBOX_KEY = 'unicorn-valley:just-games:crystalarium:v1';

async function enterResonanceGarden(page: Page): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await openDiagnostics(page);
  await waitForScene(page, 'TitleScene');
  await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
  await waitForScene(page, 'JustGamesScene');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-card:crystalarium');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-variant:resonance-patterns');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
  await waitForNamedObject(page, SCENE, 'crystalarium-full-cell:0');
}

async function fullBoardSnapshot(page: Page) {
  const snapshot = await getDiagnosticSnapshot(page);
  const scene = snapshot.scenes.find((candidate) => candidate.key === SCENE);
  if (!scene) throw new Error('Full Crystalarium scene not active');
  return scene;
}

test.describe('H6.9C first complete playable Crystalarium visual evidence', () => {
  test('desktop board, source, shelf and controls remain visible', async ({ page }, testInfo) => {
    await enterResonanceGarden(page);
    const scene = await fullBoardSnapshot(page);
    expect(scene.objects.filter((o) => o.name.startsWith('crystalarium-full-cell:'))).toHaveLength(
      42,
    );
    for (const name of [
      'crystalarium-full-grow',
      'crystalarium-full-sound',
      'crystalarium-full-offer',
      'crystalarium-full-harmony',
      'crystalarium-full-polish',
      'crystalarium-full-shelve',
      'crystalarium-full-wash',
      'crystalarium-full-fresh',
      'crystalarium-full-exit',
    ]) {
      expect(scene.objects.some((o) => o.name === name && o.visible && o.interactive)).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath('h6.9c-desktop-board.png'), fullPage: true });
  });

  test('quiet play, confirmed wash and fresh board do not change adventure data', async ({
    page,
  }) => {
    await enterResonanceGarden(page);
    await clickNamedObject(page, SCENE, 'crystalarium-full-sound');
    expect((await fullBoardSnapshot(page)).objects.some((o) => o.text === 'Sound: Off')).toBe(true);

    await clickNamedObject(page, SCENE, 'crystalarium-full-cell:0');
    await clickNamedObject(page, SCENE, 'crystalarium-full-wash');
    await clickNamedObject(page, SCENE, 'crystalarium-full-wash');
    const washed = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      SANDBOX_KEY,
    );
    expect(washed.washes).toBe(1);
    expect(washed.cells[0]).toBeNull();

    await clickNamedObject(page, SCENE, 'crystalarium-full-fresh');
    await clickNamedObject(page, SCENE, 'crystalarium-full-fresh');
    const fresh = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      SANDBOX_KEY,
    );
    expect(fresh.cells.filter(Boolean)).toHaveLength(2);
    expect(fresh.washes).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
  });
});

test('H6.9C8 desktop carries crystals through merge, shelf and explicit return socket', async ({
  page,
}) => {
  await enterResonanceGarden(page);
  await dragNamedObjectTo(page, SCENE, 'crystalarium-full-cell:0', 264, 209);
  const merged = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SANDBOX_KEY,
  );
  expect(merged.merges).toBe(1);
  expect(merged.cells[1].tier).toBe(1);
  await dragNamedObjectTo(page, SCENE, 'crystalarium-full-cell:1', 748, 567);
  const shelved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SANDBOX_KEY,
  );
  expect(shelved.shelf[0].tier).toBe(1);
  await dragNamedObjectTo(page, SCENE, 'crystalarium-full-shelf:0', 512, 209);
  const restored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SANDBOX_KEY,
  );
  expect(restored.cells[5].tier).toBe(1);
  expect(restored.shelf[0]).toBeNull();
});

test('H6.9C10 desktop rejects mismatched drops without losing progress', async ({ page }) => {
  await enterResonanceGarden(page);
  await dragNamedObjectTo(page, SCENE, 'crystalarium-full-cell:0', 264, 209);
  await clickNamedObject(page, SCENE, 'crystalarium-full-grow');
  const before = await page.evaluate((key) => localStorage.getItem(key), SANDBOX_KEY);
  await dragNamedObjectTo(page, SCENE, 'crystalarium-full-cell:0', 264, 209);
  expect(await page.evaluate((key) => localStorage.getItem(key), SANDBOX_KEY)).toBe(before);
  await clickNamedObject(page, SCENE, 'crystalarium-full-offer');
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}').completed,
      SANDBOX_KEY,
    ),
  ).toBe(1);
});

test.describe('H6.9C landscape touch evidence', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });
  test('shows the game board on phone landscape without hiding the playable scene', async ({
    page,
  }, testInfo) => {
    await enterResonanceGarden(page);
    const scene = await fullBoardSnapshot(page);
    expect(
      scene.objects.filter((o) => o.name.startsWith('crystalarium-full-cell:') && o.visible),
    ).toHaveLength(42);
    await page.screenshot({
      path: testInfo.outputPath('h6.9c-phone-landscape.png'),
      fullPage: true,
    });
  });
});

test.describe('H6.9C portrait touch evidence', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('preserves a playable board and return action in portrait orientation', async ({
    page,
  }, testInfo) => {
    await enterResonanceGarden(page);
    const scene = await fullBoardSnapshot(page);
    expect(
      scene.objects.filter((o) => o.name.startsWith('crystalarium-full-cell:') && o.visible),
    ).toHaveLength(42);
    const portrait = page.getByRole('region', { name: 'Crystalarium Resonance Garden' });
    await expect(portrait).toBeVisible();
    const tiles = portrait.locator('[data-crystalarium-cell]');
    await expect(tiles).toHaveCount(42);
    const first = tiles.first();
    const bounds = await first.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(48);
    expect(bounds?.height).toBeGreaterThanOrEqual(48);
    const initial = await portrait.boundingBox();
    expect(initial?.width).toBeLessThanOrEqual(390);
    await page.screenshot({
      path: testInfo.outputPath('h6.9c-phone-portrait.png'),
      fullPage: true,
    });

    await portrait.locator('[data-crystalarium-cell="0"]').click();
    await portrait.locator('[data-crystalarium-cell="1"]').click();
    const offer = portrait.locator('[data-crystalarium-action="offer"]');
    await expect(offer).toBeEnabled();
    await offer.click();
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').completed,
        SANDBOX_KEY,
      ),
    ).toBe(1);
    await portrait.locator('[data-crystalarium-action="exit"]').click();
    await waitForScene(page, 'JustGamesScene');
    await expect(portrait).toHaveCount(0);
  });
});

test.describe('H6.9C9 illustrated first-play guidance', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('teaches accepted actions, allows replay and keeps the adventure save untouched', async ({
    page,
  }) => {
    await enterResonanceGarden(page);
    const region = page.getByRole('region', { name: 'Crystalarium Resonance Garden' });
    const step = region.locator('[data-crystalarium-guide]');
    await expect(step).toHaveAttribute('data-crystalarium-guide', 'grow');
    await expect(region.locator('[data-crystalarium-action="grow"]')).toHaveClass(/is-guide-focus/);
    await region.locator('[data-crystalarium-action="grow"]').click();
    await expect(step).toHaveAttribute('data-crystalarium-guide', 'merge');
    await expect(region.locator('.crystalarium-portrait-grid')).toHaveClass(/is-guide-focus/);
    await region.locator('[data-crystalarium-cell="0"]').click();
    await region.locator('[data-crystalarium-cell="1"]').click();
    await expect(step).toHaveAttribute('data-crystalarium-guide', 'offer');
    await expect(region.locator('[data-crystalarium-action="offer"]')).toHaveClass(
      /is-guide-focus/,
    );
    await region.locator('[data-crystalarium-action="offer"]').click();
    await expect(step).toHaveAttribute('data-crystalarium-guide', 'hidden');
    expect(
      await page.evaluate(() =>
        localStorage.getItem('unicorn-valley:crystalarium:guide:just-games:v1'),
      ),
    ).toBe('seen');
    expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
    await region.locator('[data-crystalarium-action="guide"]').click();
    await expect(step).toHaveAttribute('data-crystalarium-guide', 'explore');
    await region.locator('[data-crystalarium-action="guide"]').click();
    await expect(step).toHaveAttribute('data-crystalarium-guide', 'hidden');
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').completed,
        SANDBOX_KEY,
      ),
    ).toBe(1);
  });
});

test.describe('H6.9C native-to-canvas rotation contract', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('changes presentation on rotation and restores a functioning portrait Leave', async ({
    page,
  }) => {
    await enterResonanceGarden(page);
    const portrait = page.getByRole('region', { name: 'Crystalarium Resonance Garden' });
    await expect(portrait).toBeVisible();

    await page.setViewportSize({ width: 844, height: 390 });
    await expect(portrait).toBeHidden();
    expect(
      (await fullBoardSnapshot(page)).objects.filter((o) =>
        o.name.startsWith('crystalarium-full-cell:'),
      ),
    ).toHaveLength(42);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(portrait).toBeVisible();
    await portrait.locator('[data-crystalarium-action="exit"]').click();
    await waitForScene(page, 'JustGamesScene');
    await expect(portrait).toHaveCount(0);
  });
});

test('H6.9C10 consecutive visual offerings unlock the next goal', async ({ page }) => {
  await enterResonanceGarden(page);
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:1');
  await clickNamedObject(page, SCENE, 'crystalarium-full-offer');
  let state = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SANDBOX_KEY,
  );
  expect(state.completed).toBe(1);
  expect(state.offers).toBe(1);
  // Pattern two needs two identical tier-one crystals, with no hidden charge or timer.
  await clickNamedObject(page, SCENE, 'crystalarium-full-grow');
  await clickNamedObject(page, SCENE, 'crystalarium-full-grow');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:1');
  await clickNamedObject(page, SCENE, 'crystalarium-full-grow');
  await clickNamedObject(page, SCENE, 'crystalarium-full-grow');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:2');
  await clickNamedObject(page, SCENE, 'crystalarium-full-offer');
  state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SANDBOX_KEY);
  expect(state.completed).toBe(2);
  expect(state.offers).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
});

// Keep the return/resume contract independently covered without packing both
// consecutive crafting and scene re-entry into Playwright's 45-second budget.
test('H6.9C10 an offered pattern survives leaving and restarting Just Games', async ({ page }) => {
  await enterResonanceGarden(page);
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:1');
  await clickNamedObject(page, SCENE, 'crystalarium-full-offer');
  await clickNamedObject(page, SCENE, 'crystalarium-full-exit');
  await waitForScene(page, 'JustGamesScene');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-card:crystalarium');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-variant:resonance-patterns');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
  await waitForNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  const resumed = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SANDBOX_KEY,
  );
  expect(resumed.completed).toBe(1);
  expect(resumed.offers).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
});

test('H6.9C Crystal Brook nursery saves world progress and returns without reopening the Grotto', async ({
  page,
}) => {
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), {
    key: 'unicorn-valley.save',
    save: createDefaultSave('2026-10-24T11:00:00.000Z'),
  });
  await openDiagnostics(page, '/?scene=brook&diagnostics=1');
  await waitForScene(page, 'CrystalBrookScene');
  await setArcadeSpritePosition(
    page,
    'CrystalBrookScene',
    'world-player-unicorn',
    CRYSTAL_BROOK_CRYSTALARIUM_NURSERY.x,
    CRYSTAL_BROOK_CRYSTALARIUM_NURSERY.y + 50,
  );
  await expect
    .poll(async () => {
      const snapshot = await getDiagnosticSnapshot(page);
      return snapshot.scenes
        .find((s) => s.key === 'CrystalBrookScene')
        ?.objects.find((o) => o.name === 'exploration-tablet-hint' && o.visible)?.text;
    })
    .toBe('Crystalarium Nursery');

  await page.keyboard.press('KeyE');
  await waitForNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:1');
  await clickNamedObject(page, SCENE, 'crystalarium-full-offer');

  const save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}'),
  );
  expect(save.activities.crystalarium.completed).toBe(1);
  expect(save.world.flags['flag:r6-crystal-grotto-open']).not.toBe(true);
  expect(
    await page.evaluate(() => localStorage.getItem('unicorn-valley:just-games:crystalarium:v1')),
  ).toBeNull();

  await clickNamedObject(page, SCENE, 'crystalarium-full-exit');
  await waitForScene(page, 'CrystalBrookScene');
});

test('H6.9C6 Crystal Grotto altar launches and returns to the cave, keeping adventure saves', async ({
  page,
}) => {
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), {
    key: 'unicorn-valley.save',
    save: createDefaultSave('2026-10-27T12:00:00.000Z'),
  });
  await openDiagnostics(page);
  await page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { startScene(sceneKey: string): void };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    api?.startScene('CrystalGrottoScene');
  });
  await waitForScene(page, 'CrystalGrottoScene');
  await waitForNamedObject(page, 'CrystalGrottoScene', 'crystal-grotto:crystalarium-altar');
  await setArcadeSpritePosition(page, 'CrystalGrottoScene', 'world-player-unicorn', 1090, 205);
  await expect
    .poll(async () => {
      const snapshot = await getDiagnosticSnapshot(page);
      return snapshot.scenes
        .find((scene) => scene.key === 'CrystalGrottoScene')
        ?.objects.find((o) => o.name === 'exploration-tablet-hint' && o.visible)?.text;
    })
    .toBe('Crystalarium Altar');
  await page.keyboard.press('KeyE');
  await waitForNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:1');
  await clickNamedObject(page, SCENE, 'crystalarium-full-offer');
  const save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('unicorn-valley.save') ?? '{}'),
  );
  expect(save.activities.crystalarium.completed).toBe(1);
  expect(save.world.flags['flag:r6-crystal-grotto-open']).not.toBe(true);
  await clickNamedObject(page, SCENE, 'crystalarium-full-exit');
  await waitForScene(page, 'CrystalGrottoScene');
  expect(
    (await getDiagnosticSnapshot(page)).scenes
      .find((scene) => scene.key === 'CrystalGrottoScene')
      ?.objects.some((obj) => obj.name === 'crystal-grotto:bright-crystal'),
  ).toBe(true);
});

test.describe('H6.9C8 native touch and mouse carrying', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('physically merges pieces, shelves one and returns it to an explicit socket', async ({
    page,
  }) => {
    await enterResonanceGarden(page);
    const region = page.locator('[data-crystalarium-portrait="true"]');
    // No floating status/shelf layer may intercept an occupied first-row crystal.
    for (const index of [0, 1]) {
      const selector = '[data-crystalarium-cell="' + index + '"]';
      const crystal = region.locator(selector);
      const bounds = await crystal.boundingBox();
      if (!bounds) throw new Error('Crystal must have a visible hit area');
      const hit = await page.evaluate(
        ({ x, y }) =>
          document
            .elementFromPoint(x, y)
            ?.closest('[data-crystalarium-cell]')
            ?.getAttribute('data-crystalarium-cell'),
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
      );
      expect(hit).toBe(String(index));
    }
    const drag = async (source: string, target: string) => {
      const from = await region.locator(source).boundingBox();
      const to = await region.locator(target).boundingBox();
      if (!from || !to) throw new Error('Missing draggable Crystalarium control');
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
      await page.mouse.up();
    };
    await drag('[data-crystalarium-cell="0"]', '[data-crystalarium-cell="1"]');
    const afterMerge = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      SANDBOX_KEY,
    );
    expect(afterMerge.merges).toBe(1);
    expect(afterMerge.cells[0]).toBeNull();
    expect(afterMerge.cells[1].tier).toBe(1);
    // Recipes and physical pieces must share the exact illustrated tier identity.
    await expect(region.locator('[data-crystalarium-cell="1"] [data-crystal-art]')).toHaveAttribute(
      'data-crystal-art',
      'low-tier-1',
    );
    await expect(
      region.locator('.crystalarium-portrait-goal [data-crystal-art]').first(),
    ).toHaveAttribute('data-crystal-art', 'low-tier-1');
    await drag('[data-crystalarium-cell="1"]', '[data-crystalarium-action="shelf-0"]');
    const afterShelf = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      SANDBOX_KEY,
    );
    expect(afterShelf.shelf[0].tier).toBe(1);
    expect(afterShelf.cells[1]).toBeNull();
    await drag('[data-crystalarium-action="shelf-0"]', '[data-crystalarium-cell="5"]');
    const restored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      SANDBOX_KEY,
    );
    expect(restored.cells[5].tier).toBe(1);
    expect(restored.shelf[0]).toBeNull();
  });
});

test.describe('H6.9C8 invalid portrait drop protection', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('marks valid and blocked drops and preserves crystals after an incompatible merge', async ({
    page,
  }) => {
    await enterResonanceGarden(page);
    const region = page.locator('[data-crystalarium-portrait="true"]');
    const first = region.locator('[data-crystalarium-cell="0"]');
    const second = region.locator('[data-crystalarium-cell="1"]');
    const drag = async () => {
      const from = await first.boundingBox();
      const to = await second.boundingBox();
      if (!from || !to) throw new Error('Missing Crystalarium drag targets');
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    };
    await drag();
    await expect(second).toHaveAttribute('data-crystalarium-drop', 'valid');
    await page.mouse.up();
    await region.locator('[data-crystalarium-action="grow"]').click();
    const savedBeforeInvalidDrop = await page.evaluate(
      (key) => localStorage.getItem(key),
      SANDBOX_KEY,
    );
    await drag();
    await expect(second).toHaveAttribute('data-crystalarium-drop', 'blocked');
    await expect(region.locator('[data-crystalarium-cell="2"]')).toHaveAttribute(
      'data-crystalarium-drop',
      'valid',
    );
    await page.mouse.up();
    expect(await page.evaluate((key) => localStorage.getItem(key), SANDBOX_KEY)).toBe(
      savedBeforeInvalidDrop,
    );
    await expect(region.locator('[data-crystalarium-drop]')).toHaveCount(0);
  });
});

test.describe('H6.9C narrow portrait touch acceptance', () => {
  test.use({ viewport: { width: 320, height: 700 }, hasTouch: true });
  test('retains real-size scrollable sockets, readable actions and a saved return', async ({
    page,
  }, testInfo) => {
    await enterResonanceGarden(page);
    const portrait = page.locator('[data-crystalarium-portrait="true"]');
    await expect(portrait).toBeVisible();
    const grid = portrait.locator('.crystalarium-portrait-grid');
    const cell = portrait.locator('[data-crystalarium-cell="0"]');
    await expect(cell).toBeVisible();
    const bounds = await cell.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(48);
    expect(bounds?.height).toBeGreaterThanOrEqual(48);
    // A passing hit-target test is insufficient if the dock visually covers
    // the entire first row. On the first screen a new player must see one row.
    const dockBounds = await portrait.locator('.crystalarium-portrait-shelf').boundingBox();
    if (!bounds || !dockBounds) throw new Error('Missing board or shelf on narrow portrait');
    expect(bounds.y + bounds.height).toBeLessThan(dockBounds.y);
    const scroll = await portrait
      .locator('.crystalarium-portrait-board-scroll')
      .evaluate((node) => node.scrollWidth > node.clientWidth);
    expect(scroll).toBe(true);
    await expect(portrait.locator('.crystalarium-portrait-scroll-cue')).toContainText(
      'Swipe sideways',
    );
    await expect(grid.locator('button')).toHaveCount(42);
    await page.screenshot({
      path: testInfo.outputPath('h6.9c-narrow-portrait.png'),
      fullPage: true,
    });
    const scroller = portrait.locator('.crystalarium-portrait-board-scroll');
    await scroller.evaluate((node) => {
      node.scrollLeft = node.scrollWidth - node.clientWidth;
    });
    const rightmostScroll = await scroller.evaluate((node) => node.scrollLeft);
    expect(rightmostScroll).toBeGreaterThan(0);
    await portrait.locator('[data-crystalarium-action="grow"]').click();
    expect(await scroller.evaluate((node) => node.scrollLeft)).toBe(rightmostScroll);
    await portrait.locator('[data-crystalarium-cell="6"]').click();
    expect(await scroller.evaluate((node) => node.scrollLeft)).toBe(rightmostScroll);
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').cells.filter(Boolean).length,
        SANDBOX_KEY,
      ),
    ).toBe(3);
    await portrait.locator('[data-crystalarium-action="exit"]').click();
    await waitForScene(page, 'JustGamesScene');
  });
});

test.describe('H6.9C10 final-chapter 320px experience', () => {
  test.use({ viewport: { width: 320, height: 700 }, hasTouch: true });

  test('shows three rare recipes and completes the Symphony without ending free play', async ({
    page,
  }, testInfo) => {
    await enterResonanceGarden(page);
    const portrait = page.locator('[data-crystalarium-portrait="true"]');
    await portrait.locator('[data-crystalarium-action="exit"]').click();
    await waitForScene(page, 'JustGamesScene');

    // A structurally valid endgame save is injected only into isolated Just Games
    // for late-UI coverage; the 50-pattern legal-action run is independently
    // covered by CrystalariumCampaignSolvability.test.ts.
    const cells: CrystalariumFullState['cells'][number][] = Array.from({ length: 42 }, () => null);
    cells[0] = { family: 'low', tier: 5 };
    cells[1] = { family: 'bright', tier: 5 };
    cells[2] = { family: 'bell', tier: 5 };
    const seeded: CrystalariumFullState = {
      ...createCrystalariumFullState(),
      cells,
      completed: 49,
      harmonies: 3,
      selectedFamily: 'bell',
      discovered: ['low:0', 'low:5', 'bright:5', 'bell:5'],
    };
    await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [
      SANDBOX_KEY,
      seeded,
    ] as const);
    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:crystalarium');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-variant:resonance-patterns');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
    await waitForNamedObject(page, SCENE, 'crystalarium-full-cell:0');
    await expect(portrait).toBeVisible();
    await expect(portrait.locator('.crystalarium-portrait-pattern-title')).toHaveText(
      'Crystalarium Symphony',
    );
    const finalChapterLabel = portrait.locator('.crystalarium-portrait-eyebrow');
    await expect(finalChapterLabel).toHaveText('Great Harmonic Garden • 50 of 50');
    const labelBounds = await finalChapterLabel.boundingBox();
    expect(labelBounds?.height).toBeLessThan(25);
    await expect(portrait.locator('.crystalarium-portrait-goal')).toHaveCount(3);
    for (const [index, family] of ['low', 'bright', 'bell'].entries()) {
      await expect(
        portrait.locator('.crystalarium-portrait-goal [data-crystal-art]').nth(index),
      ).toHaveAttribute('data-crystal-art', family + '-tier-5');
    }
    const first = await portrait.locator('[data-crystalarium-cell="0"]').boundingBox();
    const dock = await portrait.locator('.crystalarium-portrait-shelf').boundingBox();
    if (!first || !dock) throw new Error('Finale board or safe shelf not visible');
    expect(first.y + first.height).toBeLessThan(dock.y);
    await page.screenshot({
      path: testInfo.outputPath('h6.9c-final-chapter-320.png'),
      fullPage: true,
    });

    await portrait.locator('[data-crystalarium-action="offer"]').click();
    await expect(portrait.locator('.crystalarium-portrait-pattern-title')).toHaveText(
      'Crystalarium Symphony complete',
    );
    const completed = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      SANDBOX_KEY,
    );
    expect(completed.completed).toBe(50);
    expect(completed.offers).toBe(1);
    expect(completed.harmonies).toBe(0);
    await portrait.locator('[data-crystalarium-action="grow-refined"]').click();
    const freePlay = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      SANDBOX_KEY,
    );
    expect(freePlay.completed).toBe(50);
    expect(freePlay.cells[0]).toEqual({ family: 'bell', tier: 2 });
    expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
  });
});
