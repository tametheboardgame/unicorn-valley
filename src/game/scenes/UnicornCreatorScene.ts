import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import {
  ACCESSORIES,
  BODY_COLOURS,
  DEFAULT_UNICORN_APPEARANCE,
  DEFAULT_UNICORN_NAME,
  EYE_COLOURS,
  HAIR_COLOURS,
  HORN_STYLES,
  MANE_STYLES,
  MARKINGS,
  parseUnicornAppearance,
  TAIL_STYLES,
  type UnicornAppearance,
} from '../player/UnicornAppearance';
import {
  drawUnicornAppearance,
  fitUnicornArtwork,
  unicornAppearanceBounds,
} from '../player/UnicornAppearanceRenderer';
import { getBrowserSaveService } from '../save/browserSaveService';
import { applyProfileRedesign, hasNamedUnicorn } from '../save/profileRedesign';
import type { SaveGame } from '../save/saveSchema';
import { CreatorDraft, type CreatorAppearanceKey } from '../ui/CreatorProgressiveModel';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

interface TextChoice {
  id: string;
  label: string;
}

const RANDOM_NAMES = [
  'Starlight',
  'Moonbeam',
  'Twinkle',
  'Blossom',
  'Sparkle',
  'Nova',
  'Daisy',
  'Comet',
  'Rosie',
  'Skydrop',
];
const NAME_INPUT_X = 325;
const NAME_INPUT_Y = 140;
const NAME_INPUT_WIDTH = 300;
const NAME_INPUT_HEIGHT = 48;

export class UnicornCreatorScene extends Phaser.Scene {
  private save: SaveGame | null = null;
  private draft = new CreatorDraft(DEFAULT_UNICORN_APPEARANCE, false);
  private preview: Phaser.GameObjects.Graphics | null = null;
  private nameInput: HTMLInputElement | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private profileLabel: Phaser.GameObjects.Text | null = null;
  private editMode = false;
  private valueLabels = new Map<string, Phaser.GameObjects.Text>();
  private swatchOutlines = new Map<string, Phaser.GameObjects.Arc[]>();
  public creatorProgressiveRefresh?: () => void;
  private renameButton: HTMLButtonElement | null = null;

  public constructor() {
    super('UnicornCreatorScene');
  }

  public create(): void {
    const saveService = getBrowserSaveService();
    if (saveService.hasUnsupportedSaveVersion()) {
      this.scene.start('TitleScene');
      return;
    }

    this.save = saveService.load() ?? saveService.createNewGame();
    this.editMode = hasNamedUnicorn(this.save);
    this.draft = new CreatorDraft(
      parseUnicornAppearance(this.save.profile.appearance),
      this.editMode,
    );

    this.input.keyboard?.disableGlobalCapture();

    this.cameras.main.setBackgroundColor('#7558a0');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7558a0, 1);
    this.add.circle(220, 150, 185, 0xf2c9ed, 0.12);
    this.add.circle(1100, 590, 255, 0xffecb6, 0.08);
    this.add.circle(1030, 120, 120, 0xcfefff, 0.06);
    this.add.circle(70, 650, 180, 0x9ed9e6, 0.06);

    for (const [x, y, size, alpha] of [
      [92, 165, 22, 0.62],
      [548, 210, 16, 0.48],
      [110, 555, 15, 0.42],
      [515, 540, 20, 0.54],
      [1180, 92, 17, 0.44],
    ] as const) {
      this.add
        .text(x, y, '✦', {
          color: '#fff3ae',
          fontFamily: UI_FONT,
          fontSize: `${size}px`,
        })
        .setAlpha(alpha)
        .setDepth(1);
    }

    const unicornName = this.save.profile.name ?? DEFAULT_UNICORN_NAME;
    this.add
      .text(GAME_WIDTH / 2, 28, this.editMode ? `Redesign ${unicornName}` : 'Make Your Unicorn', {
        color: '#fff8ff',
        fontFamily: UI_FONT,
        fontSize: '43px',
        fontStyle: 'bold',
      })
      .setName('creator-heading')
      .setOrigin(0.5, 0)
      .setDepth(20);

