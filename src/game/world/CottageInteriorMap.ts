import type { CollisionRectangle, MapPoint, TraversalMapDefinition } from './MapTraversal';

export const COTTAGE_INTERIOR_LOCATION_ID = 'location:moonflower-cottage-interior';

export type CottageDecorationCategory = 'wall' | 'floor' | 'table' | 'shelf' | 'display';

export interface CottageDecorationSlot {
  id: string;
  label: string;
  category: CottageDecorationCategory;
  position: MapPoint;
  interactionPosition?: MapPoint;
}

export interface CottageInteractionPoint {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
}

export const COTTAGE_INTERIOR_MAP = {
  width: 1800,
  height: 1200,
  margin: 70,
  playerSpawn: { x: 900, y: 820 },
  colliders: [
    // The illustrated back wall ends at the skirting seam at y=390. The player's
    // physics body represents its feet, so this blocker ends at the visible floor.
    { id: 'wall-top', x: 900, y: 230, width: 1640, height: 320 },
    { id: 'wall-left', x: 105, y: 610, width: 70, height: 1010 },
    { id: 'wall-right', x: 1695, y: 610, width: 70, height: 1010 },
    { id: 'wall-bottom', x: 900, y: 1150, width: 1640, height: 100 },
    { id: 'fireplace', x: 285, y: 305, width: 250, height: 150 },
    { id: 'bed', x: 390, y: 670, width: 300, height: 230 },
    { id: 'tea-table', x: 900, y: 500, width: 230, height: 165 },
    { id: 'sofa', x: 1245, y: 735, width: 300, height: 145 },
    { id: 'treasure-shelf', x: 1515, y: 345, width: 220, height: 95 },
  ] satisfies readonly CollisionRectangle[],
  exit: {
    id: 'cottage-exit',
    label: 'Moonflower Glade',
    position: { x: 900, y: 1110 },
    approach: { x: 900, y: 1010 },
  },
  treasureDisplay: {
    id: 'treasure-display',
    label: 'Treasure Shelf',
    position: { x: 1515, y: 345 },
    approach: { x: 1310, y: 470 },
  },
  decorationSlots: [
    {
      id: 'cottage-slot:window-nook',
      label: 'Window nook',
      category: 'table',
      position: { x: 705, y: 320 },
      interactionPosition: { x: 705, y: 455 },
    },
    {
      id: 'cottage-slot:centre-rug',
      label: 'Centre rug',
      category: 'floor',
      position: { x: 900, y: 790 },
    },
    {
      id: 'cottage-slot:cosy-corner',
      label: 'Cosy corner',
      category: 'floor',
      position: { x: 1450, y: 735 },
    },
    {
      id: 'cottage-slot:bedside',
      label: 'Bedside table',
      category: 'table',
      position: { x: 610, y: 720 },
    },
    {
      id: 'cottage-slot:left-wall',
      label: 'Left wall',
      category: 'wall',
      position: { x: 500, y: 300 },
      interactionPosition: { x: 500, y: 445 },
    },
    {
      id: 'cottage-slot:right-wall',
      label: 'Right wall',
      category: 'wall',
      position: { x: 1320, y: 270 },
      interactionPosition: { x: 1320, y: 445 },
    },
    {
      id: 'cottage-slot:tea-table',
      label: 'Tea table',
      category: 'table',
      position: { x: 900, y: 455 },
      interactionPosition: { x: 900, y: 650 },
    },
    {
      id: 'cottage-slot:treasure-shelf',
      label: 'Treasure shelf',
      category: 'shelf',
      position: { x: 1515, y: 335 },
      interactionPosition: { x: 1515, y: 500 },
    },
    {
      id: 'cottage-slot:ribbon-display',
      label: 'Fireplace display',
      category: 'display',
      position: { x: 390, y: 210 },
      interactionPosition: { x: 500, y: 430 },
    },
  ] satisfies readonly CottageDecorationSlot[],
} satisfies TraversalMapDefinition & {
  exit: CottageInteractionPoint;
  treasureDisplay: CottageInteractionPoint;
  decorationSlots: readonly CottageDecorationSlot[];
};
