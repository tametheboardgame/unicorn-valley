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

export const SUNBEAM_VILLAGE_LAYERS = {
  base: 0,
  districtGround: 1.2,
  path: 3.2,
  groundDetail: 4,
  structureShadow: 5.6,
  structure: 6,
  structureDetail: 8,
  structureLabel: 9.2,
  gateway: 10,
  ui: 115,
} as const;

export const SUNBEAM_VILLAGE_LAYOUT = {
  map: {
    width: 3000,
    height: 1900,
    margin: 90,
  },
  pathScaffold: {
    main: [
      { x: 120, y: 950 },
      { x: 620, y: 950 },
      { x: 1050, y: 960 },
      { x: 1230, y: 900 },
      { x: 1340, y: 840 },
      { x: 1660, y: 840 },
      { x: 1770, y: 900 },
      { x: 1960, y: 960 },
      { x: 2380, y: 950 },
      { x: 2880, y: 950 },
    ],
    shopBranches: [
      [
        { x: 700, y: 950 },
        { x: 700, y: 760 },
      ],
      [
        { x: 1450, y: 840 },
        { x: 1450, y: 700 },
      ],
      [
        { x: 2260, y: 950 },
        { x: 2260, y: 800 },
      ],
    ],
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
  villageLife: {
    noticeBoard: { x: 1030, y: 1170 },
    sundial: { x: 1260, y: 1370 },
    bench: { x: 1850, y: 1080 },
    storyMapSign: { x: 2520, y: 820 },
    threadWindow: { x: 1305, y: 770 },
    fountainSplash: { x: 1690, y: 1060 },
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
