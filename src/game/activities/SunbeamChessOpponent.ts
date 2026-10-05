import { Chess, type Move, type PieceSymbol } from 'chess.js';

export const SUNBEAM_CHESS_OPPONENT_LEVELS = ['dandelion', 'clover', 'sunbeam'] as const;
export type SunbeamChessOpponentLevel = (typeof SUNBEAM_CHESS_OPPONENT_LEVELS)[number];

export interface SunbeamChessOpponentDefinition {
  id: SunbeamChessOpponentLevel;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

export const SUNBEAM_CHESS_OPPONENT_DEFINITIONS = [
  {
    id: 'dandelion',
    title: 'Dandelion',
    subtitle: 'Very forgiving',
    description: 'Makes simple, believable choices and leaves you plenty of room to spot ideas.',
    icon: '🌼',
  },
  {
    id: 'clover',
    title: 'Clover',
    subtitle: 'Beginner',
    description: 'Usually finds sensible moves, but sometimes chooses an easier plan.',
    icon: '☘️',
  },
  {
    id: 'sunbeam',
    title: 'Sunbeam',
    subtitle: 'Developing player',
    description: 'Looks for captures, checks and useful development much more consistently.',
    icon: '☀️',
  },
] as const satisfies readonly SunbeamChessOpponentDefinition[];

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

function moveScore(chess: Chess, move: Move): number {
  const simulation = new Chess(chess.fen());
  simulation.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion,
  });

  if (simulation.isCheckmate()) {
    return 100_000;
  }

  let score = 0;
  if (move.captured) {
    score += PIECE_VALUES[move.captured] * 100;
  }
  if (move.promotion) {
    score += PIECE_VALUES[move.promotion] * 45;
  }
  if (simulation.isCheck()) {
    score += 30;
  }

  const file = move.to.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = Number(move.to[1]) - 1;
  const centreDistance = Math.abs(file - 3.5) + Math.abs(rank - 3.5);
  score += Math.max(0, 7 - centreDistance) * 2;

  if (move.piece === 'n' || move.piece === 'b') {
    const startingRank = move.color === 'w' ? '1' : '8';
    if (move.from[1] === startingRank) {
      score += 8;
    }
  }

  return score;
}

function rankedMoves(chess: Chess): Move[] {
  return chess
    .moves({ verbose: true })
    .sort((left, right) => {
      const scoreDifference = moveScore(chess, right) - moveScore(chess, left);
      return scoreDifference !== 0 ? scoreDifference : left.san.localeCompare(right.san);
    });
}

function dandelionIndex(moveCount: number): number {
  if (moveCount <= 2) {
    return Math.max(0, moveCount - 1);
  }
  return Math.max(1, Math.floor((moveCount - 1) * 0.48));
}

function cloverIndex(chess: Chess, moveCount: number): number {
  if (moveCount <= 1) {
    return 0;
  }

  const opponentTurnNumber = Math.floor(chess.history().length / 2);
  return opponentTurnNumber % 3 === 2 ? Math.min(1, moveCount - 1) : 0;
}

export function chooseSunbeamChessOpponentMove(
  chess: Chess,
  level: SunbeamChessOpponentLevel,
): Move | null {
  const moves = rankedMoves(chess);
  if (moves.length === 0) {
    return null;
  }

  if (level === 'sunbeam') {
    return moves[0];
  }

  if (level === 'clover') {
    return moves[cloverIndex(chess, moves.length)];
  }

  return moves[dandelionIndex(moves.length)];
}

export function getSunbeamChessOpponent(
  id: SunbeamChessOpponentLevel,
): SunbeamChessOpponentDefinition {
  const opponent = SUNBEAM_CHESS_OPPONENT_DEFINITIONS.find((definition) => definition.id === id);
  if (!opponent) {
    throw new Error(`Unknown Sunbeam Chess opponent: ${id}`);
  }
  return opponent;
}

export function scoreSunbeamChessOpponentMove(chess: Chess, move: Move): number {
  return moveScore(chess, move);
}
