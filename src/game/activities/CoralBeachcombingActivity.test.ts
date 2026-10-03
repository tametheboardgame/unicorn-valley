import { describe, expect, it } from 'vitest';
import { getNextSandboxBeachcombingTrail } from './CoralBeachcombingActivity';

describe('Coral Beachcombing sandbox rotation', () => {
  it('cycles through trails without needing adventure-save progress', () => {
    const first = getNextSandboxBeachcombingTrail();
    const second = getNextSandboxBeachcombingTrail(first);
    const third = getNextSandboxBeachcombingTrail(second);
    const wrapped = getNextSandboxBeachcombingTrail(third);

    expect([first, second, third]).toEqual(['crab-tracks', 'tidepool-star', 'moon-shell']);
    expect(wrapped).toBe('crab-tracks');
  });
});
