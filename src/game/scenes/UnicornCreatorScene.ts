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
  normaliseUnicornName,
  parseUnicornAppearance,
  randomiseUnicornAppearance,
  serialiseUnicornAppearance,
  TAIL_STYLES,
  type UnicornAppearance,
} from '../player/UnicornAppearance';
import { drawUnicornAppearance } from '../player/UnicornAppearanceRenderer';
import { getBrowserSaveService } from '../save/browserSaveService';
import type { SaveGame } from '../save/saveSchema';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

interface TextChoice {
  id: string;
  label: string;
}

const RANDOM_NAMES = ['Starlight', 'Moonbeam', 'Twinkle', 'Blossom', 'Sparkle', 'Nova'];

export class UnicornCreatorScene extends Phaser.Scene {
  private save: SaveGame | null = null;
  private appearance: UnicornAppearance = { ...DEFAULT_UNICORN_APPEARANCE };
  private preview: Phaser.GameObjects.Graphics | null = null;
  private nameInput: HTMLInputElement | null = null;
  private valueLabels = new Map<string, Phaser.GameObjects.Text>();
  private swatchOutlines = new Map<string, Phaser.GameObjects.Arc[]>();

  public constructor() {
    super('UnicornCreatorScene');
  }

  public create(): void {
    const saveService = getBrowserSaveService();
    this.save = saveService.load() ?? saveService.createNewGame();
    this.appearance = parseUnicornAppearance(this.save.profile.appearance);

    this.input.keyboard?.disableGlobalCapture();

    this.cameras.main.setBackgroundColor('#7558a0');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7558a0, 1);
    this.add.circle(220, 150, 185, 0xf2c9ed, 0.12);
    this.add.circle(1100, 590, 255, 0xffecb6, 0.08);
    this.add.circle(1030, 120, 120, 0xcfefff, 0.06);

    this.add
      .text(52, 38, 'Make Your Unicorn', {
        color: '#fff8ff',
        fontFamily: UI_FONT,
        fontSize: '43px',
        fontStyle: 'bold',
      })
      .setDepth(20);

    this.add
      .text(52, 94, 'Everything here is just for fun. You can change it again later.', {
        color: '#efe6fa',
        fontFamily: UI_FONT,
        fontSize: '19px',
      })
      .setDepth(20);

