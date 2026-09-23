import { expect, type Page, test } from '@playwright/test';
import {
  getDiagnosticSnapshot,
  setArcadeSpritePosition,
  waitForDiagnostics,
  waitForScene,
} from '../support/browserDiagnostics';

const PLAYER_NAME = 'world-player-unicorn';

async function pressInteraction(page: Page): Promise<void> {
  await page.keyboard.press('KeyE');
}

async function expectReaction(page: Page, expected: RegExp): Promise<void> {
  await expect
    .poll(async () => {
      const snapshot = await getDiagnosticSnapshot(page);
      return (
        snapshot.scenes
          .find(({ key }) => key === 'SunbeamVillageScene')
          ?.objects.find(
            ({ name, visible }) => name === 'world-feedback-reaction-text' && visible,
          )?.text ?? ''
      );
    })
    .toMatch(expected);
}

test('H3.9 activates cottage and Candyland targets through shared world interaction feedback', async ({
  page,
}) => {
  await page.goto('/?scene=village&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForScene(page, 'SunbeamVillageScene');

  await setArcadeSpritePosition(page, 'SunbeamVillageScene', PLAYER_NAME, 1630, 1630);
  await page.waitForTimeout(120);
  await pressInteraction(page);
  await expectReaction(page, /Rosehip Cottage/);

  await setArcadeSpritePosition(page, 'SunbeamVillageScene', PLAYER_NAME, 2340, 1785);
  await page.waitForTimeout(120);
  await pressInteraction(page);
  await expectReaction(page, /Candyland[\s\S]*opening soon/i);
});

test('H3.9 gives both village exits one automatic shared interaction owner', async ({ page }) => {
  await page.goto('/?scene=village&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForScene(page, 'SunbeamVillageScene');

  await setArcadeSpritePosition(page, 'SunbeamVillageScene', PLAYER_NAME, 120, 950);
  await waitForScene(page, 'MoonflowerGladeScene');

  await page.goto('/?scene=village&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForScene(page, 'SunbeamVillageScene');
  await setArcadeSpritePosition(page, 'SunbeamVillageScene', PLAYER_NAME, 2880, 950);
  await waitForScene(page, 'RainbowMeadowScene');
});
