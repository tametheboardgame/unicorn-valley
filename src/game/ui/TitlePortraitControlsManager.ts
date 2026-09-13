import Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore } from '../accessibility/AccessibilitySettings';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { RefreshThrottle } from '../performance/RefreshThrottle';

const TITLE_SCENE_KEY = 'TitleScene';
const SYNC_INTERVAL_MS = 100;
const PORTRAIT_MEDIA_QUERY = '(pointer: coarse) and (max-width: 900px) and (orientation: portrait)';
const TITLE_ARTWORK_NAME = 'title-generated-artwork';
const TITLE_ARTWORK_LANDSCAPE_KEY = 'title-generated-landscape';
const TITLE_ARTWORK_PORTRAIT_KEY = 'title-generated-portrait';
const TITLE_ARTWORK_LANDSCAPE_URL = '/assets/title/wp19f-title-landscape.webp';
const TITLE_ARTWORK_PORTRAIT_URL = '/assets/title/wp19f-title-portrait.webp';
const TITLE_LOGO_NAME = 'title-generated-logo';
const TITLE_LOGO_KEY = 'title-generated-logo';
const TITLE_LOGO_URL = '/assets/title/unicorn-valley-logo.webp';
const TITLE_LOGO_WIDTH = 600;
const TITLE_LOGO_X = 380;
const TITLE_LOGO_Y = 210;
const TITLE_SPARKLE_NAME = 'title-generated-sparkles';

interface ActionDefinition {
  objectName: string;
  labelName: string;
  className?: string;
}

const MAIN_ACTIONS: readonly ActionDefinition[] = [
  {
    objectName: 'title-menu-retry-save',
    labelName: 'title-menu-retry-save-label',
    className: 'title-portrait-primary',
  },
  {
    objectName: 'title-menu-refresh',
    labelName: 'title-menu-refresh-label',
    className: 'title-portrait-primary',
  },
  {
    objectName: 'title-menu-continue',
    labelName: 'title-menu-continue-label',
    className: 'title-portrait-primary',
  },
  { objectName: 'title-menu-new-game', labelName: 'title-menu-new-game-label' },
  {
    objectName: 'title-menu-my-unicorn',
    labelName: 'title-menu-my-unicorn-label',
    className: 'title-portrait-blush',
  },
  {
    objectName: 'title-menu-settings',
    labelName: 'title-menu-settings-label',
    className: 'title-portrait-mint',
  },
];

interface DomAction {
  definition: ActionDefinition;
  button: HTMLButtonElement;
}

function makeButton(definition: ActionDefinition): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `title-portrait-button${definition.className ? ` ${definition.className}` : ''}`;
  button.dataset.titleAction = definition.objectName;
  return button;
}

function isVisible(object: Phaser.GameObjects.GameObject | null): boolean {
  return Boolean(object && 'visible' in object && object.visible);
}

function isEnabled(object: Phaser.GameObjects.GameObject | null): boolean {
  if (!object || !('input' in object)) {
    return false;
  }
  return Boolean(object.input?.enabled);
}

interface TitleArtworkTarget {
  key: string;
  url: string;
  portrait: boolean;
}

function currentArtworkTarget(): TitleArtworkTarget {
  const portrait = globalThis.matchMedia?.(PORTRAIT_MEDIA_QUERY).matches === true;
  return portrait
    ? {
        key: TITLE_ARTWORK_PORTRAIT_KEY,
        url: TITLE_ARTWORK_PORTRAIT_URL,
        portrait: true,
      }
    : {
        key: TITLE_ARTWORK_LANDSCAPE_KEY,
        url: TITLE_ARTWORK_LANDSCAPE_URL,
        portrait: false,
      };
}

export class TitlePortraitControlsManager {
  private readonly syncThrottle = new RefreshThrottle(SYNC_INTERVAL_MS);
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly root: HTMLElement;
  private readonly heading: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly status: HTMLElement;
  private readonly mainActions: DomAction[];
  private readonly requestedArtwork = new Set<string>();
  private readonly preloadedArtwork = new Set<string>();

  public constructor(private readonly game: Phaser.Game) {
    this.root = document.createElement('section');
    this.root.className = 'title-portrait-controls';
    this.root.dataset.titlePortraitControls = 'true';
    this.root.setAttribute('aria-label', 'Unicorn Valley menu');
    this.root.hidden = true;

    const sparkles = document.createElement('div');
    sparkles.className = 'title-portrait-sparkles';
    sparkles.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 12; index += 1) {
      const sparkle = document.createElement('span');
      sparkle.className = 'title-portrait-sparkle';
      sparkle.textContent = index % 3 === 0 ? '✦' : '✧';
      sparkle.style.setProperty('--sparkle-x', `${6 + ((index * 17) % 88)}%`);
      sparkle.style.setProperty('--sparkle-rest-y', `${8 + ((index * 13) % 78)}%`);
      sparkle.style.setProperty('--sparkle-delay', `${-0.7 * index}s`);
      sparkle.style.setProperty('--sparkle-duration', `${8 + (index % 5) * 1.4}s`);
      sparkle.style.setProperty('--sparkle-size', `${13 + (index % 4) * 4}px`);
      sparkles.append(sparkle);
    }

