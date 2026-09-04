import Phaser from 'phaser';
import { LIGHT_FOUND_SEA_COMPLETE_FLAG } from '../../content/r65CrossRegionFollowUp';
import { GAME_WIDTH } from '../config/gameConstants';
import {
  WORLD_INTERACTION_PROMPT,
  WorldInteractionInput,
} from '../interaction/WorldInteractionInput';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  CrossRegionFollowUpStoryService,
  type CrossRegionFollowUpResult,
} from '../story/CrossRegionFollowUpStoryService';
import { worldDepthForY } from './WorldDepth';
import { WORLD_PLAYER_NAME } from './WorldTraversalPolishManager';

interface Point {
  x: number;
  y: number;
}

interface FollowUpInteractionDefinition {
  id: string;
  label: string;
  actionLabel: string;
  icon: string;
  position: Point;
  radius: number;
  activate: () => CrossRegionFollowUpResult;
}

interface FollowUpInteractionRuntime {
  definition: FollowUpInteractionDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
}

interface FollowUpSceneState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  interactions: FollowUpInteractionRuntime[];
  feedback: Phaser.GameObjects.Text;
  persistent: Phaser.GameObjects.Container | null;
  signature: string;
}

const TARGET_SCENES = ['StarlightBeachScene', 'WhisperingWoodsScene'] as const;

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

