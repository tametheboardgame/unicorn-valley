import { expect, test, type Page } from '@playwright/test';
import { createDefaultSave } from '../../src/game/save/createDefaultSave';
import { CRYSTAL_BROOK_CRYSTALARIUM_NURSERY } from '../../src/game/world/CrystalBrookMap';
import {
  clickNamedObject,
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
    expect(scene.objects.filter((o) => o.name.startsWith('crystalarium-full-cell:'))).toHaveLength(42);
    for (const name of [
      'crystalarium-full-grow', 'crystalarium-full-sound', 'crystalarium-full-offer',
      'crystalarium-full-harmony', 'crystalarium-full-polish',
      'crystalarium-full-shelve', 'crystalarium-full-wash',
      'crystalarium-full-fresh', 'crystalarium-full-exit',
    ]) {
      expect(scene.objects.some((o) => o.name === name && o.visible && o.interactive)).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath('h6.9c-desktop-board.png'), fullPage: true });
  });

  test('quiet play, confirmed wash and fresh board do not change adventure data', async ({ page }) => {
    await enterResonanceGarden(page);
    await clickNamedObject(page, SCENE, 'crystalarium-full-sound');
    expect((await fullBoardSnapshot(page)).objects.some((o) => o.text === 'Sound: Off')).toBe(true);

    await clickNamedObject(page, SCENE, 'crystalarium-full-cell:0');
    await clickNamedObject(page, SCENE, 'crystalarium-full-wash');
    await clickNamedObject(page, SCENE, 'crystalarium-full-wash');
    const washed = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SANDBOX_KEY);
    expect(washed.washes).toBe(1);
    expect(washed.cells[0]).toBeNull();

    await clickNamedObject(page, SCENE, 'crystalarium-full-fresh');
    await clickNamedObject(page, SCENE, 'crystalarium-full-fresh');
    const fresh = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SANDBOX_KEY);
    expect(fresh.cells.filter(Boolean)).toHaveLength(2);
    expect(fresh.washes).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem('unicorn-valley.save'))).toBeNull();
  });
});

test.describe('H6.9C landscape touch evidence', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });
  test('shows the game board on phone landscape without hiding the playable scene', async ({ page }, testInfo) => {
    await enterResonanceGarden(page);
    const scene = await fullBoardSnapshot(page);
    expect(scene.objects.filter((o) => o.name.startsWith('crystalarium-full-cell:') && o.visible)).toHaveLength(42);
    await page.screenshot({ path: testInfo.outputPath('h6.9c-phone-landscape.png'), fullPage: true });
  });
});

test.describe('H6.9C portrait touch evidence', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('preserves a playable board and return action in portrait orientation', async ({ page }, testInfo) => {
    await enterResonanceGarden(page);
    const scene = await fullBoardSnapshot(page);
    expect(scene.objects.filter((o) => o.name.startsWith('crystalarium-full-cell:') && o.visible)).toHaveLength(42);
    await page.screenshot({ path: testInfo.outputPath('h6.9c-phone-portrait.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');
  });
});

test('H6.9C Crystal Brook nursery saves world progress and returns without reopening the Grotto', async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, save }) => localStorage.setItem(key, JSON.stringify(save)),
    { key: 'unicorn-valley.save', save: createDefaultSave('2026-10-24T11:00:00.000Z') },
  );
  await openDiagnostics(page, '/?scene=brook&diagnostics=1');
  await waitForScene(page, 'CrystalBrookScene');
  await setArcadeSpritePosition(
    page, 'CrystalBrookScene', 'world-player-unicorn',
    CRYSTAL_BROOK_CRYSTALARIUM_NURSERY.x,
    CRYSTAL_BROOK_CRYSTALARIUM_NURSERY.y + 50,
  );
  await expect.poll(async () => {
    const snapshot = await getDiagnosticSnapshot(page);
    return snapshot.scenes.find((s) => s.key === 'CrystalBrookScene')
      ?.objects.find((o) => o.name === 'exploration-tablet-hint' && o.visible)?.text;
  }).toBe('Crystalarium Nursery');

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
  expect(await page.evaluate(() =>
    localStorage.getItem('unicorn-valley:just-games:crystalarium:v1'),
  )).toBeNull();

  await clickNamedObject(page, SCENE, 'crystalarium-full-exit');
  await waitForScene(page, 'CrystalBrookScene');
});
