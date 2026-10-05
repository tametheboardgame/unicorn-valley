import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import {
  SUNBEAM_CHESS_OPPONENT_LEVELS,
  chooseSunbeamChessOpponentMove,
  getSunbeamChessOpponent,
  scoreSunbeamChessOpponentMove,
} from './SunbeamChessOpponent';

describe('SunbeamChessOpponent', () => {
  it('defines the approved three-level child-friendly opponent ladder', () => {
    expect(SUNBEAM_CHESS_OPPONENT_LEVELS).toEqual(['dandelion', 'clover', 'sunbeam']);
    expect(getSunbeamChessOpponent('dandelion').subtitle).toBe('Very forgiving');
    expect(getSunbeamChessOpponent('clover').subtitle).toBe('Beginner');
    expect(getSunbeamChessOpponent('sunbeam').subtitle).toBe('Developing player');
  });

  it('always returns a legal move for every opponent level', () => {
    const chess = new Chess();
    chess.move('e4');

    const legal = chess.moves();
    for (const level of SUNBEAM_CHESS_OPPONENT_LEVELS) {
      const chosen = chooseSunbeamChessOpponentMove(chess, level);
      expect(chosen).not.toBeNull();
      expect(legal).toContain(chosen?.san);
    }
  });

  it('is deterministic for the same position and level', () => {
    const chess = new Chess();
    chess.move('e4');

    for (const level of SUNBEAM_CHESS_OPPONENT_LEVELS) {
      const first = chooseSunbeamChessOpponentMove(chess, level);
      const second = chooseSunbeamChessOpponentMove(chess, level);
      expect(first?.san).toBe(second?.san);
    }
  });

  it('orders move-choice quality from forgiving to developing', () => {
    const chess = new Chess();
    chess.move('e4');

    const dandelion = chooseSunbeamChessOpponentMove(chess, 'dandelion');
    const clover = chooseSunbeamChessOpponentMove(chess, 'clover');
    const sunbeam = chooseSunbeamChessOpponentMove(chess, 'sunbeam');

    expect(dandelion).not.toBeNull();
    expect(clover).not.toBeNull();
    expect(sunbeam).not.toBeNull();

    expect(scoreSunbeamChessOpponentMove(chess, sunbeam!)).toBeGreaterThanOrEqual(
      scoreSunbeamChessOpponentMove(chess, clover!),
    );
    expect(scoreSunbeamChessOpponentMove(chess, clover!)).toBeGreaterThanOrEqual(
      scoreSunbeamChessOpponentMove(chess, dandelion!),
    );
  });

  it('returns null only when no legal move exists', () => {
    const checkmated = new Chess('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1');
    expect(checkmated.isCheckmate()).toBe(true);

    for (const level of SUNBEAM_CHESS_OPPONENT_LEVELS) {
      expect(chooseSunbeamChessOpponentMove(checkmated, level)).toBeNull();
    }
  });
});
