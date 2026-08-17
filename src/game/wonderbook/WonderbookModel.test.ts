import { describe, expect, it } from 'vitest';
import type { DiscoveryDefinition } from '../../content/contentTypes';
import { buildWonderbookEntries } from './WonderbookModel';

const discoveries = [
  {
    id: 'discovery:first',
    name: 'First Secret',
    description: 'The first secret.',
  },
  {
    id: 'discovery:second',
    name: 'Second Secret',
    description: 'The second secret.',
  },
] satisfies readonly DiscoveryDefinition[];

describe('buildWonderbookEntries', () => {
  it('marks saved discoveries without mutating content', () => {
    const result = buildWonderbookEntries(discoveries, ['discovery:second']);

    expect(result).toEqual([
      {
        id: 'discovery:first',
        name: 'First Secret',
        description: 'The first secret.',
        discovered: false,
      },
      {
        id: 'discovery:second',
        name: 'Second Secret',
        description: 'The second secret.',
        discovered: true,
      },
    ]);
    expect(discoveries[0].name).toBe('First Secret');
  });
});
