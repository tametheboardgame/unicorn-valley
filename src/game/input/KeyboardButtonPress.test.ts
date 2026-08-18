import { describe, expect, it } from 'vitest';
import { resolvePressedButtonActions } from './KeyboardButtonPress';

describe('resolvePressedButtonActions', () => {
  it('lets one physical key trigger every action that shares it', () => {
    const space = { key: 'SPACE' };
    const enter = { key: 'ENTER' };
    const actions = resolvePressedButtonActions(
      {
        INTERACT: [space, enter],
        RACE_JUMP: [space],
      },
      new Set([space]),
    );

    expect(actions).toEqual(new Set(['INTERACT', 'RACE_JUMP']));
  });
});
