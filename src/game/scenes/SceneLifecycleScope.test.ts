import { describe, expect, it, vi } from 'vitest';
import {
  bindSceneLifecycle,
  SceneLifecycleScope,
  type SceneEventSource,
  type SceneLifecycleEvents,
} from './SceneLifecycleScope';

class FakeEmitter implements SceneLifecycleEvents, SceneEventSource<[number]> {
  private listeners = new Map<string, Set<(...args: [number]) => void>>();
  private onceListeners = new Map<string, Set<() => void>>();

  public on(event: string, listener: (...args: [number]) => void): void {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
  }

  public off(event: string, listener: ((...args: [number]) => void) | (() => void)): void {
    this.listeners.get(event)?.delete(listener as (...args: [number]) => void);
    this.onceListeners.get(event)?.delete(listener as () => void);
  }

  public once(event: string, listener: () => void): void {
    const listeners = this.onceListeners.get(event) ?? new Set();
    listeners.add(listener);
    this.onceListeners.set(event, listeners);
  }

  public emit(event: string, value = 0): void {
    for (const listener of [...(this.listeners.get(event) ?? [])]) listener(value);
    const once = [...(this.onceListeners.get(event) ?? [])];
    this.onceListeners.delete(event);
    for (const listener of once) listener();
  }

  public listenerCount(event: string): number {
    return (this.listeners.get(event)?.size ?? 0) + (this.onceListeners.get(event)?.size ?? 0);
  }
}

describe('SceneLifecycleScope', () => {
  it('runs owned cleanup once even when close is repeated', () => {
    const cleanup = vi.fn();
    const scope = new SceneLifecycleScope();
    scope.own(cleanup);

    scope.close();
    scope.close();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('removes scene-owned listeners when the scene shuts down', () => {
    const events = new FakeEmitter();
    const input = new FakeEmitter();
    const listener = vi.fn();
    const scope = bindSceneLifecycle(events);
    scope.listen(input, 'action', listener);

    input.emit('action', 1);
    events.emit('shutdown');
    input.emit('action', 2);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(input.listenerCount('action')).toBe(0);
    expect(events.listenerCount('shutdown')).toBe(0);
    expect(events.listenerCount('destroy')).toBe(0);
  });

  it('does not accumulate duplicate listeners across scene re-entry', () => {
    const events = new FakeEmitter();
    const input = new FakeEmitter();
    const first = vi.fn();
    const second = vi.fn();

    const firstScope = bindSceneLifecycle(events);
    firstScope.listen(input, 'action', first);
    events.emit('shutdown');

    const secondScope = bindSceneLifecycle(events);
    secondScope.listen(input, 'action', second);
    input.emit('action', 1);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(input.listenerCount('action')).toBe(1);
  });
});
