import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowLayout';

export interface R6CleanupPoint {
  x: number;
  y: number;
}

export interface LegacyGatewayLabelTarget {
  id: string;
  sceneKey: string;
  label: string;
  position: R6CleanupPoint;
}

export const CORRECTED_MEADOW_PATH_NAME = 'r6-wp6.18g:meadow-crystal-brook:path';

export const CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS: readonly R6CleanupPoint[] =
  RAINBOW_MEADOW_LAYOUT.crystalBrookRoute.pathPoints;

export const LEGACY_GATEWAY_LABEL_TARGETS: readonly LegacyGatewayLabelTarget[] = [
  {
    id: 'meadow-crystal-brook',
    sceneKey: 'RainbowMeadowScene',
    label: 'Crystal Brook',
    position: RAINBOW_MEADOW_LAYOUT.crystalBrookRoute.transitionPosition,
  },
  {
    id: 'crystal-brook-meadow',
    sceneKey: 'CrystalBrookScene',
    label: 'Rainbow Meadow',
    position: { x: 120, y: 1090 },
  },
  {
    id: 'crystal-brook-whispering-woods',
    sceneKey: 'CrystalBrookScene',
    label: 'Whispering Woods',
    position: { x: 3260, y: 990 },
  },
  {
    id: 'whispering-woods-crystal-brook',
    sceneKey: 'WhisperingWoodsScene',
    label: 'Crystal Brook',
    position: { x: 120, y: 1090 },
  },
  {
    id: 'crystal-brook-crystal-cascade',
    sceneKey: 'CrystalBrookScene',
    label: 'Crystal Cascade',
    position: { x: 2860, y: 850 },
  },
] as const;
