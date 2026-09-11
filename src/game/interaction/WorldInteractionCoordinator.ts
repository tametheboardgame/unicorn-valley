import Phaser from 'phaser';
import { InputController } from '../input/InputController';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import {
  isInteractionActivationSuppressed,
  isInteractionModalActive,
} from './InteractionModalState';
import type { InteractionTarget } from './InteractionTarget';
import {
  getInteractionTargetPosition,
  isInteractionTargetEligible,
  selectInteractionTarget,
} from './InteractionTargeting';
import { getSceneInteractionRegistry } from './SceneInteractionRegistry';

interface Point {
  x: number;
  y: number;
}

interface SceneCoordinatorState {
  scene: Phaser.Scene;
  pointer: PointerTouchInputAdapter;
  input: InputController;
  prompt: InteractionPrompt;
  retainedTargetId: string | null;
  preferredTargetId: string | null;
  directZones: Map<string, Phaser.GameObjects.Zone>;
  wasDialogueBlocking: boolean;
}

function findPlayer(scene: Phaser.Scene): Point | null {
  const named = scene.children.getByName(WORLD_PLAYER_NAME) as
    | (Phaser.GameObjects.GameObject & Partial<Point>)
    | null;
  if (named && typeof named.x === 'number' && typeof named.y === 'number') {
    return { x: named.x, y: named.y };
  }

  const fallback = scene.children.list.find((object) => {
    const candidate = object as Phaser.GameObjects.GameObject &
      Partial<Point> & { texture?: { key?: string } };
    return (
      typeof candidate.x === 'number' &&
      typeof candidate.y === 'number' &&
      candidate.texture?.key?.startsWith('player-unicorn')
    );
  }) as (Phaser.GameObjects.GameObject & Point) | undefined;

  return fallback ? { x: fallback.x, y: fallback.y } : null;
}

function isDialogueBlocking(scene: Phaser.Scene): boolean {
  if (isInteractionModalActive(scene)) {
    return true;
  }
  const panel = scene.children.getByName('dialogue-production-panel');
  return panel instanceof Phaser.GameObjects.Rectangle && panel.visible;
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  const element = target as {
    tagName?: string;
    isContentEditable?: boolean;
  } | null;
  const tagName = element?.tagName?.toUpperCase();
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    element?.isContentEditable === true
  );
}

function isWorldInteractionKey(event: KeyboardEvent): boolean {
  return (
    event.code === 'KeyE' ||
    event.key === 'e' ||
    event.key === 'E' ||
    event.key === 'Enter' ||
    event.code === 'Space' ||
    event.key === ' '
  );
}

export class WorldInteractionCoordinator {
  private readonly states = new Map<string, SceneCoordinatorState>();
  private pendingKeyboardInteraction = false;

  public constructor(private readonly game: Phaser.Game) {
    globalThis.addEventListener?.('keydown', this.onKeyDown);
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.repeat ||
      isEditableKeyboardTarget(event.target) ||
      !isWorldInteractionKey(event)
    ) {
      return;
    }

