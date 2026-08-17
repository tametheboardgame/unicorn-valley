import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DEFAULT_PLAYER_SPEED } from '../player/PlayerMovement';
import type { MapPoint, TraversalMapDefinition } from '../world/MapTraversal';
import { COTTAGE_INTERIOR_MAP } from '../world/CottageInteriorMap';
import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import { findClickNavigationPath } from './ClickNavigationPath';

interface NavigationState {
  path: MapPoint[];
  waypointIndex: number;
  marker: Phaser.GameObjects.Container | null;
  lastDistance: number;
  lastProgressAt: number;
  pointerHandler: (
    pointer: Phaser.Input.Pointer,
    currentlyOver: Phaser.GameObjects.GameObject[],
  ) => void;
}

const SUPPORTED_SCENES = new Set([
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'CottageInteriorScene',
  'MoonflowerPatchScene',
]);

const PATCH_NAVIGATION_MAP: TraversalMapDefinition = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  margin: 80,
  playerSpawn: { x: 250, y: 500 },
  colliders: [],
};

const NAVIGATION_MAPS: Readonly<Record<string, TraversalMapDefinition>> = {
  MoonflowerGladeScene: MOONFLOWER_GLADE_MAP,
  SunbeamVillageScene: SUNBEAM_VILLAGE_MAP,
  CottageInteriorScene: COTTAGE_INTERIOR_MAP,
  MoonflowerPatchScene: PATCH_NAVIGATION_MAP,
};

const WAYPOINT_REACHED_DISTANCE = 22;
const STUCK_TIMEOUT_MS = 950;
const MIN_PROGRESS_DISTANCE = 2;
const MODAL_DEPTH = 125;

function isPlayerSprite(
  gameObject: Phaser.GameObjects.GameObject,
): gameObject is Phaser.Physics.Arcade.Sprite {
  return (
    gameObject instanceof Phaser.Physics.Arcade.Sprite &&
    gameObject.texture.key.startsWith('player-unicorn-')
  );
}

export class ClickToMoveManager {
  private readonly states = new WeakMap<Phaser.Scene, NavigationState>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (!SUPPORTED_SCENES.has(scene.scene.key)) {
        continue;
      }

      const state = this.ensureScene(scene);
      const player = scene.children.list.find(isPlayerSprite);
      if (!player) {
        this.cancel(state);
        continue;
      }

      if (this.hasVisibleModal(scene)) {
        this.cancel(state);
        continue;
      }

      const body = player.body as Phaser.Physics.Arcade.Body;
      if (Math.hypot(body.velocity.x, body.velocity.y) > 1) {
        this.cancel(state, false);
        continue;
      }

      const waypoint = state.path[state.waypointIndex];
      if (!waypoint) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(player.x, player.y, waypoint.x, waypoint.y);
      if (distance <= WAYPOINT_REACHED_DISTANCE) {
        state.waypointIndex += 1;
        state.lastDistance = Number.POSITIVE_INFINITY;
        state.lastProgressAt = scene.time.now;

        if (!state.path[state.waypointIndex]) {
          body.setVelocity(0, 0);
          this.cancel(state);
        }
        continue;
      }

      if (distance < state.lastDistance - MIN_PROGRESS_DISTANCE) {
        state.lastDistance = distance;
        state.lastProgressAt = scene.time.now;
      } else if (scene.time.now - state.lastProgressAt >= STUCK_TIMEOUT_MS) {
        body.setVelocity(0, 0);
        this.cancel(state);
        continue;
      }

      const directionX = waypoint.x - player.x;
      const directionY = waypoint.y - player.y;
      const magnitude = Math.hypot(directionX, directionY);
      if (magnitude === 0) {
        continue;
      }

      body.setVelocity(
        (directionX / magnitude) * DEFAULT_PLAYER_SPEED,
        (directionY / magnitude) * DEFAULT_PLAYER_SPEED,
      );

      if (Math.abs(directionX) > 2) {
        player.setFlipX(directionX < 0);
      }
      player.setAngle(Math.sin(scene.time.now * 0.018) * 1.6);
    }
  }

  private ensureScene(scene: Phaser.Scene): NavigationState {
    const existing = this.states.get(scene);
    if (existing) {
      return existing;
    }

    const state: NavigationState = {
      path: [],
      waypointIndex: 0,
      marker: null,
      lastDistance: Number.POSITIVE_INFINITY,
      lastProgressAt: scene.time.now,
      pointerHandler: () => undefined,
    };

    state.pointerHandler = (
      pointer: Phaser.Input.Pointer,
      currentlyOver: Phaser.GameObjects.GameObject[],
    ) => {
      if (pointer.button !== 0 || currentlyOver.length > 0 || this.hasVisibleModal(scene)) {
        return;
      }

      const player = scene.children.list.find(isPlayerSprite);
      const map = NAVIGATION_MAPS[scene.scene.key];
      if (!player || !map) {
        return;
      }

      const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const path = findClickNavigationPath(
        map,
        { x: player.x, y: player.y },
        { x: worldPoint.x, y: worldPoint.y },
      );
      if (path.length === 0) {
        this.cancel(state);
        return;
      }

      state.path = path;
      state.waypointIndex = 0;
      state.lastDistance = Number.POSITIVE_INFINITY;
      state.lastProgressAt = scene.time.now;
      this.showTargetMarker(scene, state, path[path.length - 1]);
    };

    scene.input.on('pointerdown', state.pointerHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerdown', state.pointerHandler);
      this.cancel(state);
      this.states.delete(scene);
    });
    this.states.set(scene, state);
    return state;
  }

  private hasVisibleModal(scene: Phaser.Scene): boolean {
    return scene.children.list.some((gameObject) => {
      const displayObject = gameObject as Phaser.GameObjects.GameObject & {
        visible?: boolean;
        depth?: number;
      };
      return (
        displayObject.active &&
        displayObject.visible === true &&
        (displayObject.depth ?? 0) >= MODAL_DEPTH
      );
    });
  }

  private showTargetMarker(scene: Phaser.Scene, state: NavigationState, target: MapPoint): void {
    state.marker?.destroy(true);

    const ring = scene.add
      .circle(0, 0, 19, 0xfff3a6, 0.24)
      .setStrokeStyle(3, 0xffe27d, 0.92);
    const sparkle = scene.add
      .text(0, -1, '✦', {
        color: '#fff8cf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    state.marker = scene.add.container(target.x, target.y, [ring, sparkle]).setDepth(19);

    scene.tweens.add({
      targets: state.marker,
      scale: 1.18,
      alpha: 0.72,
      duration: 430,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private cancel(state: NavigationState, destroyMarker = true): void {
    state.path = [];
    state.waypointIndex = 0;
    state.lastDistance = Number.POSITIVE_INFINITY;
    if (destroyMarker) {
      state.marker?.destroy(true);
      state.marker = null;
    }
  }
}

let browserClickToMoveManager: ClickToMoveManager | null = null;

export function getClickToMoveManager(game: Phaser.Game): ClickToMoveManager {
  browserClickToMoveManager ??= new ClickToMoveManager(game);
  return browserClickToMoveManager;
}
