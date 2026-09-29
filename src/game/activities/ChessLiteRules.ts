export type ChessLiteColour = 'white' | 'black';
export type ChessLitePieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export interface ChessLitePiece {
  colour: ChessLiteColour;
  type: ChessLitePieceType;
}

export interface ChessLiteSquare {
  row: number;
  col: number;
}

export interface ChessLiteMove {
  from: ChessLiteSquare;
  to: ChessLiteSquare;
}

export interface ChessLiteState {
  board: Array<Array<ChessLitePiece | null>>;
  turn: ChessLiteColour;
  winner: ChessLiteColour | 'draw' | null;
  ply: number;
}

const BOARD_SIZE = 8;
const MAX_PLY = 100;

const BACK_RANK: readonly ChessLitePieceType[] = [
  'rook',
  'knight',
  'bishop',
  'queen',
  'king',
  'bishop',
  'knight',
  'rook',
];

const PIECE_VALUE: Record<ChessLitePieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 100,
};

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function cloneBoard(board: ChessLiteState['board']): ChessLiteState['board'] {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function sameSquare(left: ChessLiteSquare, right: ChessLiteSquare): boolean {
  return left.row === right.row && left.col === right.col;
}

function opponent(colour: ChessLiteColour): ChessLiteColour {
  return colour === 'white' ? 'black' : 'white';
}

function addIfOpenOrEnemy(
  state: ChessLiteState,
  piece: ChessLitePiece,
  moves: ChessLiteMove[],
  from: ChessLiteSquare,
  row: number,
  col: number,
): boolean {
  if (!inBounds(row, col)) {
    return false;
  }
  const target = state.board[row][col];
  if (!target) {
    moves.push({ from, to: { row, col } });
    return true;
  }
  if (target.colour !== piece.colour) {
    moves.push({ from, to: { row, col } });
  }
  return false;
}

function addSlidingMoves(
  state: ChessLiteState,
  piece: ChessLitePiece,
  moves: ChessLiteMove[],
  from: ChessLiteSquare,
  directions: readonly (readonly [number, number])[],
): void {
  for (const [rowStep, colStep] of directions) {
    let row = from.row + rowStep;
    let col = from.col + colStep;
    while (inBounds(row, col)) {
      if (!addIfOpenOrEnemy(state, piece, moves, from, row, col)) {
        break;
      }
      row += rowStep;
      col += colStep;
    }
  }
}

export function createChessLiteState(): ChessLiteState {
  const board: ChessLiteState['board'] = Array.from({ length: BOARD_SIZE }, () =>
    Array<ChessLitePiece | null>(BOARD_SIZE).fill(null),
  );

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    board[0][col] = { colour: 'black', type: BACK_RANK[col] };
    board[1][col] = { colour: 'black', type: 'pawn' };
    board[6][col] = { colour: 'white', type: 'pawn' };
    board[7][col] = { colour: 'white', type: BACK_RANK[col] };
  }

  return {
    board,
    turn: 'white',
    winner: null,
    ply: 0,
  };
}

export function getChessLiteMovesForSquare(
  state: ChessLiteState,
  from: ChessLiteSquare,
): ChessLiteMove[] {
  if (state.winner || !inBounds(from.row, from.col)) {
    return [];
  }
  const piece = state.board[from.row][from.col];
  if (!piece || piece.colour !== state.turn) {
    return [];
  }

  const moves: ChessLiteMove[] = [];
  if (piece.type === 'pawn') {
    const rowStep = piece.colour === 'white' ? -1 : 1;
    const startRow = piece.colour === 'white' ? 6 : 1;
    const oneRow = from.row + rowStep;
    if (inBounds(oneRow, from.col) && !state.board[oneRow][from.col]) {
      moves.push({ from, to: { row: oneRow, col: from.col } });
      const twoRow = from.row + rowStep * 2;
      if (from.row === startRow && inBounds(twoRow, from.col) && !state.board[twoRow][from.col]) {
        moves.push({ from, to: { row: twoRow, col: from.col } });
      }
    }
    for (const colStep of [-1, 1] as const) {
      const col = from.col + colStep;
      const target = inBounds(oneRow, col) ? state.board[oneRow][col] : null;
      if (target && target.colour !== piece.colour) {
        moves.push({ from, to: { row: oneRow, col } });
      }
    }
    return moves;
  }

  if (piece.type === 'knight') {
    for (const [rowStep, colStep] of [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ] as const) {
      addIfOpenOrEnemy(state, piece, moves, from, from.row + rowStep, from.col + colStep);
    }
    return moves;
  }

  if (piece.type === 'king') {
    for (let rowStep = -1; rowStep <= 1; rowStep += 1) {
      for (let colStep = -1; colStep <= 1; colStep += 1) {
        if (rowStep !== 0 || colStep !== 0) {
          addIfOpenOrEnemy(state, piece, moves, from, from.row + rowStep, from.col + colStep);
        }
      }
    }
    return moves;
  }

  const straight = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const;
  const diagonal = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const;

  if (piece.type === 'rook' || piece.type === 'queen') {
    addSlidingMoves(state, piece, moves, from, straight);
  }
  if (piece.type === 'bishop' || piece.type === 'queen') {
    addSlidingMoves(state, piece, moves, from, diagonal);
  }
  return moves;
}

export function getAllChessLiteMoves(state: ChessLiteState): ChessLiteMove[] {
  if (state.winner) {
    return [];
  }
  const moves: ChessLiteMove[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      moves.push(...getChessLiteMovesForSquare(state, { row, col }));
    }
  }
  return moves;
}

export function applyChessLiteMove(
  state: ChessLiteState,
  requested: ChessLiteMove,
): ChessLiteState | null {
  const legal = getChessLiteMovesForSquare(state, requested.from).find((move) =>
    sameSquare(move.to, requested.to),
  );
  if (!legal) {
    return null;
  }

  const board = cloneBoard(state.board);
  const movingPiece = board[legal.from.row][legal.from.col];
  const captured = board[legal.to.row][legal.to.col];
  if (!movingPiece) {
    return null;
  }

  board[legal.from.row][legal.from.col] = null;
  board[legal.to.row][legal.to.col] = movingPiece;

  if (movingPiece.type === 'pawn' && (legal.to.row === 0 || legal.to.row === BOARD_SIZE - 1)) {
    board[legal.to.row][legal.to.col] = { ...movingPiece, type: 'queen' };
  }

  const ply = state.ply + 1;
  return {
    board,
    turn: opponent(state.turn),
    winner: captured?.type === 'king' ? movingPiece.colour : ply >= MAX_PLY ? 'draw' : null,
    ply,
  };
}

export function chooseVillageChessMove(state: ChessLiteState): ChessLiteMove | null {
  const moves = getAllChessLiteMoves(state);
  let best: ChessLiteMove | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const move of moves) {
    const captured = state.board[move.to.row][move.to.col];
    const moving = state.board[move.from.row][move.from.col];
    if (!moving) {
      continue;
    }

    const centreDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
    const advancement =
      moving.type === 'pawn'
        ? moving.colour === 'black'
          ? move.to.row
          : BOARD_SIZE - 1 - move.to.row
        : 0;
    const score = (captured ? PIECE_VALUE[captured.type] * 100 : 0) - centreDistance + advancement;

    if (score > bestScore) {
      best = move;
      bestScore = score;
    }
  }

  return best;
}
