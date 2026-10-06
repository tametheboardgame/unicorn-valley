import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  getDiagnosticSnapshot,
  openDiagnostics,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

async function openChessAcademy(page: Page): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await openDiagnostics(page);
  await waitForScene(page, 'TitleScene');
  await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
  await waitForScene(page, 'JustGamesScene');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-card:sunbeam-chess');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
  await waitForScene(page, 'ChessPlazaActivityScene');
  await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:teacher');
}

function objectText(
  snapshot: Awaited<ReturnType<typeof getDiagnosticSnapshot>>,
  name: string,
): string | null {
  return (
    snapshot.scenes
      .find((scene) => scene.key === 'ChessPlazaActivityScene')
      ?.objects.find((object) => object.name === name)?.text ?? null
  );
}

test.describe('MG-WP5 Sunbeam Chess Academy', () => {
  test('opens the Academy Home with Coach Match available', async ({ page }) => {
    await openChessAcademy(page);

    for (const name of [
      'sunbeam-chess:mode:lessons',
      'sunbeam-chess:mode:puzzle-garden',
      'sunbeam-chess:mode:coach-match',
      'sunbeam-chess:mode:friendly-match',
    ]) {
      await waitForNamedObject(page, 'ChessPlazaActivityScene', name);
    }

    const snapshot = await getDiagnosticSnapshot(page);
    const scene = snapshot.scenes.find((entry) => entry.key === 'ChessPlazaActivityScene');
    const puzzleGarden = scene?.objects.find(
      (object) => object.name === 'sunbeam-chess:mode:puzzle-garden',
    );
    const coachMatch = scene?.objects.find(
      (object) => object.name === 'sunbeam-chess:mode:coach-match',
    );

    expect(puzzleGarden?.interactive).toBe(true);
    expect(coachMatch?.interactive).toBe(true);
  });

  test('completes the first rook movement lesson through real board interaction', async ({
    page,
  }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:lessons');
    await waitForNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:lesson-card:rook-rays',
    );
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:lesson-card:rook-rays');

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:r:d4');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:r:d4');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:square:d7');

    const snapshot = await getDiagnosticSnapshot(page);
    expect(objectText(snapshot, 'sunbeam-chess:lesson-status')).toContain('Lesson complete');
    expect(objectText(snapshot, 'sunbeam-chess:teacher-message')).toContain('straight up');

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:completion-card');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:completion-next');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:completion-next');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:b:d4');
  });

  test('makes check visually obvious on the checked king', async ({ page }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:lessons');
    await waitForNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:lesson-card:give-check',
    );
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:lesson-card:give-check');

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:r:a1');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:r:a1');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:square:a8');

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:check-warning:h8');
  });

  test('cycles directly to the next Puzzle Garden challenge after a solve', async ({ page }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:puzzle-garden');
    await waitForNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:puzzle-card:free-rook',
    );
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:puzzle-card:free-rook');

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:r:a1');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:r:a1');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:square:a8');

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:completion-card');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:completion-next');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:completion-next');

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:puzzle-status');
    const snapshot = await getDiagnosticSnapshot(page);
    expect(objectText(snapshot, 'sunbeam-chess:puzzle-status')).toContain(
      'rook move that gives check',
    );
  });

  test('solves the mate-in-one Puzzle Garden challenge on the real chess board', async ({
    page,
  }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:puzzle-garden');
    await waitForNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:puzzle-card:mate-in-one',
    );
    await clickNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:puzzle-card:mate-in-one',
    );

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:q:g6');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:q:g6');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:square:g7');

    const snapshot = await getDiagnosticSnapshot(page);
    expect(objectText(snapshot, 'sunbeam-chess:puzzle-status')).toContain('Puzzle solved');
    expect(objectText(snapshot, 'sunbeam-chess:puzzle-message')).toContain('Checkmate');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:completion-card');
  });

  test('plays a normal coached opening move and undoes the full turn', async ({ page }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:coach-match');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:coach-undo');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:coach-speech-bubble');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:move-history-up');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:move-history-down');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:move-history-range');

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:square:e4');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e4');

    const duringHold = await getDiagnosticSnapshot(page);
    const playerFeedback = objectText(duringHold, 'sunbeam-chess:coach-message');
    expect(objectText(duringHold, 'sunbeam-chess:coach-status')).toContain('take a moment');
    expect(playerFeedback).toBeTruthy();
    expect(playerFeedback).not.toContain('Village reply');

    await expect
      .poll(async () => {
        const snapshot = await getDiagnosticSnapshot(page);
        return objectText(snapshot, 'sunbeam-chess:coach-status');
      })
      .toContain('Your move');

    const afterReply = await getDiagnosticSnapshot(page);
    const combinedFeedback = objectText(afterReply, 'sunbeam-chess:coach-message');
    expect(combinedFeedback).toContain(playerFeedback ?? '');
    expect(combinedFeedback).toContain('Village reply');
    expect(objectText(afterReply, 'sunbeam-chess:move-history-range')).toContain('1–1 of 1');

    const warning = afterReply.scenes
      .find((scene) => scene.key === 'ChessPlazaActivityScene')
      ?.objects.some((object) => object.name === 'sunbeam-chess:coach-warning' && object.visible);
    expect(warning).not.toBe(true);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:coach-undo');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');
  });

  test('offers to resume an unfinished Coach Match after leaving Chess Academy', async ({
    page,
  }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:coach-match');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:square:e4');

    await expect
      .poll(async () => {
        const snapshot = await getDiagnosticSnapshot(page);
        return objectText(snapshot, 'sunbeam-chess:coach-status');
      })
      .toContain('Your move');

    await page.keyboard.press('Escape');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:teacher');
    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');

    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:sunbeam-chess');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
    await waitForScene(page, 'ChessPlazaActivityScene');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:teacher');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:coach-match');

    await waitForNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:coach-resume-carry-on',
    );
    await waitForNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:coach-resume-new-game',
    );

    await clickNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:coach-resume-carry-on',
    );
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e4');

    const restored = await getDiagnosticSnapshot(page);
    expect(objectText(restored, 'sunbeam-chess:move-history-range')).toContain('1–1 of 1');
    expect(objectText(restored, 'sunbeam-chess:coach-message')).toContain('Welcome back');
  });

  test('offers the child-friendly Friendly Match opponent ladder', async ({ page }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:friendly-match');

    for (const level of ['dandelion', 'clover', 'sunbeam']) {
      await waitForNamedObject(page, 'ChessPlazaActivityScene', `sunbeam-chess:opponent:${level}`);
    }

    const snapshot = await getDiagnosticSnapshot(page);
    const scene = snapshot.scenes.find((entry) => entry.key === 'ChessPlazaActivityScene');
    for (const level of ['dandelion', 'clover', 'sunbeam']) {
      expect(
        scene?.objects.find((object) => object.name === `sunbeam-chess:opponent:${level}`)
          ?.interactive,
      ).toBe(true);
    }

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:opponent:dandelion');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');
    await waitForNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:friendly-opponent-title',
    );

    const match = await getDiagnosticSnapshot(page);
    expect(objectText(match, 'sunbeam-chess:friendly-opponent-title')).toContain('Dandelion');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:friendly-opponents');
  });

  test('offers to resume an unfinished Friendly Match and restores its board', async ({ page }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:friendly-match');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:opponent:dandelion');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:square:e4');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e4');

    await expect
      .poll(async () => {
        const snapshot = await getDiagnosticSnapshot(page);
        return objectText(snapshot, 'sunbeam-chess:move-history-range');
      })
      .toContain('1–1 of 1');

    await page.keyboard.press('Escape');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:teacher');
    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');

    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:sunbeam-chess');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
    await waitForScene(page, 'ChessPlazaActivityScene');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:teacher');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:friendly-match');

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:resume-carry-on');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:resume-new-game');
    const resume = await getDiagnosticSnapshot(page);
    expect(objectText(resume, 'sunbeam-chess:resume-opponent')).toContain('Dandelion');

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:resume-carry-on');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e4');
    const restored = await getDiagnosticSnapshot(page);
    expect(objectText(restored, 'sunbeam-chess:friendly-opponent-title')).toContain('Dandelion');
    expect(objectText(restored, 'sunbeam-chess:move-history-range')).toContain('1–1 of 1');
  });

  test('stores learning progress outside the adventure save and shows it in the Academy', async ({
    page,
  }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:lessons');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:lesson-card:rook-rays');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:r:d4');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:square:d7');

    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:completion-back');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:completion-back');
    await waitForNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:lesson-complete:rook-rays',
    );

    const record = await page.evaluate(() => ({
      learning: window.localStorage.getItem('unicorn-valley.learning.sunbeam-chess.v1'),
      adventure: window.localStorage.getItem('unicorn-valley.save'),
    }));
    expect(record.learning).toContain('rook-rays');
    expect(record.adventure).toBeNull();

    const list = await getDiagnosticSnapshot(page);
    expect(objectText(list, 'sunbeam-chess:lesson-progress-summary')).toContain('1/8 complete');

    await page.keyboard.press('Escape');
    const home = await getDiagnosticSnapshot(page);
    expect(objectText(home, 'sunbeam-chess:learning-summary')).toContain('1/8 lessons');
  });

  test('supports keyboard-only Academy navigation and board play', async ({ page }) => {
    await openChessAcademy(page);

    await page.keyboard.press('1');
    await waitForNamedObject(
      page,
      'ChessPlazaActivityScene',
      'sunbeam-chess:lesson-card:rook-rays',
    );
    await page.keyboard.press('1');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:keyboard-focus:d4');

    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:keyboard-focus:d7');
    await page.keyboard.press('Enter');

    const snapshot = await getDiagnosticSnapshot(page);
    expect(objectText(snapshot, 'sunbeam-chess:lesson-status')).toContain('Lesson complete');
  });

  test('keeps the 16:9 chess canvas contained in a portrait tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await openChessAcademy(page);

    const box = await page.locator('canvas').boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width ?? 9999).toBeLessThanOrEqual(768);
    expect(box?.height ?? 9999).toBeLessThanOrEqual(1024);
    expect((box?.width ?? 16) / (box?.height ?? 9)).toBeCloseTo(16 / 9, 1);

    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width);
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:lessons');
  });

  test('keeps the complete chess game and shared history available in Friendly Match', async ({
    page,
  }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:friendly-match');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:opponent:clover');
    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:opponent:clover');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:move-history-up');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:move-history-down');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:move-history-range');

    await page.keyboard.press('Escape');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:teacher');
  });
});
