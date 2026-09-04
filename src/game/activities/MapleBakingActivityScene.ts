import Phaser from 'phaser';
import {
  BAKERY_OUTCOMES,
  type BakeryCakeTheme,
  type BakeryFinish,
  type BakeryTopping,
} from '../../content/r65RepeatableActivities';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';
import { getMapleBakingProgress, recordMapleBakingCake } from './MapleBakingActivity';

interface MapleBakingSceneData {
  returnScene?: string;
}

type BakingStage = 'theme' | 'topping' | 'finish' | 'result';

interface Choice<T> {
  value: T;
  label: string;
  icon: string;
}

const THEMES: readonly Choice<BakeryCakeTheme>[] = [
  { value: 'sunshine', label: 'Sunshine', icon: '☀️' },
  { value: 'moonflower', label: 'Moonflower', icon: '🌙' },
  { value: 'rainbow', label: 'Rainbow', icon: '🌈' },
];

const TOPPINGS: readonly Choice<BakeryTopping>[] = [
  { value: 'berries', label: 'Berry dots', icon: '🍓' },
  { value: 'clouds', label: 'Cloud puffs', icon: '☁️' },
  { value: 'stars', label: 'Sugar stars', icon: '⭐' },
];

const FINISHES: readonly Choice<BakeryFinish>[] = [
  { value: 'sprinkles', label: 'Sprinkles', icon: '✨' },
  { value: 'swirl', label: 'Icing swirl', icon: '🌀' },
  { value: 'ribbon', label: 'Cake ribbon', icon: '🎀' },
];

