export const WALK_THROUGH_GATEWAY_RADIUS = 130;
export const INTERACTIVE_GATEWAY_RADIUS = 170;

export function shouldActivateWalkThroughGateway(distance: number, interactive: boolean): boolean {
  return !interactive && distance <= WALK_THROUGH_GATEWAY_RADIUS;
}

export function isWithinInteractiveGateway(distance: number): boolean {
  return distance <= INTERACTIVE_GATEWAY_RADIUS;
}