    // The coordinator owns the explicit world-action edge. Core exploration scenes still
    // have keyboard adapters for movement/back/menu actions, and Phaser.JustDown is
    // consumptive across adapters. Capturing the action here prevents those legacy scene
    // adapters from stealing E/Enter/Space before the shared POST_STEP route can see it.
    this.pendingKeyboardInteraction = true;
  };

  private readonly destroy = (): void => {
    globalThis.removeEventListener?.('keydown', this.onKeyDown);
    this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    for (const state of this.states.values()) {
      this.destroyState(state);
    }
    this.states.clear();
    this.pendingKeyboardInteraction = false;
  };

  private update(): void {
    const activeKeys = new Set<string>();
    let keyboardInteractionAvailable = this.pendingKeyboardInteraction;
    // Keyboard interaction is an edge, never a queued future action. If no eligible target
    // exists this frame it is discarded rather than firing later when the player walks near one.
    this.pendingKeyboardInteraction = false;

    for (const scene of this.game.scene.getScenes(true)) {
      const targets = getSceneInteractionRegistry(scene).getTargets();
      if (targets.length === 0) {
        continue;
      }

      activeKeys.add(scene.scene.key);
      const state = this.ensureState(scene);
      const consumedKeyboardInteraction = this.refreshState(
        state,
        targets,
        keyboardInteractionAvailable,
      );
      if (consumedKeyboardInteraction) {
        keyboardInteractionAvailable = false;
      }
    }

    for (const [sceneKey, state] of this.states) {
      if (!activeKeys.has(sceneKey) || !state.scene.scene.isActive()) {
        this.destroyState(state);
        this.states.delete(sceneKey);
      }
    }
  }

  private ensureState(scene: Phaser.Scene): SceneCoordinatorState {
    const existing = this.states.get(scene.scene.key);
    if (existing?.scene === scene) {
      return existing;
    }
    if (existing) {
      this.destroyState(existing);
    }

    const pointer = new PointerTouchInputAdapter();
    const state: SceneCoordinatorState = {
      scene,
      pointer,
      input: new InputController([pointer]),
      prompt: null as unknown as InteractionPrompt,
      retainedTargetId: null,
      preferredTargetId: null,
      directZones: new Map(),
      wasDialogueBlocking: false,
    };
    state.prompt = new InteractionPrompt(scene, pointer, (targetId) => {
      state.preferredTargetId = targetId;
    });
    this.states.set(scene.scene.key, state);
    return state;
  }

  private refreshState(
    state: SceneCoordinatorState,
    targets: readonly InteractionTarget[],
    keyboardInteractionRequested: boolean,
  ): boolean {
    state.input.update();
    const player = findPlayer(state.scene);
    const dialogueBlocking = isDialogueBlocking(state.scene);
    if (!player || dialogueBlocking) {
      state.wasDialogueBlocking = dialogueBlocking;
      state.prompt.setTarget(null);
      state.retainedTargetId = null;
      state.preferredTargetId = null;
      state.pointer.setButton('INTERACT', false);
      this.syncDirectZones(state, targets, null);
      return keyboardInteractionRequested;
    }

    const suppressActivationAfterDialogue = state.wasDialogueBlocking;
    state.wasDialogueBlocking = false;

    const selected = selectInteractionTarget(player, targets, {
      preferredTargetId: state.preferredTargetId,
      retainedTargetId: state.retainedTargetId,
      retentionMargin: 18,
    });
    state.preferredTargetId = null;
    state.retainedTargetId = selected?.id ?? null;
    state.prompt.setTarget(selected);
    this.syncDirectZones(state, targets, player);

    if (suppressActivationAfterDialogue || isInteractionActivationSuppressed()) {
      state.pointer.setButton('INTERACT', false);
      return keyboardInteractionRequested;
    }

    const pointerInteractionRequested = state.input.justPressed('INTERACT');
    if (!selected || (!pointerInteractionRequested && !keyboardInteractionRequested)) {
      return false;
    }

    const registryTargets = getSceneInteractionRegistry(state.scene).getTargets();
    const revalidated = selectInteractionTarget(player, registryTargets, {
      preferredTargetId: selected.id,
      retainedTargetId: selected.id,
      retentionMargin: 0,
    });
    if (!revalidated || revalidated.id !== selected.id) {
      state.retainedTargetId = null;
      state.prompt.setTarget(null);
      return keyboardInteractionRequested;
    }

    this.activate(state.scene, revalidated);
    return keyboardInteractionRequested;
  }

  private syncDirectZones(
    state: SceneCoordinatorState,
    targets: readonly InteractionTarget[],
    player: Point | null,
  ): void {
    const wanted = new Set<string>();
    for (const target of targets) {
      if (!player || !isInteractionTargetEligible(player, target)) {
        continue;
      }
      wanted.add(target.id);
      const position = getInteractionTargetPosition(target);
      const area = target.directArea;
      const zoneX = position.x + (area?.offsetX ?? 0);
      const zoneY = position.y + (area?.offsetY ?? 0);
      let zone = state.directZones.get(target.id);
      if (!zone) {
        zone = state.scene.add
          .zone(zoneX, zoneY, area?.width ?? 126, area?.height ?? 126)
          .setName(area?.name ?? `interaction-direct-zone:${target.id}`)
          .setDepth(117)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          state.preferredTargetId = target.id;
          state.pointer.setButton('INTERACT', true);
        });
        const release = () => state.pointer.setButton('INTERACT', false);
        zone.on('pointerup', release);
        zone.on('pointerout', release);
        zone.on('pointerupoutside', release);
        state.directZones.set(target.id, zone);
      }
      zone.setPosition(zoneX, zoneY).setVisible(true);
    }

    for (const [targetId, zone] of state.directZones) {
      if (!wanted.has(targetId)) {
        zone.destroy();
        state.directZones.delete(targetId);
      }
    }
  }

  private activate(scene: Phaser.Scene, target: InteractionTarget): void {
    switch (target.result.type) {
      case 'callback':
        target.result.activate();
        return;
      case 'scene-transition':
        scene.scene.start(target.result.sceneKey, target.result.payload);
        return;
      case 'message': {
        scene.children.getByName('wp19d-interaction-feedback')?.destroy();
        const message = scene.add
          .text(640, 112, `${target.result.title}\n${target.result.message}`, {
            color: '#594c68',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            align: 'center',
            backgroundColor: '#fff8ecf2',
            padding: { x: 18, y: 10 },
            wordWrap: { width: 760 },
          })
          .setName('wp19d-interaction-feedback')
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(20_150);
        scene.time.delayedCall(3500, () => message.destroy());
        return;
      }
      case 'dialogue':
        throw new Error(
          `Dialogue target ${target.id} must provide a callback until WP19E presenter owns dialogue.`,
        );
    }
  }

  private destroyState(state: SceneCoordinatorState): void {
    for (const zone of state.directZones.values()) {
      zone.destroy();
    }
    state.directZones.clear();
    state.prompt.destroy();
    state.input.destroy();
  }
}

let browserWorldInteractionCoordinator: WorldInteractionCoordinator | null = null;

export function getWorldInteractionCoordinator(game: Phaser.Game): WorldInteractionCoordinator {
  browserWorldInteractionCoordinator ??= new WorldInteractionCoordinator(game);
  return browserWorldInteractionCoordinator;
}