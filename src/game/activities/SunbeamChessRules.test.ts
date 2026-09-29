import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import {
  chooseTeachingMove,
  chooseVillageChessMove,
  describeChessPosition,
  describeTeachingMove,
} from './SunbeamChessRules';

describe('SunbeamChessRules', () => {
  it('only returns legal moves for the village opponent', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    chess.move('Nf3');
    chess.move('Nc6');
    chess.move('Bb5+');

    const legal = chess.moves({ verbose: true });
    const chosen = chooseVillageChessMove(chess);

    expect(chess.isCheck()).toBe(true);
    expect(chosen).not.toBeNull();
    expect(legal.some((move) => move.san === chosen?.san)).toBe(true);
  });

  it('recognises real checkmate rather than crown capture', () => {
    const chess = new Chess();
    for (const move of ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#']) {
      chess.move(move);
    }

    expect(chess.isCheckmate()).toBe(true);
    expect(describeChessPosition(chess)).toContain('Checkmate');
  });

  it('provides a legal teaching hint with a short explanation', () => {
    const chess = new Chess();
    const hint = chooseTeachingMove(chess);

    expect(hint).not.toBeNull();
    expect(chess.moves()).toContain(hint?.san);
    expect(hint && describeTeachingMove(hint).length).toBeGreaterThan(20);
  });

  it('explains check as a forced-response situation', () => {
    const chess = new Chess();
    for (const move of ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5+']) {
      chess.move(move);
    }

    expect(chess.isCheck()).toBe(true);
    expect(describeChessPosition(chess)).toContain('must');
  });
});
