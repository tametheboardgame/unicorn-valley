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
const NAME_INPUT_X = 982;
const NAME_INPUT_Y = 196;
const NAME_INPUT_WIDTH = 390;
const NAME_INPUT_HEIGHT = 48;

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
    if (saveService.hasUnsupportedSaveVersion()) {
      this.scene.start('TitleScene');
      return;
    }

    this.save = saveService.load() ?? saveService.createNewGame();
    this.appearance = parseUnicornAppearance(this.save.profile.appearance);

    this.input.keyboard?.disableGlobalCapture();

    this.cameras.main.setBackgroundColor('#7558a0');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7558a0, 1);
    this.add.circle(220, 150, 185, 0xf2c9ed, 0.12);
    this.add.circle(1100, 590, 255, 0xffecb6, 0.08);
    this.add.circle(1030, 120, 120, 0xcfefff, 0.06);

    this.add
      .text(52, 34, 'Make Your Unicorn', {
        color: '#fff8ff',
        fontFamily: UI_FONT,
        fontSize: '43px',
        fontStyle: 'bold',
      })
      .setDepth(20);

    this.add
      .text(52, 88, 'Pick anything you like. You can change it again later.', {
        color: '#efe6fa',
        fontFamily: UI_FONT,
        fontSize: '19px',
      })
      .setDepth(20);

    createUiShadow(this, 325, 390, 500, 520, 1, 0.22);
    this.add
      .rectangle(325, 390, 500, 520, UI_COLOURS.cream, 0.98)
      .setStrokeStyle(6, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);
    this.add
      .rectangle(325, 158, 260, 50, UI_COLOURS.lavender, 1)
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.9)
      .setDepth(4);
    this.add
      .text(325, 158, 'This is you ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '26px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(5);

    createUiShadow(this, 940, 390, 610, 530, 1, 0.22);
    this.add
      .rectangle(940, 390, 610, 530, UI_COLOURS.cream, 0.99)
      .setStrokeStyle(6, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);
    this.add
      .text(670, 146, 'Choose your look ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setDepth(5);

    this.preview = this.add.graphics().setDepth(6);
    this.createNameInput(this.save.profile.name ?? DEFAULT_UNICORN_NAME);

    this.createColourRow('Body', 'bodyColour', BODY_COLOURS, 670, 250);
    this.createColourRow('Eyes', 'eyeColour', EYE_COLOURS, 670, 300);
    this.createChoiceRow('Mane style', 'maneStyle', MANE_STYLES, 670, 350);
    this.createColourRow('Mane colour', 'maneColour', HAIR_COLOURS, 670, 400);
    this.createChoiceRow('Tail style', 'tailStyle', TAIL_STYLES, 670, 450);
    this.createColourRow('Tail colour', 'tailColour', HAIR_COLOURS, 670, 500);
    this.createCompactChoiceRow('Horn', 'hornStyle', HORN_STYLES, 670, 555, 250);
    this.createCompactChoiceRow('Marking', 'marking', MARKINGS, 935, 555, 260);
    this.createCompactChoiceRow('Accessory', 'accessory', ACCESSORIES, 670, 605, 520);

    this.createActionButton(305, 625, 210, 'Surprise Me!', () => this.randomise());
    this.createActionButton(535, 625, 190, 'Nice Default', () => this.useDefault());
    this.createActionButton(1080, 675, 275, 'Looks Good! ✨', () => this.saveAndEnter(), true);

    this.redraw();

    this.scale.on('resize', this.positionNameInput, this);
    globalThis.addEventListener?.('resize', this.positionNameInput);
    globalThis.requestAnimationFrame?.(() => this.positionNameInput());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.positionNameInput, this);
      globalThis.removeEventListener?.('resize', this.positionNameInput);
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
      .text(670, NAME_INPUT_Y, 'Name', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(20);

    this.positionNameInput();
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
      .setOrigin(0, 0.5)
      .setDepth(5);

    const outlines: Phaser.GameObjects.Arc[] = [];
    choices.forEach((choice, index) => {
      const swatchX = x + 160 + index * 52;
      const outline = this.add
        .circle(swatchX, y, 24, UI_COLOURS.lavender, 0.8)
        .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.72)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);
      this.add.circle(swatchX, y, 16, choice.value, 1).setDepth(6);
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
      .setOrigin(0, 0.5)
      .setDepth(5);
    this.valueLabels.set(key, valueText);

    const left = this.add
      .circle(leftX, y, arrowRadius, UI_COLOURS.lavender, 1)
      .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);
    const right = this.add
      .circle(rightX, y, arrowRadius, UI_COLOURS.lavender, 1)
      .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);
    this.add
      .text(leftX, y - 1, '‹', { color: UI_COLOURS.ink, fontFamily: UI_FONT, fontSize: '27px' })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(rightX, y - 1, '›', { color: UI_COLOURS.ink, fontFamily: UI_FONT, fontSize: '27px' })
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
    drawUnicornAppearance(this.preview, 315, 405, this.appearance, 2.18);

    for (const [key, outlines] of this.swatchOutlines) {
      const currentValue = this.appearance[key as keyof UnicornAppearance];
      const source =
        key === 'bodyColour' ? BODY_COLOURS : key === 'eyeColour' ? EYE_COLOURS : HAIR_COLOURS;
      outlines.forEach((outline, index) => {
        outline.setStrokeStyle(
          5,
          source[index]?.id === currentValue ? 0xd6b35f : UI_COLOURS.lavenderStrong,
          source[index]?.id === currentValue ? 1 : 0.72,
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
    const saved = service.save(nextSave);
    if (!saved) {
      this.scene.start('TitleScene');
      return;
    }

    this.save = saved;
    this.scene.start('MoonflowerGladeScene');
  }
}
