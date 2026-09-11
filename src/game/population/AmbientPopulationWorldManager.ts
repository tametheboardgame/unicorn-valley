import Phaser from 'phaser';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { setInteractionModalActive } from '../interaction/InteractionModalState';
import type { InteractionActionKind, InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
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
const ROUTE_TIMEOUT_GRACE_MS = 1400;
const REGISTRY_OWNER = 'ambient-population';

interface PositionedObject {
  x: number;
  y: number;
}

interface ResidentRuntime {
  resident: SupportingResidentDefinition;
  location: ResolvedResidentLocation;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  cursor: ResidentRouteCursor;
  tween: Phaser.Tweens.Tween | null;
  movementTargetIndex: number | null;
  movementDeadlineMs: number;
  pauseUntilMs: number;
  engaged: boolean;
  interactionCount: number;
}

interface SmallInteractionRuntime {
  definition: SmallWorldInteractionDefinition;
  container: Phaser.GameObjects.Container;
}

interface ScenePopulationRuntime {
  scene: Phaser.Scene;
  residents: Map<SupportingResidentId, ResidentRuntime>;
  interactions: Map<string, SmallInteractionRuntime>;
  activeResidentId: SupportingResidentId | null;
  conversationObjects: Phaser.GameObjects.GameObject[];
  conversationKeyHandler: ((event: KeyboardEvent) => void) | null;
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

function smallActionKind(kind: SmallWorldInteractionDefinition['kind']): InteractionActionKind {
  if (kind === 'inspect' || kind === 'listen' || kind === 'reveal') {
    return 'inspect';
  }
  if (kind === 'play') {
    return 'start';
  }
  return 'interact';
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
      residents: new Map(),
      interactions: new Map(),
      activeResidentId: null,
      conversationObjects: [],
      conversationKeyHandler: null,
    };
    this.states.set(scene.scene.key, state);
    return state;
  }

  private refreshScene(state: ScenePopulationRuntime, context: AmbientPopulationContext): void {
    this.syncResidents(state, context);
    this.syncSmallInteractions(state, context);

    const player = findPlayer(state.scene);
    if (player) {
      const now = this.game.loop.time;
      for (const runtime of state.residents.values()) {
        this.updateResident(runtime, player, now);
      }
    }

    this.publishTargets(state);
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
        if (state.activeResidentId === residentId) {
          this.closeResidentConversation(state);
        }
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
    const container = state.scene.add
      .container(start.x, start.y, [sprite])
      .setName(`supporting-resident:${resident.id}`)
      .setDepth(worldDepthForY(start.y + 52, 0.36));

    const firstPause = location.placement?.waypoints[0]?.pauseMs ?? 1200;
    return {
      resident,
      location,
      container,
      sprite,
      cursor: { index: 0, direction: 1 },
      tween: null,
      movementTargetIndex: null,
      movementDeadlineMs: 0,
      pauseUntilMs: this.game.loop.time + firstPause,
      engaged: false,
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

    if (runtime.engaged) {
      runtime.sprite.setTexture(
        ensureSupportingResidentTexture(runtime.container.scene, runtime.resident, 'idle'),
      );
      runtime.sprite.setFlipX(player.x < runtime.container.x);
      return;
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

  private activateResident(state: ScenePopulationRuntime, runtime: ResidentRuntime): void {
    if (runtime.engaged || state.activeResidentId !== null) {
      return;
    }
    const player = findPlayer(state.scene);
    if (!player) {
      return;
    }

    runtime.tween?.pause();
    runtime.engaged = true;
    runtime.sprite.setFlipX(player.x < runtime.container.x);
    runtime.sprite.setTexture(
      ensureSupportingResidentTexture(runtime.container.scene, runtime.resident, 'idle'),
    );

    const configuredVariants = R6_SUPPORTING_RESIDENT_TALK_VARIANTS[runtime.resident.id];
    const talk: ResidentTalkDefinition = {
      ...runtime.resident.talk,
      variants: configuredVariants ?? runtime.resident.talk.variants,
    };
    const lines = resolveResidentTalkLines(talk, this.getContext());
    const line = chooseTalkLine(lines, runtime.interactionCount);
    runtime.interactionCount += 1;
    state.activeResidentId = runtime.resident.id;
    this.showResidentConversation(state, runtime, line);
    this.publishTargets(state);
  }

  private showResidentConversation(
    state: ScenePopulationRuntime,
    runtime: ResidentRuntime,
    message: string,
  ): void {
    this.destroyConversationObjects(state);
    setInteractionModalActive(state.scene, true);

    const blocker = state.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001)
      .setName('wp19d-resident-conversation-blocker')
      .setScrollFactor(0)
      .setDepth(20_000)
      .setInteractive();
    const panel = state.scene.add
      .rectangle(GAME_WIDTH / 2, 114, 690, 154, 0xfff9ed, 0.98)
      .setStrokeStyle(4, 0x9b72b5, 0.9)
      .setScrollFactor(0)
      .setDepth(20_010);
    const title = state.scene.add
      .text(GAME_WIDTH / 2, 72, runtime.resident.name, {
        color: '#5b3f69',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20_011);
    const body = state.scene.add
      .text(GAME_WIDTH / 2, 112, message, {
        color: '#574663',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        align: 'center',
        wordWrap: { width: 570 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20_011);
    const done = state.scene.add
      .rectangle(GAME_WIDTH / 2 + 278, 158, 88, 42, 0x7d55a1, 1)
      .setStrokeStyle(3, 0xffefaf, 0.95)
      .setScrollFactor(0)
      .setDepth(20_012)
      .setInteractive({ useHandCursor: true });
    const doneLabel = state.scene.add
      .text(GAME_WIDTH / 2 + 278, 158, 'Done', {
        color: '#fffaf1',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20_013);

    const close = () => this.closeResidentConversation(state);
    done.on('pointerdown', close);
    const keyHandler = (event: KeyboardEvent): void => {
      if (event.repeat || !['Escape', 'Enter', 'KeyE'].includes(event.code)) {
        return;
      }
      event.preventDefault();
      close();
    };
    globalThis.addEventListener?.('keydown', keyHandler);
    state.conversationKeyHandler = keyHandler;
    state.conversationObjects = [blocker, panel, title, body, done, doneLabel];
  }

  private closeResidentConversation(state: ScenePopulationRuntime): void {
    const residentId = state.activeResidentId;
    const runtime = residentId ? state.residents.get(residentId) : null;
    this.destroyConversationObjects(state);
    state.activeResidentId = null;
    setInteractionModalActive(state.scene, false);

    if (runtime) {
      runtime.engaged = false;
      runtime.pauseUntilMs = this.game.loop.time + 700;
      runtime.tween?.resume();
    }
    this.publishTargets(state);
  }

  private destroyConversationObjects(state: ScenePopulationRuntime): void {
    if (state.conversationKeyHandler) {
      globalThis.removeEventListener?.('keydown', state.conversationKeyHandler);
      state.conversationKeyHandler = null;
    }
    for (const object of state.conversationObjects) {
      object.destroy();
    }
    state.conversationObjects = [];
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
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, icon])
      .setName(`small-world-interaction:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 12, 0.22));

    state.scene.tweens.add({
      targets: [glow, icon],
      alpha: { from: 0.45, to: 0.9 },
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    return { definition, container };
  }

  private publishTargets(state: ScenePopulationRuntime): void {
    const targets: InteractionTarget[] = [];

    for (const runtime of state.residents.values()) {
      targets.push({
        id: `interaction:resident:${runtime.resident.id}`,
        label: runtime.resident.name,
        actionLabel: 'Talk',
        actionKind: 'talk',
        position: () => ({ x: runtime.container.x, y: runtime.container.y }),
        interactionRadius: this.residentInteractionRadius(runtime),
        priority: 30,
        visible: () => runtime.container.active,
        enabled: () => !runtime.engaged && state.activeResidentId === null,
        result: {
          type: 'callback',
          activate: () => this.activateResident(state, runtime),
        },
      });
    }

    for (const runtime of state.interactions.values()) {
      targets.push({
        id: `interaction:ambient:${runtime.definition.id}`,
        label: runtime.definition.label,
        actionLabel: runtime.definition.actionLabel,
        actionKind: smallActionKind(runtime.definition.kind),
        position: runtime.definition.position,
        interactionRadius: runtime.definition.interactionRadius,
        priority: 10,
        visible: () => runtime.container.active,
        enabled: () => state.activeResidentId === null,
        result: {
          type: 'callback',
          activate: () => this.activateSmallInteraction(state.scene, runtime.definition),
        },
      });
    }

    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
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
    if (state.activeResidentId !== null) {
      setInteractionModalActive(state.scene, false);
      state.activeResidentId = null;
    }
    this.destroyConversationObjects(state);
    getSceneInteractionRegistry(state.scene).clearOwner(REGISTRY_OWNER);
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
