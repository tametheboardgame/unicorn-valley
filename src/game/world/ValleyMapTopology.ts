import { MOONFLOWER_GLADE_LOCATION_ID } from '../save/saveLocationCheckpoint';
import { COTTAGE_INTERIOR_LOCATION_ID } from './CottageInteriorMap';
import { CRYSTAL_BROOK_LOCATION_ID } from './CrystalBrookMap';
import { RAINBOW_MEADOW_LOCATION_ID } from './RainbowMeadowMap';
import { STARLIGHT_BEACH_LOCATION_ID } from './StarlightBeachMap';
import { SUNBEAM_VILLAGE_LOCATION_ID } from './SunbeamVillageMap';
import { WHISPERING_WOODS_LOCATION_ID } from './WhisperingWoodsMap';

export type ValleyMapNodeKind = 'home' | 'region' | 'side' | 'future';
export type ValleyMapConnectionKind = 'physical' | 'planned';

export interface ValleyMapNode {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  kind: ValleyMapNodeKind;
  locationIds: readonly string[];
  revisitHint?: string;
}

export interface ValleyMapConnection {
  from: string;
  to: string;
  kind: ValleyMapConnectionKind;
}

export const VALLEY_HOME_NODE_ID = 'valley:moonflower-home';

export const VALLEY_MAP_NODES = [
  {
    id: VALLEY_HOME_NODE_ID,
    label: 'Moonflower Cottage',
    icon: '🏡',
    x: 0.12,
    y: 0.58,
    kind: 'home',
    locationIds: ['moonflower-cottage', COTTAGE_INTERIOR_LOCATION_ID],
    revisitHint: 'Cottage, garden and familiar Moonflower paths.',
  },
  {
    id: 'valley:moonflower-glade',
    label: 'Moonflower Glade',
    icon: '🌸',
    x: 0.27,
    y: 0.5,
    kind: 'region',
    locationIds: [MOONFLOWER_GLADE_LOCATION_ID],
    revisitHint: 'Moonflower Field, Hollow Tree and home discoveries.',
  },
  {
    id: 'valley:sunbeam-village',
    label: 'Sunbeam Village',
    icon: '☀️',
    x: 0.44,
    y: 0.34,
    kind: 'region',
    locationIds: [SUNBEAM_VILLAGE_LOCATION_ID],
    revisitHint: 'Friends, shops, the fountain and changing character moments.',
  },
  {
    id: 'valley:rainbow-meadow',
    label: 'Rainbow Meadow',
    icon: '🌈',
    x: 0.58,
    y: 0.58,
    kind: 'region',
    locationIds: [RAINBOW_MEADOW_LOCATION_ID],
    revisitHint: 'Rainbow Run, race rewards and meadow discoveries.',
  },
  {
    id: 'valley:crystal-brook',
    label: 'Crystal Brook',
    icon: '💎',
    x: 0.73,
    y: 0.34,
    kind: 'region',
    locationIds: [CRYSTAL_BROOK_LOCATION_ID],
    revisitHint: 'River treasures, Crystal Cascade and Prism Grotto.',
  },
  {
    id: 'valley:whispering-woods',
    label: 'Whispering Woods',
    icon: '🌲',
    x: 0.88,
    y: 0.57,
    kind: 'region',
    locationIds: [WHISPERING_WOODS_LOCATION_ID],
    revisitHint: 'Firefly Lantern, woodland discoveries and magical weather.',
  },
  {
    id: 'valley:starlight-beach',
    label: 'Starlight Beach',
    icon: '🏖️',
    x: 0.94,
    y: 0.79,
    kind: 'region',
    locationIds: [STARLIGHT_BEACH_LOCATION_ID],
    revisitHint: 'Starlight Shells, Tide Pools, Star Dunes and Moonlit Point.',
  },
  {
    id: 'valley:moonflower-field',
    label: 'Moonflower Field',
    icon: '🌺',
    x: 0.29,
    y: 0.8,
    kind: 'side',
    locationIds: [],
  },
  {
    id: 'valley:rainbow-run',
    label: 'Rainbow Run',
    icon: '🏁',
    x: 0.49,
    y: 0.81,
    kind: 'side',
    locationIds: [],
  },
  {
    id: 'valley:prism-grotto',
    label: 'Prism Grotto',
    icon: '🌈',
    x: 0.73,
    y: 0.62,
    kind: 'side',
    locationIds: [],
  },
  {
    id: 'valley:lantern-clearing',
    label: 'Lantern Clearing',
    icon: '🏮',
    x: 0.95,
    y: 0.31,
    kind: 'side',
    locationIds: [],
  },
  {
    id: 'valley:future-north',
    label: 'Unrevealed path',
    icon: '?',
    x: 0.59,
    y: 0.12,
    kind: 'future',
    locationIds: [],
  },
  {
    id: 'valley:future-south',
    label: 'Unrevealed path',
    icon: '?',
    x: 0.72,
    y: 0.88,
    kind: 'future',
    locationIds: [],
  },
] as const satisfies readonly ValleyMapNode[];

