import Phaser from 'phaser';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import {
  JUNIPER_BUTTERFLY_COUNT_COMPLETE_FLAG,
  JUNIPER_BUTTERFLY_COUNT_QUEST_ID,
  MAPLE_PICNIC_SPOT_COMPLETE_FLAG,
  MAPLE_PICNIC_SPOT_QUEST_ID,
  MAPLE_PICNIC_STORY_PREREQUISITE_QUEST_ID,
  NOVA_NO_FINISH_LINE_COMPLETE_FLAG,
  NOVA_NO_FINISH_LINE_QUEST_ID,
  PEBBLE_ODD_STONE_COMPLETE_FLAG,
  PEBBLE_ODD_STONE_QUEST_ID,
  WILLOW_AFTER_DARK_COMPLETE_FLAG,
  WILLOW_AFTER_DARK_QUEST_ID,
} from '../../content/r6ExistingValleyQuestPack';
import { MEADOW_FLOWER_CIRCLE_DISCOVERY_ID } from '../../content/r6MeadowRunContent';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import {
  WorldInteractionInput,
  WORLD_INTERACTION_PROMPT,
} from '../interaction/WorldInteractionInput';
import { getQuestStepId } from '../quests/QuestEngine';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  ExistingValleyQuestPackService,
  type ExistingValleyStoryResult,
} from '../story/ExistingValleyQuestPackService';
import { worldDepthForY } from './WorldDepth';
import { WORLD_PLAYER_NAME } from './WorldTraversalPolishManager';

interface Point {
  x: number;
  y: number;
}

interface QuestPackInteractionDefinition {
  id: string;
  label: string;
  actionLabel: string;
  icon: string;
  position: Point;
  radius: number;
  activate: () => ExistingValleyStoryResult;
}

interface QuestPackInteractionRuntime {
  definition: QuestPackInteractionDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
}

interface QuestPackSceneState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  interactions: QuestPackInteractionRuntime[];
  feedback: Phaser.GameObjects.Text;
  persistent: Phaser.GameObjects.Container | null;
  signature: string;
}

const TARGET_SCENES = [
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
  'CrystalBrookScene',
] as const;

function findPlayer(scene: Phaser.Scene): Point | null {
  const object = scene.children.getByName(WORLD_PLAYER_NAME) as
    | (Phaser.GameObjects.GameObject & Partial<Point>)
    | null;
  if (object && typeof object.x === 'number' && typeof object.y === 'number') {
    return { x: object.x, y: object.y };
  }
  return null;
}

function distance(left: Point, right: Point): number {
  return Phaser.Math.Distance.Between(left.x, left.y, right.x, right.y);
}

export class ExistingValleyQuestPackWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly quests = getBrowserQuestEngine();
  private readonly time = getBrowserAtmosphericTimeService(this.saveService);
  private readonly story = new ExistingValleyQuestPackService(this.saveService, this.quests);
  private state: QuestPackSceneState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = TARGET_SCENES.map((key) => this.game.scene.getScene(key)).find((candidate) =>
      candidate?.scene.isActive(),
    );
    if (!scene) {
      this.destroyState();
      return;
    }

    const signature = this.getSignature(scene.scene.key);
    if (!this.state || this.state.scene !== scene || this.state.signature !== signature) {
      this.buildState(scene, signature);
    }
    const state = this.state;
    if (!state) {
      return;
    }

    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    let nearest: QuestPackInteractionRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const runtime of state.interactions) {
      const pointDistance = distance(player, runtime.definition.position);
      runtime.prompt.setVisible(pointDistance <= runtime.definition.radius + 84);
      if (runtime.container.input) {
        runtime.container.input.enabled = pointDistance <= runtime.definition.radius;
      }
      if (pointDistance <= runtime.definition.radius && pointDistance < nearestDistance) {
        nearest = runtime;
        nearestDistance = pointDistance;
      }
    }

    if (nearest && state.input.justPressed()) {
      this.activate(state, nearest.definition);
    }
  }

  private buildState(scene: Phaser.Scene, signature: string): void {
    this.destroyState();
    const state: QuestPackSceneState = {
      scene,
      input: new WorldInteractionInput(scene),
      interactions: [],
      feedback: scene.add
        .text(640, 112, '', {
          color: '#594c68',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#fff8ecf2',
          padding: { x: 18, y: 10 },
          wordWrap: { width: 760 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(20_100)
        .setVisible(false),
      persistent: null,
      signature,
    };
    state.interactions = this.definitionsForScene(scene.scene.key).map((definition) =>
      this.createInteraction(state, definition),
    );
    state.persistent = this.createPersistentState(scene);
    this.state = state;
  }

  private definitionsForScene(sceneKey: string): QuestPackInteractionDefinition[] {
    if (sceneKey === 'MoonflowerGladeScene') {
      return this.gladeDefinitions();
    }
    if (sceneKey === 'RainbowMeadowScene') {
      return this.meadowDefinitions();
    }
    if (sceneKey === 'SunbeamVillageScene') {
      return this.villageDefinitions();
    }
    if (sceneKey === 'CrystalBrookScene') {
      return this.brookDefinitions();
    }
    return [];
  }

  private gladeDefinitions(): QuestPackInteractionDefinition[] {
    const willowReady = this.quests.getProgress(WILLOW_MOONFLOWERS_QUEST_ID).status === 'completed';
    const afterDark = this.quests.getProgress(WILLOW_AFTER_DARK_QUEST_ID);
    const dark = ['sunset', 'night'].includes(this.time.getState());
    if (!willowReady || (!dark && afterDark.status === 'not-started')) {
      return [];
    }
    return [
      {
        id: 'moonflowers-after-dark',
        label: 'Moonflower starlight pattern',
        actionLabel: 'Watch',
        icon: '🌙',
        position: { x: 880, y: 520 },
        radius: 104,
        activate: () => this.story.inspectMoonflowersAfterDark(),
      },
    ];
  }

  private meadowDefinitions(): QuestPackInteractionDefinition[] {
    const result: QuestPackInteractionDefinition[] = [];
    const novaReady = this.quests.getProgress(NOVA_FIRST_RACE_QUEST_ID).status === 'completed';
    const novaStory = this.quests.getProgress(NOVA_NO_FINISH_LINE_QUEST_ID);
    if (novaReady) {
      result.push({
        id: 'clover-route-card',
        label: 'Clover’s no-finish-line route card',
        actionLabel: 'Read',
        icon: '🗺️',
        position: { x: 2200, y: 870 },
        radius: 116,
        activate: () => this.story.inspectCloverRouteCard(),
      });
    }

    if (novaStory.status === 'active') {
      if (novaStory.currentStepId === getQuestStepId(NOVA_NO_FINISH_LINE_QUEST_ID, 1)) {
        result.push({
          id: 'no-finish-pond-turn',
          label: 'First untimed route flag',
          actionLabel: 'Loop around',
          icon: '🚩',
          position: { x: 1770, y: 770 },
          radius: 104,
          activate: () => this.story.visitNoFinishLandmark('pond'),
        });
      }
      if (novaStory.currentStepId === getQuestStepId(NOVA_NO_FINISH_LINE_QUEST_ID, 2)) {
        result.push({
          id: 'no-finish-picnic-turn',
          label: 'Second untimed route flag',
          actionLabel: 'Climb slowly',
          icon: '🚩',
          position: { x: 1990, y: 1580 },
          radius: 108,
          activate: () => this.story.visitNoFinishLandmark('picnic'),
        });
      }
      if (novaStory.currentStepId === getQuestStepId(NOVA_NO_FINISH_LINE_QUEST_ID, 3)) {
        result.push({
          id: 'no-finish-windmill-turn',
          label: 'Final untimed route flag',
          actionLabel: 'Follow the curve',
          icon: '🚩',
          position: { x: 1580, y: 565 },
          radius: 108,
          activate: () => this.story.visitNoFinishLandmark('windmill'),
        });
      }
    }

    const save = this.saveService.load();
    const flowerCircleKnown = Boolean(
      save?.collections.discoveryIds.includes(MEADOW_FLOWER_CIRCLE_DISCOVERY_ID) ||
        save?.world.uniqueDiscoveryIds.includes(MEADOW_FLOWER_CIRCLE_DISCOVERY_ID),
    );
    if (flowerCircleKnown) {
      result.push({
        id: 'juniper-butterfly-count',
        label: 'Juniper’s butterfly counting game',
        actionLabel: 'Count together',
        icon: '🦋',
        position: { x: 835, y: 1510 },
        radius: 108,
        activate: () => this.story.playJuniperButterflyCount(),
      });
    }

    const mapleReady =
      this.quests.getProgress(MAPLE_PICNIC_STORY_PREREQUISITE_QUEST_ID).status === 'completed';
    if (mapleReady) {
      result.push({
        id: 'maple-picnic-spot',
        label: 'Maple’s bun-safe picnic test',
        actionLabel: 'Test the spot',
        icon: '🧺',
        position: { x: 2070, y: 1460 },
        radius: 110,
        activate: () => this.story.tryMaplePicnicSpot(),
      });
    }

    return result;
  }

  private villageDefinitions(): QuestPackInteractionDefinition[] {
    const progress = this.quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID);
    if (
      progress.status !== 'active' ||
      progress.currentStepId !== getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 2)
    ) {
      return [];
    }
    return [
      {
        id: 'odd-stone-storyhouse-rubbing',
        label: 'Story House stone-rubbing drawer',
        actionLabel: 'Compare patterns',
        icon: '📜',
        position: { x: 2665, y: 930 },
        radius: 112,
        activate: () => this.story.studyOddStoneAtStoryHouse(),
      },
    ];
  }

  private brookDefinitions(): QuestPackInteractionDefinition[] {
    const result: QuestPackInteractionDefinition[] = [];
    const progress = this.quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID);
    if (
      progress.status !== 'completed' &&
      progress.currentStepId !== getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 3)
    ) {
      result.push({
        id: 'odd-stone-bank',
        label: 'One oddly patterned stone',
        actionLabel: 'Inspect',
        icon: '🪨',
        position: { x: 1370, y: 1470 },
        radius: 112,
        activate: () => this.story.inspectOddStone(),
      });
    }
    if (
      progress.status === 'active' &&
      progress.currentStepId === getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 3)
    ) {
      result.push({
        id: 'odd-stone-reflection-match',
        label: 'Still-water stone reflection',
        actionLabel: 'Line up the pattern',
        icon: '💧',
        position: { x: 2855, y: 1650 },
        radius: 112,
        activate: () => this.story.matchOddStoneReflection(),
      });
    }
    return result;
  }

  private createInteraction(
    state: QuestPackSceneState,
    definition: QuestPackInteractionDefinition,
  ): QuestPackInteractionRuntime {
    const glow = state.scene.add.circle(0, 0, 26, 0xffe89a, 0.08).setStrokeStyle(2, 0xffffff, 0.18);
    const icon = state.scene.add
      .text(0, 0, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
      })
      .setOrigin(0.5)
      .setAlpha(0.78);
    const prompt = state.scene.add
      .text(
        0,
        50,
        `${definition.actionLabel}: ${definition.label}  ·  ${WORLD_INTERACTION_PROMPT}`,
        {
          color: '#5b4d68',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          backgroundColor: '#fff9edef',
          padding: { x: 8, y: 5 },
        },
      )
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 176, 148);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, icon, prompt, zone])
      .setName(`wp11-story:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 18, 0.62));
    container.setInteractive(
      new Phaser.Geom.Rectangle(-88, -74, 176, 148),
      Phaser.Geom.Rectangle.Contains,
    );
    state.input.bindPointer(zone, () => {
      const player = findPlayer(state.scene);
      if (player && distance(player, definition.position) <= definition.radius) {
        this.activate(state, definition);
      }
    });
    state.scene.tweens.add({
      targets: [glow, icon],
      alpha: { from: 0.42, to: 0.9 },
      y: { from: -2, to: 2 },
      duration: 920,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return { definition, container, prompt };
  }

  private activate(state: QuestPackSceneState, definition: QuestPackInteractionDefinition): void {
    const result = definition.activate();
    const scene = state.scene;
    if (result.changed) {
      scene.cameras.main.flash(90, 255, 237, 170, false);
    }
    const nextSignature = this.getSignature(scene.scene.key);
    if (nextSignature !== state.signature) {
      this.buildState(scene, nextSignature);
      if (this.state?.scene === scene) {
        this.showFeedback(this.state, result.message);
      }
      return;
    }
    this.showFeedback(state, result.message);
  }

  private getSignature(sceneKey: string): string {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return [
      sceneKey,
      this.time.getState(),
      this.quests.getProgress(WILLOW_MOONFLOWERS_QUEST_ID).status,
      this.quests.getProgress(WILLOW_AFTER_DARK_QUEST_ID).status,
      this.quests.getProgress(WILLOW_AFTER_DARK_QUEST_ID).currentStepId ?? '',
      this.quests.getProgress(NOVA_FIRST_RACE_QUEST_ID).status,
      this.quests.getProgress(NOVA_NO_FINISH_LINE_QUEST_ID).status,
      this.quests.getProgress(NOVA_NO_FINISH_LINE_QUEST_ID).currentStepId ?? '',
      this.quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID).status,
      this.quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID).currentStepId ?? '',
      this.quests.getProgress(JUNIPER_BUTTERFLY_COUNT_QUEST_ID).status,
      this.quests.getProgress(MAPLE_PICNIC_STORY_PREREQUISITE_QUEST_ID).status,
      this.quests.getProgress(MAPLE_PICNIC_SPOT_QUEST_ID).status,
      save.world.flags[WILLOW_AFTER_DARK_COMPLETE_FLAG] === true ? 'willow-glow' : '',
      save.world.flags[NOVA_NO_FINISH_LINE_COMPLETE_FLAG] === true ? 'route-open' : '',
      save.world.flags[PEBBLE_ODD_STONE_COMPLETE_FLAG] === true ? 'stone-solved' : '',
      save.world.flags[JUNIPER_BUTTERFLY_COUNT_COMPLETE_FLAG] === true ? 'butterfly-count' : '',
      save.world.flags[MAPLE_PICNIC_SPOT_COMPLETE_FLAG] === true ? 'picnic-spot' : '',
      save.collections.discoveryIds.includes(MEADOW_FLOWER_CIRCLE_DISCOVERY_ID)
        ? 'flower-circle'
        : '',
    ].join('|');
  }

  private createPersistentState(scene: Phaser.Scene): Phaser.GameObjects.Container | null {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const objects: Phaser.GameObjects.GameObject[] = [];
    if (
      scene.scene.key === 'MoonflowerGladeScene' &&
      save.world.flags[WILLOW_AFTER_DARK_COMPLETE_FLAG] === true
    ) {
      for (const [index, point] of [
        { x: 825, y: 590 },
        { x: 865, y: 560 },
        { x: 905, y: 585 },
        { x: 945, y: 550 },
        { x: 980, y: 585 },
      ].entries()) {
        objects.push(
          scene.add
            .text(point.x, point.y, index % 2 === 0 ? '✦' : '🌸', {
              color: '#fff3b0',
              fontFamily: 'system-ui, sans-serif',
              fontSize: index % 2 === 0 ? '18px' : '20px',
            })
            .setOrigin(0.5)
            .setAlpha(0.86)
            .setDepth(11),
        );
      }
    }

    if (
      scene.scene.key === 'RainbowMeadowScene' &&
      save.world.flags[NOVA_NO_FINISH_LINE_COMPLETE_FLAG] === true
    ) {
      for (const point of [
        { x: 1770, y: 770 },
        { x: 1990, y: 1580 },
        { x: 1580, y: 565 },
      ]) {
        objects.push(
          scene.add
            .text(point.x, point.y, '🚩', { fontFamily: 'system-ui, sans-serif', fontSize: '17px' })
            .setOrigin(0.5)
            .setAlpha(0.58)
            .setDepth(8),
        );
      }
    }
    if (
      scene.scene.key === 'RainbowMeadowScene' &&
      save.world.flags[MAPLE_PICNIC_SPOT_COMPLETE_FLAG] === true
    ) {
      objects.push(
        scene.add
          .text(2070, 1460, '🧺', { fontFamily: 'system-ui, sans-serif', fontSize: '18px' })
          .setOrigin(0.5)
          .setAlpha(0.64)
          .setDepth(8),
      );
    }

    if (
      scene.scene.key === 'CrystalBrookScene' &&
      save.world.flags[PEBBLE_ODD_STONE_COMPLETE_FLAG] === true
    ) {
      objects.push(
        scene.add
          .text(2855, 1650, '🪨 ✦ 🪨', {
            color: '#d9fbff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
          })
          .setOrigin(0.5)
          .setAlpha(0.7)
          .setDepth(8),
      );
    }

    if (objects.length === 0) {
      return null;
    }
    return scene.add
      .container(0, 0, objects)
      .setName('wp11-existing-valley:persistent-story-state');
  }

  private showFeedback(state: QuestPackSceneState, message: string): void {
    const serial = ((state.feedback.getData('serial') as number | undefined) ?? 0) + 1;
    state.feedback.setData('serial', serial).setText(message).setVisible(true);
    state.scene.time.delayedCall(4000, () => {
      if (state.feedback.active && state.feedback.getData('serial') === serial) {
        state.feedback.setVisible(false);
      }
    });
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    for (const runtime of this.state.interactions) {
      runtime.container.destroy(true);
    }
    this.state.persistent?.destroy(true);
    this.state.feedback.destroy();
    this.state.input.destroy();
    this.state = null;
  }
}

let browserExistingValleyQuestPackWorldManager: ExistingValleyQuestPackWorldManager | null = null;

export function getExistingValleyQuestPackWorldManager(
  game: Phaser.Game,
): ExistingValleyQuestPackWorldManager {
  browserExistingValleyQuestPackWorldManager ??= new ExistingValleyQuestPackWorldManager(game);
  return browserExistingValleyQuestPackWorldManager;
}
