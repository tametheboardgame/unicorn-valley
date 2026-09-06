import Phaser from 'phaser';
import {
  CREATOR_CATEGORIES,
  creatorCategoryLabel,
  type CreatorCategoryId,
} from './CreatorProgressiveModel';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from './uiTheme';

interface PositionedObject extends Phaser.GameObjects.GameObject {
  x: number;
  y: number;
  setPosition(x: number, y: number): this;
  setVisible(visible: boolean): this;
  input?: Phaser.Types.Input.InteractiveObject | null;
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

const LEGACY_ROW_TARGETS: Readonly<Record<number, number>> = {
  250: 410,
  300: 490,
  350: 390,
  400: 450,
  450: 515,
  500: 575,
  555: 465,
  605: 465,
};

export class LandscapeCreatorProgressiveManager {
  private readonly managedControls: ManagedControl[] = [];
  private readonly categoryButtons = new Map<CreatorCategoryId, CategoryButtonSet>();
  private readonly transientObjects: Phaser.GameObjects.GameObject[] = [];
  private activeCategory: CreatorCategoryId = 'main';

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
      const rowY = this.nearestLegacyRow(candidate.y);
      if (rowY === null) {
        continue;
      }
      const category = this.categoryForPosition(candidate.x, rowY);
      if (!category) {
        continue;
      }
      this.managedControls.push({
        object: candidate,
        category,
        originalX: candidate.x,
        originalY: candidate.y,
        targetY: LEGACY_ROW_TARGETS[rowY],
        interactive: Boolean(candidate.input),
      });
    }
  }

  private hideLegacySectionPills(): void {
    for (const candidate of this.scene.children.list) {
      if (!this.isPositioned(candidate)) {
        continue;
      }
      if ([226, 326, 532].some((y) => Math.abs(candidate.y - y) <= 1)) {
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
          fontSize: definition.id === 'mane-tail' || definition.id === 'accessories' ? '14px' : '16px',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(31);
      applyButtonHover(button, UI_COLOURS.cream, UI_COLOURS.gold);
      button.on('pointerdown', () => this.showCategory(definition.id));
      this.categoryButtons.set(definition.id, { button, label });
      this.transientObjects.push(shadow);
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

    createUiShadow(this.scene, 730, 675, 150, 64, 29, 0.15);
    const back = this.scene.add
      .rectangle(730, 675, 150, 64, UI_COLOURS.cream, 0.99)
      .setName('creator-action-back')
      .setStrokeStyle(5, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(30);
    const label = this.scene.add
      .text(730, 675, 'Back', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName('creator-action-back-label')
      .setOrigin(0.5)
      .setDepth(31);
    applyButtonHover(back, UI_COLOURS.cream, UI_COLOURS.lavender);
    back.on('pointerdown', () => this.scene.scene.start('TitleScene'));
    this.transientObjects.push(back, label);
  }

  private showCategory(category: CreatorCategoryId): void {
    this.activeCategory = category;
    this.clearCategoryDescription();

    for (const control of this.managedControls) {
      const visible = control.category === category;
      control.object.setVisible(visible);
      control.object.setPosition(
        control.originalX,
        visible ? control.targetY + (control.originalY - Math.round(control.originalY)) : control.originalY,
      );
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
      .text(940, 360, creatorCategoryLabel(category), {
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
    this.transientObjects.push(heading, marker);

    if (category !== 'main') {
      const hint = this.scene.add
        .text(940, 390, 'Tap any option. Your unicorn updates instantly on the left.', {
          color: '#7d6880',
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(28);
      this.transientObjects.push(hint);
      return;
    }

    const intro = this.scene.add
      .text(
        940,
        440,
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
      .text(940, 555, 'Randomise and reset options are below the preview. Save only when it feels right.', {
        color: '#806b84',
        fontFamily: UI_FONT,
        fontSize: '14px',
        align: 'center',
        wordWrap: { width: 490 },
      })
      .setOrigin(0.5)
      .setDepth(28);
    this.transientObjects.push(intro, footer);
  }

  private clearCategoryDescription(): void {
    for (let index = this.transientObjects.length - 1; index >= 0; index -= 1) {
      const object = this.transientObjects[index];
      if (
        object.name.startsWith('creator-tablet-category-') ||
        object.name === 'creator-tablet-main-guidance' ||
        (object instanceof Phaser.GameObjects.Text && object.y >= 350 && object.y <= 590)
      ) {
        object.destroy();
        this.transientObjects.splice(index, 1);
      }
    }
  }

  private nearestLegacyRow(y: number): number | null {
    for (const row of Object.keys(LEGACY_ROW_TARGETS).map(Number)) {
      if (Math.abs(y - row) <= 1) {
        return row;
      }
    }
    return null;
  }

  private categoryForPosition(
    x: number,
    rowY: number,
  ): Exclude<CreatorCategoryId, 'main'> | null {
    if (rowY === 250 || rowY === 300) {
      return 'colours';
    }
    if (rowY === 350 || rowY === 400 || rowY === 450 || rowY === 500) {
      return 'mane-tail';
    }
    if (rowY === 555) {
      return x < 925 ? 'horn' : 'markings';
    }
    if (rowY === 605) {
      return 'accessories';
    }
    return null;
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
