import { describe, expect, it } from 'vitest';
import { COTTAGE_INTERIOR_LOCATION_ID } from './CottageInteriorMap';
import { CRYSTAL_BROOK_LOCATION_ID, CRYSTAL_BROOK_MAP } from './CrystalBrookMap';
import { MOONFLOWER_GLADE_MAP } from './MoonflowerGladeMap';
import { RAINBOW_MEADOW_LOCATION_ID, RAINBOW_MEADOW_MAP } from './RainbowMeadowMap';
import {
  VALLEY_HOME_NODE_ID,
  VALLEY_MAP_CONNECTIONS,
  VALLEY_MAP_NODES,
  getHomewardNextNode,
  getPhysicalValleyConnections,
  getPhysicalValleyRoute,
  getValleyMapNodeForLocation,
} from './ValleyMapTopology';
import { WHISPERING_WOODS_LOCATION_ID, WHISPERING_WOODS_MAP } from './WhisperingWoodsMap';

describe('R5-WP5.9E/G Valley map topology', () => {
  it('resolves home and every current R5 exploration region from save location IDs', () => {
    expect(getValleyMapNodeForLocation('moonflower-cottage')?.kind).toBe('home');
    expect(getValleyMapNodeForLocation(COTTAGE_INTERIOR_LOCATION_ID)?.id).toBe(
      VALLEY_HOME_NODE_ID,
    );
    expect(getValleyMapNodeForLocation(RAINBOW_MEADOW_LOCATION_ID)?.label).toBe('Rainbow Meadow');
    expect(getValleyMapNodeForLocation(CRYSTAL_BROOK_LOCATION_ID)?.label).toBe('Crystal Brook');
    expect(getValleyMapNodeForLocation(WHISPERING_WOODS_LOCATION_ID)?.label).toBe(
      'Whispering Woods',
    );
  });

  it('keeps implemented region travel physical while exposing real side branches', () => {
    const physical = VALLEY_MAP_CONNECTIONS.filter(({ kind }) => kind === 'physical');
    const sideNodes = VALLEY_MAP_NODES.filter(({ kind }) => kind === 'side');

    expect(physical).toHaveLength(9);
    expect(sideNodes.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        'valley:moonflower-field',
        'valley:rainbow-run',
        'valley:prism-grotto',
        'valley:lantern-clearing',
      ]),
    );
    expect(sideNodes.every(({ locationIds }) => locationIds.length === 0)).toBe(true);
    expect(getPhysicalValleyConnections('valley:crystal-brook')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: 'valley:crystal-brook' }),
        expect.objectContaining({ from: 'valley:crystal-brook' }),
        expect.objectContaining({ to: 'valley:prism-grotto' }),
      ]),
    );
    expect(getPhysicalValleyConnections('valley:moonflower-glade')).toHaveLength(3);
    expect(getPhysicalValleyConnections('valley:rainbow-meadow')).toHaveLength(3);
    expect(getPhysicalValleyConnections('valley:crystal-brook')).toHaveLength(3);
  });

  it('maps side destinations to places that already exist in the playable world', () => {
    expect(MOONFLOWER_GLADE_MAP.landmarks.some(({ id }) => id === 'moonflower-field')).toBe(true);
    expect(RAINBOW_MEADOW_MAP.hubFeatures.some(({ id }) => id === 'rainbow-run-entrance')).toBe(
      true,
    );
    expect(CRYSTAL_BROOK_MAP.secretRoutes.some(({ id }) => id === 'prism-grotto-route')).toBe(true);
    expect(WHISPERING_WOODS_MAP.landmarks.some(({ id }) => id === 'lantern-clearing')).toBe(true);
  });

  it('provides a stable physical route home from regions and side destinations', () => {
    expect(getHomewardNextNode('valley:whispering-woods')?.id).toBe('valley:crystal-brook');
    expect(getHomewardNextNode('valley:crystal-brook')?.id).toBe('valley:rainbow-meadow');
    expect(getHomewardNextNode('valley:rainbow-meadow')?.id).toBe('valley:sunbeam-village');
    expect(getHomewardNextNode('valley:sunbeam-village')?.id).toBe('valley:moonflower-glade');
    expect(getHomewardNextNode('valley:moonflower-glade')?.id).toBe(VALLEY_HOME_NODE_ID);
    expect(getHomewardNextNode('valley:prism-grotto')?.id).toBe('valley:crystal-brook');
    expect(getHomewardNextNode(VALLEY_HOME_NODE_ID)).toBeNull();
    expect(getPhysicalValleyRoute('valley:lantern-clearing', VALLEY_HOME_NODE_ID)).toEqual([
      'valley:lantern-clearing',
      'valley:whispering-woods',
      'valley:crystal-brook',
      'valley:rainbow-meadow',
      'valley:sunbeam-village',
      'valley:moonflower-glade',
      VALLEY_HOME_NODE_ID,
    ]);
  });

  it('records a concrete revisit reason for every current major region', () => {
    const majorNodes = VALLEY_MAP_NODES.filter(({ kind }) => kind === 'home' || kind === 'region');
    expect(majorNodes.length).toBeGreaterThanOrEqual(6);
    expect(
      majorNodes.every((node) => 'revisitHint' in node && Boolean(node.revisitHint.trim())),
    ).toBe(true);
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