    createUiShadow(this, 325, 390, 500, 500, 1, 0.22);
    this.add
      .rectangle(325, 390, 500, 500, UI_COLOURS.cream, 0.96)
      .setStrokeStyle(6, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);
    this.add
      .rectangle(325, 182, 260, 50, UI_COLOURS.lavender, 0.96)
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.9)
      .setDepth(4);
    this.add
      .text(325, 182, 'This is you ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '26px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(5);

    createUiShadow(this, 940, 392, 600, 558, 1, 0.16);
    this.add
      .rectangle(940, 392, 600, 558, 0x6e5198, 0.32)
      .setStrokeStyle(3, 0xd8b9e8, 0.28)
      .setDepth(1);

    this.preview = this.add.graphics().setDepth(6);
    this.createNameInput(this.save.profile.name ?? DEFAULT_UNICORN_NAME);

    this.createColourRow('Body', 'bodyColour', BODY_COLOURS, 650, 175);
    this.createColourRow('Eyes', 'eyeColour', EYE_COLOURS, 650, 235);
    this.createChoiceRow('Mane style', 'maneStyle', MANE_STYLES, 650, 300);
    this.createColourRow('Mane colour', 'maneColour', HAIR_COLOURS, 650, 355);
    this.createChoiceRow('Tail style', 'tailStyle', TAIL_STYLES, 650, 420);
    this.createColourRow('Tail colour', 'tailColour', HAIR_COLOURS, 650, 475);
    this.createCompactChoiceRow('Horn', 'hornStyle', HORN_STYLES, 650, 540);
    this.createCompactChoiceRow('Marking', 'marking', MARKINGS, 930, 540);
    this.createCompactChoiceRow('Accessory', 'accessory', ACCESSORIES, 930, 600);

    this.createActionButton(305, 615, 210, 'Surprise Me!', () => this.randomise());
    this.createActionButton(535, 615, 190, 'Nice Default', () => this.useDefault());
    this.createActionButton(1080, 660, 275, 'Looks Good! ✨', () => this.saveAndEnter(), true);

    this.redraw();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.nameInput?.remove();
      this.nameInput = null;
      this.input.keyboard?.enableGlobalCapture();
      this.preview = null;
      this.valueLabels.clear();
      this.swatchOutlines.clear();
    });
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
    container.append(input);
    this.nameInput = input;

    this.add
      .text(650, 124, 'Name', {
        color: '#f8efff',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(20);
  }

  private createColourRow(
    label: string,
    key: 'bodyColour' | 'eyeColour' | 'maneColour' | 'tailColour',
    choices: readonly { id: string; label: string; value: number }[],
    x: number,
    y: number,
  ): void {
    this.add
      .text(x, y, label, {
        color: '#fff8ff',
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    const outlines: Phaser.GameObjects.Arc[] = [];
    choices.forEach((choice, index) => {
      const swatchX = x + 160 + index * 52;
      const outline = this.add
        .circle(swatchX, y, 21, 0xffffff, 0.14)
        .setStrokeStyle(4, 0xffffff, 0.25)
        .setInteractive({ useHandCursor: true });
      this.add.circle(swatchX, y, 15, choice.value, 1);
      outline.on('pointerdown', () => {
        this.appearance = { ...this.appearance, [key]: choice.id } as UnicornAppearance;
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
    this.addChoiceControls(label, key, choices, x, y, 385);
  }

  private createCompactChoiceRow(
    label: string,
    key: 'hornStyle' | 'marking' | 'accessory',
    choices: readonly TextChoice[],
    x: number,
    y: number,
  ): void {
    this.addChoiceControls(label, key, choices, x, y, 255, true);
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
        color: '#fff8ff',
        fontFamily: UI_FONT,
        fontSize: compact ? '16px' : '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    const leftX = x + (compact ? 112 : 115);
    const valueX = x + (compact ? 142 : 145);
    const rightX = x + rightOffset;
    const arrowRadius = compact ? 17 : 18;

    const valueText = this.add
      .text(valueX, y, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: compact ? '15px' : '17px',
        fontStyle: 'bold',
        backgroundColor: '#fffaf0ee',
        padding: { x: compact ? 9 : 12, y: compact ? 6 : 7 },
      })
      .setOrigin(0, 0.5);
    this.valueLabels.set(key, valueText);

    const left = this.add
      .circle(leftX, y, arrowRadius, UI_COLOURS.lavender, 1)
      .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 0.8)
      .setInteractive({ useHandCursor: true });
    const right = this.add
      .circle(rightX, y, arrowRadius, UI_COLOURS.lavender, 1)
      .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(leftX, y - 1, '‹', { color: UI_COLOURS.ink, fontFamily: UI_FONT, fontSize: '27px' })
      .setOrigin(0.5);
    this.add
      .text(rightX, y - 1, '›', { color: UI_COLOURS.ink, fontFamily: UI_FONT, fontSize: '27px' })
      .setOrigin(0.5);

    left.on('pointerdown', () => this.cycleChoice(key, choices, -1));
    right.on('pointerdown', () => this.cycleChoice(key, choices, 1));
  }

  private cycleChoice(
    key: 'maneStyle' | 'tailStyle' | 'hornStyle' | 'marking' | 'accessory',
    choices: readonly TextChoice[],
    direction: number,
  ): void {
    const current = this.appearance[key];
    const index = choices.findIndex((choice) => choice.id === current);
    const nextIndex = (index + direction + choices.length) % choices.length;
    this.appearance = { ...this.appearance, [key]: choices[nextIndex].id } as UnicornAppearance;
    this.redraw();
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    label: string,
    action: () => void,
    primary = false,
  ): void {
    createUiShadow(this, x, y, width, 64, 19, primary ? 0.23 : 0.15);
    const fill = primary ? UI_COLOURS.gold : UI_COLOURS.cream;
    const hover = primary ? 0xfff4bf : UI_COLOURS.lavender;
    const button = this.add
      .rectangle(x, y, width, 64, fill, 0.99)
      .setStrokeStyle(5, primary ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    this.add
      .text(x, y, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: primary ? '22px' : '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(21);
    applyButtonHover(button, fill, hover);
    button.on('pointerdown', action);
  }

  private randomise(): void {
    this.appearance = randomiseUnicornAppearance();
    if (this.nameInput) {
      this.nameInput.value = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    }
    this.redraw();
  }

  private useDefault(): void {
    this.appearance = { ...DEFAULT_UNICORN_APPEARANCE };
    if (this.nameInput) {
      this.nameInput.value = DEFAULT_UNICORN_NAME;
    }
    this.redraw();
  }

  private redraw(): void {
    if (!this.preview) {
      return;
    }

    this.preview.clear();
    drawUnicornAppearance(this.preview, 315, 397, this.appearance, 2.18);

    for (const [key, outlines] of this.swatchOutlines) {
      const currentValue = this.appearance[key as keyof UnicornAppearance];
      const source =
        key === 'bodyColour' ? BODY_COLOURS : key === 'eyeColour' ? EYE_COLOURS : HAIR_COLOURS;
      outlines.forEach((outline, index) => {
        outline.setStrokeStyle(
          5,
          source[index]?.id === currentValue ? 0xffe98c : 0xffffff,
          source[index]?.id === currentValue ? 1 : 0.25,
        );
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
      const value = this.appearance[key as keyof UnicornAppearance];
      label.setText(
        labelSources[key]?.find((choice) => choice.id === value)?.label ?? String(value),
      );
    }
  }

  private saveAndEnter(): void {
    if (!this.save) {
      return;
    }

    const service = getBrowserSaveService();
    const nextSave: SaveGame = {
      ...this.save,
      profile: {
        ...this.save.profile,
        name: normaliseUnicornName(this.nameInput?.value ?? ''),
        appearance: serialiseUnicornAppearance(this.appearance),
      },
    };
    this.save = service.save(nextSave);
    this.scene.start('MoonflowerGladeScene');
  }
}