export class CrossRegionFollowUpWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly quests = getBrowserQuestEngine();
  private readonly story = new CrossRegionFollowUpStoryService(this.saveService, this.quests);
  private state: FollowUpSceneState | null = null;

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
    const player = findPlayer(scene);
    if (!state || !player) {
      return;
    }

    let nearest: FollowUpInteractionRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const runtime of state.interactions) {
      const pointDistance = distance(player, runtime.definition.position);
      runtime.prompt.setVisible(pointDistance <= runtime.definition.radius + 88);
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
    const state: FollowUpSceneState = {
      scene,
      input: new WorldInteractionInput(scene),
      interactions: [],
      feedback: scene.add
        .text(GAME_WIDTH / 2, 122, '', {
          color: '#4e5267',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#fff9edf2',
          padding: { x: 18, y: 10 },
          wordWrap: { width: 700 },
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(20_120)
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

  private definitionsForScene(sceneKey: string): FollowUpInteractionDefinition[] {
    if (sceneKey === 'StarlightBeachScene') {
      const definitions: FollowUpInteractionDefinition[] = [];
      if (this.story.canStart() || this.story.isStep(0)) {
        definitions.push({
          id: 'moonlit-shell-glimmer',
          label: 'Unusual green shell-light',
          actionLabel: 'Look closely',
          icon: '🐚',
          position: { x: 2860, y: 1800 },
          radius: 116,
          activate: () => this.story.inspectMoonlitGlimmer(),
        });
      }
      if (this.story.isStep(1)) {
        definitions.push({
          id: 'ask-coral-about-glimmer',
          label: 'Coral and the strange green glimmer',
          actionLabel: 'Ask Coral',
          icon: '💬',
          position: { x: 1110, y: 1050 },
          radius: 118,
          activate: () => this.story.askCoralAboutGlimmer(),
        });
      }
      if (this.story.isStep(4)) {
        definitions.push({
          id: 'return-to-coral-with-starwell-answer',
          label: 'Coral and the Starwell answer',
          actionLabel: 'Tell Coral',
          icon: '🏮',
          position: { x: 1110, y: 1050 },
          radius: 118,
          activate: () => this.story.returnToCoral(),
        });
      }
      return definitions;
    }

    if (sceneKey === 'WhisperingWoodsScene') {
      if (this.story.isStep(2)) {
        return [
          {
            id: 'ask-lumi-about-glimmer',
            label: 'Lumi and Coral’s wandering light',
            actionLabel: 'Ask Lumi',
            icon: '✨',
            position: { x: 2735, y: 1510 },
            radius: 118,
            activate: () => this.story.askLumiAboutGlimmer(),
          },
        ];
      }
      if (this.story.isStep(3)) {
        return [
          {
            id: 'starwell-sea-reflection',
            label: 'Starwell water and the beach glimmer',
            actionLabel: 'Compare',
            icon: '🌌',
            position: { x: 2920, y: 1700 },
            radius: 118,
            activate: () => this.story.inspectStarwellReflection(),
          },
        ];
      }
    }

    return [];
  }

  private createInteraction(
    state: FollowUpSceneState,
    definition: FollowUpInteractionDefinition,
  ): FollowUpInteractionRuntime {
    const plate = state.scene.add.circle(0, 0, 29, 0xdff5bd, 0.18).setStrokeStyle(2, 0xffffff, 0.26);
    const icon = state.scene.add
      .text(0, 0, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
      })
      .setOrigin(0.5);
    const prompt = state.scene.add
      .text(
        0,
        54,
        `${definition.actionLabel}: ${definition.label}  ·  ${WORLD_INTERACTION_PROMPT}`,
        {
          color: '#554c67',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          backgroundColor: '#fff9edef',
          padding: { x: 8, y: 5 },
        },
      )
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 180, 154);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [plate, icon, prompt, zone])
      .setName(`wp13-story:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 18, 0.58));

    state.input.bindPointer(zone, () => {
      const player = findPlayer(state.scene);
      if (player && distance(player, definition.position) <= definition.radius) {
        this.activate(state, definition);
      }
    });

    return { definition, container, prompt };
  }

  private createPersistentState(scene: Phaser.Scene): Phaser.GameObjects.Container | null {
    const complete = this.saveService.load()?.world.flags[LIGHT_FOUND_SEA_COMPLETE_FLAG] === true;
    if (!complete || scene.scene.key !== 'StarlightBeachScene') {
      return null;
    }

    const glow = scene.add.circle(0, -8, 42, 0xcdf2a5, 0.16);
    const shell = scene.add
      .text(-9, 4, '🐚', { fontFamily: 'system-ui, sans-serif', fontSize: '28px' })
      .setOrigin(0.5);
    const light = scene.add.circle(14, -14, 7, 0xeaf89b, 0.92);
    const label = scene.add
      .text(0, 48, 'Shore & Starwell Lantern', {
        color: '#61516a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#fff9eddd',
        padding: { x: 7, y: 4 },
      })
      .setOrigin(0.5);
    return scene.add
      .container(1060, 810, [glow, shell, light, label])
      .setName('wp13-persistent:shore-starwell-lantern')
      .setDepth(worldDepthForY(828, 0.6));
  }

  private activate(state: FollowUpSceneState, definition: FollowUpInteractionDefinition): void {
    const result = definition.activate();
    if (result.changed) {
      state.scene.cameras.main.flash(100, 234, 248, 176, false);
    }
    const nextSignature = this.getSignature(state.scene.scene.key);
    if (nextSignature !== state.signature) {
      const scene = state.scene;
      this.buildState(scene, nextSignature);
      if (this.state?.scene === scene) {
        this.showFeedback(this.state, result.message);
      }
      return;
    }
    this.showFeedback(state, result.message);
  }

  private showFeedback(state: FollowUpSceneState, message: string): void {
    state.feedback.setText(message).setVisible(true);
    state.scene.time.delayedCall(3600, () => {
      if (state.feedback.active) {
        state.feedback.setVisible(false);
      }
    });
  }

  private getSignature(sceneKey: string): string {
    const progress = this.quests.getProgress('quest:lumi-coral-light-found-sea');
    const complete = this.saveService.load()?.world.flags[LIGHT_FOUND_SEA_COMPLETE_FLAG] === true;
    return [
      sceneKey,
      progress.status,
      progress.currentStepId ?? 'none',
      this.story.canStart() ? 'ready' : 'not-ready',
      complete ? 'complete' : 'incomplete',
    ].join('|');
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    this.state.input.destroy();
    for (const runtime of this.state.interactions) {
      runtime.container.destroy(true);
    }
    this.state.feedback.destroy();
    this.state.persistent?.destroy(true);
    this.state = null;
  }
}

let manager: CrossRegionFollowUpWorldManager | null = null;

export function getCrossRegionFollowUpWorldManager(game: Phaser.Game): CrossRegionFollowUpWorldManager {
  manager ??= new CrossRegionFollowUpWorldManager(game);
  return manager;
}
