import Phaser from 'phaser';
import {
  BAKERY_OUTCOMES,
  type BakeryCakeTheme,
  type BakeryFinish,
  type BakeryTopping,
} from '../../content/r65RepeatableActivities';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { PortraitModalCompanion, type PortraitModalAction } from '../ui/PortraitModalCompanion';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';
import {
  completeMapleQuestCake,
  getMapleBakingProgress,
  judgeMapleCake,
  MAPLE_REPEAT_BAKE_COST,
  recordMapleBakingCake,
  type MapleCakeJudgement,
} from './MapleBakingActivity';

interface MapleBakingSceneData {
  returnScene?: string;
  mode?: BakingMode;
}

type BakingMode = 'quest' | 'repeatable';
type BakingStage = 'recipe' | 'measure' | 'mix' | 'stack' | 'icing' | 'decorate' | 'result';

interface Choice<T> {
  value: T;
  label: string;
  icon: string;
  colour: number;
}

interface RecipeDefinition extends Choice<BakeryCakeTheme> {
  recipeLine: string;
  targets: readonly [number, number, number];
}

interface IngredientDefinition {
  id: 'flour' | 'milk' | 'sparkle';
  label: string;
  icon: string;
  colour: number;
}

const RECIPES: readonly RecipeDefinition[] = [
  {
    value: 'sunshine',
    label: 'Sunshine Cake',
    icon: '☀️',
    colour: 0xffdc77,
    recipeLine: '3 flour scoops · 2 cloud-milk pours · 1 sparkle spoon',
    targets: [0.68, 0.52, 0.4],
  },
  {
    value: 'moonflower',
    label: 'Moonflower Cake',
    icon: '🌙',
    colour: 0xb9a6ef,
    recipeLine: '2 flour scoops · 3 cloud-milk pours · 1 sparkle spoon',
    targets: [0.56, 0.7, 0.43],
  },
  {
    value: 'rainbow',
    label: 'Rainbow Cake',
    icon: '🌈',
    colour: 0xf09ab7,
    recipeLine: '3 flour scoops · 2 cloud-milk pours · 2 sparkle spoons',
    targets: [0.64, 0.54, 0.66],
  },
];

