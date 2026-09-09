import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import {
  CREATOR_CATEGORIES,
  CREATOR_CONTROL_DESCRIPTORS,
  creatorCategoryLabel,
  type CreatorCategoryId,
} from './CreatorProgressiveModel';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from './uiTheme';

interface PositionedObject extends Phaser.GameObjects.GameObject {
  x: number;
  y: number;
  setPosition(x: number, y: number): this;
  setVisible(visible: boolean): this;
}

interface ManagedControl {
  object: PositionedObject;
  category: Exclude<CreatorCategoryId, 'main'>;
  originalX: number;
  originalY: number;
  targetY: number;
  interactive: boolean;
}

interface CategoryButtonSet {
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export class LandscapeCreatorProgressiveManager {
  private readonly managedControls: ManagedControl[] = [];
  private readonly categoryButtons = new Map<CreatorCategoryId, CategoryButtonSet>();
  private readonly persistentObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly categoryDescriptionObjects: Phaser.GameObjects.GameObject[] = [];

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly editMode: boolean,
  ) {
    this.captureLegacyControls();
    this.hideLegacySectionPills();
    this.createCategoryNavigation();
    this.ensureBackAction();
    this.showCategory('main');
  }

  private captureLegacyControls(): void {
    for (const candidate of this.scene.children.list) {
      if (!this.isPositioned(candidate)) {
        continue;
      }
      const descriptor = CREATOR_CONTROL_DESCRIPTORS.find(({ namePrefix }) =>
        candidate.name.startsWith(namePrefix),
      );
      if (!descriptor) {
        continue;
      }
      this.managedControls.push({
        object: candidate,
        category: descriptor.category,
        originalX: candidate.x,
        originalY: candidate.y,
        targetY: descriptor.targetY,
        interactive: Boolean(candidate.input),
      });
    }
  }

  private hideLegacySectionPills(): void {
    for (const candidate of this.scene.children.list) {
      if (!this.isPositioned(candidate)) {
        continue;
      }
      if (
        candidate.name.startsWith('creator-legacy-section-') ||
        candidate.name === 'creator-legacy-controls-heading' ||
        candidate.name === 'creator-legacy-name-label'
      ) {
        candidate.setVisible(false);
        if (candidate.input) {
          candidate.input.enabled = false;
        }
      }
    }
  }

  private createCategoryNavigation(): void {
    CREATOR_CATEGORIES.forEach((definition, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 735 + column * 205;
      const y = 255 + row * 62;
      const shadow = createUiShadow(this.scene, x, y + 2, 180, 52, 29, 0.13);
      const button = this.scene.add
        .rectangle(x, y, 180, 52, UI_COLOURS.cream, 0.98)
        .setName(`creator-category-${definition.id}`)
        .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.9)
        .setInteractive({ useHandCursor: true })
        .setDepth(30);
      const label = this.scene.add
        .text(x, y, `${definition.icon} ${definition.label}`, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize:
            definition.id === 'mane-tail' || definition.id === 'accessories' ? '14px' : '16px',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(31);
      applyButtonHover(button, UI_COLOURS.cream, UI_COLOURS.gold);
      button.on('pointerdown', () => this.showCategory(definition.id));
      this.categoryButtons.set(definition.id, { button, label });
      this.persistentObjects.push(shadow, button, label);
    });
  }

