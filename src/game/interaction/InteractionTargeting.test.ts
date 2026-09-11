import { describe, expect, it } from 'vitest';
import type { InteractionTarget } from './InteractionTarget';
import { getInteractionTargetPosition, selectInteractionTarget } from './InteractionTargeting';

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
    actionKind: 'interact',
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
    const selected = selectInteractionTarget({ x: 0, y: 0 }, [
      target('farther', 80, 0),
      target('nearest', 30, 0),
    ]);
    expect(selected?.id).toBe('nearest');
  });

  it('does not let a distant high-priority target steal a nearby action', () => {
    const selected = selectInteractionTarget({ x: 0, y: 0 }, [
      target('nearby', 20, 0, 120, 0),
      target('priority-farther', 90, 0, 120, 999),
    ]);
    expect(selected?.id).toBe('nearby');
  });

  it('uses priority to break an exact distance tie', () => {
    const selected = selectInteractionTarget({ x: 0, y: 0 }, [
      target('low-priority', 50, 0, 120, 1),
      target('high-priority', -50, 0, 120, 5),
    ]);
    expect(selected?.id).toBe('high-priority');
  });

  it('ignores disabled and invisible targets', () => {
    const disabled = target('disabled', 10, 0);
    disabled.enabled = false;
    const invisible = target('invisible', 20, 0);
    invisible.visible = () => false;
    expect(
      selectInteractionTarget({ x: 0, y: 0 }, [disabled, invisible, target('available', 60, 0)])
        ?.id,
    ).toBe('available');
  });

  it('supports live positions for moving residents', () => {
    let position = { x: 80, y: 0 };
    const moving = target('moving', 0, 0);
    moving.position = () => position;
    expect(getInteractionTargetPosition(moving)).toEqual({ x: 80, y: 0 });
    position = { x: 30, y: 10 };
    expect(getInteractionTargetPosition(moving)).toEqual({ x: 30, y: 10 });
  });

  it('gives an explicitly tapped eligible target precedence', () => {
    const selected = selectInteractionTarget(
      { x: 0, y: 0 },
      [target('nearest', 20, 0), target('tapped', 60, 0)],
      { preferredTargetId: 'tapped' },
    );
    expect(selected?.id).toBe('tapped');
  });

  it('falls back to nearest when a tapped target is no longer eligible', () => {
    const selected = selectInteractionTarget(
      { x: 0, y: 0 },
      [target('nearest', 20, 0), target('tapped', 300, 0)],
      { preferredTargetId: 'tapped' },
    );
    expect(selected?.id).toBe('nearest');
  });

  it('keeps enlarged direct tap geometry range gated', () => {
    const enlarged = target('enlarged-touch-target', 100, 0, 50);
    enlarged.directArea = { width: 360, height: 360 };
    expect(selectInteractionTarget({ x: 0, y: 0 }, [enlarged])).toBeNull();
  });

  it('retains the current target inside the anti-flicker margin', () => {
    const selected = selectInteractionTarget(
      { x: 0, y: 0 },
      [target('current', 48, 0), target('challenger', 40, 0)],
      { retainedTargetId: 'current', retentionMargin: 12 },
    );
    expect(selected?.id).toBe('current');
  });

  it('releases retained selection once another target is clearly nearer', () => {
    const selected = selectInteractionTarget(
      { x: 0, y: 0 },
      [target('current', 80, 0), target('challenger', 30, 0)],
      { retainedTargetId: 'current', retentionMargin: 12 },
    );
    expect(selected?.id).toBe('challenger');
  });

  it('ignores automatic crossing targets in the explicit-action route', () => {
    const automatic = target('automatic', 5, 0);
    automatic.activationMode = 'automatic';
    expect(
      selectInteractionTarget({ x: 0, y: 0 }, [automatic, target('explicit', 40, 0)])?.id,
    ).toBe('explicit');
  });

  it('breaks otherwise identical ties deterministically by stable ID', () => {
    const selected = selectInteractionTarget({ x: 0, y: 0 }, [
      target('interaction:zebra', 40, 0),
      target('interaction:apple', -40, 0),
    ]);
    expect(selected?.id).toBe('interaction:apple');
  });
});
