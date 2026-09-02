import Phaser from 'phaser';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { GAME_WIDTH } from '../config/gameConstants';
import { WorldInteractionInput } from '../interaction/WorldInteractionInput';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { getBrowserSaveService } from '../save/browserSaveService';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import { worldDepthForY } from '../world/WorldDepth';
import {
  chooseTalkLine,
  conditionMatches,
  movementDurationMs,
  nextRouteCursor,
  resolveResidentLocation,
  resolveResidentTalkLines,
  type ResidentRouteCursor,
  type ResolvedResidentLocation,
} from './AmbientResidentRoutine';
import type {
  AmbientPopulationContext,
  ResidentTalkDefinition,
  SmallWorldInteractionDefinition,
  SupportingResidentDefinition,
  SupportingResidentId,
} from './AmbientPopulationTypes';
import {
  R6_AMBIENT_RESIDENT_PLACEMENTS,
  R6_SMALL_WORLD_INTERACTIONS,
  R6_SUPPORTING_RESIDENTS,
} from './R6SupportingResidentContent';
import {
  R6_AMBIENT_RESIDENT_STORY_ANCHORS,
  R6_SUPPORTING_RESIDENT_TALK_VARIANTS,
} from './R6SupportingResidentStateContent';
import {
  createSupportingResidentSprite,
  ensureSupportingResidentTexture,
} from './SupportingResidentArt';

const UPDATE_INTERVAL_MS = 90;
const RESIDENT_INTERACTION_HOLD_MS = 2300;
const ROUTE_TIMEOUT_GRACE_MS = 1400;
const PROMPT_EXTRA_RANGE = 96;

interface PositionedObject {
  x: number;
  y: number;
}

interface ResidentRuntime {
  resident: SupportingResidentDefinition;
  location: ResolvedResidentLocation;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  prompt: Phaser.GameObjects.Text;
  cursor: ResidentRouteCursor;
  tween: Phaser.Tweens.Tween | null;
  movementTargetIndex: number | null;
  movementDeadlineMs: number;
  pauseUntilMs: number;
  interactionUntilMs: number;
  interactionCount: number;
}

interface SmallInteractionRuntime {
  definition: SmallWorldInteractionDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
}

interface ScenePopulationRuntime {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  residents: Map<SupportingResidentId, ResidentRuntime>;
  interactions: Map<string, SmallInteractionRuntime>;
}

interface NearbyTarget {
  distance: number;
  radius: number;
  activate: () => void;
}

function findPlayer(scene: Phaser.Scene): PositionedObject | null {
  const named = scene.children.getByName(WORLD_PLAYER_NAME) as
    | (Phaser.GameObjects.GameObject & Partial<PositionedObject>)
    | null;
  if (named && typeof named.x === 'number' && typeof named.y === 'number') {
    return named as Phaser.GameObjects.GameObject & PositionedObject;
  }

  const fallback = scene.children.list.find((object) => {
    const candidate = object as Phaser.GameObjects.GameObject &
      Partial<PositionedObject> & {
        texture?: { key?: string };
      };
    return (
      typeof candidate.x === 'number' &&
      typeof candidate.y === 'number' &&
      candidate.texture?.key?.startsWith('player-unicorn')
    );
  }) as (Phaser.GameObjects.GameObject & PositionedObject) | undefined;

  return fallback ?? null;
}

function distanceBetween(left: PositionedObject, right: PositionedObject): number {
  return Phaser.Math.Distance.Between(left.x, left.y, right.x, right.y);
}

function feedbackIcon(kind: SmallWorldInteractionDefinition['kind']): string {
  const icons: Record<SmallWorldInteractionDefinition['kind'], string> = {
    inspect: '✦',
    play: '☆',
    sit: '⌒',
    ring: '♪',
    splash: '≈',
    listen: '♫',
    reveal: '✧',
  };
  return icons[kind];
}

