import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { CONCEPT_UI } from './ConceptUi';

const MODAL_SCENE_KEYS = new Set([
  'InventoryScene',
  'WonderbookScene',
  'SettingsScene',
  'UnicornCreatorScene',
  'ShopScene',
  'CottageDecorateScene',
]);

const SURFACE_NAME_PATTERN =
  /(button|panel|tab|card|row|tile|pocket|close|done|shop|scroll|option|category|action|confirm|cancel|next|previous|filter|badge)/i;
const SYNC_INTERVAL_MS = 120;
const HIDDEN_SOURCE_ALPHA = 0.001;
const SETTINGS_VIEWPORT_TOP = 132;
const SETTINGS_VIEWPORT_BOTTOM = 590;
const SETTINGS_CLIP_WIDTH = 650;
const SETTINGS_CHROME_DEPTH = 19;
const SETTINGS_FOREGROUND_DEPTH = 22;

interface ConceptSurfacePresentation {
  graphics: Phaser.GameObjects.Graphics;
  hideSource: () => void;
}

interface SettingsClipPresentation {
  top: Phaser.GameObjects.Rectangle;
  bottom: Phaser.GameObjects.Rectangle;
}

function shouldStyleRectangle(rectangle: Phaser.GameObjects.Rectangle): boolean {
  const name = rectangle.name.trim();
  return Boolean(name && !name.includes('backdrop') && SURFACE_NAME_PATTERN.test(name));
}

function surfaceRadius(width: number, height: number): number {
  const preferred = height >= 180 ? 30 : height >= 90 ? 24 : 20;
  return Math.max(10, Math.min(preferred, width / 2, height / 2));
}

function sourceFill(rectangle: Phaser.GameObjects.Rectangle): number {
  return rectangle.fillColor || CONCEPT_UI.cream;
}

function sourceStroke(rectangle: Phaser.GameObjects.Rectangle): number {
  return rectangle.strokeColor || CONCEPT_UI.lavenderLine;
}

function redrawSurface(
  presentation: ConceptSurfacePresentation,
  rectangle: Phaser.GameObjects.Rectangle,
): void {
  const width = rectangle.displayWidth;
  const height = rectangle.displayHeight;
  const x = rectangle.x;
  const y = rectangle.y;
  const radius = surfaceRadius(width, height);
  const graphics = presentation.graphics;
  const fill = sourceFill(rectangle);
  const stroke = sourceStroke(rectangle);
  const lineWidth = Math.max(2, rectangle.lineWidth || 3);

  graphics.setDepth(rectangle.depth).setVisible(rectangle.visible);
  graphics.clear();
  graphics.fillStyle(CONCEPT_UI.shadow, height >= 150 ? 0.13 : 0.2);
  graphics.fillRoundedRect(x - width / 2 + 5, y - height / 2 + 7, width, height, radius);
  graphics.fillStyle(fill, Math.max(0.9, rectangle.fillAlpha || 1));
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  graphics.lineStyle(lineWidth, stroke, Math.max(0.76, rectangle.strokeAlpha || 1));
  graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);

  if (height <= 104 && width <= 720) {
    const inset = Math.min(6, height * 0.08);
    const glossHeight = Math.max(10, height * 0.34);
    graphics.fillStyle(CONCEPT_UI.white, 0.18);
    graphics.fillRoundedRect(
      x - width / 2 + inset,
      y - height / 2 + inset,
      width - inset * 2,
      glossHeight,
      Math.max(7, radius - inset),
    );
  }

  presentation.hideSource();
}

function setNamedDepth(scene: Phaser.Scene, name: string, depth: number): void {
  const object = scene.children.getByName(name);
  if (object instanceof Phaser.GameObjects.Rectangle || object instanceof Phaser.GameObjects.Text) {
    object.setDepth(depth);
  }
}

