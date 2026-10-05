import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import {
  SUNBEAM_CHESS_PUZZLES,
  getSunbeamChessPuzzle,
  validateSunbeamChessPuzzle,
} from './SunbeamChessPuzzles';

describe('SunbeamChessPuzzles', () => {
  it('keeps every starter puzzle legal and its authored solution valid', () => {
    for (const puzzle of SUNBEAM_CHESS_PUZZLES) {
      expect(validateSunbeamChessPuzzle(puzzle), puzzle.id).toEqual([]);

      const chess = new Chess(puzzle.fen);
      expect(
        chess.moves({ square: puzzle.from, verbose: true }).some((move) => move.to === puzzle.to),
        puzzle.id,
      ).toBe(true);
    }
  });

  it('ships capture, check, check escape and mate-in-one puzzle families', () => {
    expect(SUNBEAM_CHESS_PUZZLES.map((puzzle) => puzzle.id)).toEqual([
      'free-rook',
      'give-check',
      'escape-check',
      'mate-in-one',
    ]);
  });

  it('looks up puzzles by stable id', () => {
    expect(getSunbeamChessPuzzle('mate-in-one').subtitle).toBe('Checkmate in one');
  });
});
