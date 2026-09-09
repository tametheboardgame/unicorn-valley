import Phaser from 'phaser';
import '../../creatorPortraitControls.css';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import {
  ACCESSORIES,
  BODY_COLOURS,
  EYE_COLOURS,
  HAIR_COLOURS,
  HORN_STYLES,
  MANE_STYLES,
  MARKINGS,
  TAIL_STYLES,
  type UnicornAppearance,
} from '../player/UnicornAppearance';
import { drawUnicornComponent } from '../player/UnicornAppearanceRenderer';
import { CREATOR_CATEGORIES, type CreatorCategoryId } from './CreatorProgressiveModel';
import { UI_COLOURS, UI_FONT, applyButtonHover } from './uiTheme';

interface CreatorOwner extends Phaser.Scene {
  creatorValue(key: keyof UnicornAppearance): string;
  creatorSelect(key: keyof UnicornAppearance, value: string): void;
  creatorProgressiveRefresh?: () => void;
}

type Choice = { id: string; label: string; value?: number };
type CategoryConfig = {
  key: keyof UnicornAppearance;
  title: string;
  choices: readonly Choice[];
  colours?: { key: keyof UnicornAppearance; title: string; choices: readonly Choice[] };
};

const CONFIG: Record<CreatorCategoryId, CategoryConfig[]> = {
  colours: [
    { key: 'bodyColour', title: 'Body colour', choices: BODY_COLOURS },
    { key: 'eyeColour', title: 'Eye colour', choices: EYE_COLOURS },
  ],
  mane: [
    {
      key: 'maneStyle',
      title: 'Choose a mane',
      choices: MANE_STYLES,
      colours: { key: 'maneColour', title: 'Mane colour', choices: HAIR_COLOURS },
    },
  ],
  tail: [
    {
      key: 'tailStyle',
      title: 'Choose a tail',
      choices: TAIL_STYLES,
      colours: { key: 'tailColour', title: 'Tail colour', choices: HAIR_COLOURS },
    },
  ],
  horn: [{ key: 'hornStyle', title: 'Choose a horn', choices: HORN_STYLES }],
  markings: [{ key: 'marking', title: 'Choose a marking', choices: MARKINGS }],
  accessories: [{ key: 'accessory', title: 'Choose an accessory', choices: ACCESSORIES }],
};

