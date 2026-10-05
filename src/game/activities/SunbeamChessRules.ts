import { Chess, type Move } from 'chess.js';
import { chooseSunbeamChessOpponentMove } from './SunbeamChessOpponent';

const PIECE_NAMES = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
} as const;

function sideName(colour: 'w' | 'b'): string {
  return colour === 'w' ? 'White' : 'Black';
}

export function chooseVillageChessMove(chess: Chess): Move | null {
  return chooseSunbeamChessOpponentMove(chess, 'sunbeam');
}

export function chooseTeachingMove(chess: Chess): Move | null {
  return chooseVillageChessMove(chess);
}

export function describeTeachingMove(move: Move): string {
  const piece = PIECE_NAMES[move.piece];
  if (move.san.includes('#')) {
    return `${move.san} is checkmate — the king has no legal escape.`;
  }
  if (move.san.includes('+')) {
    return `${move.san} gives check, so the opponent must answer the threat to their king.`;
  }
  if (move.san === 'O-O' || move.san === 'O-O-O') {
    return `${move.san} castles: it moves your king to safety and brings a rook into play.`;
  }
  if (move.promotion) {
    return `${move.san} promotes your pawn to a ${PIECE_NAMES[move.promotion]}.`;
  }
  if (move.captured) {
    return `${move.san} lets your ${piece} capture a ${PIECE_NAMES[move.captured]}.`;
  }
  if (move.piece === 'n' || move.piece === 'b') {
    return `${move.san} develops your ${piece} and helps bring more pieces into the game.`;
  }
  if (move.piece === 'p' && ['d4', 'd5', 'e4', 'e5'].includes(move.to)) {
    return `${move.san} puts a pawn in the centre, where it helps control important squares.`;
  }
  return `${move.san} is a legal move. Look at what your ${piece} will attack or defend afterwards.`;
}

export function describeChessPosition(chess: Chess): string {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'Black' : 'White';
    return `Checkmate. ${winner} wins — the checked king has no legal reply.`;
  }
  if (chess.isStalemate()) {
    return 'Stalemate. The player to move is not in check but has no legal move, so the game is a draw.';
  }
  if (chess.isThreefoldRepetition()) {
    return 'Draw by threefold repetition: the same position has appeared three times.';
  }
  if (chess.isInsufficientMaterial()) {
    return 'Draw by insufficient material: neither side has enough pieces left to force checkmate.';
  }
  if (chess.isDraw()) {
    return 'The game is drawn.';
  }
  if (chess.isCheck()) {
    return `${sideName(chess.turn())} is in check. The next move must move the king, capture the attacker, or block the attack.`;
  }

  const moveCount = chess.history().length;
  if (moveCount < 8) {
    return 'Opening idea: fight for the centre, develop your knights and bishops, and get your king safe.';
  }
  if (moveCount < 24) {
    return 'Middlegame idea: look for checks, captures and threats before choosing your move.';
  }
  return 'Endgame idea: keep your king active and look for safe ways to promote your pawns.';
}
