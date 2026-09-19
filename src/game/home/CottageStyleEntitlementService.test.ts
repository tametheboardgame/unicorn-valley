import { describe, expect, it } from 'vitest';
import { TypedEventBus, type GameEventMap } from '../events/GameEventBus';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { CottageStyleEntitlementService } from './CottageStyleEntitlementService';

class MemorySaveRepository implements SaveRepository {
  private value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
  }
}

describe('CottageStyleEntitlementService', () => {
  it('separates starter styles from unlockable progression rewards', () => {
    const service = new CottageStyleEntitlementService(
      new SaveService(new MemorySaveRepository()),
      new TypedEventBus<GameEventMap>(),
    );

    expect(service.isUnlocked('cottage-wall:moon-cream')).toBe(true);
    expect(service.isUnlocked('cottage-wall:misty-lilac')).toBe(true);
    expect(service.isUnlocked('cottage-wall:sea-glass')).toBe(false);
    expect(service.isUnlocked('cottage-wallpaper:star-scatter')).toBe(false);
  });

  it('persists a granted style and publishes its reward source exactly once', () => {
    const repository = new MemorySaveRepository();
    const events = new TypedEventBus<GameEventMap>();
    const received: GameEventMap['HOME_STYLE_UNLOCKED'][] = [];
    events.on('HOME_STYLE_UNLOCKED', (event) => received.push(event));

    const service = new CottageStyleEntitlementService(new SaveService(repository), events);
    expect(service.grantStyle('cottage-wall:sea-glass', 'quest')).toBe(true);
    expect(service.grantStyle('cottage-wall:sea-glass', 'shop')).toBe(false);

    const reloaded = new CottageStyleEntitlementService(
      new SaveService(repository),
      new TypedEventBus<GameEventMap>(),
    );
    expect(reloaded.isUnlocked('cottage-wall:sea-glass')).toBe(true);
    expect(received).toEqual([{ styleId: 'cottage-wall:sea-glass', source: 'quest' }]);
  });

  it('rejects unknown entitlement IDs rather than persisting arbitrary reward state', () => {
    const service = new CottageStyleEntitlementService(
      new SaveService(new MemorySaveRepository()),
      new TypedEventBus<GameEventMap>(),
    );

    expect(() => service.grantStyle('cottage-wall:not-real', 'reward')).toThrow(
      'Unknown cottage style entitlement',
    );
  });
});