const INGREDIENTS: readonly IngredientDefinition[] = [
  { id: 'flour', label: 'Cloud Flour', icon: '🌾', colour: 0xf5d8a4 },
  { id: 'milk', label: 'Cloud Milk', icon: '🥛', colour: 0xccecf1 },
  { id: 'sparkle', label: 'Sparkle Sugar', icon: '✨', colour: 0xf6b9d8 },
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

const MIX_CENTRE = { x: GAME_WIDTH / 2, y: 388 } as const;
const MIX_RADIUS = 112;
const MIX_REQUIRED_TRAVEL = Math.PI * 4;
const ICING_LEFT = GAME_WIDTH / 2 - 220;
const ICING_RIGHT = GAME_WIDTH / 2 + 220;
const ICING_CENTRE_Y = 420;

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function recipeFor(theme: BakeryCakeTheme | null): RecipeDefinition | null {
  return RECIPES.find((recipe) => recipe.value === theme) ?? null;
}

function choiceLabel<T>(choices: readonly Choice<T>[], value: T | null): string {
  return choices.find((choice) => choice.value === value)?.label ?? 'not added yet';
}

export class MapleBakingActivityScene extends Phaser.Scene {
  private returnScene = 'VillageInteriorScene';
  private mode: BakingMode = 'repeatable';
  private stage: BakingStage = 'recipe';
  private body: Phaser.GameObjects.Container | null = null;
  private portraitCompanion: PortraitModalCompanion | null = null;

  private theme: BakeryCakeTheme | null = null;
  private ingredientIndex = 0;
  private ingredientScores: number[] = [];
  private measureFill = 0;
  private measureHolding = false;
  private measureMeterGraphics: Phaser.GameObjects.Graphics | null = null;
  private measureValueText: Phaser.GameObjects.Text | null = null;

  private mixDragging = false;
  private mixTravel = 0;
  private mixQualityTotal = 0;
  private mixSamples = 0;
  private mixLastAngle: number | null = null;
  private mixDirection: number | null = null;
  private mixSpoon: Phaser.GameObjects.Text | null = null;
  private mixProgressGraphics: Phaser.GameObjects.Graphics | null = null;

  private layerOffsets = [0, 0, 0];
  private layerScores: number[] = [];
  private placedLayers = new Set<number>();

  private icingProgress = 0;
  private icingQualityTotal = 0;
  private icingSamples = 0;
  private icingTracing = false;
  private icingGraphics: Phaser.GameObjects.Graphics | null = null;

  private topping: BakeryTopping | null = null;
  private finish: BakeryFinish | null = null;
  private judgement: MapleCakeJudgement | null = null;
  private shimmerPayout = 0;
  private repeatBakeCharged = false;
  private completedRun = false;
  private actionLocked = false;

  public constructor() {
    super('MapleBakingActivityScene');
  }

  public create(data: MapleBakingSceneData = {}): void {
    this.returnScene = data.returnScene ?? 'VillageInteriorScene';
    this.mode = data.mode ?? 'repeatable';
    this.resetRun();

    if (this.mode === 'repeatable') {
      this.repeatBakeCharged = new ShimmerEconomyService(getBrowserSaveService()).spend(
        MAPLE_REPEAT_BAKE_COST,
      );
      if (!this.repeatBakeCharged) {
        this.time.delayedCall(0, () => this.leaveActivity(false));
        return;
      }
    }

    this.cameras.main.setBackgroundColor('#6d4b62');
    this.createBackdrop();
    this.portraitCompanion = PortraitModalCompanion.create(
      'maple-baking',
      'Maple’s Wobbly Baking Table',
    );
    this.renderStage();

    this.input.on('pointerup', this.handleGlobalPointerUp, this);
    this.input.keyboard?.on('keydown-ESC', this.handleEscape, this);
    this.input.keyboard?.on('keydown-SPACE', this.handleSpaceDown, this);
    this.input.keyboard?.on('keyup-SPACE', this.handleSpaceUp, this);
    this.input.keyboard?.on('keydown-ENTER', this.handleEnter, this);
    this.input.keyboard?.on('keydown-LEFT', () => this.keyboardStir(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.keyboardStir(1));
    this.input.keyboard?.on('keydown-ONE', () => this.chooseByIndex(0));
    this.input.keyboard?.on('keydown-TWO', () => this.chooseByIndex(1));
    this.input.keyboard?.on('keydown-THREE', () => this.chooseByIndex(2));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerup', this.handleGlobalPointerUp, this);
      this.input.keyboard?.off('keydown-ESC', this.handleEscape, this);
      this.input.keyboard?.off('keydown-SPACE', this.handleSpaceDown, this);
      this.input.keyboard?.off('keyup-SPACE', this.handleSpaceUp, this);
      this.input.keyboard?.off('keydown-ENTER', this.handleEnter, this);
      this.input.keyboard?.removeAllListeners('keydown-LEFT');
      this.input.keyboard?.removeAllListeners('keydown-RIGHT');
      this.input.keyboard?.removeAllListeners('keydown-ONE');
      this.input.keyboard?.removeAllListeners('keydown-TWO');
      this.input.keyboard?.removeAllListeners('keydown-THREE');
      this.portraitCompanion?.destroy();
      this.portraitCompanion = null;
      this.body?.destroy(true);
      this.body = null;
    });
  }

  public update(_time: number, delta: number): void {
    if (this.stage !== 'measure' || !this.measureHolding) {
      return;
    }
    this.measureFill = Math.min(1, this.measureFill + delta * 0.00046);
    this.drawMeasureMeter();
    if (this.measureFill >= 1) {
      this.finishMeasure();
    }
  }

  private resetRun(): void {
    this.stage = 'recipe';
    this.theme = null;
    this.ingredientIndex = 0;
    this.ingredientScores = [];
    this.measureFill = 0;
    this.measureHolding = false;
    this.mixDragging = false;
    this.mixTravel = 0;
    this.mixQualityTotal = 0;
    this.mixSamples = 0;
    this.mixLastAngle = null;
    this.mixDirection = null;
    this.layerOffsets = [0, 0, 0];
    this.layerScores = [];
    this.placedLayers.clear();
    this.icingProgress = 0;
    this.icingQualityTotal = 0;
    this.icingSamples = 0;
    this.icingTracing = false;
    this.topping = null;
    this.finish = null;
    this.judgement = null;
    this.shimmerPayout = 0;
    this.completedRun = false;
    this.actionLocked = false;
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x6d4b62, 1);

    const shadow = this.add.graphics().setDepth(1);
    shadow.fillStyle(0x3f2b3b, 0.24);
    shadow.fillRoundedRect(92, 40, GAME_WIDTH - 184, GAME_HEIGHT - 82, 34);

    const panel = this.add.graphics().setDepth(2).setName('h3-r2-baking-panel');
    panel.fillStyle(0xfff5df, 1);
    panel.lineStyle(6, 0xe5a2b6, 1);
    panel.fillRoundedRect(84, 32, GAME_WIDTH - 184, GAME_HEIGHT - 82, 34);
    panel.strokeRoundedRect(84, 32, GAME_WIDTH - 184, GAME_HEIGHT - 82, 34);

    this.add
      .text(GAME_WIDTH / 2, 66, '🎂 Maple’s Wobbly Baking Table', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(
        GAME_WIDTH / 2,
        101,
        this.mode === 'quest'
          ? 'First cake is on Maple. Make it wonderfully wobbly.'
          : 'Ingredients cost 1 Shimmer. Better cakes earn more back.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '15px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setDepth(3);

    this.createRoundedButton(
      170,
      GAME_HEIGHT - 54,
      220,
      48,
      '← Back to Bakery',
      () => this.leaveActivity(true),
      undefined,
      3,
    );
  }

  private renderStage(): void {
    this.body?.destroy(true);
    this.body = this.add.container(0, 0).setDepth(10);
    this.measureMeterGraphics = null;
    this.measureValueText = null;
    this.mixSpoon = null;
    this.mixProgressGraphics = null;
    this.icingGraphics = null;
    this.actionLocked = false;

    if (this.stage === 'recipe') {
      this.renderRecipeStage();
    } else if (this.stage === 'measure') {
      this.renderMeasureStage();
    } else if (this.stage === 'mix') {
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

  private renderStageHeader(title: string, instruction: string, step: string): void {
    const stepPill = this.createRoundedPanel(182, 137, 126, 36, UI_COLOURS.lavender, 0xb78ed0);
    const stepText = this.add
      .text(182, 137, step, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const heading = this.add
      .text(GAME_WIDTH / 2, 143, title, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName(`h3-r2-baking-stage:${this.stage}`);
    const note = this.add
      .text(GAME_WIDTH / 2, 179, instruction, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5);
    this.body?.add([stepPill, stepText, heading, note]);
  }

  private renderRecipeStage(): void {
    this.renderStageHeader(
      'Choose Maple’s recipe',
      'Pick a cake style, then you will measure the ingredients yourself.',
      'RECIPE',
    );

    RECIPES.forEach((recipe, index) => {
      const x = 320 + index * 320;
      this.createChoiceCard(
        x,
        380,
        270,
        260,
        `h3-r2-baking-recipe:${recipe.value}`,
        recipe.icon,
        recipe.label,
        recipe.recipeLine,
        recipe.colour,
        () => this.chooseRecipe(recipe.value),
      );
    });

    this.portraitCompanion?.setHeader(
      '📖 Choose a recipe',
      'Sunshine, Moonflower or Rainbow. The recipe changes the measuring marks.',
    );
    this.portraitCompanion?.setCards(
      RECIPES.map((recipe) => ({
        id: recipe.value,
        title: `${recipe.icon} ${recipe.label}`,
        description: recipe.recipeLine,
      })),
    );
    this.portraitCompanion?.setActionGroups([
      {
        id: 'recipes',
        actions: RECIPES.map((recipe) => ({
          id: `recipe-${recipe.value}`,
          label: `${recipe.icon} Make ${recipe.label}`,
          onPress: () => this.chooseRecipe(recipe.value),
        })),
      },
      this.portraitExitGroup(),
    ]);
  }

  private chooseRecipe(theme: BakeryCakeTheme): void {
    if (this.stage !== 'recipe' || this.actionLocked) {
      return;
    }
    this.theme = theme;
    this.stage = 'measure';
    this.renderStage();
  }

  private renderMeasureStage(): void {
    const recipe = recipeFor(this.theme);
    const ingredient = INGREDIENTS[this.ingredientIndex];
    if (!recipe || !ingredient) {
      return;
    }

    this.renderStageHeader(
      'Measure the ingredients',
      'Hold the scoop to pour. Release when the fill reaches the gold recipe mark.',
      `MEASURE ${this.ingredientIndex + 1}/3`,
    );

    const recipeCard = this.createRoundedPanel(
      GAME_WIDTH / 2,
      236,
      650,
      72,
      0xfffbef,
      recipe.colour,
    );
    const recipeText = this.add
      .text(GAME_WIDTH / 2, 236, `${recipe.icon} ${recipe.label}   •   ${recipe.recipeLine}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5);
    this.body?.add([recipeCard, recipeText]);

    const jar = this.createRoundedPanel(
      GAME_WIDTH / 2 - 210,
      420,
      190,
      190,
      0xfffbef,
      ingredient.colour,
    );
    const jarIcon = this.add
      .text(GAME_WIDTH / 2 - 210, 382, ingredient.icon, {
        fontFamily: UI_FONT,
        fontSize: '54px',
      })
      .setOrigin(0.5);
    const jarLabel = this.add
      .text(GAME_WIDTH / 2 - 210, 450, ingredient.label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    const holdLabel = this.add
      .text(GAME_WIDTH / 2 - 210, 486, 'HOLD TO POUR', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const hit = this.add
      .rectangle(GAME_WIDTH / 2 - 210, 420, 205, 205, 0xffffff, 0.001)
      .setAlpha(0.001)
      .setInteractive({ useHandCursor: true })
      .setName(`h3-r2-baking-measure:${ingredient.id}`);
    hit.on('pointerdown', () => this.startMeasure());

    this.measureMeterGraphics = this.add.graphics();
    this.measureValueText = this.add
      .text(GAME_WIDTH / 2 + 190, 515, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.drawMeasureMeter();

    const target = recipe.targets[this.ingredientIndex] ?? 0.5;
    const tip = this.add
      .text(
        GAME_WIDTH / 2 + 190,
        555,
        `Gold line = recipe target • previous accuracy: ${
          this.ingredientScores.map((score) => `${Math.round(score)}%`).join(' · ') ||
          'first ingredient'
        }`,
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '12px',
          align: 'center',
        },
      )
      .setOrigin(0.5);
    tip.setData('target', target);

    this.body?.add([
      jar,
      jarIcon,
      jarLabel,
      holdLabel,
      hit,
      this.measureMeterGraphics,
      this.measureValueText,
      tip,
    ]);

    this.portraitCompanion?.setHeader(
      `${ingredient.icon} Measure ${ingredient.label}`,
      'Tap Pour to add a little, then Lock measure when you are close to the recipe mark.',
    );
    this.portraitCompanion?.setCards([
      {
        id: 'measure',
        title: `${recipe.icon} ${recipe.label}`,
        description: recipe.recipeLine,
        badge: `${Math.round(this.measureFill * 100)}% full`,
      },
    ]);
    this.portraitCompanion?.setActionGroups([
      {
        id: 'measure',
        actions: [
          { id: 'pour', label: '🥄 Pour a little', onPress: () => this.nudgeMeasure(0.09) },
          { id: 'lock', label: '✓ Lock measure', onPress: () => this.finishMeasure() },
        ],
      },
      this.portraitExitGroup(),
    ]);
  }

  private startMeasure(): void {
    if (this.stage !== 'measure' || this.measureHolding) {
      return;
    }
    this.measureHolding = true;
  }

  private handleGlobalPointerUp(): void {
    if (this.stage === 'measure' && this.measureHolding) {
      this.finishMeasure();
      return;
    }
    if (this.stage === 'mix') {
      this.mixDragging = false;
      this.mixLastAngle = null;
    }
    if (this.stage === 'icing') {
      this.icingTracing = false;
    }
  }

  private nudgeMeasure(amount: number): void {
    if (this.stage !== 'measure') {
      return;
    }
    this.measureFill = Math.min(1, this.measureFill + amount);
    this.drawMeasureMeter();
    this.renderPortraitMeasureState();
  }

  private finishMeasure(): void {
    if (this.stage !== 'measure' || this.actionLocked) {
      return;
    }
    this.measureHolding = false;
    const recipe = recipeFor(this.theme);
    if (!recipe) {
      return;
    }

    const target = recipe.targets[this.ingredientIndex] ?? 0.5;
    const error = Math.abs(this.measureFill - target);
    const score = Math.max(0, Math.round(100 - error * 220));
    this.ingredientScores.push(score);
    this.ingredientIndex += 1;
    this.measureFill = 0;

    if (this.ingredientIndex >= INGREDIENTS.length) {
      this.actionLocked = true;
      this.time.delayedCall(180, () => {
        this.stage = 'mix';
        this.renderStage();
      });
      return;
    }
    this.renderStage();
  }

  private drawMeasureMeter(): void {
    const recipe = recipeFor(this.theme);
    if (!recipe || !this.measureMeterGraphics) {
      return;
    }
    const target = recipe.targets[this.ingredientIndex] ?? 0.5;
    const x = GAME_WIDTH / 2 + 88;
    const y = 330;
    const width = 205;
    const height = 175;
    const fillHeight = height * this.measureFill;
    const targetY = y + height - height * target;

    this.measureMeterGraphics.clear();
    this.measureMeterGraphics.fillStyle(0xeadde7, 1);
    this.measureMeterGraphics.fillRoundedRect(x, y, width, height, 24);
    this.measureMeterGraphics.lineStyle(4, 0xb78ed0, 1);
    this.measureMeterGraphics.strokeRoundedRect(x, y, width, height, 24);
    this.measureMeterGraphics.fillStyle(0xf4c98d, 0.94);
    this.measureMeterGraphics.fillRoundedRect(
      x + 10,
      y + height - fillHeight + 8,
      width - 20,
      Math.max(0, fillHeight - 16),
      16,
    );
    this.measureMeterGraphics.lineStyle(6, 0xd69b35, 1);
    this.measureMeterGraphics.lineBetween(x - 12, targetY, x + width + 12, targetY);
    this.measureMeterGraphics.fillStyle(0xfff7dd, 1);
    this.measureMeterGraphics.fillCircle(x + width + 24, targetY, 10);

    this.measureValueText?.setText(`${Math.round(this.measureFill * 100)}% full`);
  }

  private renderPortraitMeasureState(): void {
    const recipe = recipeFor(this.theme);
    const ingredient = INGREDIENTS[this.ingredientIndex];
    if (!recipe || !ingredient) {
      return;
    }
    this.portraitCompanion?.setCards([
      {
        id: 'measure',
        title: `${ingredient.icon} ${ingredient.label}`,
        description: 'Aim for the gold recipe mark.',
        badge: `${Math.round(this.measureFill * 100)}% full`,
      },
    ]);
  }

  private renderMixStage(): void {
    this.renderStageHeader(
      'Stir the batter',
      'Press and trace around the glowing ring. Smooth circles make a better cake.',
      'STIR',
    );

    const bowl = this.add.graphics();
    bowl.fillStyle(0xf3c8b6, 1);
    bowl.lineStyle(7, 0xca8979, 1);
    bowl.fillEllipse(MIX_CENTRE.x - 190, MIX_CENTRE.y - 105, 380, 210);
    bowl.strokeEllipse(MIX_CENTRE.x - 190, MIX_CENTRE.y - 105, 380, 210);
    bowl.fillStyle(0xffdda0, 1);
    bowl.fillEllipse(MIX_CENTRE.x - 150, MIX_CENTRE.y - 78, 300, 156);

    const guide = this.add.graphics();
    guide.lineStyle(14, 0xd3a8ec, 0.22);
    guide.strokeCircle(MIX_CENTRE.x, MIX_CENTRE.y, MIX_RADIUS);
    guide.lineStyle(4, 0xb47bd0, 0.9);
    guide.strokeCircle(MIX_CENTRE.x, MIX_CENTRE.y, MIX_RADIUS);

    const hit = this.add
      .circle(MIX_CENTRE.x, MIX_CENTRE.y, 155, 0xffffff, 0.001)
      .setAlpha(0.001)
      .setInteractive({ useHandCursor: true })
      .setName('h3-r2-baking-mix-bowl');
    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.startMixTrace(pointer));
    hit.on('pointermove', (pointer: Phaser.Input.Pointer) => this.traceMix(pointer));

    this.mixSpoon = this.add
      .text(MIX_CENTRE.x + MIX_RADIUS, MIX_CENTRE.y, '🥄', {
        fontFamily: UI_FONT,
        fontSize: '48px',
      })
      .setOrigin(0.5);
    this.mixProgressGraphics = this.add.graphics();
    this.drawMixProgress();

    const hint = this.createRoundedPanel(GAME_WIDTH / 2, 575, 520, 54, 0xfffbef, 0xd8b4e5);
    const hintText = this.add
      .text(GAME_WIDTH / 2, 575, 'Mouse/touch: trace the ring   •   Keyboard: LEFT / RIGHT', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.body?.add([bowl, guide, hit, this.mixSpoon, this.mixProgressGraphics, hint, hintText]);

    this.portraitCompanion?.setHeader(
      '🥣 Stir the batter',
      'Keep moving around the bowl. There is no timer and you cannot fail.',
    );
    this.portraitCompanion?.setCards([
      {
        id: 'mix',
        title: 'Stirring progress',
        description: 'Smooth circles give the best wobble.',
        badge: `${Math.round((this.mixTravel / MIX_REQUIRED_TRAVEL) * 100)}%`,
      },
    ]);
    this.portraitCompanion?.setActionGroups([
      {
        id: 'mix',
        actions: [
          { id: 'left', label: '↶ Stir left', onPress: () => this.keyboardStir(-1) },
          { id: 'right', label: '↷ Stir right', onPress: () => this.keyboardStir(1) },
        ],
      },
      this.portraitExitGroup(),
    ]);
  }

  private startMixTrace(pointer: Phaser.Input.Pointer): void {
    if (this.stage !== 'mix') {
      return;
    }
    this.mixDragging = true;
    this.mixLastAngle = Phaser.Math.Angle.Between(MIX_CENTRE.x, MIX_CENTRE.y, pointer.x, pointer.y);
    this.positionMixSpoon(pointer.x, pointer.y);
  }

  private traceMix(pointer: Phaser.Input.Pointer): void {
    if (this.stage !== 'mix' || !this.mixDragging || this.actionLocked) {
      return;
    }
    const angle = Phaser.Math.Angle.Between(MIX_CENTRE.x, MIX_CENTRE.y, pointer.x, pointer.y);
    if (this.mixLastAngle === null) {
      this.mixLastAngle = angle;
      return;
    }
    const delta = Phaser.Math.Angle.Wrap(angle - this.mixLastAngle);
    if (Math.abs(delta) > 0.75) {
      this.mixLastAngle = angle;
      return;
    }
    const radius = Phaser.Math.Distance.Between(MIX_CENTRE.x, MIX_CENTRE.y, pointer.x, pointer.y);
    const radialQuality = Math.max(0, 1 - Math.abs(radius - MIX_RADIUS) / 62);
    const direction = delta === 0 ? 0 : Math.sign(delta);
    if (this.mixDirection === null && direction !== 0) {
      this.mixDirection = direction;
    }
    const directionQuality =
      direction === 0 || this.mixDirection === null || direction === this.mixDirection ? 1 : 0.55;
    this.addMixMovement(Math.abs(delta), radialQuality * directionQuality);
    this.mixLastAngle = angle;
    this.positionMixSpoon(pointer.x, pointer.y);
  }

  private keyboardStir(direction: number): void {
    if (this.stage !== 'mix' || this.actionLocked) {
      return;
    }
    if (this.mixDirection === null) {
      this.mixDirection = direction;
    }
    const quality = this.mixDirection === direction ? 0.88 : 0.6;
    this.addMixMovement(Math.PI / 6, quality);
    const angle = this.mixTravel * direction;
    this.positionMixSpoon(
      MIX_CENTRE.x + Math.cos(angle) * MIX_RADIUS,
      MIX_CENTRE.y + Math.sin(angle) * MIX_RADIUS,
    );
  }

  private addMixMovement(distance: number, quality: number): void {
    this.mixTravel = Math.min(MIX_REQUIRED_TRAVEL, this.mixTravel + distance);
    this.mixQualityTotal += quality;
    this.mixSamples += 1;
    this.drawMixProgress();

    if (this.mixTravel >= MIX_REQUIRED_TRAVEL) {
      this.actionLocked = true;
      this.mixDragging = false;
      this.time.delayedCall(180, () => {
        this.stage = 'stack';
        this.renderStage();
      });
    }
  }

  private positionMixSpoon(x: number, y: number): void {
    this.mixSpoon?.setPosition(x, y);
  }

  private drawMixProgress(): void {
    if (!this.mixProgressGraphics) {
      return;
    }
    const progress = Phaser.Math.Clamp(this.mixTravel / MIX_REQUIRED_TRAVEL, 0, 1);
    this.mixProgressGraphics.clear();
    this.mixProgressGraphics.lineStyle(11, 0xf1b6ca, 1);
    this.mixProgressGraphics.beginPath();
    this.mixProgressGraphics.arc(
      MIX_CENTRE.x,
      MIX_CENTRE.y,
      MIX_RADIUS + 24,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * progress,
      false,
    );
    this.mixProgressGraphics.strokePath();
  }

  private renderStackStage(): void {
    this.renderStageHeader(
      'Build the wobble',
      'Drag each sponge onto its glowing wobble zone. Slightly off-centre is exactly right.',
      'STACK',
    );

    this.drawCakeStand(GAME_WIDTH / 2, 585);
    const targetOffsets = [-24, 28, -18] as const;
    const targetYs = [520, 456, 392] as const;

    targetOffsets.forEach((offset, index) => {
      if (this.placedLayers.has(index)) {
        this.drawPlacedLayer(
          index,
          GAME_WIDTH / 2 + this.layerOffsets[index],
          targetYs[index] ?? 0,
        );
        return;
      }

      const targetX = GAME_WIDTH / 2 + offset;
      const targetY = targetYs[index] ?? 0;
      const zone = this.add.graphics();
      zone.fillStyle(0xd9b9ed, 0.16);
      zone.lineStyle(4, 0xb47bd0, 0.7);
      zone.fillRoundedRect(targetX - 108, targetY - 28, 216, 56, 24);
      zone.strokeRoundedRect(targetX - 108, targetY - 28, 216, 56, 24);
      this.body?.add(zone);

      const trayX = index % 2 === 0 ? 250 : 1030;
      const trayY = 330 + index * 76;
      this.createDraggableLayer(index, trayX, trayY, targetX, targetY);
    });

    const progress = this.add
      .text(GAME_WIDTH / 2, 625, `${this.placedLayers.size}/3 sponge layers placed`, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.body?.add(progress);

    this.portraitCompanion?.setHeader(
      '🍰 Build the wobble',
      'Place each layer. The best target is deliberately a little off-centre.',
    );
    this.portraitCompanion?.setCards([
      {
        id: 'stack',
        title: 'Cake stack',
        description: 'Three layers make the Wobbly Cake.',
        badge: `${this.placedLayers.size}/3`,
      },
    ]);
    this.portraitCompanion?.setActionGroups([
      {
        id: 'stack',
        actions: [
          {
            id: 'place',
            label: '🍰 Place next layer',
            onPress: () => this.autoPlaceNextLayer(),
          },
        ],
      },
      this.portraitExitGroup(),
    ]);
  }

  private createDraggableLayer(
    index: number,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
  ): void {
    const shadow = this.add.graphics();
    shadow.fillStyle(0x7b5268, 0.18);
    shadow.fillRoundedRect(-106, -22, 212, 52, 22);
    const sponge = this.add.graphics();
    sponge.fillStyle(0xf4c989, 1);
    sponge.lineStyle(4, 0xd8a565, 1);
    sponge.fillRoundedRect(-108, -28, 216, 56, 22);
    sponge.strokeRoundedRect(-108, -28, 216, 56, 22);
    const icon = this.add
      .text(0, 0, `Layer ${index + 1}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const layer = this.add
      .container(startX, startY, [shadow, sponge, icon])
      .setSize(216, 64)
      .setInteractive({ useHandCursor: true })
      .setName(`h3-r2-baking-layer:${index + 1}`);
    this.input.setDraggable(layer);

    let dragged = false;
    layer.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      dragged = true;
      layer.setPosition(dragX, dragY);
    });
    layer.on('dragend', () => this.placeLayer(index, layer.x, layer.y, targetX, targetY));
    layer.on('pointerup', () => {
      if (!dragged && !this.placedLayers.has(index)) {
        this.placeLayer(index, targetX + 15, targetY, targetX, targetY);
      }
    });

    this.body?.add(layer);
  }

  private placeLayer(
    index: number,
    droppedX: number,
    _droppedY: number,
    targetX: number,
    _targetY: number,
  ): void {
    if (this.stage !== 'stack' || this.placedLayers.has(index) || this.actionLocked) {
      return;
    }
    const xError = Math.abs(droppedX - targetX);
    const score = Math.max(0, Math.round(100 - xError * 1.6));
    this.layerScores[index] = score;
    this.layerOffsets[index] = Phaser.Math.Clamp(droppedX - GAME_WIDTH / 2, -58, 58);
    this.placedLayers.add(index);

    if (this.placedLayers.size >= 3) {
      this.actionLocked = true;
      this.time.delayedCall(180, () => {
        this.stage = 'icing';
        this.renderStage();
      });
      return;
    }
    this.renderStage();
  }

  private autoPlaceNextLayer(): void {
    const index = [0, 1, 2].find((candidate) => !this.placedLayers.has(candidate));
    if (index === undefined) {
      return;
    }
    const targetOffsets = [-24, 28, -18] as const;
    const targetYs = [520, 456, 392] as const;
    const targetX = GAME_WIDTH / 2 + (targetOffsets[index] ?? 0);
    this.placeLayer(index, targetX + 15, targetYs[index] ?? 0, targetX, targetYs[index] ?? 0);
  }

  private renderIcingStage(): void {
    this.renderStageHeader(
      'Pipe the icing',
      'Trace the wavy guide from left to right. You can lift and continue if you need to.',
      'ICE',
    );

    this.drawCakePreview(GAME_WIDTH / 2, 520);

    const guide = this.add.graphics();
    guide.lineStyle(10, 0xd5b2e7, 0.35);
    guide.beginPath();
    for (let x = ICING_LEFT; x <= ICING_RIGHT; x += 8) {
      const y = this.icingGuideY(x);
      if (x === ICING_LEFT) {
        guide.moveTo(x, y);
      } else {
        guide.lineTo(x, y);
      }
    }
    guide.strokePath();

    this.icingGraphics = this.add.graphics();
    this.drawIcingTrace();

    const hit = this.add
      .rectangle(GAME_WIDTH / 2, ICING_CENTRE_Y, 520, 150, 0xffffff, 0.001)
      .setAlpha(0.001)
      .setInteractive({ useHandCursor: true })
      .setName('h3-r2-baking-icing-trace');
    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.icingTracing = true;
      this.traceIcing(pointer);
    });
    hit.on('pointermove', (pointer: Phaser.Input.Pointer) => this.traceIcing(pointer));

    const hint = this.createRoundedPanel(GAME_WIDTH / 2, 605, 500, 48, 0xfffbef, 0xd8b4e5);
    const hintText = this.add
      .text(
        GAME_WIDTH / 2,
        605,
        'Trace the purple wave • SPACE / ENTER advances an accessible guided trace',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '12px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    this.body?.add([guide, this.icingGraphics, hit, hint, hintText]);

    this.portraitCompanion?.setHeader(
      '🧁 Pipe the icing',
      'Follow the wavy guide. A guided trace is available here too.',
    );
    this.portraitCompanion?.setCards([
      {
        id: 'icing',
        title: 'Icing trail',
        description: 'Keep going until the whole cake is iced.',
        badge: `${Math.round(this.icingProgress * 100)}%`,
      },
    ]);
    this.portraitCompanion?.setActionGroups([
      {
        id: 'icing',
        actions: [
          { id: 'trace', label: '🧁 Continue guided trace', onPress: () => this.keyboardIcing() },
        ],
      },
      this.portraitExitGroup(),
    ]);
  }

  private traceIcing(pointer: Phaser.Input.Pointer): void {
    if (this.stage !== 'icing' || !this.icingTracing || this.actionLocked) {
      return;
    }
    const x = Phaser.Math.Clamp(pointer.x, ICING_LEFT, ICING_RIGHT);
    const progress = (x - ICING_LEFT) / (ICING_RIGHT - ICING_LEFT);
    if (progress + 0.08 < this.icingProgress) {
      return;
    }
    const expectedY = this.icingGuideY(x);
    const quality = Math.max(0, 1 - Math.abs(pointer.y - expectedY) / 65);
    this.icingProgress = Math.max(this.icingProgress, progress);
    this.icingQualityTotal += quality;
    this.icingSamples += 1;
    this.drawIcingTrace();
    this.checkIcingComplete();
  }

  private keyboardIcing(): void {
    if (this.stage !== 'icing' || this.actionLocked) {
      return;
    }
    this.icingProgress = Math.min(1, this.icingProgress + 0.1);
    this.icingQualityTotal += 0.84;
    this.icingSamples += 1;
    this.drawIcingTrace();
    this.checkIcingComplete();
  }

  private icingGuideY(x: number): number {
    const normalised = (x - ICING_LEFT) / (ICING_RIGHT - ICING_LEFT);
    return ICING_CENTRE_Y + Math.sin(normalised * Math.PI * 5) * 28;
  }

  private drawIcingTrace(): void {
    if (!this.icingGraphics) {
      return;
    }
    const recipe = recipeFor(this.theme);
    const colour = recipe?.colour ?? UI_COLOURS.blush;
    const endX = Phaser.Math.Linear(ICING_LEFT, ICING_RIGHT, this.icingProgress);

    this.icingGraphics.clear();
    this.icingGraphics.lineStyle(9, colour, 1);
    this.icingGraphics.beginPath();
    for (let x = ICING_LEFT; x <= endX; x += 8) {
      const y = this.icingGuideY(x);
      if (x === ICING_LEFT) {
        this.icingGraphics.moveTo(x, y);
      } else {
        this.icingGraphics.lineTo(x, y);
      }
    }
    this.icingGraphics.strokePath();
  }

  private checkIcingComplete(): void {
    if (this.icingProgress < 0.99 || this.actionLocked) {
      return;
    }
    this.actionLocked = true;
    this.time.delayedCall(180, () => {
      this.stage = 'decorate';
      this.renderStage();
    });
  }

  private renderDecorateStage(): void {
    const choosingTopping = this.topping === null;
    this.renderStageHeader(
      choosingTopping ? 'Choose a topping' : 'Add the finishing touch',
      choosingTopping
        ? 'Decoration is yours. Pick whatever looks most delicious.'
        : 'One final flourish, then Cinnamon will judge the wobble.',
      'DECORATE',
    );

    this.drawCakePreview(GAME_WIDTH / 2, 475);
    const choices = choosingTopping ? TOPPINGS : FINISHES;
    choices.forEach((choice, index) => {
      const x = 330 + index * 310;
      this.createChoiceCard(
        x,
        275,
        250,
        112,
        choosingTopping
          ? `h3-r2-baking-topping:${choice.value}`
          : `h3-r2-baking-finish:${choice.value}`,
        choice.icon,
        choice.label,
        '',
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

    this.renderPortraitDecorate();
  }

  private applyTopping(topping: BakeryTopping): void {
    if (this.stage !== 'decorate' || this.topping !== null || this.actionLocked) {
      return;
    }
    this.topping = topping;
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

    const ingredientScore = average(this.ingredientScores);
    const mixScore = this.mixSamples > 0 ? (this.mixQualityTotal / this.mixSamples) * 100 : 55;
    const stackScore = average(this.layerScores);
    const icingScore =
      this.icingSamples > 0 ? (this.icingQualityTotal / this.icingSamples) * 100 : 55;
    this.judgement = judgeMapleCake({
      ingredients: ingredientScore,
      mixing: mixScore,
      stacking: stackScore,
      icing: icingScore,
    });

    const saveService = getBrowserSaveService();
    if (this.mode === 'quest') {
      completeMapleQuestCake(saveService, this.theme);
    } else {
      recordMapleBakingCake(saveService, this.theme);
      this.shimmerPayout = this.judgement.shimmerPayout;
      new ShimmerEconomyService(saveService).earn(this.shimmerPayout);
      this.repeatBakeCharged = false;
    }

    this.completedRun = true;
    this.stage = 'result';
    this.cameras.main.flash(120, 255, 236, 190, false);
    this.time.delayedCall(120, () => this.renderStage());
  }

  private renderResult(): void {
    const judgement = this.judgement;
    const outcome =
      BAKERY_OUTCOMES.find((candidate) => candidate.theme === this.theme) ?? BAKERY_OUTCOMES[0];
    if (!judgement || !outcome) {
      return;
    }

    const badge = this.createRoundedPanel(GAME_WIDTH / 2, 180, 420, 68, UI_COLOURS.gold, 0xd69b35);
    const title = this.add
      .text(GAME_WIDTH / 2, 170, `${outcome.icon} ${judgement.ratingLabel}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('h3-r2-baking-result');
    const score = this.add
      .text(GAME_WIDTH / 2, 202, `Wobble Score: ${judgement.score}/100`, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const cake = this.drawCakePreview(GAME_WIDTH / 2, 420, true);
    const detailPanel = this.createRoundedPanel(GAME_WIDTH / 2, 560, 690, 96, 0xfffbef, 0xd9b9e8);
    const progress =
      this.mode === 'repeatable' ? getMapleBakingProgress(getBrowserSaveService()) : null;
    const balance =
      this.mode === 'repeatable'
        ? new ShimmerEconomyService(getBrowserSaveService()).getBalance()
        : null;
    const economyLine =
      this.mode === 'repeatable'
        ? `Cinnamon buys it for ${this.shimmerPayout} Shimmer. Ingredients cost 1, so this bake made +${this.shimmerPayout - MAPLE_REPEAT_BAKE_COST}. Balance: ${balance} ✨`
        : 'Maple’s first Wobbly Cake is ready. Take it outside and show her.';
    const detail = this.add
      .text(
        GAME_WIDTH / 2,
        560,
        `${choiceLabel(TOPPINGS, this.topping)} · ${choiceLabel(FINISHES, this.finish)}\n${economyLine}${
          this.mode === 'repeatable'
            ? `\nRecipe notebook: ${progress?.completedOutcomeCount ?? 0}/${progress?.totalOutcomeCount ?? 0} styles discovered.`
            : ''
        }`,
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 630 },
        },
      )
      .setOrigin(0.5);
    this.body?.add([badge, title, score, detailPanel, detail]);

    if (this.mode === 'repeatable') {
      this.createRoundedButton(
        GAME_WIDTH / 2 - 150,
        640,
        260,
        48,
        '🎂 Bake another • 1 ✨',
        () => this.restartRun(),
        this.body,
      );
      this.createRoundedButton(
        GAME_WIDTH / 2 + 150,
        640,
        230,
        48,
        '✓ Back to Bakery',
        () => this.leaveActivity(false),
        this.body,
      );
    } else {
      this.createRoundedButton(
        GAME_WIDTH / 2,
        640,
        280,
        48,
        '✓ Show Maple',
        () => this.leaveActivity(false),
        this.body,
      );
    }

    this.tweens.add({
      targets: cake,
      angle: 2.4,
      duration: 340,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.portraitCompanion?.setHeader(
      `${outcome.icon} ${judgement.ratingLabel}`,
      `Wobble Score: ${judgement.score}/100`,
    );
    this.portraitCompanion?.setCards([
      {
        id: 'result',
        title: this.mode === 'quest' ? 'Take it to Maple' : `Bakery pays ${this.shimmerPayout} ✨`,
        description: economyLine,
      },
    ]);
    this.portraitCompanion?.setActionGroups([
      {
        id: 'result',
        actions:
          this.mode === 'repeatable'
            ? [
                { id: 'again', label: '🎂 Bake another • 1 ✨', onPress: () => this.restartRun() },
                { id: 'back', label: '✓ Back to Bakery', onPress: () => this.leaveActivity(false) },
              ]
            : [{ id: 'back', label: '✓ Show Maple', onPress: () => this.leaveActivity(false) }],
      },
    ]);
  }

  private drawCakeStand(x: number, y: number): void {
    const stand = this.add.graphics();
    stand.fillStyle(0xf5d5df, 1);
    stand.lineStyle(4, 0xce96aa, 0.8);
    stand.fillEllipse(x - 150, y - 28, 300, 56);
    stand.strokeEllipse(x - 150, y - 28, 300, 56);
    stand.fillRoundedRect(x - 18, y - 6, 36, 48, 12);
    stand.fillEllipse(x - 65, y + 32, 130, 30);
    this.body?.add(stand);
  }

  private drawPlacedLayer(index: number, x: number, y: number): void {
    const widths = [230, 205, 180] as const;
    const width = widths[index] ?? 180;
    const layer = this.add.graphics();
    layer.fillStyle(0xf4c989, 1);
    layer.lineStyle(4, 0xd8a565, 1);
    layer.fillRoundedRect(x - width / 2, y - 28, width, 56, 22);
    layer.strokeRoundedRect(x - width / 2, y - 28, width, 56, 22);
    this.body?.add(layer);
  }

  private drawCakePreview(x: number, y: number, result = false): Phaser.GameObjects.Container {
    const recipe = recipeFor(this.theme);
    const icingColour = recipe?.colour ?? 0xf0a7c3;
    const container = this.add.container(x, y);
    const widths = [230, 205, 180] as const;
    const ys = [42, -18, -76] as const;

    widths.forEach((width, index) => {
      const offset = this.layerOffsets[index] ?? 0;
      const sponge = this.add.graphics();
      sponge.fillStyle(0xf4c989, 1);
      sponge.lineStyle(3, 0xd8a565, 1);
      sponge.fillRoundedRect(offset - width / 2, (ys[index] ?? 0) - 26, width, 52, 20);
      sponge.strokeRoundedRect(offset - width / 2, (ys[index] ?? 0) - 26, width, 52, 20);
      sponge.fillStyle(icingColour, 1);
      sponge.fillRoundedRect(offset - width / 2 + 8, (ys[index] ?? 0) - 24, width - 16, 18, 9);
      container.add(sponge);
    });

    if (this.topping) {
      const icon = this.topping === 'berries' ? '🍓' : this.topping === 'clouds' ? '☁️' : '⭐';
      for (const dx of [-62, 0, 62]) {
        container.add(
          this.add
            .text(dx + (this.layerOffsets[2] ?? 0), -118, icon, {
              fontFamily: UI_FONT,
              fontSize: '25px',
            })
            .setOrigin(0.5),
        );
      }
    }
    if (this.finish) {
      const icon = this.finish === 'sprinkles' ? '✨' : this.finish === 'swirl' ? '🌀' : '🎀';
      container.add(
        this.add
          .text(this.layerOffsets[2] ?? 0, -151, icon, {
            fontFamily: UI_FONT,
            fontSize: '31px',
          })
          .setOrigin(0.5),
      );
    }

    if (result) {
      container.setScale(1.03);
    }
    this.body?.add(container);
    return container;
  }

  private createRoundedPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColour: number,
    strokeColour: number,
  ): Phaser.GameObjects.Graphics {
    const panel = this.add.graphics();
    panel.fillStyle(fillColour, 1);
    panel.lineStyle(3, strokeColour, 0.95);
    panel.fillRoundedRect(x - width / 2, y - height / 2, width, height, 22);
    panel.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 22);
    return panel;
  }

  private createChoiceCard(
    x: number,
    y: number,
    width: number,
    height: number,
    name: string,
    iconText: string,
    titleText: string,
    description: string,
    accent: number,
    onPress: () => void,
  ): void {
    const card = this.createRoundedPanel(x, y, width, height, 0xfffbef, accent);
    const icon = this.add
      .text(x, y - height * 0.22, iconText, { fontFamily: UI_FONT, fontSize: '42px' })
      .setOrigin(0.5);
    const title = this.add
      .text(x, y + (description ? 4 : 15), titleText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    const detail = this.add
      .text(x, y + height * 0.27, description, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: width - 34 },
      })
      .setOrigin(0.5);
    const hit = this.add
      .rectangle(x, y, width, height, 0xffffff, 0.001)
      .setAlpha(0.001)
      .setInteractive({ useHandCursor: true })
      .setName(name);
    hit.on('pointerover', () => card.setAlpha(0.86));
    hit.on('pointerout', () => card.setAlpha(1));
    hit.on('pointerdown', onPress);
    this.body?.add([card, icon, title, detail, hit]);
  }

  private createRoundedButton(
    x: number,
    y: number,
    width: number,
    height: number,
    labelText: string,
    onPress: () => void,
    parent?: Phaser.GameObjects.Container | null,
    depth?: number,
  ): void {
    const shadow = this.add.graphics();
    shadow.fillStyle(0x4c3446, 0.18);
    shadow.fillRoundedRect(x - width / 2 + 4, y - height / 2 + 5, width, height, height / 2);
    const surface = this.add.graphics();
    surface.fillStyle(UI_COLOURS.gold, 1);
    surface.lineStyle(3, UI_COLOURS.goldStrong, 1);
    surface.fillRoundedRect(x - width / 2, y - height / 2, width, height, height / 2);
    surface.strokeRoundedRect(x - width / 2, y - height / 2, width, height, height / 2);
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const hit = this.add
      .rectangle(x, y, width, height, 0xffffff, 0.001)
      .setAlpha(0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => surface.setAlpha(0.82));
    hit.on('pointerout', () => surface.setAlpha(1));
    hit.on('pointerdown', onPress);
    if (depth !== undefined) {
      shadow.setDepth(depth);
      surface.setDepth(depth + 0.01);
      label.setDepth(depth + 0.02);
      hit.setDepth(depth + 0.03);
    }
    parent?.add([shadow, surface, label, hit]);
  }

  private renderPortraitDecorate(): void {
    if (!this.portraitCompanion) {
      return;
    }
    const choosingTopping = this.topping === null;
    const choices = choosingTopping ? TOPPINGS : FINISHES;
    this.portraitCompanion.setHeader(
      choosingTopping ? '🍓 Choose a topping' : '✨ Finish the cake',
      choosingTopping ? 'Decoration is creative, not scored.' : 'One last flourish.',
    );
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
    this.portraitCompanion.setActionGroups([{ id: 'decorate', actions }, this.portraitExitGroup()]);
  }

  private portraitExitGroup(): { id: string; actions: PortraitModalAction[] } {
    return {
      id: 'exit',
      actions: [{ id: 'back', label: '← Back to Bakery', onPress: () => this.leaveActivity(true) }],
    };
  }

  private handleEscape(): void {
    this.leaveActivity(true);
  }

  private handleSpaceDown(): void {
    if (this.stage === 'measure') {
      this.startMeasure();
      return;
    }
    if (this.stage === 'icing') {
      this.keyboardIcing();
    }
  }

  private handleSpaceUp(): void {
    if (this.stage === 'measure' && this.measureHolding) {
      this.finishMeasure();
    }
  }

  private handleEnter(): void {
    if (this.stage === 'recipe') {
      this.chooseRecipe(RECIPES[0]?.value ?? 'sunshine');
    } else if (this.stage === 'measure') {
      this.nudgeMeasure(0.09);
    } else if (this.stage === 'mix') {
      this.keyboardStir(1);
    } else if (this.stage === 'stack') {
      this.autoPlaceNextLayer();
    } else if (this.stage === 'icing') {
      this.keyboardIcing();
    } else if (this.stage === 'decorate') {
      if (this.topping === null) {
        this.applyTopping(TOPPINGS[0]?.value ?? 'berries');
      } else {
        this.applyFinish(FINISHES[0]?.value ?? 'sprinkles');
      }
    }
  }

  private chooseByIndex(index: number): void {
    if (this.stage === 'recipe') {
      const choice = RECIPES[index];
      if (choice) {
        this.chooseRecipe(choice.value);
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
    if (this.mode !== 'repeatable') {
      return;
    }
    const economy = new ShimmerEconomyService(getBrowserSaveService());
    if (!economy.spend(MAPLE_REPEAT_BAKE_COST)) {
      this.leaveActivity(false);
      return;
    }
    this.repeatBakeCharged = true;
    this.resetRun();
    this.repeatBakeCharged = true;
    this.renderStage();
  }

  private leaveActivity(refundIncomplete: boolean): void {
    if (
      refundIncomplete &&
      this.mode === 'repeatable' &&
      this.repeatBakeCharged &&
      !this.completedRun
    ) {
      new ShimmerEconomyService(getBrowserSaveService()).earn(MAPLE_REPEAT_BAKE_COST);
      this.repeatBakeCharged = false;
    }
    this.scene.stop();
    if (this.game.scene.isPaused(this.returnScene)) {
      this.game.scene.resume(this.returnScene);
    } else if (!this.game.scene.isActive(this.returnScene)) {
      this.game.scene.start(this.returnScene);
    }
  }
}
