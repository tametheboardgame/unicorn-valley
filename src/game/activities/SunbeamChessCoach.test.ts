import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { getSunbeamChessCoachHint, reviewSunbeamChessCoachMove } from './SunbeamChessCoach';

function moveBySan(chess: Chess, san: string) {
  const move = chess.moves({ verbose: true }).find((candidate) => candidate.san === san);
  if (!move) {
    throw new Error(`Expected legal move ${san}`);
  }
  return move;
}

describe('SunbeamChessCoach', () => {
  it('warns when a major piece is moved where a much cheaper piece can take it', () => {
    const chess = new Chess('k7/8/8/8/3p4/8/3Q4/4K3 w - - 0 1');
    const move = moveBySan(chess, 'Qe3');

    const concern = reviewSunbeamChessCoachMove(chess, move);

    expect(concern?.kind).toBe('hanging-major-piece');
    expect(concern?.message).toContain('queen');
    expect(chess.fen()).toBe('k7/8/8/8/3p4/8/3Q4/4K3 w - - 0 1');
  });

  it('points out a safe free rook capture before an unrelated quiet move', () => {
    const chess = new Chess('4k3/r7/8/8/8/8/4P3/R3K3 w - - 0 1');
    const move = moveBySan(chess, 'e3');

    const concern = reviewSunbeamChessCoachMove(chess, move);

    expect(concern?.kind).toBe('missed-free-capture');
    expect(concern?.suggestedTo).toBe('a7');
  });

  it('does not interrupt a normal opening move just because another move scores better', () => {
    const chess = new Chess();
    const move = moveBySan(chess, 'e4');

    expect(reviewSunbeamChessCoachMove(chess, move)).toBeNull();
  });

  it('builds hints in layers and only reveals the move at the final stage', () => {
    const chess = new Chess();

    const notice = getSunbeamChessCoachHint(chess, 0);
    const question = getSunbeamChessCoachHint(chess, 1);
    const nudge = getSunbeamChessCoachHint(chess, 2);
    const reveal = getSunbeamChessCoachHint(chess, 3);

    expect(notice?.from).toBeUndefined();
    expect(question?.from).toBeUndefined();
    expect(nudge?.from).toBeDefined();
    expect(nudge?.to).toBeUndefined();
    expect(reveal?.from).toBeDefined();
    expect(reveal?.to).toBeDefined();
  });
});
