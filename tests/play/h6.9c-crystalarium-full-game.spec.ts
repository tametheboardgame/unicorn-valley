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

async function enterResonanceGarden(page: Page, teach = false): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await openDiagnostics(page);
  await waitForScene(page, 'TitleScene');
  await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
  await waitForScene(page, 'JustGamesScene');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-card:crystalarium');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-variant:resonance-patterns');
  // Existing free-play regressions intentionally skip the new first-time lesson.
  // The dedicated C11B scenario below tests it from a completely fresh save.
  if (!teach) {
    await page.evaluate(() =>
      localStorage.setItem('unicorn-valley:crystalarium:guide:just-games:v1', 'seen'),
    );
  }
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
  // C12B moved the physical shelf below the independent Crystal Tools panel.
  await dragNamedObjectTo(page, SCENE, 'crystalarium-full-cell:1', 748, 608);
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

test('H6.9C13A live desktop frame wells grow free shards atomically without losing sockets', async ({
  page,
}) => {
  await enterResonanceGarden(page);
  const scene = await fullBoardSnapshot(page);
  expect(scene.objects.filter((o) => o.name.startsWith('crystalarium-full-cell:'))).toHaveLength(
    42,
  );
  for (const family of ['low', 'bright', 'bell']) {
    expect(
      scene.objects.some((o) => o.name === 'crystalarium-full-producer:' + family && o.visible),
    ).toBe(true);
  }
  const original = await page.evaluate((key) => localStorage.getItem(key), SANDBOX_KEY);
  await clickNamedObject(page, SCENE, 'crystalarium-full-producer:bright');
  expect(await page.evaluate((key) => localStorage.getItem(key), SANDBOX_KEY)).toBe(original);
  await clickNamedObject(page, SCENE, 'crystalarium-full-producer:low');
  const grown = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SANDBOX_KEY,
  );
  expect(grown.cells[2]).toEqual({ family: 'low', tier: 0 });
  expect(grown.cells).toHaveLength(42);
  expect(grown.selectedFamily).toBe('low');
  expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
});

