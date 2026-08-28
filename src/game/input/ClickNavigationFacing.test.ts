import { describe, expect, it } from 'vitest';
import { parsePlayerFacing, resolveClickNavigationFacing } from './ClickNavigationFacing';

describe('click navigation facing', () => {
  it('keeps a stable facing when the remaining waypoint delta is negligible', () => {
    expect(resolveClickNavigationFacing(1.5, -1, 'left')).toBe('left');
    expect(resolveClickNavigationFacing(-1.5, 2, 'right')).toBe('right');
  });

  it('uses the dominant movement axis without alternating on a straight backwards path', () => {
    expect(resolveClickNavigationFacing(-180, 12, 'right')).toBe('left');
    expect(resolveClickNavigationFacing(-120, -18, 'left')).toBe('left');
    expect(resolveClickNavigationFacing(-72, 4, 'left')).toBe('left');
  });

  it('changes facing only when the path direction meaningfully changes', () => {
    expect(resolveClickNavigationFacing(8, -120, 'left')).toBe('up');
    expect(resolveClickNavigationFacing(95, 12, 'up')).toBe('right');
    expect(resolveClickNavigationFacing(-7, 80, 'right')).toBe('down');
  });

  it('parses persisted sprite facing defensively', () => {
    expect(parsePlayerFacing('left')).toBe('left');
    expect(parsePlayerFacing('unknown', 'right')).toBe('right');
    expect(parsePlayerFacing(null)).toBe('down');
  });
});
