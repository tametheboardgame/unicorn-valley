import { Chess, type PieceSymbol, type Square } from 'chess.js';

export const SUNBEAM_CHESS_LESSON_IDS = [
  'rook-rays',
  'bishop-trails',
  'knight-jumps',
  'pawn-steps',
] as const;

export type SunbeamChessLessonId = (typeof SUNBEAM_CHESS_LESSON_IDS)[number];

export interface SunbeamChessLessonHints {
  notice: string;
  question: string;
  nudge: string;
  show: string;
}

export interface SunbeamChessLessonDefinition {
  id: SunbeamChessLessonId;
  order: number;
  title: string;
  subtitle: string;
  piece: PieceSymbol;
  pieceName: string;
  fen: string;
  pieceSquare: Square;
  goalSquare: Square;
  objective: string;
  intro: string;
  success: string;
  hints: SunbeamChessLessonHints;
}

export const SUNBEAM_CHESS_LESSONS = [
  {
    id: 'rook-rays',
    order: 10,
    title: 'Rook Rays',
    subtitle: 'Straight lines',
    piece: 'r',
    pieceName: 'rook',
    fen: '7k/8/8/8/3R4/8/8/K7 w - - 0 1',
    pieceSquare: 'd4',
    goalSquare: 'd7',
    objective: 'Move the rook to the glowing star.',
    intro: 'Rooks travel in straight lines: up, down, left or right.',
    success: 'Lovely! Your rook travelled straight up the file.',
    hints: {
      notice: 'Look at the rook and the star. They are on the same file.',
      question: 'Which straight line reaches the star?',
      nudge: 'Try moving the rook upwards on the D-file.',
      show: 'Move the rook from D4 to D7.',
    },
  },
  {
    id: 'bishop-trails',
    order: 20,
    title: 'Bishop Trails',
    subtitle: 'Diagonal paths',
    piece: 'b',
    pieceName: 'bishop',
    fen: '7k/8/8/8/3B4/8/8/K7 w - - 0 1',
    pieceSquare: 'd4',
    goalSquare: 'g7',
    objective: 'Guide the bishop to the glowing star.',
    intro: 'Bishops glide diagonally and stay on the same colour squares.',
    success: 'Yes! The bishop followed a diagonal trail.',
    hints: {
      notice: 'The star sits diagonally away from the bishop.',
      question: 'Can you trace a sloping line from D4 to the star?',
      nudge: 'Follow the diagonal up and to the right.',
      show: 'Move the bishop from D4 to G7.',
    },
  },
  {
    id: 'knight-jumps',
    order: 30,
    title: 'Knight Jumps',
    subtitle: 'The L-shape',
    piece: 'n',
    pieceName: 'knight',
    fen: '7k/8/8/8/3N4/8/8/K7 w - - 0 1',
    pieceSquare: 'd4',
    goalSquare: 'f5',
    objective: 'Jump the knight onto the glowing star.',
    intro: 'Knights jump in an L: two squares one way, then one sideways.',
    success: 'Boing! That was a perfect knight jump.',
    hints: {
      notice: 'Knights can jump over other pieces and do not move in straight lines.',
      question: 'Can you find an L-shape that ends on the star?',
      nudge: 'Count two squares right, then one square up.',
      show: 'Move the knight from D4 to F5.',
    },
  },
  {
    id: 'pawn-steps',
    order: 40,
    title: 'Pawn Steps',
    subtitle: 'Forward first moves',
    piece: 'p',
    pieceName: 'pawn',
    fen: '7k/8/8/8/8/8/4P3/K7 w - - 0 1',
    pieceSquare: 'e2',
    goalSquare: 'e4',
    objective: 'Move the pawn to the glowing star.',
    intro: 'A pawn may move two squares forward on its very first move if the path is clear.',
    success: 'Great! That pawn used its two-square first move.',
    hints: {
      notice: 'The pawn has not moved yet, so it has a special first step available.',
      question: 'How far forward may a pawn move on its first move?',
      nudge: 'Look two squares ahead on the E-file.',
      show: 'Move the pawn from E2 to E4.',
    },
  },
] as const satisfies readonly SunbeamChessLessonDefinition[];

export function getSunbeamChessLesson(id: SunbeamChessLessonId): SunbeamChessLessonDefinition {
  const lesson = SUNBEAM_CHESS_LESSONS.find((definition) => definition.id === id);
  if (!lesson) {
    throw new Error(`Unknown Sunbeam Chess lesson: ${id}`);
  }
  return lesson;
}

export function validateSunbeamChessLesson(
  lesson: SunbeamChessLessonDefinition,
): readonly string[] {
  const problems: string[] = [];
  let chess: Chess;

  try {
    chess = new Chess(lesson.fen);
  } catch {
    return ['FEN is not a valid chess position.'];
  }

  if (chess.turn() !== 'w') {
    problems.push('Lesson positions must start with White to move.');
  }

  const piece = chess.get(lesson.pieceSquare);
  if (!piece || piece.color !== 'w' || piece.type !== lesson.piece) {
    problems.push(
      `Expected a white ${lesson.pieceName} on ${lesson.pieceSquare.toUpperCase()}.`,
    );
  }

  const legalMoves = chess.moves({ square: lesson.pieceSquare, verbose: true });
  if (!legalMoves.some((move) => move.to === lesson.goalSquare)) {
    problems.push(
      `${lesson.pieceSquare.toUpperCase()} -> ${lesson.goalSquare.toUpperCase()} must be legal.`,
    );
  }

  if (
    !lesson.hints.notice ||
    !lesson.hints.question ||
    !lesson.hints.nudge ||
    !lesson.hints.show
  ) {
    problems.push('Every lesson needs all four layered hints.');
  }

  return problems;
}
