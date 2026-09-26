import Phaser from 'phaser';
import {
  BAKERY_OUTCOMES,
  type BakeryCakeTheme,
  type BakeryFinish,
  type BakeryTopping,
} from '../../content/r65RepeatableActivities';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';
import { PortraitModalCompanion, type PortraitModalAction } from '../ui/PortraitModalCompanion';
import { UI_COLOURS, UI_FONT, createUiShadow } from '../ui/uiTheme';
import {
  completeMapleQuestCake,
  getMapleBakingProgress,
  recordMapleBakingCake,
} from './MapleBakingActivity';

interface MapleBakingSceneData {
  returnScene?: string;
  mode?: BakingMode;
}

type BakingMode = 'quest' | 'repeatable';
type BakingStage = 'mix' | 'stack' | 'icing' | 'decorate' | 'result';

interface Choice<T> {
  value: T;
  label: string;
  icon: string;
  colour: number;
}

const THEMES: readonly Choice<BakeryCakeTheme>[] = [
  { value: 'sunshine', label: 'Sunshine icing', icon: '☀️', colour: 0xffdc77 },
  { value: 'moonflower', label: 'Moonflower icing', icon: '🌙', colour: 0xb9a6ef },
  { value: 'rainbow', label: 'Rainbow icing', icon: '🌈', colour: 0xf09ab7 },
];

const TOPPINGS: readonly Choice<BakeryTopping>[] = [
  { value: 'berries', label: 'Berry dots', icon: '🍓', colour: 0xf5a0ad },
  { value: 'clouds', label: 'Cloud puffs', icon: '☁️', colour: 0xd8f0f4 },
  { value: 'stars', label: 'Sugar stars', icon: '⭐', colour: 0xffe28b },
];

const FINISHES: readonly Choice<BakeryFinish>[] = [
  { value: 'sprinkles', label: 'Sprinkle shower', icon: '✨', colour: 0xffcfef },
  { value: 'swirl', label: 'Icing swirl', icon: '🌀', colour: 0xb5e5df },
  { value: 'ribbon', label: 'Cake ribbon', icon: '🎀', colour: 0xf2a9bd },
];

const REQUIRED_STIRS = 5;
const REQUIRED_LAYERS = 3;

function themeColour(theme: BakeryCakeTheme | null): number {
  return THEMES.find((choice) => choice.value === theme)?.colour ?? 0xfff4df;
}

function choiceLabel<T>(choices: readonly Choice<T>[], value: T | null): string {
  return choices.find((choice) => choice.value === value)?.label ?? 'not added yet';
}

export class MapleBakingActivityScene extends Phaser.Scene {
  private returnScene = 'VillageInteriorScene';
  private mode: BakingMode = 'repeatable';
  private stage: BakingStage = 'mix';
  private mixProgress = 0;
  private placedLayers = new Set<number>();
  private theme: BakeryCakeTheme | null = null;
  private topping: BakeryTopping | null = null;
  private finish: BakeryFinish | null = null;
  private body: Phaser.GameObjects.Container | null = null;
  private portraitCompanion: PortraitModalCompanion | null = null;
  private mixMeterText: Phaser.GameObjects.Text | null = null;
  private mixSpoon: Phaser.GameObjects.Text | null = null;
  private actionLocked = false;

  public constructor() {
    super('MapleBakingActivityScene');
  }

