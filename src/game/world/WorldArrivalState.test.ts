import { describe, expect, it } from 'vitest';
import {
  consumeWorldArrivalFacing,
  rememberWorldReturnState,
  setWorldArrivalFacing,
} from './WorldArrivalState';

describe('WorldArrivalState', () => {
  it('consumes an arrival facing only once', () => {
    setWorldArrivalFacing('TestScene', 'left');

    expect(consumeWorldArrivalFacing('TestScene')).toBe('left');
    expect(consumeWorldArrivalFacing('TestScene')).toBeNull();
  });

  it('captures exact return position and facing from a world player', () => {
    let spawn = { x: 0, y: 0 };

    rememberWorldReturnState(
      'ReturnScene',
      {
        x: 432,
        y: 765,
        getData: () => 'up',
      },
      (point) => {
        spawn = point;
      },
    );

    expect(spawn).toEqual({ x: 432, y: 765 });
    expect(consumeWorldArrivalFacing('ReturnScene')).toBe('up');
  });
});
