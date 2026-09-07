import Phaser from 'phaser';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { getBrowserSaveService } from '../save/browserSaveService';

const LOCATION_TITLES: Readonly<Record<string, string>> = {
  MoonflowerGladeScene: 'Moonflower Glade',
  CottageInteriorScene: 'Moonflower Cottage',
  MoonflowerPatchScene: 'Moonflower Patch',
  HollowTreeNookScene: 'Hollow Tree Nook',
  SunbeamVillageScene: 'Sunbeam Village',
  RainbowMeadowScene: 'Rainbow Meadow',
  WindmillLookoutScene: 'Windmill Lookout',
  CrystalBrookScene: 'Crystal Brook',
  CrystalGrottoScene: 'Crystal Grotto',
  WhisperingWoodsScene: 'Whispering Woods',
  FireflyGroveScene: 'Firefly Grove',
  StarlightBeachScene: 'Starlight Beach',
};

const LEGACY_NAMES = new Set([
  'exploration-shell-bag-button',
  'exploration-shell-bag-label',
  'exploration-shell-book-button',
  'exploration-shell-book-label',
  'exploration-shell-sound-button',
  'exploration-shell-sound-label',
  'exploration-location-title-panel',
  'exploration-location-title',
  'exploration-controls-button',
  'exploration-controls-label',
  'activity-suggestion-reopen',
]);

interface SuppressedState {
  alpha: number;
  interactive: boolean;
}

interface PortraitDock {
  scene: Phaser.Scene;
  root: HTMLDivElement;
  location: HTMLDivElement;
  shimmer: HTMLDivElement;
}

function usesPortraitConceptPresentation(): boolean {
  if (typeof globalThis.document === 'undefined') {
    return false;
  }
  const coarsePointer =
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(pointer: coarse), (any-pointer: coarse)').matches;
  const touchCapable =
    (globalThis.navigator?.maxTouchPoints ?? 0) > 0 ||
    'ontouchstart' in globalThis ||
    coarsePointer;
  return (
    touchCapable && globalThis.innerWidth <= 700 && globalThis.innerHeight > globalThis.innerWidth
  );
}

function canSuppress(
  object: Phaser.GameObjects.GameObject,
): object is Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc | Phaser.GameObjects.Text {
  return (
    object instanceof Phaser.GameObjects.Rectangle ||
    object instanceof Phaser.GameObjects.Arc ||
    object instanceof Phaser.GameObjects.Text
  );
}

