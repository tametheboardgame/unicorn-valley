import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';
import { chooseTeachingMove } from './SunbeamChessRules';

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

export type SunbeamChessCoachConcernKind =
  | 'mate-in-one-against'
  | 'hanging-major-piece'
  | 'missed-free-capture';

export interface SunbeamChessCoachConcern {
  kind: SunbeamChessCoachConcernKind;
  title: string;
  message: string;
  question: string;
  focusSquare?: Square;
  suggestedFrom?: Square;
  suggestedTo?: Square;
}

export interface SunbeamChessCoachHint {
  text: string;
  from?: Square;
  to?: Square;
}

function simulateMove(chess: Chess, move: Move): Chess {
  const simulation = new Chess(chess.fen());
  simulation.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion,
  });
  return simulation;
}

function findMateInOne(chess: Chess): Move | null {
  for (const move of chess.moves({ verbose: true })) {
    const simulation = simulateMove(chess, move);
    if (simulation.isCheckmate()) {
      return move;
    }
  }
  return null;
}

function isMoveStillLegal(chess: Chess, move: Move): boolean {
  return chess
    .moves({ square: move.from, verbose: true })
    .some(
      (candidate) =>
        candidate.to === move.to &&
        (move.promotion === undefined || candidate.promotion === move.promotion),
    );
}

function findSafeHighValueCapture(chess: Chess): Move | null {
  const captures = chess
    .moves({ verbose: true })
    .filter((move) => move.captured && PIECE_VALUES[move.captured] >= 5)
    .sort((left, right) => {
      const capturedDifference =
        PIECE_VALUES[right.captured ?? 'p'] - PIECE_VALUES[left.captured ?? 'p'];
      if (capturedDifference !== 0) {
        return capturedDifference;
      }
      return left.san.localeCompare(right.san);
    });

  for (const move of captures) {
    const simulation = simulateMove(chess, move);
    if (simulation.isCheckmate()) {
      return move;
    }

    const opponentCanTakeBack = simulation
      .moves({ verbose: true })
      .some((reply) => reply.to === move.to && reply.captured === move.piece);

    if (!opponentCanTakeBack) {
      return move;
    }
  }

  return null;
}

function findCheapCaptureOfMovedPiece(simulation: Chess, move: Move): Move | null {
  const movedValue = PIECE_VALUES[move.piece];
  if (movedValue < 5) {
    return null;
  }

  const replies = simulation
    .moves({ verbose: true })
    .filter((reply) => reply.to === move.to && reply.captured === move.piece)
    .sort((left, right) => PIECE_VALUES[left.piece] - PIECE_VALUES[right.piece]);

  return replies.find((reply) => PIECE_VALUES[reply.piece] + 1 < movedValue) ?? null;
}

export function reviewSunbeamChessCoachMove(
  chess: Chess,
  move: Move,
): SunbeamChessCoachConcern | null {
  if (!isMoveStillLegal(chess, move)) {
    return null;
  }

  const simulation = simulateMove(chess, move);

  // Never interrupt a move that already checkmates the opponent.
  if (simulation.isCheckmate()) {
    return null;
  }

  const opponentMate = findMateInOne(simulation);
  if (opponentMate) {
    return {
      kind: 'mate-in-one-against',
      title: 'Have another look?',
      message: 'That move gives the other side a checkmate in one.',
      question: 'Can you spot the checkmate threat before you decide?',
      focusSquare: opponentMate.to,
      suggestedFrom: opponentMate.from,
      suggestedTo: opponentMate.to,
    };
  }

  const cheapCapture = findCheapCaptureOfMovedPiece(simulation, move);
  if (cheapCapture) {
    return {
      kind: 'hanging-major-piece',
      title: 'Have another look?',
      message: `That move leaves your ${PIECE_NAMES[move.piece]} where their ${PIECE_NAMES[cheapCapture.piece]} can take it next move.`,
      question: 'Would you like to look for a safer square first?',
      focusSquare: move.to,
      suggestedFrom: cheapCapture.from,
      suggestedTo: cheapCapture.to,
    };
  }

  if (!move.captured) {
    const freeCapture = findSafeHighValueCapture(chess);
    if (freeCapture && freeCapture.from !== move.from && freeCapture.to !== move.to) {
      return {
        kind: 'missed-free-capture',
        title: 'Did you spot this?',
        message: `There is a loose ${PIECE_NAMES[freeCapture.captured ?? 'p']} you can take safely right now.`,
        question: 'Want another look before you make your move?',
        focusSquare: freeCapture.to,
        suggestedFrom: freeCapture.from,
        suggestedTo: freeCapture.to,
      };
    }
  }

  return null;
}

export function getSunbeamChessCoachHint(
  chess: Chess,
  stage: number,
): SunbeamChessCoachHint | null {
  if (chess.isGameOver()) {
    return null;
  }

  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) {
    return null;
  }

  const mate = findMateInOne(chess);
  const freeCapture = findSafeHighValueCapture(chess);
  const teachingMove = mate ?? freeCapture ?? chooseTeachingMove(chess);
  if (!teachingMove) {
    return null;
  }

  if (stage <= 0) {
    if (chess.isCheck()) {
      return { text: 'Notice: your king is in check. Your next move has to make it safe.' };
    }
    if (mate) {
      return { text: 'Notice: there is a move that can finish the game right now.' };
    }
    if (freeCapture) {
      return { text: 'Notice: one of the other side’s valuable pieces is loose.' };
    }
    return { text: 'Notice: look at checks, captures and threats before choosing your move.' };
  }

  if (stage === 1) {
    if (mate) {
      return { text: 'Question: which move gives check and leaves the king with no escape?' };
    }
    if (freeCapture) {
      return { text: 'Question: which of your pieces can safely capture something valuable?' };
    }
    return {
      text: `Question: what will your ${PIECE_NAMES[teachingMove.piece]} attack or defend after it moves?`,
    };
  }

  if (stage === 2) {
    return {
      text: `Nudge: have a closer look at the ${teachingMove.from.toUpperCase()} piece.`,
      from: teachingMove.from,
    };
  }

  return {
    text: `Show me: try ${teachingMove.san}.`,
    from: teachingMove.from,
    to: teachingMove.to,
  };
}