  public create(data: MapleBakingSceneData = {}): void {
    this.returnScene = data.returnScene ?? 'VillageInteriorScene';
    this.mode = data.mode ?? 'repeatable';
    this.resetRun();

    this.cameras.main.setBackgroundColor('#7a5369');
    this.createBackdrop();
    this.portraitCompanion = PortraitModalCompanion.create(
      'maple-baking',
      'Maple’s Wobbly Baking Table',
    );
    this.renderStage();

    this.input.keyboard?.on('keydown-ESC', this.leaveActivity, this);
    this.input.keyboard?.on('keydown-SPACE', this.handlePrimaryKeyboardAction, this);
    this.input.keyboard?.on('keydown-ENTER', this.handlePrimaryKeyboardAction, this);
    this.input.keyboard?.on('keydown-ONE', () => this.chooseByIndex(0));
    this.input.keyboard?.on('keydown-TWO', () => this.chooseByIndex(1));
    this.input.keyboard?.on('keydown-THREE', () => this.chooseByIndex(2));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.leaveActivity, this);
      this.input.keyboard?.off('keydown-SPACE', this.handlePrimaryKeyboardAction, this);
      this.input.keyboard?.off('keydown-ENTER', this.handlePrimaryKeyboardAction, this);
      this.input.keyboard?.removeAllListeners('keydown-ONE');
      this.input.keyboard?.removeAllListeners('keydown-TWO');
      this.input.keyboard?.removeAllListeners('keydown-THREE');
      this.portraitCompanion?.destroy();
      this.portraitCompanion = null;
      this.body?.destroy(true);
      this.body = null;
      this.mixMeterText = null;
      this.mixSpoon = null;
    });
  }

  private resetRun(): void {
    this.stage = 'mix';
    this.mixProgress = 0;
    this.placedLayers.clear();
    this.theme = null;
    this.topping = null;
    this.finish = null;
    this.actionLocked = false;
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x69465c, 1);
    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1080, 650, 1, 0.28);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1080, 650, 0xfff0cf, 1)
      .setStrokeStyle(8, 0xe89b6b, 1)
      .setName('h3-r2-baking-panel');
    this.add
      .text(GAME_WIDTH / 2, 54, '🎂 Maple’s Wobbly Baking Table', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(
        GAME_WIDTH / 2,
        94,
        'Mix it, stack it, ice it, decorate it. Wobble is encouraged.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '16px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 820 },
        },
      )
      .setOrigin(0.5);
    this.createButton(150, GAME_HEIGHT - 46, 230, '← Back to Bakery', () => this.leaveActivity());
  }

  private renderStage(): void {
    this.body?.destroy(true);
    this.body = this.add.container(0, 0).setDepth(10);
    this.mixMeterText = null;
    this.mixSpoon = null;
    this.actionLocked = false;

    if (this.stage === 'mix') {
      this.renderMixStage();
    } else if (this.stage === 'stack') {
      this.renderStackStage();
    } else if (this.stage === 'icing') {
      this.renderIcingStage();
    } else if (this.stage === 'decorate') {
      this.renderDecorateStage();
    } else {
      this.renderResult();
    }
  }

  private renderStageHeader(title: string, instruction: string, step: number): void {
    const heading = this.add
      .text(GAME_WIDTH / 2, 145, `${step}. ${title}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '26px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName(`h3-r2-baking-stage:${this.stage}`);
    const note = this.add
      .text(GAME_WIDTH / 2, 181, instruction, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 820 },
      })
      .setOrigin(0.5);
    this.body?.add([heading, note]);
  }

  private renderMixStage(): void {
    this.renderStageHeader(
      'Mix the batter',
      'Tap the spoon and bowl until the batter turns sparkly. There is no timer.',
      1,
    );

    const bowl = this.add
      .ellipse(GAME_WIDTH / 2, 385, 360, 180, 0xf4c9af, 1)
      .setStrokeStyle(7, 0xc98575, 1)
      .setInteractive({ useHandCursor: true })
      .setName('h3-r2-baking-mix-bowl');
    const batter = this.add
      .ellipse(GAME_WIDTH / 2, 370, 300, 116, 0xffe1a3, 1)
      .setStrokeStyle(3, 0xe8b969, 0.8);
    this.mixSpoon = this.add
      .text(GAME_WIDTH / 2 + 78, 326, '🥄', {
        fontFamily: UI_FONT,
        fontSize: '62px',
      })
      .setOrigin(0.5)
      .setAngle(-28);
    this.mixMeterText = this.add
      .text(
        GAME_WIDTH / 2,
        520,
        `Stirs: ${this.mixProgress}/${REQUIRED_STIRS}  ${'✨'.repeat(this.mixProgress)}`,
        {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '20px',
          fontStyle: 'bold',
          backgroundColor: '#fff9ebdf',
          padding: { x: 18, y: 9 },
        },
      )
      .setOrigin(0.5);
    const hint = this.add
      .text(GAME_WIDTH / 2, 574, 'Tap the bowl, or press SPACE / ENTER', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    bowl.on('pointerdown', () => this.stirMix());
    batter.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.stirMix());
    this.body?.add([bowl, batter, this.mixSpoon, this.mixMeterText, hint]);

    this.portraitCompanion?.setHeader(
      '🥣 Mix the batter',
      'Tap Stir five times. No timer and no wrong way to mix it.',
    );
    this.portraitCompanion?.setCards([
      {
        id: 'mix-progress',
        title: 'Sparkly batter',
        description: `${this.mixProgress}/${REQUIRED_STIRS} stirs`,
      },
    ]);
    this.portraitCompanion?.setActionGroups([
      {
        id: 'mix',
        actions: [{ id: 'stir', label: '🥄 Stir the bowl', onPress: () => this.stirMix() }],
      },
      this.portraitExitGroup(),
    ]);
  }

  private stirMix(): void {
    if (this.stage !== 'mix' || this.actionLocked) {
      return;
    }

    this.mixProgress = Math.min(REQUIRED_STIRS, this.mixProgress + 1);
    this.mixMeterText?.setText(
      `Stirs: ${this.mixProgress}/${REQUIRED_STIRS}  ${'✨'.repeat(this.mixProgress)}`,
    );
    if (this.mixSpoon) {
      this.tweens.add({
        targets: this.mixSpoon,
        angle: this.mixSpoon.angle + 110,
        scale: 1.08,
        duration: 120,
        yoyo: true,
      });
    }
    this.createMixSparkle();

    if (this.mixProgress >= REQUIRED_STIRS) {
      this.actionLocked = true;
      this.time.delayedCall(260, () => {
        this.stage = 'stack';
        this.renderStage();
      });
      return;
    }

    this.renderPortraitForCurrentStage();
  }

  private createMixSparkle(): void {
    const sparkle = this.add
      .text(
        GAME_WIDTH / 2 + Phaser.Math.Between(-125, 125),
        340 + Phaser.Math.Between(-35, 55),
        '✨',
        { fontFamily: UI_FONT, fontSize: '22px' },
      )
      .setOrigin(0.5)
      .setDepth(18);
    this.body?.add(sparkle);
    this.tweens.add({
      targets: sparkle,
      y: sparkle.y - 28,
      alpha: 0,
      duration: 420,
      onComplete: () => sparkle.destroy(),
    });
  }

  private renderStackStage(): void {
    this.renderStageHeader(
      'Stack the sponge',
      'Tap each soft sponge layer to wobble it onto the cake stand.',
      2,
    );
    this.drawCakePreview(GAME_WIDTH / 2, 530);

    const positions = [360, 640, 920];
    for (let index = 0; index < REQUIRED_LAYERS; index += 1) {
      if (this.placedLayers.has(index)) {
        continue;
      }
      this.createPhysicalTool(
        positions[index] ?? GAME_WIDTH / 2,
        300,
        210,
        74,
        `h3-r2-baking-layer:${index + 1}`,
        '🍰',
        `Sponge layer ${index + 1}`,
        0xf4c989,
        () => this.placeLayer(index),
      );
    }

    this.portraitCompanion?.setHeader(
      '🍰 Stack the sponge',
      'Place all three sponge layers. They are supposed to lean a little.',
    );
    this.portraitCompanion?.setCards([
      {
        id: 'stack-progress',
        title: 'Cake stack',
        description: `${this.placedLayers.size}/${REQUIRED_LAYERS} layers placed`,
      },
    ]);
    this.portraitCompanion?.setActionGroups([
      {
        id: 'stack',
        actions: [
          {
            id: 'place-layer',
            label: '🍰 Place next layer',
            onPress: () => this.placeNextAvailableLayer(),
          },
        ],
      },
      this.portraitExitGroup(),
    ]);
  }

  private placeLayer(index: number): void {
    if (this.stage !== 'stack' || this.actionLocked || this.placedLayers.has(index)) {
      return;
    }
    this.placedLayers.add(index);
    this.cameras.main.shake(70, 0.0016);

    if (this.placedLayers.size >= REQUIRED_LAYERS) {
      this.actionLocked = true;
      this.time.delayedCall(220, () => {
        this.stage = 'icing';
        this.renderStage();
      });
      return;
    }
    this.renderStage();
  }

  private placeNextAvailableLayer(): void {
    const next = [0, 1, 2].find((index) => !this.placedLayers.has(index));
    if (next !== undefined) {
      this.placeLayer(next);
    }
  }

  private renderIcingStage(): void {
    this.renderStageHeader(
      'Pipe the icing',
      'Tap a piping bag to squeeze that icing straight onto the cake.',
      3,
    );
    this.drawCakePreview(GAME_WIDTH / 2, 535);

    THEMES.forEach((choice, index) => {
      this.createPhysicalTool(
        360 + index * 280,
        286,
        220,
        92,
        `h3-r2-baking-icing:${choice.value}`,
        choice.icon,
        choice.label,
        choice.colour,
        () => this.applyIcing(choice.value),
      );
    });

    this.portraitCompanion?.setHeader(
      '🧁 Pipe the icing',
      'Choose a piping bag and cover the wobbly sponge.',
    );
    this.portraitCompanion?.setCards([
      {
        id: 'icing-progress',
        title: 'Three layers ready',
        description: 'Now give the cake its colour.',
      },
    ]);
    this.portraitCompanion?.setActionGroups([
      {
        id: 'icing',
        label: 'Pipe one icing',
        actions: THEMES.map((choice) => ({
          id: `icing-${choice.value}`,
          label: `${choice.icon} ${choice.label}`,
          onPress: () => this.applyIcing(choice.value),
        })),
      },
      this.portraitExitGroup(),
    ]);
  }

  private applyIcing(theme: BakeryCakeTheme): void {
    if (this.stage !== 'icing' || this.actionLocked) {
      return;
    }
    this.theme = theme;
    this.actionLocked = true;
    this.cameras.main.flash(90, 255, 244, 221, false);
    this.time.delayedCall(180, () => {
      this.stage = 'decorate';
      this.renderStage();
    });
  }

  private renderDecorateStage(): void {
    const choosingTopping = this.topping === null;
    this.renderStageHeader(
      choosingTopping ? 'Add a topping' : 'Finish the wobble',
      choosingTopping
        ? 'Tap a topping bowl to scatter it over the icing.'
        : 'One last touch. Tap a decoration tool and the cake is ready.',
      4,
    );
    this.drawCakePreview(GAME_WIDTH / 2, 525);

    const choices = choosingTopping ? TOPPINGS : FINISHES;
    choices.forEach((choice, index) => {
      this.createPhysicalTool(
        360 + index * 280,
        276,
        220,
        92,
        choosingTopping
          ? `h3-r2-baking-topping:${choice.value}`
          : `h3-r2-baking-finish:${choice.value}`,
        choice.icon,
        choice.label,
        choice.colour,
        () => {
          if (choosingTopping) {
            this.applyTopping(choice.value as BakeryTopping);
          } else {
            this.applyFinish(choice.value as BakeryFinish);
          }
        },
      );
    });

    this.renderPortraitForCurrentStage();
  }

  private applyTopping(topping: BakeryTopping): void {
    if (this.stage !== 'decorate' || this.topping !== null || this.actionLocked) {
      return;
    }
    this.topping = topping;
    this.cameras.main.shake(55, 0.0012);
    this.renderStage();
  }

  private applyFinish(finish: BakeryFinish): void {
    if (this.stage !== 'decorate' || this.topping === null || this.actionLocked) {
      return;
    }
    this.finish = finish;
    this.completeRun();
  }

  private completeRun(): void {
    if (!this.theme || !this.topping || !this.finish || this.actionLocked) {
      return;
    }
    this.actionLocked = true;
    const saveService = getBrowserSaveService();
    if (this.mode === 'quest') {
      completeMapleQuestCake(saveService, this.theme);
    } else {
      recordMapleBakingCake(saveService, this.theme);
    }

    this.stage = 'result';
    this.cameras.main.flash(140, 255, 232, 172, false);
    this.time.delayedCall(100, () => this.renderStage());
  }

  private renderResult(): void {
    const theme = this.theme ?? 'sunshine';
    const outcome = BAKERY_OUTCOMES.find((candidate) => candidate.theme === theme) ?? BAKERY_OUTCOMES[0];
    if (!outcome) {
      return;
    }

    const title = this.add
      .text(GAME_WIDTH / 2, 158, `${outcome.icon} ${outcome.name}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('h3-r2-baking-result');
    const cake = this.drawCakePreview(GAME_WIDTH / 2, 395, true);
    const summaryText =
      `${choiceLabel(TOPPINGS, this.topping)} and ${choiceLabel(FINISHES, this.finish)} make it gloriously uneven.`;
    const questCopy =
      'Maple’s first Wobbly Cake is ready. Head outside and show her what you made.';
    const progress = this.mode === 'repeatable' ? getMapleBakingProgress(getBrowserSaveService()) : null;
    const detail = this.add
      .text(
        GAME_WIDTH / 2,
        545,
        this.mode === 'quest'
          ? `${summaryText}\n\n${questCopy}`
          : `${summaryText}\n\nRecipe notebook: ${progress?.completedOutcomeCount ?? 0}/${progress?.totalOutcomeCount ?? 0} cake styles discovered.`,
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 760 },
          backgroundColor: '#fff9ebdd',
          padding: { x: 18, y: 12 },
        },
      )
      .setOrigin(0.5);
    this.body?.add([title, detail]);

    if (this.mode === 'repeatable') {
      this.createButton(500, 628, 250, '🎂 Bake another', () => this.restartRun(), this.body);
      this.createButton(780, 628, 250, '✓ Back to Bakery', () => this.leaveActivity(), this.body);
    } else {
      this.createButton(
        GAME_WIDTH / 2,
        628,
        300,
        '✓ Show Maple',
        () => this.leaveActivity(),
        this.body,
      );
    }

    this.tweens.add({
      targets: cake,
      angle: 2.2,
      duration: 340,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.portraitCompanion?.setHeader(`${outcome.icon} ${outcome.name}`, 'Your Wobbly Cake is ready.');
    this.portraitCompanion?.setCards([
      {
        id: 'result',
        title: this.mode === 'quest' ? 'Take it to Maple' : 'Recipe notebook',
        description: this.mode === 'quest' ? questCopy : summaryText,
        badge:
          this.mode === 'repeatable'
            ? `${progress?.completedOutcomeCount ?? 0}/${progress?.totalOutcomeCount ?? 0} cake styles discovered`
            : undefined,
      },
    ]);
    this.portraitCompanion?.setActionGroups([
      {
        id: 'result-actions',
        actions:
          this.mode === 'repeatable'
            ? [
                { id: 'again', label: '🎂 Bake another', onPress: () => this.restartRun() },
                { id: 'back', label: '✓ Back to Bakery', onPress: () => this.leaveActivity() },
              ]
            : [{ id: 'back', label: '✓ Show Maple', onPress: () => this.leaveActivity() }],
      },
    ]);
  }

  private drawCakePreview(x: number, y: number, result = false): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setName('h3-r2-baking-cake');
    const stand = this.add
      .ellipse(0, 84, 310, 38, 0xf4d6b9, 1)
      .setStrokeStyle(4, 0xc89b82, 0.86);
    container.add(stand);

    const layerCount = Math.max(this.placedLayers.size, this.stage === 'mix' ? 0 : 0);
    for (let index = 0; index < layerCount; index += 1) {
      const offset = index % 2 === 0 ? -7 : 7;
      const layerY = 54 - index * 45;
      const sponge = this.add
        .rectangle(offset, layerY, 235 - index * 8, 52, 0xf1c27e, 1)
        .setStrokeStyle(3, 0xc88955, 0.85);
      container.add(sponge);
      if (this.theme) {
        const icing = this.add
          .rectangle(offset + (index % 2 === 0 ? 5 : -5), layerY - 22, 225 - index * 8, 17, themeColour(this.theme), 1)
          .setStrokeStyle(2, 0xffffff, 0.6);
        container.add(icing);
      }
    }

    if (this.topping) {
      const icons =
        this.topping === 'berries'
          ? ['🍓', '🍓', '🍓']
          : this.topping === 'clouds'
            ? ['☁️', '☁️', '☁️']
            : ['⭐', '⭐', '⭐'];
      icons.forEach((icon, index) => {
        container.add(
          this.add
            .text(-58 + index * 58, -86 - (index % 2) * 8, icon, {
              fontFamily: UI_FONT,
              fontSize: '25px',
            })
            .setOrigin(0.5),
        );
      });
    }

    if (this.finish === 'sprinkles') {
      for (const [dx, dy] of [
        [-72, -54],
        [-38, -72],
        [2, -60],
        [42, -78],
        [76, -55],
      ] as const) {
        container.add(
          this.add
            .text(dx, dy, '•', {
              color: dx % 2 === 0 ? '#ee7fb2' : '#7abfc4',
              fontFamily: UI_FONT,
              fontSize: '28px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        );
      }
    } else if (this.finish === 'swirl') {
      container.add(
        this.add
          .text(0, -98, '🌀', { fontFamily: UI_FONT, fontSize: '34px' })
          .setOrigin(0.5),
      );
    } else if (this.finish === 'ribbon') {
      container.add(
        this.add
          .text(0, 0, '🎀', { fontFamily: UI_FONT, fontSize: '39px' })
          .setOrigin(0.5),
      );
    }

    if (result) {
      container.setScale(1.04);
    }
    this.body?.add(container);
    return container;
  }

  private createPhysicalTool(
    x: number,
    y: number,
    width: number,
    height: number,
    name: string,
    iconText: string,
    labelText: string,
    fillColour: number,
    onPress: () => void,
  ): Phaser.GameObjects.Container {
    const surface = this.add
      .rectangle(0, 0, width, height, 0xfffbf2, 1)
      .setStrokeStyle(4, fillColour, 1);
    const colourBar = this.add.rectangle(0, height / 2 - 8, width - 18, 10, fillColour, 0.95);
    const icon = this.add
      .text(-width / 2 + 40, -4, iconText, {
        fontFamily: UI_FONT,
        fontSize: '34px',
      })
      .setOrigin(0.5);
    const label = this.add
      .text(18, -4, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: width - 86 },
      })
      .setOrigin(0.5);
    const container = this.add
      .container(x, y, [surface, colourBar, icon, label])
      .setSize(width, height)
      .setInteractive({ useHandCursor: true })
      .setName(name);
    container.on('pointerover', () => surface.setFillStyle(0xffefd5, 1));
    container.on('pointerout', () => surface.setFillStyle(0xfffbf2, 1));
    container.on('pointerdown', onPress);
    this.body?.add(container);
    return container;
  }

  private renderPortraitForCurrentStage(): void {
    if (!this.portraitCompanion) {
      return;
    }

    if (this.stage === 'mix') {
      this.portraitCompanion.setCards([
        {
          id: 'mix-progress',
          title: 'Sparkly batter',
          description: `${this.mixProgress}/${REQUIRED_STIRS} stirs`,
        },
      ]);
      return;
    }

    if (this.stage === 'decorate') {
      const choosingTopping = this.topping === null;
      const choices = choosingTopping ? TOPPINGS : FINISHES;
      this.portraitCompanion.setHeader(
        choosingTopping ? '🍓 Add a topping' : '✨ Finish the wobble',
        choosingTopping
          ? 'Choose something tasty to scatter over the icing.'
          : 'Pick one last decoration for the cake.',
      );
      this.portraitCompanion.setCards([
        {
          id: 'cake-so-far',
          title: 'Cake so far',
          description: `${choiceLabel(THEMES, this.theme)} · ${choiceLabel(TOPPINGS, this.topping)}`,
        },
      ]);
      const actions: PortraitModalAction[] = choices.map((choice) => ({
        id: `${choosingTopping ? 'topping' : 'finish'}-${choice.value}`,
        label: `${choice.icon} ${choice.label}`,
        onPress: () => {
          if (choosingTopping) {
            this.applyTopping(choice.value as BakeryTopping);
          } else {
            this.applyFinish(choice.value as BakeryFinish);
          }
        },
      }));
      this.portraitCompanion.setActionGroups([
        { id: 'decorate', label: choosingTopping ? 'Add topping' : 'Finish cake', actions },
        this.portraitExitGroup(),
      ]);
    }
  }

  private portraitExitGroup(): { id: string; actions: PortraitModalAction[] } {
    return {
      id: 'exit',
      actions: [{ id: 'back', label: '← Back to Bakery', onPress: () => this.leaveActivity() }],
    };
  }

  private handlePrimaryKeyboardAction(): void {
    if (this.stage === 'mix') {
      this.stirMix();
    } else if (this.stage === 'stack') {
      this.placeNextAvailableLayer();
    } else if (this.stage === 'icing') {
      this.applyIcing(THEMES[0]?.value ?? 'sunshine');
    } else if (this.stage === 'decorate') {
      if (this.topping === null) {
        this.applyTopping(TOPPINGS[0]?.value ?? 'berries');
      } else {
        this.applyFinish(FINISHES[0]?.value ?? 'sprinkles');
      }
    }
  }

  private chooseByIndex(index: number): void {
    if (this.stage === 'icing') {
      const choice = THEMES[index];
      if (choice) {
        this.applyIcing(choice.value);
      }
      return;
    }
    if (this.stage === 'decorate') {
      if (this.topping === null) {
        const choice = TOPPINGS[index];
        if (choice) {
          this.applyTopping(choice.value);
        }
      } else {
        const choice = FINISHES[index];
        if (choice) {
          this.applyFinish(choice.value);
        }
      }
    }
  }

  private restartRun(): void {
    this.resetRun();
    this.renderStage();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    labelText: string,
    onPress: () => void,
    parent: Phaser.GameObjects.Container | null = null,
  ): void {
    const button = this.add
      .rectangle(x, y, width, 54, UI_COLOURS.gold, 1)
      .setStrokeStyle(3, UI_COLOURS.goldStrong, 1)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const press = () => onPress();
    button.on('pointerdown', press);
    label.on('pointerdown', press);
    button.on('pointerover', () => button.setFillStyle(UI_COLOURS.blush, 1));
    button.on('pointerout', () => button.setFillStyle(UI_COLOURS.gold, 1));
    parent?.add([button, label]);
  }

  private leaveActivity(): void {
    this.scene.stop();
    if (this.game.scene.isPaused(this.returnScene)) {
      this.game.scene.resume(this.returnScene);
    } else if (!this.game.scene.isActive(this.returnScene)) {
      this.game.scene.start(this.returnScene);
    }
  }
}
