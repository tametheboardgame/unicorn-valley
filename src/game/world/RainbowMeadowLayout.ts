import type { MapPoint } from './MapTraversal';

export interface RainbowMeadowPathStroke {
  id: string;
  points: readonly MapPoint[];
  outerWidth: number;
  innerWidth: number;
}

export const RAINBOW_MEADOW_LAYOUT = {
  bounds: {
    width: 3400,
    height: 2100,
    margin: 90,
  },
  sunbeamGateway: {
    id: 'sunbeam-village',
    label: 'Sunbeam Village',
    position: { x: 120, y: 1050 },
    approach: { x: 330, y: 1050 },
    direction: 'west',
  },
  raceHub: {
    x: 2670,
    y: 1080,
    width: 1180,
    height: 1120,
  },
  hubFeatures: {
    rainbowRunEntrance: {
      id: 'rainbow-run-entrance',
      label: 'Rainbow Run',
      position: { x: 3190, y: 1040 },
      approach: { x: 2970, y: 1040 },
    },
    ribbonBoard: {
      id: 'ribbon-board',
      label: 'Ribbon Board',
      position: { x: 2510, y: 1430 },
      approach: { x: 2510, y: 1590 },
    },
    windmillLookout: {
      id: 'windmill-lookout',
      label: 'Windmill Lookout',
      position: { x: 1280, y: 270 },
      approach: { x: 1280, y: 440 },
    },
  },
  coreNpcPositions: {
    novaRaceHub: { x: 2470, y: 930 },
  },
  structuralPaths: [
    {
      id: 'main-route',
      points: [
        { x: 100, y: 1050 },
        { x: 760, y: 1050 },
        { x: 1330, y: 1110 },
        { x: 1900, y: 1040 },
        { x: 2350, y: 1050 },
        { x: 3190, y: 1040 },
      ],
      outerWidth: 148,
      innerWidth: 108,
    },
    {
      id: 'windmill-spur',
      points: [
        { x: 1110, y: 1065 },
        { x: 1190, y: 610 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
    {
      id: 'picnic-spur',
      points: [
        { x: 1800, y: 1050 },
        { x: 1850, y: 1610 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
    {
      id: 'rainbow-run-hub-spur',
      points: [
        { x: 2500, y: 1060 },
        { x: 2510, y: 1260 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
  ] satisfies readonly RainbowMeadowPathStroke[],
  // H4.4 will deliberately relocate and canonicalise the functional transition itself.
  // Until then this is the single source of truth for the accepted current route presentation.
  crystalBrookRoute: {
    transitionPosition: { x: 3030, y: 1750 },
    pathPoints: [
      { x: 1900, y: 1040 },
      { x: 1970, y: 1220 },
      { x: 2050, y: 1420 },
      { x: 2170, y: 1580 },
      { x: 2320, y: 1720 },
      { x: 2490, y: 1840 },
      { x: 2760, y: 1870 },
      { x: 3030, y: 1750 },
    ] satisfies readonly MapPoint[],
  },
} as const;
