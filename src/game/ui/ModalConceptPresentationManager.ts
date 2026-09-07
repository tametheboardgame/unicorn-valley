import Phaser from 'phaser';
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

interface ConceptSurfacePresentation {
  graphics: Phaser.GameObjects.Graphics;
  hideSource: () => void;
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

export class ModalConceptPresentationManager {
  private readonly syncThrottle = new RefreshThrottle(SYNC_INTERVAL_MS);
  private readonly presentations = new WeakMap<
    Phaser.GameObjects.Rectangle,
    ConceptSurfacePresentation
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
      this.syncScene(scene);
    }
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
