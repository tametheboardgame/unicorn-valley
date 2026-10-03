import type { MapPoint } from './MapTraversal';
import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowMap';

export type RainbowMeadowWalkThroughDestination = 'sunbeam-village' | 'rainbow-run-hub';

const GATEWAY_HALF_WIDTH = 90;
const GATEWAY_HALF_HEIGHT = 105;

function isInsideGateway(point: MapPoint, gateway: MapPoint): boolean {
  return (
    Math.abs(point.x - gateway.x) <= GATEWAY_HALF_WIDTH &&
    Math.abs(point.y - gateway.y) <= GATEWAY_HALF_HEIGHT
  );
}

export function resolveRainbowMeadowWalkThroughDestination(
  point: MapPoint,
): RainbowMeadowWalkThroughDestination | null {
  if (isInsideGateway(point, RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position)) {
    return 'rainbow-run-hub';
  }

  if (isInsideGateway(point, RAINBOW_MEADOW_LAYOUT.sunbeamGateway.position)) {
    return 'sunbeam-village';
  }

  return null;
}
