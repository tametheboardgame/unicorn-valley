export interface SunbeamVillageDistrict {
  id:
    | 'west-approach'
    | 'high-street'
    | 'central-plaza'
    | 'willow-garden'
    | 'residential'
    | 'east-approach';
  centre: { x: number; y: number };
  radiusX: number;
  radiusY: number;
}

export const SUNBEAM_VILLAGE_LAYOUT = {
  map: {
    width: 3000,
    height: 1900,
    margin: 90,
  },
  districts: [
    {
      id: 'west-approach',
      centre: { x: 340, y: 950 },
      radiusX: 300,
      radiusY: 250,
    },
    {
      id: 'high-street',
      centre: { x: 1500, y: 500 },
      radiusX: 1120,
      radiusY: 330,
    },
    {
      id: 'central-plaza',
      centre: { x: 1500, y: 1050 },
      radiusX: 520,
      radiusY: 320,
    },
    {
      id: 'willow-garden',
      centre: { x: 650, y: 1450 },
      radiusX: 430,
      radiusY: 300,
    },
    {
      id: 'residential',
      centre: { x: 2200, y: 1460 },
      radiusX: 600,
      radiusY: 310,
    },
    {
      id: 'east-approach',
      centre: { x: 2700, y: 950 },
      radiusX: 280,
      radiusY: 250,
    },
  ] satisfies readonly SunbeamVillageDistrict[],
  buildings: {
    bakery: {
      x: 700,
      y: 520,
      width: 420,
      height: 300,
      approach: { x: 700, y: 760 },
    },
    accessoryShop: {
      x: 1450,
      y: 430,
      width: 420,
      height: 320,
      approach: { x: 1450, y: 700 },
    },
    library: {
      x: 2260,
      y: 540,
      width: 460,
      height: 330,
      approach: { x: 2260, y: 800 },
    },
  },
  fountain: {
    x: 1500,
    y: 1060,
    approach: { x: 1300, y: 1060 },
    collisionWidth: 220,
    collisionHeight: 220,
  },
  willowGarden: {
    x: 650,
    y: 1470,
  },
  npcPositions: {
    willow: { x: 680, y: 1290 },
    marigold: { x: 1080, y: 920 },
    pebble: { x: 2140, y: 1300 },
  },
  entrances: {
    moonflowerGlade: {
      position: { x: 120, y: 950 },
      approach: { x: 330, y: 950 },
    },
    rainbowMeadow: {
      position: { x: 2880, y: 950 },
      approach: { x: 2640, y: 950 },
    },
  },
} as const;
