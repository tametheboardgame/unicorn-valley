import { describe, expect, it } from 'vitest';
import {
  applyChessLiteMove,
  chooseVillageChessMove,
  createChessLiteState,
  getAllChessLiteMoves,
  getChessLiteMovesForSquare,
  type ChessLiteState,
} from './ChessLiteRules';

describe('ChessLiteRules', () => {
  it('starts with the familiar twenty white opening moves', () => {
    const state = createChessLiteState();

    expect(state.turn).toBe('white');
    expect(getAllChessLiteMoves(state)).toHaveLength(20);
    expect(getChessLiteMovesForSquare(state, { row: 6, col: 4 }).map(({ to }) => to)).toEqual([
      { row: 5, col: 4 },
      { row: 4, col: 4 },
    ]);
  });

  it('switches turns and rejects moves for the wrong side', () => {
    const state = createChessLiteState();
    const moved = applyChessLiteMove(state, {
      from: { row: 6, col: 4 },
      to: { row: 4, col: 4 },
    });

    expect(moved?.turn).toBe('black');
    expect(
      moved &&
        applyChessLiteMove(moved, {
          from: { row: 6, col: 3 },
          to: { row: 5, col: 3 },
        }),
    ).toBeNull();
  });

  it('promotes pawns to queens at the far edge', () => {
    const state: ChessLiteState = {
      board: Array.from({ length: 8 }, () => Array(8).fill(null)),
      turn: 'white',
      winner: null,
      ply: 0,
    };
    state.board[1][3] = { colour: 'white', type: 'pawn' };

    const moved = applyChessLiteMove(state, {
      from: { row: 1, col: 3 },
      to: { row: 0, col: 3 },
    });

    expect(moved?.board[0][3]).toEqual({ colour: 'white', type: 'queen' });
  });

  it('ends the friendly game when a king is captured', () => {
    const state: ChessLiteState = {
      board: Array.from({ length: 8 }, () => Array(8).fill(null)),
      turn: 'white',
      winner: null,
      ply: 0,
    };
    state.board[4][4] = { colour: 'white', type: 'queen' };
    state.board[4][7] = { colour: 'black', type: 'king' };

    const moved = applyChessLiteMove(state, {
      from: { row: 4, col: 4 },
      to: { row: 4, col: 7 },
    });

    expect(moved?.winner).toBe('white');
  });

  it('gives the village opponent a deterministic legal move', () => {
    const state = createChessLiteState();
    const whiteMove = applyChessLiteMove(state, {
      from: { row: 6, col: 4 },
      to: { row: 4, col: 4 },
    });

    expect(whiteMove).not.toBeNull();
    const opponentMove = whiteMove ? chooseVillageChessMove(whiteMove) : null;
    expect(opponentMove).not.toBeNull();
    expect(
      whiteMove && opponentMove
        ? getAllChessLiteMoves(whiteMove).some(
            (move) =>
              move.from.row === opponentMove.from.row &&
              move.from.col === opponentMove.from.col &&
              move.to.row === opponentMove.to.row &&
              move.to.col === opponentMove.to.col,
          )
        : false,
    ).toBe(true);
  });
});