export const VALLEY_MAP_CONNECTIONS = [
  { from: VALLEY_HOME_NODE_ID, to: 'valley:moonflower-glade', kind: 'physical' },
  { from: 'valley:moonflower-glade', to: 'valley:sunbeam-village', kind: 'physical' },
  { from: 'valley:sunbeam-village', to: 'valley:rainbow-meadow', kind: 'physical' },
  { from: 'valley:rainbow-meadow', to: 'valley:crystal-brook', kind: 'physical' },
  { from: 'valley:crystal-brook', to: 'valley:whispering-woods', kind: 'physical' },
  { from: 'valley:whispering-woods', to: 'valley:starlight-beach', kind: 'physical' },
  { from: 'valley:moonflower-glade', to: 'valley:moonflower-field', kind: 'physical' },
  { from: 'valley:rainbow-meadow', to: 'valley:rainbow-run', kind: 'physical' },
  { from: 'valley:crystal-brook', to: 'valley:prism-grotto', kind: 'physical' },
  { from: 'valley:whispering-woods', to: 'valley:lantern-clearing', kind: 'physical' },
  { from: 'valley:sunbeam-village', to: 'valley:future-north', kind: 'planned' },
  { from: 'valley:future-north', to: 'valley:crystal-brook', kind: 'planned' },
  { from: 'valley:rainbow-meadow', to: 'valley:future-south', kind: 'planned' },
  { from: 'valley:future-south', to: 'valley:whispering-woods', kind: 'planned' },
] as const satisfies readonly ValleyMapConnection[];

export function getValleyMapNode(nodeId: string): ValleyMapNode | null {
  return VALLEY_MAP_NODES.find((node) => node.id === nodeId) ?? null;
}

export function getValleyMapNodeForLocation(locationId: string): ValleyMapNode | null {
  return (
    VALLEY_MAP_NODES.find((node) => (node.locationIds as readonly string[]).includes(locationId)) ??
    null
  );
}

export function getPhysicalValleyConnections(nodeId: string): readonly ValleyMapConnection[] {
  return VALLEY_MAP_CONNECTIONS.filter(
    (connection) =>
      connection.kind === 'physical' && (connection.from === nodeId || connection.to === nodeId),
  );
}

function getPhysicalNeighbourIds(nodeId: string): readonly string[] {
  return getPhysicalValleyConnections(nodeId).map((connection) =>
    connection.from === nodeId ? connection.to : connection.from,
  );
}

export function getPhysicalValleyRoute(fromNodeId: string, toNodeId: string): readonly string[] {
  if (!getValleyMapNode(fromNodeId) || !getValleyMapNode(toNodeId)) {
    return [];
  }
  if (fromNodeId === toNodeId) {
    return [fromNodeId];
  }

  const queue: string[][] = [[fromNodeId]];
  const visited = new Set([fromNodeId]);
  while (queue.length > 0) {
    const route = queue.shift();
    if (!route) {
      break;
    }
    const current = route[route.length - 1];
    for (const neighbour of getPhysicalNeighbourIds(current)) {
      if (visited.has(neighbour)) {
        continue;
      }
      const nextRoute = [...route, neighbour];
      if (neighbour === toNodeId) {
        return nextRoute;
      }
      visited.add(neighbour);
      queue.push(nextRoute);
    }
  }
  return [];
}

export function getHomewardNextNode(nodeId: string): ValleyMapNode | null {
  const route = getPhysicalValleyRoute(nodeId, VALLEY_HOME_NODE_ID);
  return route.length > 1 ? getValleyMapNode(route[1]) : null;
}
