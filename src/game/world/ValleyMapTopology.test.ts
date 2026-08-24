import { describe, expect, it } from 'vitest';
import { CRYSTAL_BROOK_LOCATION_ID } from './CrystalBrookMap';
import { RAINBOW_MEADOW_LOCATION_ID } from './RainbowMeadowMap';
import {
  VALLEY_MAP_CONNECTIONS,
  VALLEY_MAP_NODES,
  getPhysicalValleyConnections,
  getValleyMapNodeForLocation,
} from './ValleyMapTopology';
import { WHISPERING_WOODS_LOCATION_ID } from './WhisperingWoodsMap';

describe('R5-WP5.9E Valley map topology', () => {
  it('resolves home and every current R5 exploration region from save location IDs', () => {
    expect(getValleyMapNodeForLocation('moonflower-cottage')?.kind).toBe('home');
    expect(getValleyMapNodeForLocation(RAINBOW_MEADOW_LOCATION_ID)?.label).toBe('Rainbow Meadow');
    expect(getValleyMapNodeForLocation(CRYSTAL_BROOK_LOCATION_ID)?.label).toBe('Crystal Brook');
    expect(getValleyMapNodeForLocation(WHISPERING_WOODS_LOCATION_ID)?.label).toBe(
      'Whispering Woods',
    );
  });

  it('keeps implemented travel links explicitly physical', () => {
    const physical = VALLEY_MAP_CONNECTIONS.filter(({ kind }) => kind === 'physical');

    expect(physical).toHaveLength(5);
    expect(getPhysicalValleyConnections('valley:crystal-brook')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: 'valley:crystal-brook' }),
        expect.objectContaining({ from: 'valley:crystal-brook' }),
      ]),
    );
  });

  it('reserves anonymous future branches without presenting them as implemented travel', () => {
    const futureNodes = VALLEY_MAP_NODES.filter(({ kind }) => kind === 'future');
    const planned = VALLEY_MAP_CONNECTIONS.filter(({ kind }) => kind === 'planned');

    expect(futureNodes.length).toBeGreaterThanOrEqual(2);
    expect(
      futureNodes.every(
        ({ label, locationIds }) => label === 'Unrevealed path' && locationIds.length === 0,
      ),
    ).toBe(true);
    expect(planned.length).toBeGreaterThanOrEqual(4);
  });
});