    const mainView = document.createElement('div');
    mainView.className = 'title-portrait-view title-portrait-main';

    const brand = document.createElement('img');
    brand.className = 'title-portrait-logo';
    brand.dataset.titlePortraitBrand = 'true';
    brand.src = TITLE_LOGO_URL;
    brand.alt = 'Unicorn Valley. A little valley. A lot of magic.';
    brand.decoding = 'async';
    brand.fetchPriority = 'high';
    mainView.append(brand);

    const card = document.createElement('div');
    card.className = 'title-portrait-card';

    this.heading = document.createElement('h1');
    this.heading.className = 'title-portrait-heading';
    this.heading.textContent = 'Welcome to Unicorn Valley';
    card.append(this.heading);

    this.subtitle = document.createElement('p');
    this.subtitle.className = 'title-portrait-subtitle';
    card.append(this.subtitle);

    const actions = document.createElement('div');
    actions.className = 'title-portrait-actions';
    this.mainActions = MAIN_ACTIONS.map((definition) => {
      const button = makeButton(definition);
      button.addEventListener('click', () => this.activate(definition.objectName));
      actions.append(button);
      return { definition, button };
    });
    card.append(actions);

    this.status = document.createElement('p');
    this.status.className = 'title-portrait-status';
    this.status.setAttribute('aria-live', 'polite');
    card.append(this.status);

