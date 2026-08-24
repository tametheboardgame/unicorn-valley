import { describe, expect, it } from 'vitest';
import type { DiscoveryDefinition } from '../../content/contentTypes';
import { buildWonderbookEntries, paginateWonderbookEntries } from './WonderbookModel';

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
        kind: 'standard',
        icon: undefined,
        undiscoveredHint: undefined,
      },
      {
        id: 'discovery:second',
        name: 'Second Secret',
        description: 'The second secret.',
        discovered: true,
        kind: 'standard',
        icon: undefined,
        undiscoveredHint: undefined,
      },
    ]);
    expect(discoveries[0].name).toBe('First Secret');
  });

  it('surfaces a discovered secret before ordinary entries and keeps undiscovered secrets later', () => {
    const secretDiscoveries = [
      ...discoveries,
      {
        id: 'discovery:hidden-one',
        name: 'Hidden One',
        description: 'A hidden Wonderbook secret.',
        kind: 'secret',
        icon: '✨',
        undiscoveredHint: 'Look somewhere quiet.',
      },
      {
        id: 'discovery:hidden-two',
        name: 'Hidden Two',
        description: 'Another hidden Wonderbook secret.',
        kind: 'secret',
      },
    ] satisfies readonly DiscoveryDefinition[];

    const result = buildWonderbookEntries(secretDiscoveries, ['discovery:hidden-one']);

    expect(result.map(({ id }) => id)).toEqual([
      'discovery:hidden-one',
      'discovery:first',
      'discovery:second',
      'discovery:hidden-two',
    ]);
    expect(result[0]).toMatchObject({
      kind: 'secret',
      discovered: true,
      icon: '✨',
      undiscoveredHint: 'Look somewhere quiet.',
    });
  });
});

describe('paginateWonderbookEntries', () => {
  it('keeps two entries on each visible page and carries overflow onto a new spread', () => {
    const entries = buildWonderbookEntries(
      Array.from({ length: 9 }, (_, index) => ({
        id: `discovery:page-${index}`,
        name: `Discovery ${index}`,
        description: `Description ${index}`,
      })) satisfies readonly DiscoveryDefinition[],
      [],
    );

    const spreads = paginateWonderbookEntries(entries);

    expect(spreads).toHaveLength(3);
    expect(spreads[0].left).toHaveLength(2);
    expect(spreads[0].right).toHaveLength(2);
    expect(spreads[1].left).toHaveLength(2);
    expect(spreads[1].right).toHaveLength(2);
    expect(spreads[2].left).toHaveLength(1);
    expect(spreads[2].right).toHaveLength(0);
    expect(spreads.map(({ leftPageNumber, rightPageNumber }) => [leftPageNumber, rightPageNumber])).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it('still produces one empty spread when the registry has no entries', () => {
    expect(paginateWonderbookEntries([])).toEqual([
      {
        index: 0,
        leftPageNumber: 1,
        rightPageNumber: 2,
        left: [],
        right: [],
      },
    ]);
  });
});