export class ModalConceptPresentationManager {
  private readonly syncThrottle = new RefreshThrottle(SYNC_INTERVAL_MS);
  private readonly presentations = new WeakMap<
    Phaser.GameObjects.Rectangle,
    ConceptSurfacePresentation
  >();
  private readonly settingsClipPresentations = new WeakMap<
    Phaser.Scene,
    SettingsClipPresentation
  >();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }

    for (const scene of this.game.scene.getScenes(true)) {
      if (!MODAL_SCENE_KEYS.has(scene.scene.key)) {
        continue;
      }
      if (scene.scene.key === 'SettingsScene') {
        this.syncSettingsClipGuards(scene);
      }
      this.syncScene(scene);
    }
  }

  private syncSettingsClipGuards(scene: Phaser.Scene): void {
    let clips = this.settingsClipPresentations.get(scene);
    if (!clips?.top.active || !clips.bottom.active) {
      const topHeight = SETTINGS_VIEWPORT_TOP - 18;
      const top = scene.add
        .rectangle(
          GAME_WIDTH / 2,
          18 + topHeight / 2,
          SETTINGS_CLIP_WIDTH,
          topHeight,
          CONCEPT_UI.cream,
          1,
        )
        .setName('settings-clip-top')
        .setDepth(SETTINGS_CHROME_DEPTH);
      const bottomHeight = GAME_HEIGHT - 18 - SETTINGS_VIEWPORT_BOTTOM;
      const bottom = scene.add
        .rectangle(
          GAME_WIDTH / 2,
          SETTINGS_VIEWPORT_BOTTOM + bottomHeight / 2,
          SETTINGS_CLIP_WIDTH,
          bottomHeight,
          CONCEPT_UI.cream,
          1,
        )
        .setName('settings-clip-bottom')
        .setDepth(SETTINGS_CHROME_DEPTH);
      clips = { top, bottom };
      this.settingsClipPresentations.set(scene, clips);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        top.destroy();
        bottom.destroy();
        this.settingsClipPresentations.delete(scene);
      });
    }

    clips.top.setVisible(true).setDepth(SETTINGS_CHROME_DEPTH);
    clips.bottom.setVisible(true).setDepth(SETTINGS_CHROME_DEPTH);

    setNamedDepth(scene, 'settings-heading', SETTINGS_FOREGROUND_DEPTH);
    setNamedDepth(scene, 'settings-hint', SETTINGS_FOREGROUND_DEPTH);
    setNamedDepth(scene, 'settings-status', SETTINGS_FOREGROUND_DEPTH);
    setNamedDepth(scene, 'settings-done', SETTINGS_FOREGROUND_DEPTH + 1);
    setNamedDepth(scene, 'settings-done-label', SETTINGS_FOREGROUND_DEPTH + 2);
    setNamedDepth(scene, 'settings-scrollbar-track', SETTINGS_FOREGROUND_DEPTH);
    setNamedDepth(scene, 'settings-scrollbar-thumb', SETTINGS_FOREGROUND_DEPTH + 1);
  }

  private syncScene(scene: Phaser.Scene): void {
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Rectangle) || !shouldStyleRectangle(object)) {
        continue;
      }

      const presentation = this.presentations.get(object) ?? this.createPresentation(scene, object);
      redrawSurface(presentation, object);
    }
  }

  private createPresentation(
    scene: Phaser.Scene,
    rectangle: Phaser.GameObjects.Rectangle,
  ): ConceptSurfacePresentation {
    const graphics = scene.add
      .graphics()
      .setName(`concept-modal-surface:${rectangle.name}`)
      .setScrollFactor(rectangle.scrollFactorX, rectangle.scrollFactorY)
      .setDepth(rectangle.depth);
    scene.children.moveBelow(graphics, rectangle);

    const hideSource = (): void => {
      rectangle.setAlpha(HIDDEN_SOURCE_ALPHA);
    };
    for (const eventName of ['pointerover', 'pointerout', 'pointerdown', 'pointerup'] as const) {
      rectangle.on(eventName, hideSource);
    }
    hideSource();

    const presentation = { graphics, hideSource };
    this.presentations.set(rectangle, presentation);
    return presentation;
  }
}

let manager: ModalConceptPresentationManager | null = null;

export function getModalConceptPresentationManager(
  game: Phaser.Game,
): ModalConceptPresentationManager {
  manager ??= new ModalConceptPresentationManager(game);
  return manager;
}
