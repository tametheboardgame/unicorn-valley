import Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { RefreshThrottle } from '../performance/RefreshThrottle';

const TITLE_SCENE_KEY = 'TitleScene';
const SYNC_INTERVAL_MS = 100;
const PORTRAIT_MEDIA_QUERY = '(pointer: coarse) and (max-width: 700px) and (orientation: portrait)';
const TITLE_ARTWORK_NAME = 'title-generated-artwork';
const TITLE_ARTWORK_LANDSCAPE_KEY = 'title-generated-landscape';
const TITLE_ARTWORK_PORTRAIT_KEY = 'title-generated-portrait';
const TITLE_ARTWORK_LANDSCAPE_URL = '/assets/title/wp19f-title-landscape.webp';
const TITLE_ARTWORK_PORTRAIT_URL = '/assets/title/wp19f-title-portrait.webp';

interface ActionDefinition {
  objectName: string;
  labelName: string;
  className?: string;
}

const MAIN_ACTIONS: readonly ActionDefinition[] = [
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
  { objectName: 'title-menu-my-unicorn', labelName: 'title-menu-my-unicorn-label' },
  { objectName: 'title-menu-settings', labelName: 'title-menu-settings-label' },
];

const SETTING_ACTIONS: readonly ActionDefinition[] = [
  { objectName: 'title-setting-muted', labelName: 'title-setting-muted-label' },
  { objectName: 'title-setting-music', labelName: 'title-setting-music-label' },
  { objectName: 'title-setting-ambience', labelName: 'title-setting-ambience-label' },
  { objectName: 'title-setting-sfx', labelName: 'title-setting-sfx-label' },
  {
    objectName: 'title-setting-reduced-motion',
    labelName: 'title-setting-reduced-motion-label',
  },
  {
    objectName: 'title-setting-high-visibility',
    labelName: 'title-setting-high-visibility-label',
  },
  { objectName: 'title-setting-fullscreen', labelName: 'title-setting-fullscreen-label' },
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
  private readonly root: HTMLElement;
  private readonly mainView: HTMLElement;
  private readonly settingsView: HTMLElement;
  private readonly heading: HTMLElement;
  private readonly status: HTMLElement;
  private readonly mainActions: DomAction[];
  private readonly settingActions: DomAction[];
  private readonly doneButton: HTMLButtonElement;
  private readonly requestedArtwork = new Set<string>();
  private readonly preloadedArtwork = new Set<string>();

  public constructor(private readonly game: Phaser.Game) {
    this.root = document.createElement('section');
    this.root.className = 'title-portrait-controls';
    this.root.dataset.titlePortraitControls = 'true';
    this.root.setAttribute('aria-label', 'Unicorn Valley menu');
    this.root.hidden = true;

    this.mainView = document.createElement('div');
    this.mainView.className = 'title-portrait-view title-portrait-main';

    this.heading = document.createElement('h1');
    this.heading.className = 'title-portrait-heading';
    this.heading.textContent = 'Unicorn Valley';
    this.mainView.append(this.heading);

    const mainActions = document.createElement('div');
    mainActions.className = 'title-portrait-actions';
    this.mainActions = MAIN_ACTIONS.map((definition) => {
      const button = makeButton(definition);
      button.addEventListener('click', () => this.activate(definition.objectName));
      mainActions.append(button);
      return { definition, button };
    });
    this.mainView.append(mainActions);

    this.status = document.createElement('p');
    this.status.className = 'title-portrait-status';
    this.status.setAttribute('aria-live', 'polite');
    this.mainView.append(this.status);

    this.settingsView = document.createElement('div');
    this.settingsView.className = 'title-portrait-view title-portrait-settings';
    this.settingsView.hidden = true;

    const settingsHeading = document.createElement('h2');
    settingsHeading.className = 'title-portrait-heading';
    settingsHeading.textContent = 'Settings';
    this.settingsView.append(settingsHeading);

    const settingActions = document.createElement('div');
    settingActions.className = 'title-portrait-actions title-portrait-settings-actions';
    this.settingActions = SETTING_ACTIONS.map((definition) => {
      const button = makeButton(definition);
      button.addEventListener('click', () => this.activate(definition.objectName));
      settingActions.append(button);
      return { definition, button };
    });
    this.settingsView.append(settingActions);

    this.doneButton = document.createElement('button');
    this.doneButton.type = 'button';
    this.doneButton.className = 'title-portrait-button title-portrait-primary';
    this.doneButton.dataset.titleAction = 'title-settings-done';
    this.doneButton.textContent = 'Done';
    this.doneButton.addEventListener('click', () => this.activate('title-settings-done'));
    this.settingsView.append(this.doneButton);

    this.root.append(this.mainView, this.settingsView);
    document.body.append(this.root);
    this.preloadArtwork(currentArtworkTarget());
    globalThis.matchMedia?.(PORTRAIT_MEDIA_QUERY).addEventListener('change', () => {
      this.preloadArtwork(currentArtworkTarget());
    });
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
      return;
    }

    this.syncArtwork(scene);
    this.root.hidden = false;
    const settingsPanel = scene.children.getByName('title-settings-panel');
    const settingsOpen = isVisible(settingsPanel);
    this.mainView.hidden = settingsOpen;
    this.settingsView.hidden = !settingsOpen;

    const heading = scene.children.getByName('title-menu-heading');
    if (heading instanceof Phaser.GameObjects.Text) {
      this.heading.textContent = heading.text;
    }

    const status = scene.children.getByName('title-menu-status');
    if (status instanceof Phaser.GameObjects.Text) {
      this.status.textContent = status.text;
    }

    this.syncActions(scene, this.mainActions);
    this.syncActions(scene, this.settingActions, true);

    const done = scene.children.getByName('title-settings-done');
    this.doneButton.disabled = !isEnabled(done);
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

  private syncArtwork(scene: Phaser.Scene): void {
    const target = currentArtworkTarget();
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
      .image(GAME_WIDTH / 2, target.portrait ? 850 : GAME_HEIGHT / 2, target.key)
      .setName(TITLE_ARTWORK_NAME)
      .setScale(coverScale)
      .setDepth(8);
    artwork.setData('titleArtworkVariant', target.portrait ? 'portrait' : 'landscape');
  }

  private syncActions(scene: Phaser.Scene, actions: DomAction[], settings = false): void {
    for (const { definition, button } of actions) {
      const target = scene.children.getByName(definition.objectName);
      const label = scene.children.getByName(definition.labelName);
      button.hidden = !isVisible(target);
      button.disabled = !isEnabled(target);

      if (label instanceof Phaser.GameObjects.Text) {
        button.textContent = label.text;
        if (settings) {
          const enabled = label.text.endsWith(': On');
          button.setAttribute('aria-pressed', String(enabled));
          button.classList.toggle('is-on', enabled);
        }
      }
    }
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
