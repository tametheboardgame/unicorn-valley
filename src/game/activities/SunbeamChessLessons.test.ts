import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import {
  SUNBEAM_CHESS_LESSONS,
  getSunbeamChessLesson,
  validateSunbeamChessLesson,
} from './SunbeamChessLessons';

describe('SunbeamChessLessons', () => {
  it('keeps every starter lesson legal and solvable in one move', () => {
    for (const lesson of SUNBEAM_CHESS_LESSONS) {
      expect(validateSunbeamChessLesson(lesson), lesson.id).toEqual([]);

      const chess = new Chess(lesson.fen);
      const move = chess
        .moves({ square: lesson.pieceSquare, verbose: true })
        .find((candidate) => candidate.to === lesson.goalSquare);

      expect(move, lesson.id).toBeDefined();
      expect(() =>
        chess.move({
          from: lesson.pieceSquare,
          to: lesson.goalSquare,
          promotion: move?.promotion,
        }),
      ).not.toThrow();
    }
  });

  it('ships the first four movement lessons in a stable progression', () => {
    expect(SUNBEAM_CHESS_LESSONS.map((lesson) => lesson.id)).toEqual([
      'rook-rays',
      'bishop-trails',
      'knight-jumps',
      'pawn-steps',
    ]);
  });

  it('provides the full four-stage hint ladder for every lesson', () => {
    for (const lesson of SUNBEAM_CHESS_LESSONS) {
      expect(Object.values(lesson.hints).every((hint) => hint.trim().length > 0)).toBe(true);
    }
  });

  it('looks up lessons by stable id', () => {
    expect(getSunbeamChessLesson('knight-jumps').pieceName).toBe('knight');
  });
});
