import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import {
  closeExplorationModal,
  openExplorationModal,
  resolveExplorationReturnRecovery,
} from '../interaction/InteractionModalState';

class FakeScenePlugin {
  public readonly calls: string[] = [];
  public readonly launchData: Array<{ key: string; data: unknown }> = [];
  public key = 'VillageInteriorScene';
  private readonly active = new Set<string>([this.key]);
  private readonly paused = new Set<string>();
  public readonly manager = { keys: {} as Record<string, unknown> };
  public activateLaunchImmediately = true;

  public constructor() {
    this.manager.keys.InventoryScene = {};
    this.manager.keys.WonderbookScene = {};
    this.manager.keys.SettingsScene = {};
  }

  public isActive(key = this.key): boolean {
    return this.active.has(key);
  }

  public isPaused(key: string): boolean {
    return this.paused.has(key);
  }

  public launch(key: string, data?: unknown): void {
    this.calls.push(`launch:${key}`);
    this.launchData.push({ key, data });
    if (this.activateLaunchImmediately) {
      this.active.add(key);
    }
  }

  public bringToTop(key: string): void {
    this.calls.push(`bringToTop:${key}`);
  }

  public pause(key = this.key): void {
    this.calls.push(`pause:${key}`);
    this.active.delete(key);
    this.paused.add(key);
  }

  public resume(key: string): void {
    this.calls.push(`resume:${key}`);
    this.paused.delete(key);
    this.active.add(key);
  }

  public stop(key = 'InventoryScene'): void {
    this.calls.push(`stop:${key}`);
    this.active.delete(key);
    this.paused.delete(key);
  }

  public start(key: string): void {
    this.calls.push(`start:${key}`);
    this.active.add(key);
  }

  public setActive(key: string): void {
    this.active.add(key);
  }

  public setPaused(key: string): void {
    this.active.delete(key);
    this.paused.add(key);
  }

  public clear(key: string): void {
    this.active.delete(key);
    this.paused.delete(key);
  }
}

function fakeScene(plugin: FakeScenePlugin): Phaser.Scene {
  return {
    scene: plugin,
    sys: { game: { scene: plugin.manager } },
  } as unknown as Phaser.Scene;
}

describe('ExplorationModalNavigation', () => {
  it('launches one modal with return ownership before pausing the source', () => {
    const plugin = new FakeScenePlugin();
    const opened = openExplorationModal(fakeScene(plugin), 'InventoryScene', {
      initialTab: 'map',
    });

    expect(opened).toBe(true);
    expect(plugin.launchData).toEqual([
      {
        key: 'InventoryScene',
        data: { initialTab: 'map', returnScene: 'VillageInteriorScene' },
      },
    ]);
    expect(plugin.calls).toEqual([
      'launch:InventoryScene',
      'bringToTop:InventoryScene',
      'pause:VillageInteriorScene',
    ]);
    expect(plugin.isPaused('VillageInteriorScene')).toBe(true);
  });

  it('pauses the source even when Phaser defers modal activation until the next step', () => {
    const plugin = new FakeScenePlugin();
    plugin.activateLaunchImmediately = false;

    expect(openExplorationModal(fakeScene(plugin), 'InventoryScene')).toBe(true);
    expect(plugin.calls).toEqual([
      'launch:InventoryScene',
      'bringToTop:InventoryScene',
      'pause:VillageInteriorScene',
    ]);
    expect(plugin.isPaused('VillageInteriorScene')).toBe(true);
    expect(plugin.isActive('InventoryScene')).toBe(false);
  });

  it('promotes a previously registered modal above a later-loaded interior before pausing it', () => {
    const plugin = new FakeScenePlugin();

    expect(openExplorationModal(fakeScene(plugin), 'InventoryScene')).toBe(true);
    expect(plugin.calls.indexOf('bringToTop:InventoryScene')).toBeLessThan(
      plugin.calls.indexOf('pause:VillageInteriorScene'),
    );
  });

  it('does not pause the source when the requested modal is not registered', () => {
    const plugin = new FakeScenePlugin();

    expect(openExplorationModal(fakeScene(plugin), 'MissingScene')).toBe(false);
    expect(plugin.calls).toEqual([]);
    expect(plugin.isActive('VillageInteriorScene')).toBe(true);
  });

  it('refuses to stack a second exploration modal over an existing one', () => {
    const plugin = new FakeScenePlugin();
    plugin.setActive('WonderbookScene');

    expect(openExplorationModal(fakeScene(plugin), 'InventoryScene')).toBe(false);
    expect(plugin.calls).toEqual([]);
  });

  it('stops the modal before resuming its paused owner', () => {
    const plugin = new FakeScenePlugin();
    plugin.clear('VillageInteriorScene');
    plugin.setPaused('VillageInteriorScene');
    plugin.setActive('InventoryScene');

    const restored = closeExplorationModal(fakeScene(plugin), 'VillageInteriorScene');

    expect(restored).toBe('VillageInteriorScene');
    expect(plugin.calls).toEqual(['stop:InventoryScene', 'resume:VillageInteriorScene']);
  });

  it('recovers a vanished village interior to Sunbeam Village instead of leaving no scene', () => {
    const plugin = new FakeScenePlugin();
    plugin.clear('VillageInteriorScene');
    plugin.setActive('InventoryScene');

    const restored = closeExplorationModal(fakeScene(plugin), 'VillageInteriorScene');

    expect(restored).toBe('SunbeamVillageScene');
    expect(plugin.calls).toEqual(['stop:InventoryScene', 'start:SunbeamVillageScene']);
  });

  it('maps transient interiors to a stable parent world for defensive recovery', () => {
    expect(resolveExplorationReturnRecovery('CottageInteriorScene')).toBe('MoonflowerGladeScene');
    expect(resolveExplorationReturnRecovery('WindmillLookoutScene')).toBe('RainbowMeadowScene');
    expect(resolveExplorationReturnRecovery('CrystalGrottoScene')).toBe('CrystalBrookScene');
    expect(resolveExplorationReturnRecovery('WhisperingWoodsScene')).toBe('WhisperingWoodsScene');
  });
});