test.describe('H6.9C13A portrait board-frame wells', () => {
  test.use({ viewport: { width: 320, height: 700 }, hasTouch: true });

  test('retains 42 cells and grows from well while locked wells cannot spend', async ({
    page,
  }, testInfo) => {
    await enterResonanceGarden(page);
    const portrait = page.getByRole('region', { name: 'Crystalarium Resonance Garden' });
    const wells = portrait.locator('.crystalarium-portrait-rooted-wells');
    await expect(wells.locator('[data-crystalarium-well]')).toHaveCount(3);
    await expect(portrait.locator('[data-crystalarium-cell]')).toHaveCount(42);
    for (const well of await wells.locator('[data-crystalarium-well]').all()) {
      const rect = await well.boundingBox();
      expect(rect?.height).toBeGreaterThanOrEqual(48);
      expect(rect?.width).toBeGreaterThanOrEqual(48);
    }
    const locked = wells.locator('[data-crystalarium-well="bright"]');
    await expect(locked).toHaveAttribute('data-crystalarium-unlocked', 'false');
    const previous = await page.evaluate((key) => localStorage.getItem(key), SANDBOX_KEY);
    await locked.click();
    expect(await page.evaluate((key) => localStorage.getItem(key), SANDBOX_KEY)).toBe(previous);
    await wells.locator('[data-crystalarium-well="low"]').click();
    await expect(portrait.locator('[data-crystalarium-cell="2"]')).toHaveAttribute(
      'data-family',
      'low',
    );
    const state = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      SANDBOX_KEY,
    );
    expect(state.cells).toHaveLength(42);
    expect(state.cells[2]).toEqual({ family: 'low', tier: 0 });
    await page.screenshot({
      path: testInfo.outputPath('h6.9c13a-live-wells-320.png'),
      fullPage: true,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
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

    const altar = portrait.locator('.crystalarium-portrait-pattern');
    const growing = portrait.locator('.crystalarium-portrait-controls');
    const tools = portrait.locator('.crystalarium-portrait-tools');
    const offer = altar.locator('[data-crystalarium-action="offer"]');
    await expect(altar).toHaveAttribute('data-crystalarium-ready', 'false');
    await expect(offer).toBeDisabled();
    await expect(growing.locator('[data-crystalarium-action="grow"]')).toHaveCount(1);
    await expect(growing.locator('[data-crystalarium-action="offer"]')).toHaveCount(0);
    await expect(tools.locator('[data-crystalarium-action="wash"]')).toHaveCount(1);
    await portrait.locator('[data-crystalarium-cell="0"]').click();
    await portrait.locator('[data-crystalarium-cell="1"]').click();
    await expect(altar).toHaveAttribute('data-crystalarium-ready', 'true');
    await expect(offer).toHaveClass(/is-ready/);
    await expect(offer).toBeEnabled();
    await portrait.locator('[data-crystalarium-menu="pattern"]').click();
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
    await enterResonanceGarden(page, true);
    const region = page.getByRole('region', { name: 'Crystalarium Resonance Garden' });
    const step = region.locator('[data-crystalarium-guide]');
    await expect(step).toHaveAttribute('data-crystalarium-guide', 'grow');
    await expect(region.locator('[data-crystalarium-action="grow"]')).toHaveClass(/is-guide-focus/);
    // Only the spotlighted Grow control can mutate the fresh songbook.
    await expect(region.locator('[data-crystalarium-cell="0"]')).toBeDisabled();
    await expect(region.locator('[data-crystalarium-action="offer"]')).toBeDisabled();
    await region.locator('[data-crystalarium-action="grow"]').click();
    await expect(step).toHaveAttribute('data-crystalarium-guide', 'merge');
    await expect(region.locator('[data-crystalarium-cell="0"]')).toBeDisabled();
    const newShard = region.locator('[data-crystalarium-cell="2"]');
    await expect(newShard).toHaveClass(/is-guide-focus/);
    await expect(newShard).toBeFocused();
    await newShard.click();
    const mergeTarget = region.locator('[data-crystalarium-cell="0"]');
    await expect(mergeTarget).toBeEnabled();
    await expect(mergeTarget).toBeFocused();
    await mergeTarget.click();
    await expect(step).toHaveAttribute('data-crystalarium-guide', 'offer');
    const picturedGoal = region.locator('[data-crystalarium-action="inspect-goal"]');
    await expect(picturedGoal).toBeVisible();
    await expect(picturedGoal).toBeFocused();
    await expect(region.locator('[data-crystalarium-action="offer"]')).toBeDisabled();
    await picturedGoal.click();
    await expect(region.locator('[data-crystalarium-action="offer"]')).toHaveClass(
      /is-guide-focus/,
    );
    await expect(region.locator('[data-crystalarium-action="offer"]')).toBeEnabled();
    await expect(region.locator('[data-crystalarium-action="offer"]')).toBeFocused();
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

test('H6.9C11B desktop first-visit guide enforces real Grow, merge, inspect and Offer', async ({
  page,
}) => {
  await enterResonanceGarden(page, true);
  const before = await page.evaluate((key) => localStorage.getItem(key), SANDBOX_KEY);

  // Disabled non-tutorial controls remain named for browser diagnostics but
  // reject input at the canonical controller, without a save mutation.
  await clickNamedObject(page, SCENE, 'crystalarium-full-harmony');
  expect(await page.evaluate((key) => localStorage.getItem(key), SANDBOX_KEY)).toBe(before);

  await clickNamedObject(page, SCENE, 'crystalarium-full-grow');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:2');
  await clickNamedObject(page, SCENE, 'crystalarium-full-cell:0');
  await waitForNamedObject(page, SCENE, 'crystalarium-full-inspect');
  await clickNamedObject(page, SCENE, 'crystalarium-full-inspect');
  await clickNamedObject(page, SCENE, 'crystalarium-full-offer');

  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}').completed,
      SANDBOX_KEY,
    ),
  ).toBe(1);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('unicorn-valley:crystalarium:guide:just-games:v1'),
    ),
  ).toBe('seen');
  expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
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

  // This scenario verifies world save/return, not the novice lesson; first-time
  // world guidance is checked independently and cannot be bypassed in production.
  await page.evaluate(() =>
    localStorage.setItem('unicorn-valley:crystalarium:guide:world:v1', 'seen'),
  );
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
  // This scenario verifies world save/return, not the novice lesson; first-time
  // world guidance is checked independently and cannot be bypassed in production.
  await page.evaluate(() =>
    localStorage.setItem('unicorn-valley:crystalarium:guide:world:v1', 'seen'),
  );
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
      // Grow now lives below the board; returning to the board must restore
      // its visible viewport before a real mouse/touch drag begins.
      await first.scrollIntoViewIfNeeded();
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
    await region.locator('[data-crystalarium-menu="growing"]').click();
    await region.locator('[data-crystalarium-action="grow"]').click();
    await region.locator('[data-crystalarium-menu="growing"]').click();
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
    await portrait.locator('[data-crystalarium-menu="growing"]').click();
    await portrait.locator('[data-crystalarium-action="grow"]').click();
    await portrait.locator('[data-crystalarium-menu="growing"]').click();
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
    // The isolated 320px finale exercises exit/re-entry, a complete offer and
    // post-campaign refined growth. CI evidence reached its final assertion at
    // the 45s limit: retain every assertion with a bounded end-to-end budget.
    test.setTimeout(90_000);
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
    // The board is the default view even for the 50th pattern. The title and
    // recipe cards belong to the explicitly opened Pattern menu.
    await expect(portrait.locator('.crystalarium-portrait-menu-panel')).toBeHidden();
    await portrait.locator('[data-crystalarium-menu="pattern"]').click();
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
    await page.screenshot({
      path: testInfo.outputPath('h6.9c-final-chapter-pattern-menu-320.png'),
      fullPage: true,
    });
    await portrait.locator('[data-crystalarium-menu="pattern"]').click();
    const first = await portrait.locator('[data-crystalarium-cell="0"]').boundingBox();
    const dock = await portrait.locator('.crystalarium-portrait-shelf').boundingBox();
    if (!first || !dock) throw new Error('Finale board or safe shelf not visible');
    expect(first.y + first.height).toBeLessThan(dock.y);
    await page.screenshot({
      path: testInfo.outputPath('h6.9c-final-chapter-320.png'),
      fullPage: true,
    });

    await portrait.locator('[data-crystalarium-menu="pattern"]').click();
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
    await portrait.locator('[data-crystalarium-menu="growing"]').click();
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

test.describe('H6.9C13A isolated producer-placement visual concept', () => {
  test('compares 42 frame sockets against 39 fixed-cell sockets without game saves', async ({
    page,
  }, testInfo) => {
    await page.goto('/design-previews/crystalarium-c13a-generators.html');
    await expect(page.getByRole('heading', { name: /Where should crystals grow/ })).toBeVisible();
    const board = page.locator('#board');
    const grow = page.locator('#grow');
    const message = page.locator('#message');
    await expect(board.locator('.cell')).toHaveCount(42);
    await expect(page.locator('#space')).toHaveText('42 / 42');
    await expect(page.locator('#frame-sources .root-control')).toHaveCount(3);
    await expect(page.locator('#frame-sources .root-control.locked')).toHaveCount(2);
    await expect(page.locator('#unlocks')).toHaveText('1 / 3');
    await page.screenshot({
      path: testInfo.outputPath('h6.9c13a-frame-desktop.png'),
      fullPage: true,
    });

    // A locked well explains the requirement but cannot grow or change progress.
    await page.locator('#frame-sources .root-control').nth(1).click();
    await expect(page.locator('#total')).toHaveText('2');
    await expect(message).toContainText('unlocks after 4 completed patterns');
    // The rooted on-board Low well produces immediately, without a second click.
    await page.locator('#frame-sources .root-control').first().click();
    await expect(page.locator('#total')).toHaveText('3');
    await expect(message).toContainText('No charges, fluid or timers were used');
    // The comparison's separate Grow action also remains available.
    await grow.click();
    await expect(page.locator('#total')).toHaveText('4');

    await page.locator('#grid-choice').click();
    await expect(page.locator('#space')).toHaveText('39 / 42');
    await expect(board.locator('.cell.occupied-producer')).toHaveCount(3);
    await expect(page.locator('#frame-sources')).toBeHidden();
    await page.screenshot({
      path: testInfo.outputPath('h6.9c13a-three-fixed-cells.png'),
      fullPage: true,
    });

    // B permits direct growth from fixed wells, though it sacrifices three sockets.
    await board.locator('.cell.occupied-producer').first().click();
    await expect(page.locator('#total')).toHaveText('3');
    await page.locator('[data-progress="4"]').click();
    await expect(page.locator('#unlocks')).toHaveText('2 / 3');
    await page.locator('#source-cards .source-card').nth(1).click();
    await expect(grow).toHaveText('✦ Grow free Bright crystal');
    await grow.click();
    await expect(page.locator('#total')).toHaveText('4');

    await page.locator('[data-progress="7"]').click();
    await expect(page.locator('#unlocks')).toHaveText('3 / 3');
    await page.locator('#source-cards .source-card').nth(2).click();
    await expect(grow).toHaveText('✦ Grow free Bell crystal');
    await board.locator('.cell.occupied-producer').nth(2).click();
    await expect(page.locator('#total')).toHaveText('5');
    await expect(
      await page.evaluate(() => ({
        keys: Object.keys(localStorage),
        sessionKeys: Object.keys(sessionStorage),
      })),
    ).toEqual({ keys: [], sessionKeys: [] });
  });

  test.describe('320px first-play placement review', () => {
    test.use({ viewport: { width: 320, height: 700 }, hasTouch: true });

    test('keeps generator targets legible, the board horizontally scrollable and 42 cells intact', async ({
      page,
    }, testInfo) => {
      await page.goto('/design-previews/crystalarium-c13a-generators.html');
      const frame = page.locator('#frame-sources .root-control');
      await expect(frame).toHaveCount(3);
      for (const producer of await frame.all()) {
        const box = await producer.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(48);
        expect(box?.width).toBeGreaterThanOrEqual(48);
      }
      await expect(page.locator('#board .cell')).toHaveCount(42);
      await expect(page.locator('#space')).toHaveText('42 / 42');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const scroller = page.locator('.board-window');
      expect(await scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: testInfo.outputPath('h6.9c13a-narrow-frame.png'),
        fullPage: true,
      });
      await page.locator('#grid-choice').click();
      await expect(page.locator('#board .cell.occupied-producer')).toHaveCount(3);
      await expect(page.locator('#space')).toHaveText('39 / 42');
      await page.screenshot({
        path: testInfo.outputPath('h6.9c13a-narrow-occupied.png'),
        fullPage: true,
      });
    });
  });
});

test.describe('H6.9C13A board-first mobile drawer contract', () => {
  test.use({ viewport: { width: 320, height: 700 }, hasTouch: true });

  test('the default view prioritises the usable board, with reversible Pattern, Grow and Tools panels', async ({
    page,
  }) => {
    // The full touch, keyboard, focus, drawer and save sequence completed its
    // assertions but timed out in fixture teardown on shared Chromium CI.
    // Preserve the entire interaction contract; only bound its time budget.
    test.setTimeout(90_000);
    await enterResonanceGarden(page);
    const region = page.getByRole('region', { name: 'Crystalarium Resonance Garden' });
    const board = region.locator('.crystalarium-portrait-board-section');
    const first = region.locator('[data-crystalarium-cell="0"]');
    const shelf = region.locator('.crystalarium-portrait-shelf');
    await expect(board).toBeVisible();
    await expect(region.locator('[data-crystalarium-menu]')).toHaveCount(3);
    await expect(region.locator('.crystalarium-portrait-menu-panel')).toBeHidden();
    await expect(region.locator('.crystalarium-portrait-pattern')).toBeHidden();
    await expect(region.locator('.crystalarium-portrait-controls')).toBeHidden();
    await expect(region.locator('.crystalarium-portrait-tools')).toBeHidden();
    const a = await first.boundingBox();
    const b = await shelf.boundingBox();
    if (!a || !b) throw new Error('Missing first board row or safe shelf');
    expect(a.y + a.height).toBeLessThan(b.y);
    const toolsMenu = region.locator('[data-crystalarium-menu="tools"]');
    const patternMenu = region.locator('[data-crystalarium-menu="pattern"]');
    await toolsMenu.click();
    await expect(toolsMenu).toHaveAttribute('aria-expanded', 'true');
    await expect(region.locator('.crystalarium-portrait-tools')).toBeVisible();
    await expect(region.locator('[data-crystalarium-action="close-menu"]')).toBeFocused();
    await region.locator('[data-crystalarium-action="sound"]').click();
    await expect(region.locator('.crystalarium-portrait-tools')).toBeVisible();
    await region.locator('[data-crystalarium-action="close-menu"]').click();
    await expect(board).toBeVisible();
    await expect(region.locator('.crystalarium-portrait-menu-panel')).toBeHidden();
    await patternMenu.click();
    await expect(patternMenu).toHaveAttribute('aria-expanded', 'true');
    await expect(region.locator('.crystalarium-portrait-pattern')).toBeVisible();
    await patternMenu.click();
    await expect(patternMenu).toHaveAttribute('aria-expanded', 'false');
    // Escape closes the drawer, never exits the session or loses its save.
    await region.locator('[data-crystalarium-menu="growing"]').click();
    await page.keyboard.press('Escape');
    await expect(region.locator('.crystalarium-portrait-menu-panel')).toBeHidden();
    await expect(region).toBeVisible();
    await region.locator('[data-crystalarium-menu="growing"]').click();
    await expect(region.locator('[data-crystalarium-action="grow"]')).toBeVisible();
    await region.locator('[data-crystalarium-action="grow"]').click();
    await region.locator('[data-crystalarium-menu="growing"]').click();
    await expect(region.locator('[data-crystalarium-cell="2"]')).toHaveAttribute(
      'data-family',
      'low',
    );
    expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
  });
});

const C17_PREVIEW = '/design-previews/crystalarium-c17-illustrated-layout.html';

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
      await page.goto(C17_PREVIEW);
      await expect(page.getByRole('heading', { name: /Crystalarium/ })).toBeVisible();
      await expect(page.locator('#board .cell')).toHaveCount(42);
      await expect(page.locator('.wells .well')).toHaveCount(3);
      await expect(page.locator('#orders .order-card')).toHaveCount(5);
      await expect(page.locator('#stock')).toHaveText('100 / 100');
      await expect(page.locator('#low')).toBeVisible();
      await expect
        .poll(() => page.locator('body').getAttribute('data-background-art'))
        .toBe('painted');

      const boardPanel = await page.locator('.board-panel').boundingBox();
      const wellsPanel = await page.locator('.wells').boundingBox();
      const ordersPanel = await page.locator('.orders-panel').boundingBox();
      const toolsPanel = await page.locator('.tools').boundingBox();
      if (!boardPanel || !wellsPanel || !ordersPanel || !toolsPanel) {
        throw new Error('C17 composition regions missing');
      }
      if (viewport.width <= 390) {
        expect(boardPanel.y).toBeLessThan(wellsPanel.y);
        expect(wellsPanel.y).toBeLessThan(ordersPanel.y);
      } else {
        expect(wellsPanel.x).toBeLessThan(boardPanel.x);
        expect(toolsPanel.x).toBeGreaterThan(boardPanel.x);
        expect(ordersPanel.y).toBeLessThan(boardPanel.y);
      }

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
    await page.goto(C17_PREVIEW);
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

test.describe('H6.9C17 separate ornate board art candidate', () => {
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 1280, height: 720 },
  ]) {
    test(`renders all 42 independent sockets and frame at ${viewport.width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto('/design-previews/crystalarium-c17-board-frame.html');
      await expect(page.getByRole('heading', { name: /Ornate Board Study/ })).toBeVisible();
      await expect(page.locator('#sockets .socket')).toHaveCount(42);
      await expect(page.locator('#frame')).not.toHaveClass(/show-board/);
      await expect(page.locator('#frame')).not.toHaveClass(/show-garden/);
      const hasTransparency = await page.locator('.frame-art').evaluate(async (img) => {
        const frame = img as HTMLImageElement;
        if (!frame.complete)
          await new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));
        const canvas = document.createElement('canvas');
        canvas.width = frame.naturalWidth;
        canvas.height = frame.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas missing');
        context.drawImage(frame, 0, 0);
        const alphaAt = (x: number, y: number) => context.getImageData(x, y, 1, 1).data[3];
        return (
          alphaAt(0, 0) === 0 &&
          alphaAt(canvas.width - 1, 0) === 0 &&
          alphaAt(0, canvas.height - 1) === 0 &&
          alphaAt(canvas.width - 1, canvas.height - 1) === 0 &&
          alphaAt(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)) === 0
        );
      });
      expect(hasTransparency).toBe(true);
      await page.getByRole('button', { name: 'Show 7×6 grid' }).click();
      await expect(page.locator('#frame')).toHaveClass(/show-board/);
      await expect
        .poll(() =>
          page.locator('.frame-art').evaluate((node) => {
            const img = node as HTMLImageElement;
            return img.complete && img.naturalWidth > 0;
          }),
        )
        .toBe(true);
      const socket = page.locator('#sockets .socket').first();
      await socket.click();
      await expect(socket).toHaveAttribute('data-state', 'selected');
      await page.getByRole('button', { name: 'Valid drop', exact: true }).click();
      await socket.click();
      await expect(socket).toHaveAttribute('data-state', 'valid-drop');
      expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
      await page.screenshot({
        path: testInfo.outputPath(`c17-board-frame-${viewport.width}.png`),
        fullPage: true,
      });
    });
  }
});

test.describe('H6.9C17 generator asset gallery', () => {
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
    { width: 1280, height: 720 },
  ]) {
    test(`renders five individually loaded generators at ${viewport.width}px without saving`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto('/design-previews/crystalarium-c17-generators.html');
      await expect(page.getByRole('heading', { name: /Generator Art/ })).toBeVisible();
      const images = page.locator('.grid img');
      await expect(images).toHaveCount(5);
      for (let index = 0; index < 5; index++) {
        await expect
          .poll(() =>
            images.nth(index).evaluate((node) => {
              const img = node as HTMLImageElement;
              return img.complete && img.naturalWidth === 320 && img.naturalHeight === 480;
            }),
          )
          .toBe(true);
      }
      expect(
        await page.evaluate(() => ({
          adventure: localStorage.getItem('unicorn-valley.save'),
          sandbox: localStorage.getItem('unicorn-valley:just-games:crystalarium:v1'),
        })),
      ).toEqual({ adventure: null, sandbox: null });
      await page.screenshot({
        path: testInfo.outputPath(`c17-generators-${viewport.width}.png`),
        fullPage: true,
      });
    });
  }
});

test.describe('H6.9C17 Bell violet family asset gallery', () => {
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
    { width: 1280, height: 720 },
  ]) {
    test(`loads six independent Bell crystal sprites at ${viewport.width}px without saving`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto('/design-previews/crystalarium-c17-bell-crystals.html');
      await expect(page.getByRole('heading', { name: /Bell · Violet crystals/ })).toBeVisible();
      const large = page.locator('.gallery img.large');
      await expect(large).toHaveCount(6);
      await expect(page.locator('.gallery .cell img')).toHaveCount(6);
      for (let index = 0; index < 6; index++) {
        await expect
          .poll(() =>
            large.nth(index).evaluate((element) => {
              const img = element as HTMLImageElement;
              return img.complete && img.naturalWidth === 512 && img.naturalHeight === 512;
            }),
          )
          .toBe(true);
      }
      expect(
        await page.evaluate(() => ({
          adventure: localStorage.getItem('unicorn-valley.save'),
          sandbox: localStorage.getItem('unicorn-valley:just-games:crystalarium:v1'),
        })),
      ).toEqual({ adventure: null, sandbox: null });
      await page.screenshot({
        path: testInfo.outputPath(`c17-bell-${viewport.width}.png`),
        fullPage: true,
      });
    });
  }
});