export class MapleBakingActivityScene extends Phaser.Scene {
  private returnScene = 'VillageInteriorScene';
  private stage: BakingStage = 'theme';
  private theme: BakeryCakeTheme = 'sunshine';
  private topping: BakeryTopping = 'berries';
  private finish: BakeryFinish = 'sprinkles';
  private body: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('MapleBakingActivityScene');
  }

  public create(data: MapleBakingSceneData = {}): void {
    this.returnScene = data.returnScene ?? 'VillageInteriorScene';
    this.stage = 'theme';
    this.theme = 'sunshine';
    this.topping = 'berries';
    this.finish = 'sprinkles';

    this.cameras.main.setBackgroundColor('#7a5369');
    this.createBackdrop();
    this.renderStage();

    this.input.keyboard?.on('keydown-ESC', this.leaveActivity, this);
    this.input.keyboard?.on('keydown-ONE', () => this.chooseByIndex(0));
    this.input.keyboard?.on('keydown-TWO', () => this.chooseByIndex(1));
    this.input.keyboard?.on('keydown-THREE', () => this.chooseByIndex(2));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.leaveActivity, this);
      this.input.keyboard?.removeAllListeners('keydown-ONE');
      this.input.keyboard?.removeAllListeners('keydown-TWO');
      this.input.keyboard?.removeAllListeners('keydown-THREE');
      this.body?.destroy(true);
      this.body = null;
    });
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x69465c, 1);
    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1080, 650, 1, 0.28);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1080, 650, 0xfff0cf, 1)
      .setStrokeStyle(8, 0xe89b6b, 1)
      .setName('wp14-baking-panel');
    this.add
      .text(GAME_WIDTH / 2, 58, '🎂 Maple’s Wobbly Baking Table', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(
        GAME_WIDTH / 2,
        100,
        'No timer. No wrong cake. Pick three things you like and Maple will wobble it into shape.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '16px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 860 },
        },
      )
      .setOrigin(0.5);
    this.createButton(150, GAME_HEIGHT - 48, 230, '← Back to Bakery', () => this.leaveActivity());
  }

  private renderStage(): void {
    this.body?.destroy(true);
    this.body = this.add.container(0, 0).setDepth(10);

    if (this.stage === 'result') {
      this.renderResult();
      return;
    }

    const stageIndex = this.stage === 'theme' ? 1 : this.stage === 'topping' ? 2 : 3;
    const heading =
      this.stage === 'theme'
        ? '1. Pick the cake mood'
        : this.stage === 'topping'
          ? '2. Pick a topping'
          : '3. Pick the finishing touch';
    const choices =
      this.stage === 'theme' ? THEMES : this.stage === 'topping' ? TOPPINGS : FINISHES;

    const step = this.add
      .text(GAME_WIDTH / 2, 160, `${heading}  •  step ${stageIndex}/3`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName(`wp14-baking-stage:${this.stage}`);
    this.body.add(step);

    choices.forEach((choice, index) => {
      const x = 360 + index * 280;
      this.createChoiceCard(x, 340, choice.icon, choice.label, index);
    });

    const preview = this.add
      .text(GAME_WIDTH / 2, 520, `Cake so far: ${this.theme} • ${this.topping} • ${this.finish}`, {
        color: '#77516e',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#fff9ebdf',
        padding: { x: 16, y: 9 },
      })
      .setOrigin(0.5);
    this.body.add(preview);
  }

  private createChoiceCard(
    x: number,
    y: number,
    iconText: string,
    labelText: string,
    index: number,
  ): void {
    const card = this.add
      .rectangle(x, y, 230, 190, 0xfffbf2, 1)
      .setStrokeStyle(4, 0xe1a56e, 0.95)
      .setInteractive({ useHandCursor: true })
      .setName(`wp14-baking-choice:${this.stage}:${index + 1}`);
    const icon = this.add
      .text(x, y - 35, iconText, { fontFamily: UI_FONT, fontSize: '52px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y + 42, `${index + 1}. ${labelText}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    applyButtonHover(card, 0xfffbf2, 0xffe5c3);
    const choose = () => this.chooseByIndex(index);
    card.on('pointerdown', choose);
    icon.on('pointerdown', choose);
    label.on('pointerdown', choose);
    this.body?.add([card, icon, label]);
  }

  private chooseByIndex(index: number): void {
    if (this.stage === 'result') {
      return;
    }
    if (this.stage === 'theme') {
      this.theme = THEMES[index]?.value ?? this.theme;
      this.stage = 'topping';
    } else if (this.stage === 'topping') {
      this.topping = TOPPINGS[index]?.value ?? this.topping;
      this.stage = 'finish';
    } else {
      this.finish = FINISHES[index]?.value ?? this.finish;
      recordMapleBakingCake(getBrowserSaveService(), this.theme);
      this.stage = 'result';
      this.cameras.main.flash(120, 255, 232, 172, false);
    }
    this.renderStage();
  }

  private renderResult(): void {
    const progress = getMapleBakingProgress(getBrowserSaveService());
    const outcome = BAKERY_OUTCOMES.find(({ theme }) => theme === this.theme) ?? BAKERY_OUTCOMES[0];
    if (!outcome) {
      return;
    }
    const title = this.add
      .text(GAME_WIDTH / 2, 190, `${outcome.icon} ${outcome.name}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('wp14-baking-result');
    const summary = this.add
      .text(
        GAME_WIDTH / 2,
        275,
        `Maple adds ${this.topping} and a ${this.finish} finish. It wobbles exactly enough.\n\nRecipe notebook: ${progress.completedOutcomeCount}/${progress.totalOutcomeCount} cake styles discovered.`,
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 760 },
          backgroundColor: '#fff9ebdd',
          padding: { x: 20, y: 14 },
        },
      )
      .setOrigin(0.5);
    this.body?.add([title, summary]);
    this.createButton(500, 465, 260, '🎂 Bake another', () => this.restartRun(), this.body);
    this.createButton(780, 465, 260, '✓ Back to Bakery', () => this.leaveActivity(), this.body);
  }

  private restartRun(): void {
    this.stage = 'theme';
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
      .rectangle(x, y, width, 58, UI_COLOURS.gold, 1)
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
    applyButtonHover(button, UI_COLOURS.gold, UI_COLOURS.blush);
    button.on('pointerdown', onPress);
    label.on('pointerdown', onPress);
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
