import type {
  InteractionActionKind,
  InteractionCondition,
  InteractionTarget,
} from './InteractionTarget';

export const WORLD_INTERACTION_AFFORDANCE_NAME_PREFIX = 'world-interaction-affordance:';

function conditionIsTrue(condition: InteractionCondition | undefined): boolean {
  if (condition === undefined) {
    return true;
  }
  return typeof condition === 'function' ? condition() : condition;
}

export function shouldShowWorldInteractionAffordance(target: InteractionTarget): boolean {
  return (
    target.worldAffordance === true &&
    target.activationMode !== 'automatic' &&
    conditionIsTrue(target.visible) &&
    conditionIsTrue(target.enabled)
  );
}

export function getWorldInteractionAffordanceOffsetY(
  actionKind: InteractionActionKind | undefined,
): number {
  switch (actionKind ?? 'interact') {
    case 'talk':
      return -72;
    case 'enter':
      return -34;
    case 'start':
      return -38;
    case 'buy':
      return -42;
    case 'inspect':
      return -28;
    case 'use':
      return -30;
    case 'pick-up':
      return -36;
    case 'decorate':
      return -30;
    case 'interact':
      return -30;
  }
}
