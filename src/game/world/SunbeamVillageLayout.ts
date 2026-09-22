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
  path: 2.8,
  plaza: 3.15,
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
  plaza: {
    centre: { x: 1500, y: 1060 },
    width: 610,
    height: 430,
    fountainClearance: 170,
    northShopApron: {
      x: 1450,
      y: 865,
      width: 190,
      height: 130,
    },
  },
  pathNetwork: {
    mainApproaches: [
      [
        { x: 120, y: 950 },
        { x: 420, y: 950 },
        { x: 760, y: 970 },
        { x: 1030, y: 990 },
        { x: 1140, y: 1020 },
        { x: 1215, y: 1045 },
      ],
      [
        { x: 1785, y: 1045 },
        { x: 1860, y: 1020 },
        { x: 1970, y: 990 },
        { x: 2260, y: 970 },
        { x: 2640, y: 950 },
        { x: 2880, y: 950 },
      ],
    ],
    shopBranches: [
      [
        { x: 700, y: 965 },
        { x: 700, y: 850 },
        { x: 700, y: 760 },
      ],
      [
        { x: 1450, y: 850 },
        { x: 1450, y: 775 },
        { x: 1450, y: 700 },
      ],
      [
        { x: 2260, y: 970 },
        { x: 2260, y: 885 },
        { x: 2260, y: 800 },
      ],
    ],
    willowBranch: [
      { x: 1030, y: 990 },
      { x: 970, y: 1065 },
      { x: 915, y: 1145 },
      { x: 830, y: 1220 },
      { x: 750, y: 1285 },
      { x: 685, y: 1340 },
      { x: 625, y: 1420 },
    ],
    residentialBranch: [
      { x: 1970, y: 990 },
      { x: 1990, y: 1110 },
      { x: 2080, y: 1230 },
      { x: 2200, y: 1360 },
    ],
    residentialSpurs: [
      [
        { x: 1990, y: 1110 },
        { x: 1880, y: 1240 },
        { x: 1760, y: 1360 },
        { x: 1700, y: 1450 },
      ],
      [
        { x: 2200, y: 1360 },
        { x: 2225, y: 1430 },
        { x: 2225, y: 1505 },
      ],
      [
        { x: 2200, y: 1360 },
        { x: 2320, y: 1410 },
        { x: 2435, y: 1470 },
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
      centre: { x: 430, y: 1540 },
      radiusX: 390,
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
  residences: [
    {
      id: 'rosehip-cottage',
      x: 1650,
      y: 1650,
      width: 300,
      height: 240,
      approach: { x: 1700, y: 1450 },
      facing: 'north',
    },
    {
      id: 'bluebell-cottage',
      x: 2225,
      y: 1690,
      width: 320,
      height: 240,
      approach: { x: 2225, y: 1505 },
      facing: 'north',
    },
    {
      id: 'sunpetal-cottage',
      x: 2620,
      y: 1515,
      width: 300,
      height: 240,
      approach: { x: 2435, y: 1470 },
      facing: 'west',
    },
  ],
  fountain: {
    x: 1500,
    y: 1060,
    approach: { x: 1300, y: 1060 },
    collisionWidth: 220,
    collisionHeight: 220,
  },
  willowGarden: {
    x: 430,
    y: 1540,
    width: 560,
    height: 320,
    approach: { x: 625, y: 1420 },
    beds: [
      { id: 'north-west', x: -145, y: -62, width: 150, height: 82 },
      { id: 'north-east', x: 45, y: -62, width: 150, height: 82 },
      { id: 'south-west', x: -145, y: 54, width: 150, height: 82 },
      { id: 'south-east', x: 45, y: 54, width: 150, height: 82 },
    ],
    fenceSegments: [
      { id: 'west', x: -270, y: 0, width: 18, height: 300 },
      { id: 'south', x: 0, y: 151, width: 540, height: 18 },
      { id: 'east-lower', x: 270, y: 78, width: 18, height: 150 },
      {
        id: 'north-left',
        x: -125,
        y: -151,
        width: 290,
        height: 18,
        collision: { x: -125, y: -151, width: 290, height: 66 },
      },
    ],
    fencePosts: [
      { id: 'north-west', x: -270, y: -151 },
      { id: 'south-west', x: -270, y: 151 },
      { id: 'south-east', x: 270, y: 151 },
      { id: 'gate-north', x: 20, y: -151 },
      { id: 'gate-east', x: 270, y: 3 },
    ],
    sign: {
      x: 0,
      y: 194,
      width: 286,
      height: 50,
      collision: { x: 0, y: 194, width: 330, height: 98 },
    },
  },
  boundaryFence: {
    thickness: 18,
    postSize: 32,
    southEdgeY: 1891,
    segments: [
      { id: 'north', orientation: 'horizontal', x: 1500, y: 115, length: 2760 },
      {
        id: 'south',
        orientation: 'horizontal',
        x: 1500,
        y: 1891,
        length: 2760,
        collision: { x: 1500, y: 1879, width: 2760, height: 42 },
      },
      { id: 'west-north', orientation: 'vertical', x: 120, y: 435, length: 640 },
      { id: 'west-south', orientation: 'vertical', x: 120, y: 1503, length: 776 },
      { id: 'east-north', orientation: 'vertical', x: 2880, y: 435, length: 640 },
      { id: 'east-south', orientation: 'vertical', x: 2880, y: 1503, length: 776 },
    ],
    posts: [
      { id: 'north-west', x: 120, y: 115 },
      { id: 'north-east', x: 2880, y: 115 },
      { id: 'south-west', x: 120, y: 1891 },
      { id: 'south-east', x: 2880, y: 1891 },
      { id: 'west-gate-north', x: 120, y: 755 },
      { id: 'west-gate-south', x: 120, y: 1115 },
      { id: 'east-gate-north', x: 2880, y: 755 },
      { id: 'east-gate-south', x: 2880, y: 1115 },
    ],
  },
  npcPositions: {
    willow: { x: 535, y: 1345 },
    marigold: { x: 1080, y: 920 },
    pebble: { x: 2140, y: 1300 },
  },
  villageLife: {
    noticeBoard: { x: 1030, y: 1170 },
    sundial: { x: 1260, y: 1370 },
    bench: { x: 1840, y: 1330 },
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
