import { describe, expect, it } from 'vitest';
import type { InteractionTarget } from './InteractionTarget';
import { selectInteractionTarget } from './InteractionTargeting';

function target(
  id: string,
  x: number,
  y: number,
  interactionRadius = 120,
  priority = 0,
): InteractionTarget {
  return {
    id,
    label: id,
    actionLabel: 'Explore',
    position: { x, y },
    interactionRadius,
    priority,
    result: { type: 'message', title: id, message: id },
  };
}

describe('interaction target selection', () => {
  it('returns no target when everything is out of range', () => {
    expect(selectInteractionTarget({ x: 0, y: 0 }, [target('far-away', 500, 500)])).toBeNull();
  });

  it('selects the nearest valid target when several are in range', () => {
    const selected = selectInteractionTarget(
      { x: 0, y: 0 },
      [target('farther', 80, 0), target('nearest', 30, 0)],
    );

    expect(selected?.id).toBe('nearest');
  });

  it('uses priority to break an exact distance tie', () => {
    const selected = selectInteractionTarget(
      { x: 0, y: 0 },
      [target('low-priority', 50, 0, 120, 1), target('high-priority', -50, 0, 120, 5)],
    );

    expect(selected?.id).toBe('high-priority');
  });

  it('ignores disabled targets even when they are closer', () => {
    const disabled = target('disabled', 10, 0);
    disabled.enabled = false;

    expect(selectInteractionTarget({ x: 0, y: 0 }, [disabled, target('available', 60, 0)])?.id).toBe(
      'available',
    );
  });

  it('breaks otherwise identical ties deterministically by stable ID', () => {
    const selected = selectInteractionTarget(
      { x: 0, y: 0 },
      [target('interaction:zebra', 40, 0), target('interaction:apple', -40, 0)],
    );

    expect(selected?.id).toBe('interaction:apple');
  });
});
