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
  test('opens the Academy Home and keeps unfinished modes visibly unavailable', async ({
    page,
  }) => {
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

    expect(puzzleGarden?.interactive).toBe(false);
    expect(coachMatch?.interactive).toBe(false);
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
  });

  test('keeps the existing complete chess game available as Friendly Match', async ({ page }) => {
    await openChessAcademy(page);

    await clickNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:mode:friendly-match');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:piece:w:p:e2');

    await page.keyboard.press('Escape');
    await waitForNamedObject(page, 'ChessPlazaActivityScene', 'sunbeam-chess:teacher');
  });
});
