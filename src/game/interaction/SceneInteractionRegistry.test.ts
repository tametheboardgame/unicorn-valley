import { describe, expect, it } from 'vitest';
import type { InteractionTarget } from './InteractionTarget';
import { SceneInteractionRegistry } from './SceneInteractionRegistry';

function target(id: string): InteractionTarget {
  return {
    id,
    label: id,
    actionLabel: 'Interact',
    actionKind: 'interact',
    position: { x: 0, y: 0 },
    interactionRadius: 100,
    result: { type: 'message', title: id, message: id },
  };
}

describe('SceneInteractionRegistry', () => {
  it('replaces only the selected owner targets', () => {
    const registry = new SceneInteractionRegistry();
    registry.replaceOwnerTargets('core', [target('core:old')]);
    registry.replaceOwnerTargets('ambient', [target('ambient:one')]);

    registry.replaceOwnerTargets('core', [target('core:new')]);

    expect(registry.getTargets().map(({ id }) => id)).toEqual(['core:new', 'ambient:one']);
  });

  it('removes an owner when replaced with an empty target list', () => {
    const registry = new SceneInteractionRegistry();
    registry.replaceOwnerTargets('core', [target('core:one')]);
    registry.replaceOwnerTargets('core', []);

    expect(registry.getTargets()).toEqual([]);
  });
});