export class PortraitConceptPresentationManager {
  private readonly syncThrottle = new RefreshThrottle(120);
  private readonly economy = new ShimmerEconomyService(getBrowserSaveService());
  private readonly suppressed = new Map<Phaser.GameObjects.GameObject, SuppressedState>();
  private dock: PortraitDock | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.clearDock();
      this.restoreSuppressed();
    });
  }

  private update(): void {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }

    if (!usesPortraitConceptPresentation()) {
      this.clearDock();
      this.restoreSuppressed();
      return;
    }

    const scene = this.game.scene
      .getScenes(true)
      .find(
        (candidate) =>
          LOCATION_TITLES[candidate.scene.key] &&
          candidate.children.getByName('exploration-shell-bag-button'),
      );

    if (!scene) {
      this.clearDock();
      this.restoreSuppressed();
      return;
    }

    if (!this.dock || this.dock.scene !== scene) {
      this.clearDock();
      this.restoreSuppressed();
      this.dock = this.createDock(scene);
    }

    this.suppressLegacy(scene);
    this.syncDock(scene);
  }

  private createDock(scene: Phaser.Scene): PortraitDock {
    const root = globalThis.document.createElement('div');
    root.className = 'mobile-exploration-concept-dock';
    root.setAttribute('role', 'navigation');
    root.setAttribute('aria-label', 'Adventure controls');

    const meta = globalThis.document.createElement('div');
    meta.className = 'mobile-exploration-meta';

    const location = globalThis.document.createElement('div');
    location.className = 'mobile-exploration-pill mobile-exploration-location';
    location.setAttribute('aria-label', 'Current location');

    const shimmer = globalThis.document.createElement('div');
    shimmer.className = 'mobile-exploration-pill mobile-exploration-shimmer';
    shimmer.setAttribute('aria-label', 'Shimmer balance');
    meta.append(location, shimmer);

    const nav = globalThis.document.createElement('div');
    nav.className = 'mobile-exploration-nav';
    nav.append(
      this.createButton('🗺️', 'Map', () => void this.openInventory(scene, 'map')),
      this.createButton('🎒', 'Bag', () => void this.openInventory(scene, 'items')),
      this.createButton('📖', 'Book', () => void this.openWonderbook(scene)),
      this.createButton('⚙️', 'Settings', () => void this.openSettings(scene)),
    );

    root.append(meta, nav);
    (globalThis.document.querySelector('#game-shell') ?? globalThis.document.body).append(root);
    globalThis.document.documentElement.style.setProperty(
      '--portrait-exploration-dock-offset',
      '142px',
    );
    return { scene, root, location, shimmer };
  }

  private createButton(icon: string, label: string, action: () => void): HTMLButtonElement {
    const button = globalThis.document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-exploration-nav-button';
    button.setAttribute('aria-label', label);

    const iconSpan = globalThis.document.createElement('span');
    iconSpan.className = 'mobile-exploration-nav-icon';
    iconSpan.textContent = icon;

    const labelSpan = globalThis.document.createElement('span');
    labelSpan.className = 'mobile-exploration-nav-label';
    labelSpan.textContent = label;

    button.append(iconSpan, labelSpan);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.classList.add('is-active');
    });
    const release = (): void => button.classList.remove('is-active');
    button.addEventListener('pointerup', (event) => {
      event.preventDefault();
      release();
      action();
    });
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
    return button;
  }

  private syncDock(scene: Phaser.Scene): void {
    if (!this.dock || this.dock.scene !== scene) {
      return;
    }
    this.dock.location.textContent = `⌖ ${LOCATION_TITLES[scene.scene.key]}`;
    this.dock.shimmer.textContent = `✦ ${this.economy.getBalance()} Shimmer`;
  }

  private suppressLegacy(scene: Phaser.Scene): void {
    for (const object of scene.children.list) {
      if (!canSuppress(object)) {
        continue;
      }
      const namedLegacy = LEGACY_NAMES.has(object.name);
      const topChromeDecoration =
        object.scrollFactorX === 0 &&
        object.depth >= 115 &&
        object.depth <= 126 &&
        object.y <= 100 &&
        !object.name.startsWith('exploration-interaction-prompt');
      const suggestionChrome =
        object.scrollFactorX === 0 &&
        object.depth >= 115 &&
        object.depth <= 119 &&
        object.x <= 460 &&
        object.y <= 230;
      const lowerControlsDecoration =
        object.scrollFactorX === 0 &&
        object.depth >= 120 &&
        object.depth <= 126 &&
        object.x >= 1000 &&
        object.y >= 600;
      if (!namedLegacy && !topChromeDecoration && !suggestionChrome && !lowerControlsDecoration) {
        continue;
      }
      if (!this.suppressed.has(object)) {
        this.suppressed.set(object, {
          alpha: object.alpha,
          interactive: Boolean(object.input?.enabled),
        });
      }
      object.setAlpha(0.001);
      object.disableInteractive();
    }
  }

  private restoreSuppressed(): void {
    for (const [object, state] of this.suppressed) {
      if (!object.active || !canSuppress(object)) {
        continue;
      }
      object.setAlpha(state.alpha);
      if (state.interactive) {
        object.setInteractive({ useHandCursor: true });
      } else {
        object.disableInteractive();
      }
    }
    this.suppressed.clear();
  }

  private clearDock(): void {
    this.dock?.root.remove();
    this.dock = null;
    globalThis.document?.documentElement.style.setProperty(
      '--portrait-exploration-dock-offset',
      '0px',
    );
  }

  private async openInventory(scene: Phaser.Scene, initialTab: 'items' | 'map'): Promise<void> {
    if (!scene.scene.isActive()) {
      return;
    }
    if (!scene.game.scene.keys.InventoryScene) {
      const { InventoryScene } = await import('../scenes/InventoryScene');
      scene.scene.add('InventoryScene', InventoryScene, false);
    }
    if (!scene.scene.isActive() || scene.scene.isActive('InventoryScene')) {
      return;
    }
    scene.scene.launch('InventoryScene', { returnScene: scene.scene.key, initialTab });
    scene.scene.pause();
  }

  private async openWonderbook(scene: Phaser.Scene): Promise<void> {
    if (!scene.scene.isActive()) {
      return;
    }
    if (!scene.game.scene.keys.WonderbookScene) {
      const { WonderbookScene } = await import('../scenes/WonderbookScene');
      scene.scene.add('WonderbookScene', WonderbookScene, false);
    }
    if (!scene.scene.isActive() || scene.scene.isActive('WonderbookScene')) {
      return;
    }
    scene.scene.launch('WonderbookScene', { returnScene: scene.scene.key });
    scene.scene.pause();
  }

  private async openSettings(scene: Phaser.Scene): Promise<void> {
    if (!scene.scene.isActive()) {
      return;
    }
    if (!scene.game.scene.keys.SettingsScene) {
      const { SettingsScene } = await import('../scenes/SettingsScene');
      scene.scene.add('SettingsScene', SettingsScene, false);
    }
    if (!scene.scene.isActive() || scene.scene.isActive('SettingsScene')) {
      return;
    }
    scene.scene.launch('SettingsScene', { returnScene: scene.scene.key });
    scene.scene.pause();
  }
}

let manager: PortraitConceptPresentationManager | null = null;

export function getPortraitConceptPresentationManager(
  game: Phaser.Game,
): PortraitConceptPresentationManager {
  manager ??= new PortraitConceptPresentationManager(game);
  return manager;
}
