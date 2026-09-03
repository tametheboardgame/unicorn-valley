export interface ExplorationPathPoint {
  x: number;
  y: number;
}

export const EXPLORATION_MAIN_ROUTES: Readonly<Record<string, readonly ExplorationPathPoint[]>> = {
  MoonflowerGladeScene: [
    { x: 560, y: 720 },
    { x: 830, y: 820 },
    { x: 1100, y: 870 },
    { x: 1400, y: 900 },
    { x: 1750, y: 900 },
    { x: 2150, y: 900 },
    { x: 2690, y: 900 },
  ],
  SunbeamVillageScene: [
    { x: 120, y: 950 },
    { x: 760, y: 950 },
    { x: 1220, y: 950 },
    { x: 1320, y: 850 },
    { x: 1680, y: 850 },
    { x: 1780, y: 950 },
    { x: 2240, y: 950 },
    { x: 2880, y: 950 },
  ],
  RainbowMeadowScene: [
    { x: 100, y: 1050 },
    { x: 760, y: 1050 },
    { x: 1330, y: 1110 },
    { x: 1900, y: 1040 },
    { x: 2350, y: 1050 },
    { x: 3190, y: 1040 },
  ],
  CrystalBrookScene: [
    { x: 100, y: 1090 },
    { x: 850, y: 1090 },
    { x: 1510, y: 1260 },
    { x: 2050, y: 1080 },
    { x: 2600, y: 1190 },
    { x: 3230, y: 990 },
  ],
  WhisperingWoodsScene: [
    { x: 100, y: 1090 },
    { x: 720, y: 1090 },
    { x: 1230, y: 980 },
    { x: 1680, y: 1110 },
    { x: 2090, y: 1080 },
    { x: 2530, y: 930 },
    { x: 2940, y: 820 },
  ],
  StarlightBeachScene: [
    { x: 100, y: 1140 },
    { x: 650, y: 1120 },
    { x: 1120, y: 1080 },
    { x: 1510, y: 1190 },
    { x: 1900, y: 1330 },
    { x: 2370, y: 1180 },
    { x: 2830, y: 1320 },
    { x: 2870, y: 1470 },
    { x: 2990, y: 1530 },
    { x: 3130, y: 1540 },
  ],
};
