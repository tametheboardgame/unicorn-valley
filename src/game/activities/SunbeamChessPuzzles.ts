import { Chess, type Square } from 'chess.js';

export const SUNBEAM_CHESS_PUZZLE_IDS = [
  'free-rook',
  'give-check',
  'escape-check',
  'mate-in-one',
] as const;

export type SunbeamChessPuzzleId = (typeof SUNBEAM_CHESS_PUZZLE_IDS)[number];

export interface SunbeamChessPuzzleDefinition {
  id: SunbeamChessPuzzleId;
  order: number;
  title: string;
  subtitle: string;
  fen: string;
  objective: string;
  intro: string;
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  success: string;
  hints: {
    notice: string;
    question: string;
    nudge: string;
    show: string;
  };
}

export const SUNBEAM_CHESS_PUZZLES = [
  {
    id: 'free-rook',
    order: 10,
    title: 'Treasure on A8',
    subtitle: 'Spot a free capture',
    fen: 'r6k/8/8/8/8/8/8/R6K w - - 0 1',
    objective: 'Can your rook win the rook on A8?',
    intro: 'Before every move, look for pieces you can capture safely.',
    from: 'a1',
    to: 'a8',
    success: 'Found it! Your rook travelled straight up and won the loose rook.',
    hints: {
      notice: 'There is a black rook on the same file as your rook.',
      question: 'Is anything blocking the A-file?',
      nudge: 'Look all the way from A1 to A8.',
      show: 'Move the rook from A1 to A8.',
    },
  },
  {
    id: 'give-check',
    order: 20,
    title: 'Knock on the King',
    subtitle: 'Give check',
    fen: '7k/8/8/8/8/8/8/R6K w - - 0 1',
    objective: 'Find the rook move that gives check.',
    intro: 'Check means the king is under attack and must answer the threat.',
    from: 'a1',
    to: 'a8',
    success: 'Check! The rook now attacks the king along the eighth rank.',
    hints: {
      notice: 'Rooks attack in straight lines.',
      question: 'Where could your rook move to see the king across a row?',
      nudge: 'Try reaching the eighth rank.',
      show: 'Move the rook from A1 to A8.',
    },
  },
  {
    id: 'escape-check',
    order: 30,
    title: 'King Escape',
    subtitle: 'Get out of check',
    fen: '4r2k/8/8/8/8/8/8/4K3 w - - 0 1',
    objective: 'Your king is in check. Move it somewhere safe.',
    intro: 'When your king is in check, your next move must remove the attack.',
    from: 'e1',
    to: 'd2',
    success: 'Safe! The king stepped off the rook’s attacking file.',
    hints: {
      notice: 'The black rook attacks straight down the E-file.',
      question: 'Which nearby square gets your king off that file?',
      nudge: 'Look one square diagonally up and left.',
      show: 'Move the king from E1 to D2.',
    },
  },
  {
    id: 'mate-in-one',
    order: 40,
    title: 'One-Move Sparkle',
    subtitle: 'Checkmate in one',
    fen: '7k/5K2/6Q1/8/8/8/8/8 w - - 0 1',
    objective: 'Find checkmate in one move.',
    intro: 'Checkmate is a check with no legal escape.',
    from: 'g6',
    to: 'g7',
    success: 'Checkmate! The queen gives check and the king has nowhere safe to go.',
    hints: {
      notice: 'Your king already guards the squares near the black king.',
      question: 'Can the queen give a protected check from the seventh rank?',
      nudge: 'Look at G7.',
      show: 'Move the queen from G6 to G7.',
    },
  },
] as const satisfies readonly SunbeamChessPuzzleDefinition[];

export function getSunbeamChessPuzzle(id: SunbeamChessPuzzleId): SunbeamChessPuzzleDefinition {
  const puzzle = SUNBEAM_CHESS_PUZZLES.find((definition) => definition.id === id);
  if (!puzzle) {
    throw new Error(`Unknown Sunbeam Chess puzzle: ${id}`);
  }
  return puzzle;
}

export function validateSunbeamChessPuzzle(
  puzzle: SunbeamChessPuzzleDefinition,
): readonly string[] {
  const problems: string[] = [];
  let chess: Chess;

  try {
    chess = new Chess(puzzle.fen);
  } catch {
    return ['FEN is not a valid chess position.'];
  }

  if (chess.turn() !== 'w') {
    problems.push('Puzzle positions must start with White to move.');
  }

  const move = chess
    .moves({ square: puzzle.from, verbose: true })
    .find(
      (candidate) =>
        candidate.to === puzzle.to &&
        (puzzle.promotion === undefined || candidate.promotion === puzzle.promotion),
    );

  if (!move) {
    problems.push(
      `${puzzle.from.toUpperCase()} -> ${puzzle.to.toUpperCase()} must be a legal solution move.`,
    );
    return problems;
  }

  chess.move({
    from: move.from,
    to: move.to,
    promotion: puzzle.promotion ?? move.promotion,
  });

  if (puzzle.id === 'give-check' && !chess.isCheck()) {
    problems.push('The give-check puzzle solution must produce check.');
  }
  if (puzzle.id === 'escape-check') {
    const start = new Chess(puzzle.fen);
    if (!start.isCheck()) {
      problems.push('The escape-check puzzle must begin in check.');
    }
    if (chess.isCheck()) {
      problems.push('The escape-check solution must leave White safe.');
    }
  }
  if (puzzle.id === 'mate-in-one' && !chess.isCheckmate()) {
    problems.push('The mate-in-one puzzle solution must produce checkmate.');
  }

  if (!puzzle.hints.notice || !puzzle.hints.question || !puzzle.hints.nudge || !puzzle.hints.show) {
    problems.push('Every puzzle needs all four layered hints.');
  }

  return problems;
}
