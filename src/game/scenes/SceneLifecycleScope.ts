export type SceneDisposer = () => void;

export interface SceneLifecycleEvents {
  once(event: string, listener: () => void): unknown;
  off(event: string, listener: () => void): unknown;
}

export interface SceneEventSource<Args extends unknown[] = unknown[]> {
  on(event: string, listener: (...args: Args) => void): unknown;
  off(event: string, listener: (...args: Args) => void): unknown;
}

export class SceneLifecycleScope {
  private cleanups: SceneDisposer[] = [];
  private closed = false;

  public own(disposer: SceneDisposer): SceneDisposer {
    if (this.closed) {
      disposer();
      return () => undefined;
    }

    let active = true;
    const cleanup = (): void => {
      if (!active) {
        return;
      }
      active = false;
      disposer();
    };
    this.cleanups.push(cleanup);
    return cleanup;
  }

  public listen<Args extends unknown[]>(
    source: SceneEventSource<Args>,
    event: string,
    listener: (...args: Args) => void,
  ): SceneDisposer {
    source.on(event, listener);
    return this.own(() => source.off(event, listener));
  }

  public close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    const cleanups = this.cleanups.splice(0).reverse();
    for (const cleanup of cleanups) {
      cleanup();
    }
  }
}

export function bindSceneLifecycle(
  events: SceneLifecycleEvents,
  scope = new SceneLifecycleScope(),
): SceneLifecycleScope {
  const close = (): void => scope.close();
  events.once('shutdown', close);
  events.once('destroy', close);
  scope.own(() => {
    events.off('shutdown', close);
    events.off('destroy', close);
  });
  return scope;
}