    this.add
      .text(
        52,
        88,
        this.editMode
          ? 'Try a new look or name. Your adventure stays exactly where you left it.'
          : 'Pick anything you like. You can change it again later.',
        {
          color: '#efe6fa',
          fontFamily: UI_FONT,
          fontSize: '19px',
        },
      )
      .setName('creator-subtitle')
      .setDepth(20);

    this.statusText = this.add
      .text(
        52,
        116,
        this.editMode
          ? 'Nothing changes until you choose Save Changes.'
          : 'This will become your one Unicorn Valley profile.',
        {
          color: '#fff0c9',
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
        },
      )
      .setName('creator-status')
      .setDepth(20);

    createUiShadow(this, 325, 390, 500, 520, 1, 0.22);
    this.add
      .rectangle(325, 390, 500, 520, UI_COLOURS.cream, 0.98)
      .setStrokeStyle(6, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);
    this.add
      .rectangle(325, 158, 270, 50, UI_COLOURS.cream, 0.96)
      .setName('creator-legacy-name-banner')
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.9)
      .setDepth(4);
    this.profileLabel = this.add
      .text(325, 158, unicornName, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '26px',
        fontStyle: 'bold',
      })
      .setName('creator-profile-label')
      .setOrigin(0.5)
      .setDepth(5);
    this.fitDisplayedName();

    this.add
      .ellipse(325, 535, 350, 62, 0xd7c3e7, 0.38)
      .setName('creator-legacy-preview-shadow')
      .setStrokeStyle(3, 0xc39bd7, 0.44)
      .setDepth(3);
    this.add
      .text(325, 556, 'LIVE PREVIEW', {
        color: '#8c6a9d',
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setName('creator-legacy-live-preview')
      .setOrigin(0.5)
      .setDepth(5);

    createUiShadow(this, 940, 390, 610, 530, 1, 0.22);
    this.add
      .rectangle(940, 390, 610, 530, UI_COLOURS.cream, 0.99)
      .setStrokeStyle(6, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);
    this.add
      .text(670, 146, this.editMode ? 'Choose a new look ✨' : 'Choose your look ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setName('creator-legacy-controls-heading')
      .setDepth(5);

    this.createSectionPill(710, 226, 112, 'COLOURS');
    this.createSectionPill(724, 326, 140, 'HAIR & TAIL');
    this.createSectionPill(742, 532, 176, 'MAGIC DETAILS');

    this.preview = this.add.graphics().setDepth(6);
    this.createNameInput(unicornName);
    this.createRenameButton();

    this.createColourRow('Body', 'bodyColour', BODY_COLOURS, 670, 250);
    this.createColourRow('Eyes', 'eyeColour', EYE_COLOURS, 670, 300);
    this.createChoiceRow('Mane style', 'maneStyle', MANE_STYLES, 670, 350);
    this.createColourRow('Mane colour', 'maneColour', HAIR_COLOURS, 670, 400);
    this.createChoiceRow('Tail style', 'tailStyle', TAIL_STYLES, 670, 450);
    this.createColourRow('Tail colour', 'tailColour', HAIR_COLOURS, 670, 500);
    this.createCompactChoiceRow('Horn', 'hornStyle', HORN_STYLES, 670, 555, 250);
    this.createCompactChoiceRow('Marking', 'marking', MARKINGS, 935, 555, 260);
    this.createCompactChoiceRow('Accessory', 'accessory', ACCESSORIES, 670, 605, 520);

    if (this.editMode) {
      this.createActionButton(
        205,
        605,
        220,
        'Surprise!',
        () => this.randomise(),
        false,
        'surprise',
      );
      this.createActionButton(
        325,
        605,
        155,
        'Restore Saved',
        () => this.restoreSavedProfile(),
        false,
        'restore-saved',
      );
      this.createActionButton(
        455,
        605,
        180,
        'Reset',
        () => this.useDefaultLook(),
        false,
        'default',
      );
      this.createActionButton(785, 620, 210, '← Back', () => this.cancelEdit(), false, 'cancel');
      this.createActionButton(
        1080,
        620,
        275,
        'Save Changes ✨',
        () => this.saveAndEnter(),
        true,
        'save-changes',
      );
    } else {
      this.createActionButton(
        205,
        605,
        220,
        'Surprise Me!',
        () => this.randomise(),
        false,
        'surprise',
      );
      this.createActionButton(455, 605, 180, 'Reset', () => this.useDefault(), false, 'default');
      this.createActionButton(
        1080,
        620,
        275,
        'Looks Good! ✨',
        () => this.saveAndEnter(),
        true,
        'confirm-new',
      );
    }

    this.redraw();

    this.scale.on('resize', this.positionNameInput, this);
    globalThis.addEventListener?.('resize', this.positionNameInput);
    globalThis.requestAnimationFrame?.(() => this.positionNameInput());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.positionNameInput, this);
      globalThis.removeEventListener?.('resize', this.positionNameInput);
      this.nameInput?.remove();
      this.renameButton?.remove();
      this.renameButton = null;
      this.nameInput = null;
      this.input.keyboard?.enableGlobalCapture();
      this.preview = null;
      this.statusText = null;
      this.valueLabels.clear();
      this.swatchOutlines.clear();
    });
  }

  private createSectionPill(x: number, y: number, width: number, label: string): void {
    const name = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.add
      .rectangle(x, y, width, 22, 0xead8f2, 0.92)
      .setName(`creator-legacy-section-${name}`)
      .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 0.42)
      .setDepth(4);
    this.add
      .text(x, y, label, {
        color: '#7a5a8a',
        fontFamily: UI_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
      })
      .setName(`creator-legacy-section-${name}-label`)
      .setOrigin(0.5)
      .setDepth(5);
  }

  private createNameInput(initialValue: string): void {
    const container = document.getElementById('game-container');
    if (!container) {
      throw new Error('Creator requires #game-container for name entry.');
    }

    const input = document.createElement('input');
    input.className = 'unicorn-name-input';
    input.value = initialValue;
    input.maxLength = 16;
    input.placeholder = DEFAULT_UNICORN_NAME;
    input.setAttribute('aria-label', 'Your unicorn name');
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
      }
    });
    input.addEventListener('keyup', (event) => event.stopPropagation());
    input.addEventListener('input', () => {
      this.syncDisplayedName(input.value);
    });
    input.addEventListener('blur', () => {
      input.style.visibility = 'hidden';
      input.style.pointerEvents = 'none';
      this.profileLabel?.setVisible(true);
    });
    container.append(input);
    input.style.visibility = 'hidden';
    input.style.pointerEvents = 'none';
    this.nameInput = input;

    this.add
      .text(670, NAME_INPUT_Y, 'Name', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName('creator-legacy-name-label')
      .setOrigin(0, 0.5)
      .setDepth(20);

    this.positionNameInput();
  }

  private createRenameButton(): void {
    const container = document.getElementById('game-container');
    if (!container) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'creator-landscape-rename-button';
    button.setAttribute('aria-label', 'Change unicorn name');
    button.textContent = '✎';
    button.addEventListener('click', () => this.openNameEditor());
    container.append(button);
    this.renameButton = button;
    this.positionNameInput();
  }

  private openNameEditor(): void {
    if (!this.nameInput) return;
    this.profileLabel?.setVisible(false);
    this.nameInput.style.visibility = 'visible';
    this.nameInput.style.pointerEvents = 'auto';
    this.nameInput.focus();
    this.nameInput.select();
  }

  private syncDisplayedName(value: string): void {
    this.profileLabel?.setText(value || DEFAULT_UNICORN_NAME);
    this.fitDisplayedName();
    this.positionNameInput();
  }

  private fitDisplayedName(): void {
    if (!this.profileLabel) return;
    this.profileLabel.setFontSize(26);
    if (this.profileLabel.displayWidth > 270) {
      this.profileLabel.setFontSize(
        Math.max(18, Math.floor((26 * 270) / this.profileLabel.displayWidth)),
      );
    }
  }

  private positionNameInput = (): void => {
    if (!this.nameInput) {
      return;
    }

    const container = document.getElementById('game-container');
    const canvas = this.game.canvas;
    if (!container || !canvas) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / GAME_WIDTH;
    const scaleY = canvasRect.height / GAME_HEIGHT;
    const left = canvasRect.left - containerRect.left + NAME_INPUT_X * scaleX;
    const top = canvasRect.top - containerRect.top + NAME_INPUT_Y * scaleY;

    this.nameInput.style.left = `${left}px`;
    this.nameInput.style.top = `${top}px`;
    this.nameInput.style.width = `${NAME_INPUT_WIDTH * scaleX}px`;
    this.nameInput.style.height = `${NAME_INPUT_HEIGHT * scaleY}px`;
    this.nameInput.style.fontSize = `${Math.max(14, 20 * Math.min(scaleX, scaleY))}px`;
    this.nameInput.style.borderWidth = `${Math.max(2, 4 * Math.min(scaleX, scaleY))}px`;
    if (this.renameButton) {
      const labelWidth = this.profileLabel?.displayWidth ?? 150;
      const buttonX = 325 + labelWidth / 2 + 14;
      this.renameButton.style.left = `${canvasRect.left - containerRect.left + buttonX * scaleX}px`;
      this.renameButton.style.top = `${canvasRect.top - containerRect.top + 134 * scaleY}px`;
      this.renameButton.style.width = `${Math.max(38, 42 * scaleX)}px`;
      this.renameButton.style.height = `${Math.max(38, 42 * scaleY)}px`;
    }
  };

  private createColourRow(
    label: string,
    key: 'bodyColour' | 'eyeColour' | 'maneColour' | 'tailColour',
    choices: readonly { id: string; label: string; value: number }[],
    x: number,
    y: number,
  ): void {
    this.add
      .text(x, y, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setName(`creator-${key}-label`)
      .setOrigin(0, 0.5)
      .setDepth(5);

    const outlines: Phaser.GameObjects.Arc[] = [];
    choices.forEach((choice, index) => {
      const swatchX = x + 160 + index * 46;
      const outline = this.add
        .circle(swatchX, y, 24, UI_COLOURS.lavender, 0.8)
        .setName(`creator-${key}-${choice.id}`)
        .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.72)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);
      this.add
        .circle(swatchX, y, 15, choice.value, 1)
        .setName(`creator-${key}-${choice.id}-colour`)
        .setDepth(6);
      outline.on('pointerdown', () => {
        this.draft.set(key, choice.id as UnicornAppearance[typeof key]);
        this.redraw();
      });
      outlines.push(outline);
    });
    this.swatchOutlines.set(key, outlines);
  }

  private createChoiceRow(
    label: string,
    key: 'maneStyle' | 'tailStyle',
    choices: readonly TextChoice[],
    x: number,
    y: number,
  ): void {
    this.addChoiceControls(label, key, choices, x, y, 520);
  }

  private createCompactChoiceRow(
    label: string,
    key: 'hornStyle' | 'marking' | 'accessory',
    choices: readonly TextChoice[],
    x: number,
    y: number,
    rightOffset: number,
  ): void {
    this.addChoiceControls(label, key, choices, x, y, rightOffset, true);
  }

  private addChoiceControls(
    label: string,
    key: 'maneStyle' | 'tailStyle' | 'hornStyle' | 'marking' | 'accessory',
    choices: readonly TextChoice[],
    x: number,
    y: number,
    rightOffset: number,
    compact = false,
  ): void {
    this.add
      .text(x, y, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: compact ? '16px' : '17px',
        fontStyle: 'bold',
      })
      .setName(`creator-${key}-label`)
      .setOrigin(0, 0.5)
      .setDepth(5);

    const leftX = x + (compact ? 112 : 115);
    const valueX = x + (compact ? 148 : 151);
    const rightX = x + rightOffset;
    const arrowRadius = 24;

    const valueText = this.add
      .text(valueX, y, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: compact ? '15px' : '17px',
        fontStyle: 'bold',
        backgroundColor: '#f1e2f6',
        padding: { x: compact ? 9 : 12, y: compact ? 6 : 7 },
      })
      .setName(`creator-${key}-value`)
      .setOrigin(0, 0.5)
      .setDepth(5);
    this.valueLabels.set(key, valueText);

    const left = this.add
      .circle(leftX, y, arrowRadius, UI_COLOURS.lavender, 1)
      .setName(`creator-${key}-previous`)
      .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);
    const right = this.add
      .circle(rightX, y, arrowRadius, UI_COLOURS.lavender, 1)
      .setName(`creator-${key}-next`)
      .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);
    this.add
      .text(leftX, y - 1, '‹', { color: UI_COLOURS.ink, fontFamily: UI_FONT, fontSize: '27px' })
      .setName(`creator-${key}-previous-label`)
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(rightX, y - 1, '›', { color: UI_COLOURS.ink, fontFamily: UI_FONT, fontSize: '27px' })
      .setName(`creator-${key}-next-label`)
      .setOrigin(0.5)
      .setDepth(6);

    left.on('pointerdown', () => this.cycleChoice(key, choices, -1));
    right.on('pointerdown', () => this.cycleChoice(key, choices, 1));
  }

  private cycleChoice(
    key: 'maneStyle' | 'tailStyle' | 'hornStyle' | 'marking' | 'accessory',
    choices: readonly TextChoice[],
    direction: number,
  ): void {
    const current = this.draft.appearance[key];
    const index = choices.findIndex((choice) => choice.id === current);
    const nextIndex = (index + direction + choices.length) % choices.length;
    this.draft.set(key, choices[nextIndex].id as UnicornAppearance[typeof key]);
    this.redraw();
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    label: string,
    action: () => void,
    primary = false,
    name = label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  ): void {
    createUiShadow(this, x, y, width, 64, 19, primary ? 0.23 : 0.15);
    const fill = primary ? UI_COLOURS.gold : UI_COLOURS.cream;
    const hover = primary ? 0xfff4bf : UI_COLOURS.lavender;
    const button = this.add
      .rectangle(x, y, width, 64, fill, 0.99)
      .setName(`creator-action-${name}`)
      .setStrokeStyle(5, primary ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    this.add
      .text(x + (name === 'surprise' || name === 'default' ? 14 : 0), y, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: primary ? '22px' : width < 165 ? '15px' : '18px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setName(`creator-action-${name}-label`)
      .setOrigin(0.5)
      .setDepth(21);
    if (name === 'surprise' || name === 'default') {
      const icon = this.add.graphics().setDepth(21).setName(`creator-action-${name}-icon`);
      if (name === 'surprise') {
        icon.fillStyle(0x4f3a5d, 1);
        icon.fillRoundedRect(x - 77, y - 12, 24, 24, 5);
        icon.fillStyle(UI_COLOURS.cream, 1);
        for (const [dx, dy] of [
          [-70, -5],
          [-60, 5],
          [-60, -5],
          [-70, 5],
        ] as const)
          icon.fillCircle(x + dx, y + dy, 2.2);
      } else {
        icon.lineStyle(4, 0x4f3a5d, 1);
        icon.beginPath();
        icon.arc(x - 63, y, 11, -0.7, 4.5, false);
        icon.strokePath();
        icon.fillStyle(0x4f3a5d, 1);
        icon.fillTriangle(x - 77, y - 7, x - 66, y - 9, x - 71, y + 1);
      }
    }
    applyButtonHover(button, fill, hover);
    button.on('pointerdown', action);
  }

  private randomise(): void {
    this.draft.randomise();
    if (this.nameInput && !this.editMode) {
      this.nameInput.value = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      this.syncDisplayedName(this.nameInput.value);
    }
    this.redraw();
    this.setStatus(
      this.editMode
        ? 'A surprise look! Your saved name stays put unless you change it yourself.'
        : 'A surprise look! Save it only if it feels right.',
    );
  }

  private useDefault(): void {
    this.draft.resetToDefault();
    if (this.nameInput) {
      this.nameInput.value = DEFAULT_UNICORN_NAME;
      this.syncDisplayedName(this.nameInput.value);
    }
    this.redraw();
    this.setStatus('Back to the classic Starlight look.');
  }

  private useDefaultLook(): void {
    this.draft.resetToDefault();
    this.redraw();
    this.setStatus('Classic colours and style restored. Your name is unchanged.');
  }

  private restoreSavedProfile(): void {
    if (!this.save) {
      return;
    }
    this.draft.restoreOriginal();
    if (this.nameInput) {
      this.nameInput.value = this.save.profile.name ?? DEFAULT_UNICORN_NAME;
      this.syncDisplayedName(this.nameInput.value);
    }
    this.redraw();
    this.setStatus('Back to the saved look. Your adventure has not changed.');
  }

  private cancelEdit(): void {
    if (!this.editMode) {
      return;
    }
    this.scene.start('TitleScene');
  }

  private setStatus(message: string, error = false): void {
    this.statusText?.setText(message).setColor(error ? '#ffd4df' : '#fff0c9');
  }

  private redraw(): void {
    if (!this.preview) {
      return;
    }

    this.preview.clear();
    this.preview.setPosition(0, 0).setScale(1);
    drawUnicornAppearance(this.preview, 0, 0, this.draft.appearance, 1);
    // Fit the complete drawn silhouette, including long tails, horns, accessories
    // and strokes, inside the space between the name row and action buttons.
    fitUnicornArtwork(
      this.preview,
      unicornAppearanceBounds(),
      { x: 108, y: 205, width: 434, height: 344 },
      2.05,
    );

    for (const [key, outlines] of this.swatchOutlines) {
      const currentValue = this.draft.appearance[key as keyof UnicornAppearance];
      const source =
        key === 'bodyColour' ? BODY_COLOURS : key === 'eyeColour' ? EYE_COLOURS : HAIR_COLOURS;
      outlines.forEach((outline, index) => {
        const selected = source[index]?.id === currentValue;
        outline
          .setStrokeStyle(
            selected ? 5 : 4,
            selected ? 0xd6b35f : UI_COLOURS.lavenderStrong,
            selected ? 1 : 0.72,
          )
          .setScale(selected ? 1.08 : 1);
      });
    }

    const labelSources: Record<string, readonly TextChoice[]> = {
      maneStyle: MANE_STYLES,
      tailStyle: TAIL_STYLES,
      hornStyle: HORN_STYLES,
      marking: MARKINGS,
      accessory: ACCESSORIES,
    };
    for (const [key, label] of this.valueLabels) {
      const value = this.draft.appearance[key as keyof UnicornAppearance];
      label.setText(
        labelSources[key]?.find((choice) => choice.id === value)?.label ?? String(value),
      );
    }
    this.creatorProgressiveRefresh?.();
  }

  public creatorValue(key: CreatorAppearanceKey): string {
    return this.draft.appearance[key];
  }

  public creatorChoiceSelected(key: CreatorAppearanceKey, value: string): boolean {
    return this.creatorValue(key) === value;
  }

  public creatorSelect(key: CreatorAppearanceKey, value: string): void {
    this.draft.set(key, value as UnicornAppearance[typeof key]);
    this.redraw();
  }

  private saveAndEnter(): void {
    if (!this.save) {
      return;
    }

    const service = getBrowserSaveService();
    const nextSave = applyProfileRedesign(
      this.save,
      this.nameInput?.value ?? '',
      this.draft.appearance,
    );
    const result = service.saveWithResult(nextSave);
    if (result.status !== 'saved') {
      this.setStatus(
        this.editMode
          ? 'Could not save changes. Your previous unicorn and adventure are still safe.'
          : 'Could not save your unicorn yet. Try again before entering the valley.',
        true,
      );
      return;
    }

    this.save = result.save;
    this.scene.start(this.editMode ? 'TitleScene' : 'MoonflowerGladeScene');
  }
}