  private ensureBackAction(): void {
    if (this.editMode) {
      const cancelLabel = this.scene.children.getByName('creator-action-cancel-label');
      if (cancelLabel instanceof Phaser.GameObjects.Text) {
        cancelLabel.setText('Back');
      }
      return;
    }

    const shadow = createUiShadow(this.scene, 690, 172, 140, 52, 29, 0.15);
    const back = this.scene.add
      .rectangle(690, 170, 140, 52, UI_COLOURS.cream, 0.99)
      .setName('creator-action-back')
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(30);
    const label = this.scene.add
      .text(690, 170, '← Back', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setName('creator-action-back-label')
      .setOrigin(0.5)
      .setDepth(31);
    applyButtonHover(back, UI_COLOURS.cream, UI_COLOURS.lavender);
    back.on('pointerdown', () => this.scene.scene.start('TitleScene'));
    this.persistentObjects.push(shadow, back, label);
  }

  private showCategory(category: CreatorCategoryId): void {
    this.clearCategoryDescription();

    for (const control of this.managedControls) {
      const visible = control.category === category;
      control.object.setVisible(visible);
      control.object.setPosition(control.originalX, visible ? control.targetY : control.originalY);
      if (control.object.input) {
        control.object.input.enabled = visible && control.interactive;
      }
    }

    for (const [id, set] of this.categoryButtons) {
      const selected = id === category;
      set.button
        .setFillStyle(selected ? UI_COLOURS.gold : UI_COLOURS.cream, 0.99)
        .setStrokeStyle(4, selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong, 1);
      set.label.setColor(selected ? '#5a4265' : UI_COLOURS.ink);
    }

    this.renderCategoryDescription(category);
  }

  private renderCategoryDescription(category: CreatorCategoryId): void {
    const heading = this.scene.add
      .text(940, 355, creatorCategoryLabel(category), {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setName(`creator-tablet-category-heading:${category}`)
      .setOrigin(0.5)
      .setDepth(28);
    const marker = this.scene.add
      .container(0, 0)
      .setName(`creator-tablet-category-content:${category}`)
      .setDepth(28);
    this.categoryDescriptionObjects.push(heading, marker);

    if (category !== 'main') {
      return;
    }

    const intro = this.scene.add
      .text(
        940,
        445,
        'Name your unicorn above, then choose one section at a time.\n\nThe big preview stays visible while you try every look.',
        {
          color: '#664f6e',
          fontFamily: UI_FONT,
          fontSize: '19px',
          fontStyle: 'bold',
          align: 'center',
          lineSpacing: 8,
          wordWrap: { width: 500 },
        },
      )
      .setName('creator-tablet-main-guidance')
      .setOrigin(0.5)
      .setDepth(28);
    const footer = this.scene.add
      .text(
        940,
        555,
        'Randomise and reset options are below the preview. Save only when it feels right.',
        {
          color: '#806b84',
          fontFamily: UI_FONT,
          fontSize: '14px',
          align: 'center',
          wordWrap: { width: 490 },
        },
      )
      .setOrigin(0.5)
      .setDepth(28);
    this.categoryDescriptionObjects.push(intro, footer);
  }

  private clearCategoryDescription(): void {
    for (const object of this.categoryDescriptionObjects) {
      object.destroy();
    }
    this.categoryDescriptionObjects.length = 0;
  }

  private isPositioned(object: Phaser.GameObjects.GameObject): object is PositionedObject {
    return (
      'x' in object &&
      typeof object.x === 'number' &&
      'y' in object &&
      typeof object.y === 'number' &&
      'setPosition' in object &&
      typeof object.setPosition === 'function' &&
      'setVisible' in object &&
      typeof object.setVisible === 'function'
    );
  }
}

export class LandscapeCreatorProgressiveWorldManager {
  private readonly refreshThrottle = new RefreshThrottle(80);
  private readonly appliedScenes = new WeakSet<Phaser.Scene>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    if (
      globalThis.innerWidth <= globalThis.innerHeight ||
      !this.refreshThrottle.shouldRun(this.game.loop.time)
    ) {
      return;
    }

    const scene = this.game.scene.getScene('UnicornCreatorScene');
    if (!scene?.scene.isActive() || this.appliedScenes.has(scene)) {
      return;
    }

    const saveAction =
      scene.children.getByName('creator-action-save-changes') ??
      scene.children.getByName('creator-action-confirm-new');
    if (!saveAction) {
      return;
    }

    const editMode = Boolean(scene.children.getByName('creator-action-cancel'));
    new LandscapeCreatorProgressiveManager(scene, editMode);
    this.appliedScenes.add(scene);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.appliedScenes.delete(scene);
    });
  }
}

let manager: LandscapeCreatorProgressiveWorldManager | null = null;

export function getLandscapeCreatorProgressiveWorldManager(
  game: Phaser.Game,
): LandscapeCreatorProgressiveWorldManager {
  manager ??= new LandscapeCreatorProgressiveWorldManager(game);
  return manager;
}
