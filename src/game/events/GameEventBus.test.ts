import { describe, expect, it, vi } from 'vitest';
import { TypedEventBus } from './GameEventBus';

interface TestEvents {
  MAGIC_CHANGED: { amount: number };
}

describe('TypedEventBus', () => {
  it('delivers typed payloads and supports unsubscribe', () => {
    const bus = new TypedEventBus<TestEvents>();
    const listener = vi.fn();
    const unsubscribe = bus.on('MAGIC_CHANGED', listener);

    bus.emit('MAGIC_CHANGED', { amount: 3 });
    unsubscribe();
    bus.emit('MAGIC_CHANGED', { amount: 7 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ amount: 3 });
  });
});
