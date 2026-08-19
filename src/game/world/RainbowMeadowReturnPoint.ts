import type { MapPoint } from './MapTraversal';

let lastRainbowMeadowPlayerPosition: MapPoint | null = null;

export function rememberRainbowMeadowPlayerPosition(point: MapPoint): void {
  lastRainbowMeadowPlayerPosition = { x: point.x, y: point.y };
}

export function getRememberedRainbowMeadowPlayerPosition(): MapPoint | null {
  return lastRainbowMeadowPlayerPosition
    ? { x: lastRainbowMeadowPlayerPosition.x, y: lastRainbowMeadowPlayerPosition.y }
    : null;
}