export class LandscapeCreatorProgressiveManager {
  private readonly categoryButtons = new Map<CreatorCategoryId, Phaser.GameObjects.Rectangle>();
  private readonly content: Phaser.GameObjects.GameObject[] = [];
  private active: CreatorCategoryId = 'colours';

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly editMode: boolean,
  ) {
    this.hideLegacyControls();
    this.createCategoryNavigation();
    this.ensureBackAction();
    this.showCategory('colours');
    (this.scene as CreatorOwner).creatorProgressiveRefresh = () => this.showCategory(this.active);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      (this.scene as CreatorOwner).creatorProgressiveRefresh = undefined;
      this.destroy();
    });
  }

  private hideLegacyControls(): void {
    for (const candidate of this.scene.children.list) {
      if (!candidate.name.startsWith('creator-')) continue;
      if (
        ['creator-heading', 'creator-profile-label'].includes(candidate.name) ||
        candidate.name.startsWith('creator-action-surprise') ||
        candidate.name.startsWith('creator-action-default') ||
        candidate.name.startsWith('creator-action-confirm-new') ||
        candidate.name.startsWith('creator-action-save-changes') ||
        candidate.name.startsWith('creator-action-cancel')
      )
        continue;
      if ('setVisible' in candidate && typeof candidate.setVisible === 'function')
        candidate.setVisible(false);
      if ('input' in candidate && candidate.input) candidate.input.enabled = false;
    }
  }

  private createCategoryNavigation(): void {
    CREATOR_CATEGORIES.forEach((definition, index) => {
      const x = 735 + (index % 3) * 188;
      const y = 184 + Math.floor(index / 3) * 55;
      const button = this.scene.add
        .rectangle(x, y, 172, 45, UI_COLOURS.lavender, 1)
        .setName(`creator-category-${definition.id}`)
        .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.9)
        .setInteractive({ useHandCursor: true })
        .setDepth(30);
      this.scene.add
        .text(x, y, `${definition.icon}  ${definition.label}`, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '16px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(31);
      button.on('pointerover', () => {
        if (this.active !== definition.id) button.setFillStyle(UI_COLOURS.gold, 1);
      });
      button.on('pointerout', () => this.applyCategoryStyles());
      button.on('pointerdown', () => this.showCategory(definition.id));
      this.categoryButtons.set(definition.id, button);
    });
  }

  private ensureBackAction(): void {
    const existing = this.scene.children.getByName('creator-action-cancel');
    if (this.editMode && existing && 'setVisible' in existing) {
      (existing as Phaser.GameObjects.Rectangle).setVisible(true);
      if ('input' in existing && existing.input) existing.input.enabled = true;
      return;
    }
    const back = this.scene.add
      .rectangle(785, 620, 210, 54, UI_COLOURS.lavender, 1)
      .setName('creator-action-back')
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(30);
    this.scene.add
      .text(785, 620, '←  Back', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(31);
    back.on('pointerdown', () => this.scene.scene.start('TitleScene'));
  }

  private showCategory(category: CreatorCategoryId): void {
    this.active = category;
    for (const object of this.content) object.destroy();
    this.content.length = 0;
    this.applyCategoryStyles();
    const configs = CONFIG[category];
    if (category === 'colours') this.renderColourGroups(configs);
    else this.renderStyleGroup(configs[0]);
  }

  private applyCategoryStyles(): void {
    for (const [id, button] of this.categoryButtons) {
      button
        .setFillStyle(id === this.active ? UI_COLOURS.gold : UI_COLOURS.lavender, 1)
        .setStrokeStyle(
          3,
          id === this.active ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
          1,
        );
    }
  }

  private renderColourGroups(groups: CategoryConfig[]): void {
    groups.forEach((group, index) => {
      this.renderSwatches(group.key, group.title, group.choices, 300 + index * 145);
    });
  }

  private renderStyleGroup(group: CategoryConfig): void {
    this.addText(660, 295, group.title, '22px');
    const count = group.choices.length;
    const columns = count > 6 ? 4 : 3;
    const width = columns === 4 ? 120 : 154;
    const gap = columns === 4 ? 130 : 166;
    group.choices.forEach((choice, index) => {
      const x = (columns === 4 ? 704 : 728) + (index % columns) * gap;
      const y = 354 + Math.floor(index / columns) * 108;
      const selected = (this.scene as CreatorOwner).creatorValue(group.key) === choice.id;
      const card = this.scene.add
        .rectangle(x, y, width, 108, selected ? 0xfff2c1 : UI_COLOURS.cream, 1)
        .setName(`creator-card-${String(group.key)}-${choice.id}`)
        .setStrokeStyle(selected ? 5 : 2, selected ? UI_COLOURS.goldStrong : 0xcbb8cd, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(32);
      const art = this.scene.add.graphics().setDepth(33);
      const base = this.currentAppearance();
      const variant = { ...base, [group.key]: choice.id } as UnicornAppearance;
      drawUnicornComponent(
        art,
        group.key as Exclude<
          typeof group.key,
          'bodyColour' | 'eyeColour' | 'maneColour' | 'tailColour'
        >,
        x,
        y - 12,
        variant,
        group.key === 'tailStyle' ? 0.62 : 0.72,
      );
      const label = this.scene.add
        .text(x, y + 39, `${selected ? '✓ ' : ''}${choice.label}`, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(34);
      card.on('pointerdown', () => {
        (this.scene as CreatorOwner).creatorSelect(group.key, choice.id);
      });
      this.content.push(card, art, label);
    });
    if (group.colours)
      this.renderSwatches(group.colours.key, group.colours.title, group.colours.choices, 536);
  }

  private currentAppearance(): UnicornAppearance {
    return Object.fromEntries(
      [
        'bodyColour',
        'eyeColour',
        'maneStyle',
        'maneColour',
        'tailStyle',
        'tailColour',
        'hornStyle',
        'marking',
        'accessory',
      ].map((key) => [
        key,
        (this.scene as CreatorOwner).creatorValue(key as keyof UnicornAppearance),
      ]),
    ) as unknown as UnicornAppearance;
  }

  private renderSwatches(
    key: keyof UnicornAppearance,
    title: string,
    choices: readonly Choice[],
    y: number,
  ): void {
    this.addText(660, y, title, '20px');
    choices.forEach((choice, index) => {
      const x = 815 + index * 52;
      const selected = (this.scene as CreatorOwner).creatorValue(key) === choice.id;
      const swatch = this.scene.add
        .circle(x, y, 21, choice.value ?? 0x9b65b5, 1)
        .setName(`creator-card-${String(key)}-${choice.id}`)
        .setStrokeStyle(selected ? 6 : 3, selected ? UI_COLOURS.goldStrong : 0xffffff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(33);
      swatch.on('pointerdown', () => {
        (this.scene as CreatorOwner).creatorSelect(key, choice.id);
      });
      this.content.push(swatch);
    });
  }

  private addText(x: number, y: number, value: string, size: string): void {
    const text = this.scene.add
      .text(x, y, value, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: size,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(34);
    this.content.push(text);
  }

  private destroy(): void {
    for (const object of this.content) object.destroy();
    this.content.length = 0;
    for (const button of this.categoryButtons.values()) button.destroy();
    this.categoryButtons.clear();
  }
}

export class LandscapeCreatorProgressiveWorldManager {
  private readonly refreshThrottle = new RefreshThrottle(80);
  private readonly appliedScenes = new WeakSet<Phaser.Scene>();
  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () =>
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this),
    );
  }
  private update = (): void => {
    if (!this.refreshThrottle.shouldRun(this.game.loop.time)) return;
    const scene = this.game.scene
      .getScenes(true)
      .find((candidate) => candidate.scene.key === 'UnicornCreatorScene');
    if (!scene || this.appliedScenes.has(scene)) return;
    this.appliedScenes.add(scene);
    new LandscapeCreatorProgressiveManager(
      scene,
      Boolean((scene as Phaser.Scene & { editMode?: boolean }).editMode),
    );
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.appliedScenes.delete(scene));
  };
}

let manager: LandscapeCreatorProgressiveWorldManager | null = null;
export function getLandscapeCreatorProgressiveWorldManager(
  game: Phaser.Game,
): LandscapeCreatorProgressiveWorldManager {
  manager ??= new LandscapeCreatorProgressiveWorldManager(game);
  return manager;
}
