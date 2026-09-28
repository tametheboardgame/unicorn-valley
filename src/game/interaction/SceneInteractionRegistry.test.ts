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
    const populatedSnapshot = registry.getTargetSnapshot();
    registry.replaceOwnerTargets('core', []);

    expect(registry.getTargetSnapshot()).not.toBe(populatedSnapshot);
    expect(registry.getTargets()).toEqual([]);
  });

  it('visits targets in owner order without requiring a merged snapshot', () => {
    const registry = new SceneInteractionRegistry();
    registry.replaceOwnerTargets('core', [target('core:one'), target('core:two')]);
    registry.replaceOwnerTargets('ambient', [target('ambient:one')]);

    const visited: string[] = [];
    registry.forEachTarget(({ id }) => visited.push(id));

    expect(visited).toEqual(['core:one', 'core:two', 'ambient:one']);
  });

  it('reuses a flattened snapshot until a publisher changes the registry', () => {
    const registry = new SceneInteractionRegistry();
    registry.replaceOwnerTargets('core', [target('core:one')]);

    const first = registry.getTargetSnapshot();
    const second = registry.getTargetSnapshot();
    expect(second).toBe(first);

    registry.replaceOwnerTargets('ambient', [target('ambient:one')]);
    const afterPublish = registry.getTargetSnapshot();
    expect(afterPublish).not.toBe(first);
    expect(afterPublish.map(({ id }) => id)).toEqual(['core:one', 'ambient:one']);

    registry.clearOwner('ambient');
    expect(registry.getTargetSnapshot()).not.toBe(afterPublish);
  });

  it('keeps getTargets as a detached mutable copy', () => {
    const registry = new SceneInteractionRegistry();
    registry.replaceOwnerTargets('core', [target('core:one')]);

    const detached = registry.getTargets();
    detached.length = 0;

    expect(registry.getTargetSnapshot().map(({ id }) => id)).toEqual(['core:one']);
  });
});
