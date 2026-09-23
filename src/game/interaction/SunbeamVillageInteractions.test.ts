import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { createSunbeamVillageInteractions } from './SunbeamVillageInteractions';

describe('Sunbeam Village interaction ownership', () => {
  it('publishes the complete canonical village target set with unique IDs', () => {
    const scene = {} as Phaser.Scene;
    const targets = createSunbeamVillageInteractions(scene);
    const ids = targets.map(({ id }) => id);

    expect(ids).toEqual([
      'interaction:village-bakery',
      'interaction:village-accessory-shop',
      'interaction:village-library',
      'interaction:village-fountain',
      'interaction:village-willow',
      'interaction:village-marigold',
      'interaction:village-pebble',
      'interaction:village-residence-rosehip',
      'interaction:village-residence-bluebell',
      'interaction:village-residence-sunpetal',
      'interaction:village-south-gate',
      'interaction:village-glade-gate',
      'interaction:village-meadow-gate',
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses one automatic convention for both village exits', () => {
    const scene = {} as Phaser.Scene;
    const targets = createSunbeamVillageInteractions(scene);
    const exits = targets.filter(({ id }) =>
      ['interaction:village-glade-gate', 'interaction:village-meadow-gate'].includes(id),
    );

    expect(exits).toHaveLength(2);
    expect(exits.every(({ actionKind }) => actionKind === 'enter')).toBe(true);
    expect(exits.every(({ activationMode }) => activationMode === 'automatic')).toBe(true);
    expect(exits.every(({ result }) => result.type === 'callback')).toBe(true);
  });

  it('keeps every player-facing village verb on the shared semantic action contract', () => {
    const scene = {} as Phaser.Scene;
    const targets = createSunbeamVillageInteractions(scene);
    const byId = new Map(targets.map((target) => [target.id, target]));

    expect(byId.get('interaction:village-willow')?.actionKind).toBe('talk');
    expect(byId.get('interaction:village-marigold')?.actionKind).toBe('talk');
    expect(byId.get('interaction:village-pebble')?.actionKind).toBe('talk');
    expect(byId.get('interaction:village-fountain')?.actionKind).toBe('inspect');
    expect(byId.get('interaction:village-south-gate')?.actionKind).toBe('inspect');
    expect(byId.get('interaction:village-residence-rosehip')?.actionKind).toBe('interact');
    expect(byId.get('interaction:village-residence-bluebell')?.actionKind).toBe('interact');
    expect(byId.get('interaction:village-residence-sunpetal')?.actionKind).toBe('interact');
  });
});