export class AmbientPopulationWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly timeService = getBrowserAtmosphericTimeService(this.saveService);
  private readonly throttle = new RefreshThrottle(UPDATE_INTERVAL_MS);
  private readonly states = new Map<string, ScenePopulationRuntime>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      for (const state of this.states.values()) {
        this.destroySceneState(state);
      }
      this.states.clear();
    });
  }

  private update(): void {
    if (!this.throttle.shouldRun(this.game.loop.time)) {
      return;
    }

    const context = this.getContext();
    const activeSceneKeys = new Set<string>();
    for (const scene of this.game.scene.getScenes(true)) {
      if (!this.sceneHasAmbientContent(scene.scene.key)) {
        continue;
      }
      activeSceneKeys.add(scene.scene.key);
      const state = this.ensureSceneState(scene);
      this.refreshScene(state, context);
    }

    for (const [sceneKey, state] of this.states) {
      if (!activeSceneKeys.has(sceneKey) || !state.scene.scene.isActive()) {
        this.destroySceneState(state);
        this.states.delete(sceneKey);
      }
    }
  }

  private getContext(): AmbientPopulationContext {
    return {
      timeState: this.timeService.getState(),
      worldFlags: this.saveService.load()?.world.flags ?? {},
    };
  }

  private sceneHasAmbientContent(sceneKey: string): boolean {
    return (
      R6_AMBIENT_RESIDENT_PLACEMENTS.some((placement) => placement.sceneKey === sceneKey) ||
      R6_AMBIENT_RESIDENT_STORY_ANCHORS.some((anchor) => anchor.sceneKey === sceneKey) ||
      R6_SMALL_WORLD_INTERACTIONS.some((interaction) => interaction.sceneKey === sceneKey)
    );
  }

  private ensureSceneState(scene: Phaser.Scene): ScenePopulationRuntime {
    const existing = this.states.get(scene.scene.key);
    if (existing?.scene === scene) {
      return existing;
    }
    if (existing) {
      this.destroySceneState(existing);
    }
    const state: ScenePopulationRuntime = {
      scene,
      input: new WorldInteractionInput(scene),
      residents: new Map(),
      interactions: new Map(),
    };
    this.states.set(scene.scene.key, state);
    return state;
  }

  private refreshScene(state: ScenePopulationRuntime, context: AmbientPopulationContext): void {
    this.syncResidents(state, context);
    this.syncSmallInteractions(state, context);

    const player = findPlayer(state.scene);
    if (!player) {
      return;
    }

    const now = this.game.loop.time;
    const nearby: NearbyTarget[] = [];

    for (const runtime of state.residents.values()) {
      this.updateResident(runtime, player, now);
      const distance = distanceBetween(player, runtime.container);
      const radius = this.residentInteractionRadius(runtime);
      runtime.prompt.setVisible(distance <= radius + PROMPT_EXTRA_RANGE);
      if (distance <= radius) {
        nearby.push({
          distance,
          radius,
          activate: () => this.activateResident(runtime, player, now),
        });
      }
    }

    for (const runtime of state.interactions.values()) {
      const distance = distanceBetween(player, runtime.container);
      runtime.prompt.setVisible(
        distance <= runtime.definition.interactionRadius + PROMPT_EXTRA_RANGE,
      );
      if (distance <= runtime.definition.interactionRadius) {
        nearby.push({
          distance,
          radius: runtime.definition.interactionRadius,
          activate: () => this.activateSmallInteraction(state.scene, runtime.definition),
        });
      }
    }

    if (state.input.justPressed()) {
      nearby.sort((left, right) => left.distance - right.distance)[0]?.activate();
    }
  }

  private syncResidents(state: ScenePopulationRuntime, context: AmbientPopulationContext): void {
    const wanted = new Map<SupportingResidentId, ResolvedResidentLocation>();
    for (const resident of R6_SUPPORTING_RESIDENTS) {
      const location = resolveResidentLocation(
        resident.id,
        state.scene.scene.key,
        R6_AMBIENT_RESIDENT_PLACEMENTS,
        R6_AMBIENT_RESIDENT_STORY_ANCHORS,
        context,
      );
      if (location) {
        wanted.set(resident.id, location);
      }
    }

    for (const [residentId, runtime] of state.residents) {
      const location = wanted.get(residentId);
      if (!location || location.id !== runtime.location.id) {
        this.destroyResident(runtime);
        state.residents.delete(residentId);
      }
    }

    for (const [residentId, location] of wanted) {
      if (state.residents.has(residentId)) {
        continue;
      }
      const resident = R6_SUPPORTING_RESIDENTS.find((candidate) => candidate.id === residentId);
      if (!resident) {
        continue;
      }
      state.residents.set(residentId, this.createResident(state, resident, location));
    }
  }

  private createResident(
    state: ScenePopulationRuntime,
    resident: SupportingResidentDefinition,
    location: ResolvedResidentLocation,
  ): ResidentRuntime {
    const start =
      location.kind === 'story-anchor'
        ? location.storyAnchor?.position
        : location.placement?.waypoints[0];
    if (!start) {
      throw new Error(`${location.id} has no resident start point`);
    }

    const sprite = createSupportingResidentSprite(state.scene, resident);
    const prompt = state.scene.add
      .text(0, 74, `Talk to ${resident.name}  ·  E / Enter / tap`, {
        color: '#56455f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#fff9edee',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, -14, 190, 160);
    const container = state.scene.add
      .container(start.x, start.y, [sprite, prompt, zone])
      .setName(`supporting-resident:${resident.id}`)
      .setDepth(worldDepthForY(start.y + 52, 0.36));

    state.input.bindPointer(zone, () => {
      const player = findPlayer(state.scene);
      const runtime = state.residents.get(resident.id);
      if (!player || !runtime) {
        return;
      }
      const distance = distanceBetween(player, runtime.container);
      if (distance <= this.residentInteractionRadius(runtime)) {
        this.activateResident(runtime, player, this.game.loop.time);
      }
    });

    const firstPause = location.placement?.waypoints[0]?.pauseMs ?? 1200;
    return {
      resident,
      location,
      container,
      sprite,
      prompt,
      cursor: { index: 0, direction: 1 },
      tween: null,
      movementTargetIndex: null,
      movementDeadlineMs: 0,
      pauseUntilMs: this.game.loop.time + firstPause,
      interactionUntilMs: 0,
      interactionCount: 0,
    };
  }

  private residentInteractionRadius(runtime: ResidentRuntime): number {
    return (
      runtime.location.storyAnchor?.interactionRadius ??
      runtime.location.placement?.interactionRadius ??
      120
    );
  }

  private updateResident(runtime: ResidentRuntime, player: PositionedObject, now: number): void {
    runtime.container.setDepth(worldDepthForY(runtime.container.y + 52, 0.36));

    if (runtime.interactionUntilMs > 0) {
      if (now < runtime.interactionUntilMs) {
        runtime.sprite.setTexture(
          ensureSupportingResidentTexture(runtime.container.scene, runtime.resident, 'idle'),
        );
        return;
      }
      runtime.interactionUntilMs = 0;
      runtime.tween?.resume();
    }

    if (runtime.location.kind === 'story-anchor') {
      return;
    }

    if (runtime.tween?.isPlaying()) {
      if (runtime.movementDeadlineMs > 0 && now > runtime.movementDeadlineMs) {
        this.recoverTimedOutResident(runtime, now);
        return;
      }
      const pose = Math.floor(now / 180) % 2 === 0 ? 'walk-a' : 'walk-b';
      runtime.sprite.setTexture(
        ensureSupportingResidentTexture(runtime.container.scene, runtime.resident, pose),
      );
      return;
    }

    runtime.sprite.setTexture(
      ensureSupportingResidentTexture(runtime.container.scene, runtime.resident, 'idle'),
    );
    if (now < runtime.pauseUntilMs) {
      return;
    }
    this.beginNextMovement(runtime, player, now);
  }

  private beginNextMovement(runtime: ResidentRuntime, player: PositionedObject, now: number): void {
    const placement = runtime.location.placement;
    if (!placement || placement.waypoints.length <= 1) {
      runtime.pauseUntilMs = now + 1800;
      return;
    }

    const next = nextRouteCursor(runtime.cursor, placement.waypoints.length, placement.routeMode);
    const target = placement.waypoints[next.index];
    if (!target) {
      runtime.pauseUntilMs = now + 1800;
      return;
    }

    runtime.cursor = next;
    runtime.movementTargetIndex = next.index;
    const duration = movementDurationMs(runtime.container, target, placement.speedPxPerSecond);
    runtime.movementDeadlineMs = now + duration + ROUTE_TIMEOUT_GRACE_MS;
    runtime.sprite.setFlipX(target.x < runtime.container.x);

    runtime.tween = runtime.container.scene.tweens.add({
      targets: runtime.container,
      x: target.x,
      y: target.y,
      duration,
      ease: 'Linear',
      onComplete: () => {
        runtime.tween = null;
        runtime.movementTargetIndex = null;
        runtime.movementDeadlineMs = 0;
        runtime.pauseUntilMs =
          this.game.loop.time + (target.pauseMs ?? this.defaultPauseMs(placement.behaviour));
        const playerDx = player.x - runtime.container.x;
        if (Math.abs(playerDx) < 210) {
          runtime.sprite.setFlipX(playerDx < 0);
        }
      },
    });
  }

  private defaultPauseMs(
    behaviour: NonNullable<ResidentRuntime['location']['placement']>['behaviour'],
  ): number {
    if (behaviour === 'activity-loop') {
      return 2800;
    }
    if (behaviour === 'local-wander') {
      return 1800;
    }
    return 700;
  }

  private recoverTimedOutResident(runtime: ResidentRuntime, now: number): void {
    runtime.tween?.stop();
    runtime.tween = null;
    const placement = runtime.location.placement;
    const safeTarget =
      placement?.waypoints[runtime.movementTargetIndex ?? runtime.cursor.index] ??
      placement?.waypoints[runtime.cursor.index];
    if (safeTarget) {
      runtime.container.setPosition(safeTarget.x, safeTarget.y);
    }
    runtime.movementTargetIndex = null;
    runtime.movementDeadlineMs = 0;
    runtime.pauseUntilMs = now + 1400;
  }

  private activateResident(runtime: ResidentRuntime, player: PositionedObject, now: number): void {
    if (runtime.interactionUntilMs > now) {
      return;
    }
    runtime.tween?.pause();
    runtime.interactionUntilMs = now + RESIDENT_INTERACTION_HOLD_MS;
    runtime.sprite.setFlipX(player.x < runtime.container.x);
    runtime.sprite.setTexture(
      ensureSupportingResidentTexture(runtime.container.scene, runtime.resident, 'idle'),
    );
    const talk: ResidentTalkDefinition = {
      ...runtime.resident.talk,
      variants: R6_SUPPORTING_RESIDENT_TALK_VARIANTS[runtime.resident.id] ?? runtime.resident.talk.variants,
    };
    const lines = resolveResidentTalkLines(talk, this.getContext());
    const line = chooseTalkLine(lines, runtime.interactionCount);
    runtime.interactionCount += 1;
    this.showFeedback(runtime.container.scene, runtime.resident.name, line, '💬');
  }

  private syncSmallInteractions(
    state: ScenePopulationRuntime,
    context: AmbientPopulationContext,
  ): void {
    const definitions: readonly SmallWorldInteractionDefinition[] = R6_SMALL_WORLD_INTERACTIONS;
    const available = definitions.filter(
      (definition) =>
        definition.sceneKey === state.scene.scene.key &&
        conditionMatches(definition.activeWhen, context),
    );
    const wantedIds = new Set<string>(available.map(({ id }) => id));

    for (const [id, runtime] of state.interactions) {
      if (!wantedIds.has(id)) {
        runtime.container.destroy(true);
        state.interactions.delete(id);
      }
    }

    for (const definition of available) {
      if (state.interactions.has(definition.id)) {
        continue;
      }
      state.interactions.set(definition.id, this.createSmallInteraction(state, definition));
    }
  }

  private createSmallInteraction(
    state: ScenePopulationRuntime,
    definition: SmallWorldInteractionDefinition,
  ): SmallInteractionRuntime {
    const glow = state.scene.add.circle(0, 0, 24, 0xfff0a5, 0.08).setStrokeStyle(2, 0xffffff, 0.16);
    const icon = state.scene.add
      .text(0, 0, feedbackIcon(definition.kind), {
        color: '#fff1a8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.72);
    const prompt = state.scene.add
      .text(0, 50, `${definition.actionLabel}: ${definition.label}  ·  E / Enter / tap`, {
        color: '#5d496c',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: '#fff9edea',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 178, 154);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, icon, prompt, zone])
      .setName(`small-world-interaction:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 12, 0.22));

    state.input.bindPointer(zone, () => {
      const player = findPlayer(state.scene);
      if (player && distanceBetween(player, container) <= definition.interactionRadius) {
        this.activateSmallInteraction(state.scene, definition);
      }
    });

    state.scene.tweens.add({
      targets: [glow, icon],
      alpha: { from: 0.45, to: 0.9 },
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    return { definition, container, prompt };
  }

  private activateSmallInteraction(
    scene: Phaser.Scene,
    definition: SmallWorldInteractionDefinition,
  ): void {
    this.playInteractionBurst(scene, definition);
    this.showFeedback(scene, definition.label, definition.feedback, feedbackIcon(definition.kind));
  }

  private playInteractionBurst(
    scene: Phaser.Scene,
    definition: SmallWorldInteractionDefinition,
  ): void {
    const objects: Phaser.GameObjects.GameObject[] = [];
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4;
      const object =
        definition.kind === 'splash'
          ? scene.add.circle(definition.position.x, definition.position.y, 8, 0x9ee5f4, 0.65)
          : scene.add
              .text(definition.position.x, definition.position.y, feedbackIcon(definition.kind), {
                color: '#fff0a5',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '22px',
                fontStyle: 'bold',
              })
              .setOrigin(0.5);
      object.setDepth(worldDepthForY(definition.position.y + 30, 0.8));
      objects.push(object);
      scene.tweens.add({
        targets: object,
        x: definition.position.x + Math.cos(angle) * 64,
        y: definition.position.y + Math.sin(angle) * 42 - 20,
        alpha: 0,
        scale: 1.45,
        duration: 520,
        ease: 'Quad.Out',
        onComplete: () => object.destroy(),
      });
    }
  }

  private showFeedback(scene: Phaser.Scene, title: string, message: string, icon: string): void {
    scene.children.getByName('r6-5-ambient-feedback')?.destroy();
    const panel = scene.add
      .text(GAME_WIDTH / 2, 126, `${icon}  ${title}\n${message}`, {
        color: '#574663',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff9edf2',
        padding: { x: 18, y: 11 },
        wordWrap: { width: 600 },
      })
      .setName('r6-5-ambient-feedback')
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20_000);
    scene.time.delayedCall(2600, () => panel.destroy());
  }

  private destroyResident(runtime: ResidentRuntime): void {
    runtime.tween?.stop();
    runtime.container.destroy(true);
  }

  private destroySceneState(state: ScenePopulationRuntime): void {
    state.input.destroy();
    for (const runtime of state.residents.values()) {
      this.destroyResident(runtime);
    }
    for (const runtime of state.interactions.values()) {
      runtime.container.destroy(true);
    }
    state.residents.clear();
    state.interactions.clear();
  }
}

let browserAmbientPopulationWorldManager: AmbientPopulationWorldManager | null = null;

export function getAmbientPopulationWorldManager(game: Phaser.Game): AmbientPopulationWorldManager {
  browserAmbientPopulationWorldManager ??= new AmbientPopulationWorldManager(game);
  return browserAmbientPopulationWorldManager;
}