    mainView.append(card);
    this.root.append(sparkles, mainView);
    document.body.append(this.root);
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }
    this.sync();
  }

  private sync(): void {
    const scene = this.game.scene
      .getScenes(true)
      .find((active) => active.scene.key === TITLE_SCENE_KEY);
    if (!scene) {
      this.root.hidden = true;
      this.game.canvas.style.pointerEvents = '';
      return;
    }

    const artworkTarget = currentArtworkTarget();
    this.game.canvas.style.pointerEvents = artworkTarget.portrait ? 'none' : '';
    this.syncArtwork(scene, artworkTarget);
    this.syncSparkles(scene, artworkTarget.portrait);
    this.syncLogo(scene, artworkTarget.portrait);
    this.root.hidden = false;

    const heading = scene.children.getByName('title-menu-heading');
    if (heading instanceof Phaser.GameObjects.Text) {
      this.heading.textContent = heading.text;
    }

    const subtitle = scene.children.getByName('title-menu-subtitle');
    if (subtitle instanceof Phaser.GameObjects.Text) {
      this.subtitle.textContent = subtitle.text;
    }

    const status = scene.children.getByName('title-menu-status');
    if (status instanceof Phaser.GameObjects.Text) {
      this.status.textContent = status.text;
    }

    this.syncActions(scene);
  }

  private preloadArtwork(target: TitleArtworkTarget): void {
    if (this.preloadedArtwork.has(target.url)) {
      return;
    }
    this.preloadedArtwork.add(target.url);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = target.url;
    link.type = 'image/webp';
    link.setAttribute('fetchpriority', 'high');
    document.head.append(link);
  }

  private syncArtwork(scene: Phaser.Scene, target: TitleArtworkTarget): void {
    this.preloadArtwork(target);
    const existing = scene.children.getByName(TITLE_ARTWORK_NAME);
    if (existing instanceof Phaser.GameObjects.Image && existing.texture.key === target.key) {
      return;
    }

    if (existing instanceof Phaser.GameObjects.Image) {
      existing.destroy();
    }

    if (scene.textures.exists(target.key)) {
      this.attachArtwork(scene, target);
      return;
    }

    if (this.requestedArtwork.has(target.key)) {
      return;
    }

    this.requestedArtwork.add(target.key);
    scene.load.image(target.key, target.url);
    scene.load.start();
  }

  private attachArtwork(scene: Phaser.Scene, target: TitleArtworkTarget): void {
    const frame = scene.textures.get(target.key).get();
    const sourceWidth = Math.max(1, frame.realWidth);
    const sourceHeight = Math.max(1, frame.realHeight);
    const coverScale = Math.max(GAME_WIDTH / sourceWidth, GAME_HEIGHT / sourceHeight);
    const artwork = scene.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, target.key)
      .setName(TITLE_ARTWORK_NAME)
      .setScale(coverScale)
      .setDepth(8);
    artwork.setData('titleArtworkVariant', target.portrait ? 'portrait' : 'landscape');
  }

  private syncSparkles(scene: Phaser.Scene, portrait: boolean): void {
    const existing = scene.children.getByName(TITLE_SPARKLE_NAME);
    if (portrait) {
      existing?.destroy();
      return;
    }

    if (existing instanceof Phaser.GameObjects.Container) {
      const reducedMotion = this.accessibility.load().reducedMotion;
      for (const child of existing.list) {
        for (const tween of scene.tweens.getTweensOf(child)) {
          tween.timeScale = reducedMotion ? 0 : 1;
        }
      }
      return;
    }

    const positions = [
      [72, 90],
      [170, 286],
      [286, 112],
      [448, 332],
      [566, 86],
      [690, 244],
      [808, 122],
      [914, 294],
      [1040, 92],
      [1164, 212],
      [1224, 404],
      [760, 506],
      [432, 548],
      [214, 470],
    ] as const;
    const container = scene.add.container(0, 0).setName(TITLE_SPARKLE_NAME).setDepth(9);
    const reducedMotion = this.accessibility.load().reducedMotion;

    positions.forEach(([x, y], index) => {
      const sparkle = scene.add
        .text(x, y, index % 3 === 0 ? '✦' : '✧', {
          color: index % 4 === 0 ? '#fff0a8' : '#fff8ff',
          fontFamily: 'Georgia, serif',
          fontSize: `${14 + (index % 4) * 4}px`,
          stroke: '#76518a',
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setAlpha(0.42 + (index % 3) * 0.12);
      container.add(sparkle);

      if (!reducedMotion) {
        scene.tweens.add({
          targets: sparkle,
          y: y + 22 + (index % 4) * 7,
          alpha: 0.14,
          angle: index % 2 === 0 ? 24 : -20,
          duration: 2600 + (index % 5) * 520,
          delay: index * 170,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
    });
  }

  private syncLogo(scene: Phaser.Scene, portrait: boolean): void {
    const existing = scene.children.getByName(TITLE_LOGO_NAME);
    if (portrait) {
      existing?.destroy();
      return;
    }

    if (existing instanceof Phaser.GameObjects.Image || !scene.textures.exists(TITLE_LOGO_KEY)) {
      return;
    }

    const logo = scene.add
      .image(TITLE_LOGO_X, TITLE_LOGO_Y, TITLE_LOGO_KEY)
      .setName(TITLE_LOGO_NAME)
      .setDepth(12);
    const finalScale = TITLE_LOGO_WIDTH / Math.max(1, logo.width);
    const reducedMotion = this.accessibility.load().reducedMotion;

    if (reducedMotion) {
      logo.setScale(finalScale);
      return;
    }

    logo
      .setAlpha(0)
      .setScale(finalScale * 0.86)
      .setY(TITLE_LOGO_Y + 24);
    scene.tweens.add({
      targets: logo,
      alpha: 1,
      y: TITLE_LOGO_Y,
      scaleX: finalScale,
      scaleY: finalScale,
      duration: 720,
      ease: 'Back.Out',
    });
  }

  private syncActions(scene: Phaser.Scene): void {
    for (const { definition, button } of this.mainActions) {
      const target = scene.children.getByName(definition.objectName);
      const label = scene.children.getByName(definition.labelName);
      button.hidden = !isVisible(target);
      button.disabled = !isEnabled(target);

      if (label instanceof Phaser.GameObjects.Text) {
        button.textContent = label.text;
      }
    }

    const retry = this.actionButton('title-menu-retry-save');
    const refresh = this.actionButton('title-menu-refresh');
    const continueButton = this.actionButton('title-menu-continue');
    const newGame = this.actionButton('title-menu-new-game');
    const priorPrimaryVisible = [retry, refresh, continueButton].some(
      (button) => button && !button.hidden,
    );
    if (newGame) {
      newGame.classList.toggle('title-portrait-primary', !priorPrimaryVisible && !newGame.hidden);
      newGame.classList.toggle(
        'title-portrait-warning',
        !newGame.hidden && newGame.textContent !== 'New Game',
      );
    }
  }

  private actionButton(objectName: string): HTMLButtonElement | undefined {
    return this.mainActions.find(({ definition }) => definition.objectName === objectName)?.button;
  }

  private activate(objectName: string): void {
    const scene = this.game.scene
      .getScenes(true)
      .find((active) => active.scene.key === TITLE_SCENE_KEY);
    const target = scene?.children.getByName(objectName);
    if (!scene || !target || !isVisible(target) || !isEnabled(target)) {
      return;
    }

    void getVerticalSliceAudio().unlock();
    target.emit('pointerdown');
    this.sync();
  }
}

let manager: TitlePortraitControlsManager | null = null;

export function getTitlePortraitControlsManager(game: Phaser.Game): TitlePortraitControlsManager {
  manager ??= new TitlePortraitControlsManager(game);
  return manager;
}
