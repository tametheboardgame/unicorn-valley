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

    await page.waitForTimeout(900);
    const stillHolding = await getDiagnosticSnapshot(page);
    expect(objectText(stillHolding, 'sunbeam-chess:coach-status')).toContain('take a moment');

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

  test('keeps the existing complete chess game available as Friendly Match', async ({ page }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:friendly-match');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:move-history-up');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:move-history-down');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:move-history-range');

    await page.keyboard.press('Escape');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:teacher');
  });
});
