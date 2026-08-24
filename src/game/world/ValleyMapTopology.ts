import { CRYSTAL_BROOK_LOCATION_ID } from './CrystalBrookMap';
import { RAINBOW_MEADOW_LOCATION_ID } from './RainbowMeadowMap';
import { MOONFLOWER_GLADE_LOCATION_ID } from '../save/saveLocationCheckpoint';
import { SUNBEAM_VILLAGE_LOCATION_ID } from './SunbeamVillageMap';
import { WHISPERING_WOODS_LOCATION_ID } from './WhisperingWoodsMap';

export type ValleyMapNodeKind = 'home' | 'region' | 'future';
export type ValleyMapConnectionKind = 'physical' | 'planned';

export interface ValleyMapNode {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  kind: ValleyMapNodeKind;
  locationIds: readonly string[];
}

export interface ValleyMapConnection {
  from: string;
  to: string;
  kind: ValleyMapConnectionKind;
}

export const VALLEY_MAP_NODES = [
  {
    id: 'valley:moonflower-home',
    label: 'Moonflower Cottage',
    icon: '🏡',
    x: 0.12,
    y: 0.58,
    kind: 'home',
    locationIds: ['moonflower-cottage'],
  },
  {
    id: 'valley:moonflower-glade',
    label: 'Moonflower Glade',
    icon: '🌸',
    x: 0.27,
    y: 0.5,
    kind: 'region',
    locationIds: [MOONFLOWER_GLADE_LOCATION_ID],
  },
  {
    id: 'valley:sunbeam-village',
    label: 'Sunbeam Village',
    icon: '☀️',
    x: 0.44,
    y: 0.34,
    kind: 'region',
    locationIds: [SUNBEAM_VILLAGE_LOCATION_ID],
  },
  {
    id: 'valley:rainbow-meadow',
    label: 'Rainbow Meadow',
    icon: '🌈',
    x: 0.58,
    y: 0.58,
    kind: 'region',
    locationIds: [RAINBOW_MEADOW_LOCATION_ID],
  },
  {
    id: 'valley:crystal-brook',
    label: 'Crystal Brook',
    icon: '💎',
    x: 0.73,
    y: 0.34,
    kind: 'region',
    locationIds: [CRYSTAL_BROOK_LOCATION_ID],
  },
  {
    id: 'valley:whispering-woods',
    label: 'Whispering Woods',
    icon: '🌲',
    x: 0.88,
    y: 0.57,
    kind: 'region',
    locationIds: [WHISPERING_WOODS_LOCATION_ID],
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
    x: 0.76,
    y: 0.82,
    kind: 'future',
    locationIds: [],
  },
] as const satisfies readonly ValleyMapNode[];

export const VALLEY_MAP_CONNECTIONS = [
  { from: 'valley:moonflower-home', to: 'valley:moonflower-glade', kind: 'physical' },
  { from: 'valley:moonflower-glade', to: 'valley:sunbeam-village', kind: 'physical' },
  { from: 'valley:sunbeam-village', to: 'valley:rainbow-meadow', kind: 'physical' },
  { from: 'valley:rainbow-meadow', to: 'valley:crystal-brook', kind: 'physical' },
  { from: 'valley:crystal-brook', to: 'valley:whispering-woods', kind: 'physical' },
  { from: 'valley:sunbeam-village', to: 'valley:future-north', kind: 'planned' },
  { from: 'valley:future-north', to: 'valley:crystal-brook', kind: 'planned' },
  { from: 'valley:rainbow-meadow', to: 'valley:future-south', kind: 'planned' },
  { from: 'valley:future-south', to: 'valley:whispering-woods', kind: 'planned' },
] as const satisfies readonly ValleyMapConnection[];

export function getValleyMapNode(nodeId: string): ValleyMapNode | null {
  return VALLEY_MAP_NODES.find((node) => node.id === nodeId) ?? null;
}

export function getValleyMapNodeForLocation(locationId: string): ValleyMapNode | null {
  return VALLEY_MAP_NODES.find((node) => node.locationIds.includes(locationId)) ?? null;
}

export function getPhysicalValleyConnections(nodeId: string): readonly ValleyMapConnection[] {
  return VALLEY_MAP_CONNECTIONS.filter(
    (connection) =>
      connection.kind === 'physical' && (connection.from === nodeId || connection.to === nodeId),
  );
}
