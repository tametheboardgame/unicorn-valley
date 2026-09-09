import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { setPlayerEntityFacing } from '../player/PlayerEntity';
import { DEFAULT_PLAYER_SPEED } from '../player/PlayerMovement';
import { COTTAGE_INTERIOR_MAP } from '../world/CottageInteriorMap';
import { CRYSTAL_BROOK_MAP } from '../world/CrystalBrookMap';
import type { MapPoint, TraversalMapDefinition } from '../world/MapTraversal';
import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';
import { CRYSTAL_GROTTO_MAP, FIREFLY_GROVE_MAP } from '../world/MicroLocationTraversalMaps';
import { RAINBOW_MEADOW_MAP } from '../world/RainbowMeadowMap';
import { STARLIGHT_BEACH_MAP } from '../world/StarlightBeachMap';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import { WHISPERING_WOODS_MAP } from '../world/WhisperingWoodsMap';
import { parsePlayerFacing, resolveClickNavigationFacing } from './ClickNavigationFacing';
import { findClickNavigationPath } from './ClickNavigationPath';
import { isExplorationMovementBlocked } from './ExplorationMovementBlocker';
import { hasHeldExplorationMovementInput } from './KeyboardInputAdapter';
import { CLICK_NAVIGATION_SUPPORTED_SCENES } from './ClickNavigationSceneClassification';

interface NavigationState {
  path: MapPoint[];
  waypointIndex: number;
  target: MapPoint | null;
  marker: Phaser.GameObjects.Container | null;
  lastDistance: number;
  lastProgressAt: number;
  pointerHandler: (
    pointer: Phaser.Input.Pointer,
    currentlyOver: Phaser.GameObjects.GameObject[],
  ) => void;
}

const SUPPORTED_SCENES = new Set<string>(CLICK_NAVIGATION_SUPPORTED_SCENES);

const PATCH_NAVIGATION_MAP: TraversalMapDefinition = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  margin: 80,
  playerSpawn: { x: 250, y: 500 },
  colliders: [],
};

const HOLLOW_TREE_NOOK_NAVIGATION_MAP: TraversalMapDefinition = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  margin: 65,
  playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 150 },
  colliders: [
    {
      id: 'collision:hollow-tree-nook-upper-bound',
      x: GAME_WIDTH / 2,
      y: 90,
      width: GAME_WIDTH,
      height: 50,
    },
  ],
};

const WINDMILL_LOOKOUT_NAVIGATION_MAP: TraversalMapDefinition = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  margin: 70,
  playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 160 },
  colliders: [],
};

const NAVIGATION_MAPS: Readonly<Record<string, TraversalMapDefinition>> = {
  MoonflowerGladeScene: MOONFLOWER_GLADE_MAP,
  SunbeamVillageScene: SUNBEAM_VILLAGE_MAP,
  RainbowMeadowScene: RAINBOW_MEADOW_MAP,
  CrystalBrookScene: CRYSTAL_BROOK_MAP,
  WhisperingWoodsScene: WHISPERING_WOODS_MAP,
  StarlightBeachScene: STARLIGHT_BEACH_MAP,
  CottageInteriorScene: COTTAGE_INTERIOR_MAP,
  MoonflowerPatchScene: PATCH_NAVIGATION_MAP,
  HollowTreeNookScene: HOLLOW_TREE_NOOK_NAVIGATION_MAP,
  WindmillLookoutScene: WINDMILL_LOOKOUT_NAVIGATION_MAP,
  CrystalGrottoScene: CRYSTAL_GROTTO_MAP,
  FireflyGroveScene: FIREFLY_GROVE_MAP,
};

const WAYPOINT_REACHED_DISTANCE = 22;
const STUCK_TIMEOUT_MS = 950;
const MIN_PROGRESS_DISTANCE = 2;

function isPlayerSprite(
  gameObject: Phaser.GameObjects.GameObject,
): gameObject is Phaser.Physics.Arcade.Sprite {
  return (
    gameObject instanceof Phaser.Physics.Arcade.Sprite &&
    gameObject.texture.key.startsWith('player-unicorn-')
  );
}

function updateClickNavigationFacing(
  player: Phaser.Physics.Arcade.Sprite,
  directionX: number,
  directionY: number,
): void {
  const previousFacing = parsePlayerFacing(player.getData('player-facing'));
  const facing = resolveClickNavigationFacing(directionX, directionY, previousFacing);

  if (setPlayerEntityFacing(player, facing)) {
    return;
  }

  player.setData('player-facing', facing);
  if (facing === 'left') {
    player.setFlipX(true);
  } else if (facing === 'right') {
    player.setFlipX(false);
  }
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

      if (isExplorationMovementBlocked(scene) || hasHeldExplorationMovementInput()) {
        this.cancel(state);
        continue;
      }

      const body = player.body as Phaser.Physics.Arcade.Body;
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

      // Pathfinding may alternate tiny horizontal/vertical segments around obstacles.
      // Face towards the player's actual click target instead of each intermediate
      // waypoint so presentation remains stable while velocity follows the safe path.
      const facingTarget = state.target ?? waypoint;
      updateClickNavigationFacing(player, facingTarget.x - player.x, facingTarget.y - player.y);
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
      target: null,
      marker: null,
      lastDistance: Number.POSITIVE_INFINITY,
      lastProgressAt: scene.time.now,
      pointerHandler: () => undefined,
    };

    state.pointerHandler = (
      pointer: Phaser.Input.Pointer,
      currentlyOver: Phaser.GameObjects.GameObject[],
    ) => {
      if (pointer.button !== 0 || isExplorationMovementBlocked(scene)) {
        return;
      }
      if (currentlyOver.length > 0 || hasHeldExplorationMovementInput()) {
        this.cancel(state);
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
      state.target = path[path.length - 1] ?? null;
      state.lastDistance = Number.POSITIVE_INFINITY;
      state.lastProgressAt = scene.time.now;
      if (state.target) {
        this.showTargetMarker(scene, state, state.target);
      }
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

  private showTargetMarker(scene: Phaser.Scene, state: NavigationState, target: MapPoint): void {
    state.marker?.destroy(true);

    const ring = scene.add.circle(0, 0, 19, 0xfff3a6, 0.24).setStrokeStyle(3, 0xffe27d, 0.92);
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
    state.target = null;
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
