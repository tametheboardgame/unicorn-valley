import { describe, expect, it } from 'vitest';
import {
  CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS,
  LEGACY_GATEWAY_LABEL_TARGETS,
} from './R6FinalPlaythroughCleanupManager';

const RIBBON_BOARD = {
  left: 2510 - 150 - 56,
  right: 2510 + 150 + 56,
  top: 1430 - 42.5 - 56,
  bottom: 1430 + 42.5 + 56,
} as const;

function pointInsideExpandedRibbonBoard(point: { x: number; y: number }): boolean {
  return (
    point.x >= RIBBON_BOARD.left &&
    point.x <= RIBBON_BOARD.right &&
    point.y >= RIBBON_BOARD.top &&
    point.y <= RIBBON_BOARD.bottom
  );
}

describe('R6 final playthrough cleanup', () => {
  it('branches to Crystal Brook before the ribbon board and routes below it', () => {
    expect(CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS[0]).toEqual({ x: 1900, y: 1040 });
    expect(CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS[0].x).toBeLessThan(RIBBON_BOARD.left);

    for (const point of CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS) {
      expect(pointInsideExpandedRibbonBoard(point)).toBe(false);
    }

    const pointsBesideBoard = CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS.filter(
      (point) => point.x >= RIBBON_BOARD.left && point.x <= RIBBON_BOARD.right,
    );
    expect(pointsBesideBoard.length).toBeGreaterThan(0);
    expect(pointsBesideBoard.every((point) => point.y > RIBBON_BOARD.bottom)).toBe(true);
  });

  it('covers every production gateway that still has an R5 sign beneath it', () => {
    expect(LEGACY_GATEWAY_LABEL_TARGETS.map((target) => target.id)).toEqual([
      'meadow-crystal-brook',
      'crystal-brook-meadow',
      'crystal-brook-whispering-woods',
      'whispering-woods-crystal-brook',
      'crystal-brook-crystal-cascade',
    ]);
  });
});
