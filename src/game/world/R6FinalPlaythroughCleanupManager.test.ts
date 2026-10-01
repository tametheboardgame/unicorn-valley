import { describe, expect, it } from 'vitest';
import { LEGACY_GATEWAY_LABEL_TARGETS } from './R6FinalPlaythroughCleanup';

describe('R6 final playthrough cleanup', () => {
  it('covers every production gateway that still has an R5 sign beneath it', () => {
    expect(LEGACY_GATEWAY_LABEL_TARGETS.map((target) => target.id)).toEqual([
      'meadow-crystal-brook',
      'crystal-brook-meadow',
      'crystal-brook-whispering-woods',
      'whispering-woods-crystal-brook',
      'crystal-brook-crystal-cascade',
    ]);
  });
});
