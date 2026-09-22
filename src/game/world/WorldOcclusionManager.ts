import Phaser from 'phaser';
import { PIP_POSITION } from '../intro/PipIntro';
import { MOONFLOWER_GLADE_MAP } from './MoonflowerGladeMap';
import { SUNBEAM_VILLAGE_MAP } from './SunbeamVillageMap';
import { isWorldDepthSortable, worldDepthForY } from './WorldDepth';

interface SceneState {
  overlays: Phaser.GameObjects.GameObject[];
}

type PositionedDepthObject = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  depth: number;
  setDepth: (depth: number) => unknown;
};

const SUPPORTED_SCENES = new Set([
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'CottageInteriorScene',
]);

const COTTAGE_EXTERIOR_PREFIX = 'cottage-exterior:';

const GLADE_BOUNDARY_TREE_POINTS = [
  [170, 220],
  [260, 135],
  [430, 150],
  [620, 125],
  [820, 170],
  [1000, 135],
  [1180, 150],
  [1640, 150],
  [1810, 130],
  [1980, 150],
  [2180, 135],
  [2380, 125],
  [2520, 170],
  [2660, 330],
  [2650, 520],
  [2620, 690],
  [2620, 1110],
  [2650, 1290],
  [2600, 1470],
  [2660, 1660],
  [2500, 1560],
  [2380, 1680],
  [2280, 1650],
  [2100, 1660],
  [1850, 1680],
  [1570, 1670],
  [1280, 1680],
  [1120, 1650],
  [800, 1680],
  [620, 1630],
  [360, 1670],
  [250, 1510],
  [150, 1160],
  [160, 620],
] as const;

const GLADE_EXTRA_BOUNDARY_TREES = [
  [260, 135, 0.9],
  [620, 125, 0.94],
  [1000, 135, 0.9],
  [1810, 130, 0.92],
  [2180, 135, 0.96],
  [2380, 125, 0.9],
  [2650, 520, 0.96],
  [2620, 690, 0.9],
  [2620, 1110, 0.92],
  [2650, 1290, 0.98],
  [2600, 1470, 0.92],
  [2660, 1660, 0.96],
  [2380, 1680, 0.94],
  [2100, 1660, 0.9],
  [1850, 1680, 0.96],
  [1280, 1680, 0.92],
  [800, 1680, 0.94],
  [360, 1670, 0.9],
] as const;

const GLADE_GROUND_DETAILS = [
  [330, 380, 1],
  [520, 760, 0.85],
  [760, 350, 0.9],
  [1040, 430, 0.8],
  [1160, 720, 1],
  [1660, 350, 0.9],
  [1810, 560, 0.8],
  [2360, 620, 0.95],
  [2470, 760, 0.82],
  [320, 1220, 0.9],
  [470, 1400, 1],
  [1090, 1450, 0.9],
  [1630, 1220, 0.86],
  [1740, 1390, 0.92],
  [2380, 1450, 0.88],
] as const;

function isPlayerSprite(
  gameObject: Phaser.GameObjects.GameObject,
): gameObject is Phaser.Physics.Arcade.Sprite {
  return (
    gameObject instanceof Phaser.Physics.Arcade.Sprite &&
    gameObject.texture.key.startsWith('player-unicorn-')
  );
}

function isPositionedDepthObject(
  gameObject: Phaser.GameObjects.GameObject,
): gameObject is PositionedDepthObject {
  const candidate = gameObject as Partial<PositionedDepthObject>;
  return (
    typeof candidate.x === 'number' &&
    typeof candidate.y === 'number' &&
    typeof candidate.depth === 'number' &&
    typeof candidate.setDepth === 'function'
  );
}

export class WorldOcclusionManager {
  private readonly states = new WeakMap<Phaser.Scene, SceneState>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (!SUPPORTED_SCENES.has(scene.scene.key)) {
        continue;
      }

      this.ensureScene(scene);
      this.applySceneDepths(scene);

      const player = scene.children.list.find(isPlayerSprite);
      if (player) {
        player.setDepth(worldDepthForY(player.y, 0.5));
      }
    }
  }

  private ensureScene(scene: Phaser.Scene): SceneState {
    const existing = this.states.get(scene);
    if (existing) {
      return existing;
    }

    const state: SceneState = { overlays: [] };
    if (scene.scene.key === 'MoonflowerGladeScene') {
      state.overlays.push(...this.createGladeEnvironmentOverlays(scene));
    }

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const overlay of state.overlays) {
        overlay.destroy();
      }
      state.overlays.length = 0;
      this.states.delete(scene);
    });

    this.states.set(scene, state);
    return state;
  }

  private applySceneDepths(scene: Phaser.Scene): void {
    if (scene.scene.key === 'MoonflowerGladeScene') {
      this.applyGladeDepths(scene);
      return;
    }

    if (scene.scene.key === 'SunbeamVillageScene') {
      this.applyVillageDepths(scene);
      return;
    }

    this.applyCottageInteriorDepths(scene);
  }

  private applyGladeDepths(scene: Phaser.Scene): void {
    this.applyCottageExteriorDepths(scene);

    for (const [x, y] of GLADE_BOUNDARY_TREE_POINTS) {
      this.setDepthInBox(scene, x - 105, y - 105, x + 125, y + 135, worldDepthForY(y + 115));
    }

    this.setDepthInBox(
      scene,
      PIP_POSITION.x - 75,
      PIP_POSITION.y - 75,
      PIP_POSITION.x + 75,
      PIP_POSITION.y + 90,
      worldDepthForY(PIP_POSITION.y + 55, 0.2),
    );

    this.setDepthInBox(scene, 1060, 990, 1160, 1140, worldDepthForY(1092));

    const bridge = MOONFLOWER_GLADE_MAP.bridge;
    this.setDepthInBox(
      scene,
      bridge.x - bridge.width / 2 - 35,
      bridge.y - 125,
      bridge.x + bridge.width / 2 + 35,
      bridge.y - 65,
      worldDepthForY(bridge.y - 92),
    );
    this.setDepthInBox(
      scene,
      bridge.x - bridge.width / 2 - 35,
      bridge.y + 65,
      bridge.x + bridge.width / 2 + 35,
      bridge.y + 125,
      worldDepthForY(bridge.y + 92, 0.4),
    );

    for (const entrance of MOONFLOWER_GLADE_MAP.entrances) {
      this.setDepthInBox(
        scene,
        entrance.position.x - 130,
        entrance.position.y - 175,
        entrance.position.x + 130,
        entrance.position.y + 115,
        worldDepthForY(entrance.position.y + 90),
      );
    }
  }

  private applyCottageExteriorDepths(scene: Phaser.Scene): void {
    const cottageDepth = worldDepthForY(650);
    const foregroundDepth = worldDepthForY(670, 0.6);

    for (const object of scene.children.list) {
      if (!isPositionedDepthObject(object) || !object.name.startsWith(COTTAGE_EXTERIOR_PREFIX)) {
        continue;
      }

      if (object.name === `${COTTAGE_EXTERIOR_PREFIX}detail:shadow`) {
        object.setDepth(worldDepthForY(620, -0.5));
        continue;
      }

      if (object.name.startsWith(`${COTTAGE_EXTERIOR_PREFIX}flowerbeds:`)) {
        object.setDepth(foregroundDepth);
        continue;
      }

      let offset = 0;
      if (object.name.startsWith(`${COTTAGE_EXTERIOR_PREFIX}wall-finish:`)) {
        offset = -0.2;
      } else if (object.name.startsWith(`${COTTAGE_EXTERIOR_PREFIX}windows:`)) {
        offset = 0.1;
      } else if (object.name.startsWith(`${COTTAGE_EXTERIOR_PREFIX}window-boxes:`)) {
        offset = 0.15;
      } else if (object.name.startsWith(`${COTTAGE_EXTERIOR_PREFIX}door:`)) {
        offset = 0.16;
      } else if (object.name.startsWith(`${COTTAGE_EXTERIOR_PREFIX}porch:`)) {
        offset = 0.17;
      } else if (object.name.startsWith(`${COTTAGE_EXTERIOR_PREFIX}detail:`)) {
        offset = 0.18;
      } else if (object.name.startsWith(`${COTTAGE_EXTERIOR_PREFIX}plaque:`)) {
        offset = 0.2;
      }
      object.setDepth(cottageDepth + offset);
    }
  }

  private applyVillageDepths(scene: Phaser.Scene): void {
    const buildings = [
      { x: 900, y: 470, width: 450, height: 320 },
      { x: 1500, y: 430, width: 430, height: 320 },
      { x: 2110, y: 480, width: 490, height: 330 },
    ] as const;

    for (const building of buildings) {
      this.setDepthInBox(
        scene,
        building.x - building.width / 2 - 70,
        building.y - building.height / 2 - 120,
        building.x + building.width / 2 + 70,
        building.y + building.height / 2 + 80,
        worldDepthForY(building.y + building.height / 2),
      );
    }

    this.setDepthInBox(scene, 1360, 910, 1640, 1190, worldDepthForY(1160));

    for (const marker of SUNBEAM_VILLAGE_MAP.npcMarkers) {
      this.setDepthInBox(
        scene,
        marker.position.x - 65,
        marker.position.y - 55,
        marker.position.x + 65,
        marker.position.y + 90,
        worldDepthForY(marker.position.y + 65, 0.2),
      );
    }

    this.setDepthInBox(scene, 45, 750, 275, 1150, worldDepthForY(1135));
    this.setDepthInBox(scene, 2725, 750, 2955, 1150, worldDepthForY(1135));
  }

  private applyCottageInteriorDepths(scene: Phaser.Scene): void {
    const furniture = [
      { minX: 130, minY: 175, maxX: 440, maxY: 430, anchorY: 430 },
      { minX: 220, minY: 545, maxX: 560, maxY: 805, anchorY: 790 },
      { minX: 690, minY: 405, maxX: 1110, maxY: 590, anchorY: 590 },
      { minX: 1075, minY: 640, maxX: 1415, maxY: 825, anchorY: 815 },
      { minX: 1375, minY: 270, maxX: 1650, maxY: 455, anchorY: 430 },
      { minX: 785, minY: 975, maxX: 1015, maxY: 1185, anchorY: 1170 },
    ] as const;

    for (const item of furniture) {
      this.setDepthInBox(
        scene,
        item.minX,
        item.minY,
        item.maxX,
        item.maxY,
        worldDepthForY(item.anchorY),
      );
    }
  }

  private setDepthInBox(
    scene: Phaser.Scene,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    depth: number,
  ): void {
    for (const object of scene.children.list) {
      if (!isPositionedDepthObject(object) || !isWorldDepthSortable(object.depth)) {
        continue;
      }
      if (object.x < minX || object.x > maxX || object.y < minY || object.y > maxY) {
        continue;
      }
      object.setDepth(depth);
    }
  }

  private createGladeEnvironmentOverlays(scene: Phaser.Scene): Phaser.GameObjects.GameObject[] {
    const overlays: Phaser.GameObjects.GameObject[] = [];

    const ground = scene.add.graphics().setDepth(1.75);
    for (const [x, y, scale] of GLADE_GROUND_DETAILS) {
      ground.fillStyle(0x77b982, 0.1);
      ground.fillEllipse(x, y + 8, 118 * scale, 44 * scale);
      ground.lineStyle(Math.max(2, 3 * scale), 0x5f9d6b, 0.34);
      for (const offset of [-14, 0, 14]) {
        ground.beginPath();
        ground.moveTo(x + offset * scale, y + 14 * scale);
        ground.lineTo(x + (offset - 5) * scale, y - (10 + Math.abs(offset) * 0.18) * scale);
        ground.strokePath();
      }
      ground.fillStyle(0xd9efbf, 0.22);
      ground.fillCircle(x + 28 * scale, y + 4 * scale, 4 * scale);
      ground.fillCircle(x + 34 * scale, y + 1 * scale, 3 * scale);
    }
    overlays.push(ground);

    for (const [x, y, scale] of GLADE_EXTRA_BOUNDARY_TREES) {
      const tree = scene.add.graphics().setDepth(worldDepthForY(y + 115));
      tree.fillStyle(0x765a44, 0.95);
      tree.fillRoundedRect(x - 18 * scale, y + 28 * scale, 38 * scale, 112 * scale, 14 * scale);
      tree.fillStyle(0x694f3d, 0.72);
      tree.fillTriangle(
        x - 18 * scale,
        y + 124 * scale,
        x - 54 * scale,
        y + 146 * scale,
        x + 1 * scale,
        y + 117 * scale,
      );
      tree.fillTriangle(
        x + 18 * scale,
        y + 124 * scale,
        x + 58 * scale,
        y + 144 * scale,
        x - 1 * scale,
        y + 117 * scale,
      );
      tree.fillStyle(0x4f8f63, 0.96);
      tree.fillCircle(x - 34 * scale, y + 2 * scale, 68 * scale);
      tree.fillCircle(x + 30 * scale, y - 8 * scale, 76 * scale);
      tree.fillStyle(0x69a974, 0.9);
      tree.fillCircle(x + 4 * scale, y - 56 * scale, 70 * scale);
      tree.fillCircle(x + 54 * scale, y + 34 * scale, 52 * scale);
      tree.fillStyle(0x86ba7d, 0.55);
      tree.fillCircle(x - 42 * scale, y - 28 * scale, 28 * scale);
      overlays.push(tree);
    }

    overlays.push(this.createRefinedHollowTreeOccluder(scene));
    return overlays;
  }

  private createRefinedHollowTreeOccluder(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const tree = scene.add.graphics().setDepth(worldDepthForY(695));

    // Keep the clean original silhouette as the occluding copy so it aligns with the
    // scene-level tree underneath instead of creating a competing second shape.
    tree.fillStyle(0x8c6349, 1);
    tree.fillRoundedRect(2115, 395, 170, 300, 60);

    // Restrained bark texture only. No long pointed roots.
    tree.lineStyle(6, 0xa87959, 0.42);
    for (const [startX, startY, endX, endY] of [
      [2150, 430, 2138, 515],
      [2182, 415, 2173, 485],
      [2220, 420, 2213, 495],
      [2250, 445, 2260, 530],
      [2153, 565, 2145, 628],
      [2248, 570, 2256, 632],
    ] as const) {
      tree.beginPath();
      tree.moveTo(startX, startY);
      tree.lineTo(endX, endY);
      tree.strokePath();
    }

    tree.fillStyle(0x3b2f30, 0.98);
    tree.fillEllipse(2200, 555, 82, 118);
    tree.lineStyle(6, 0xb98a61, 0.42);
    tree.strokeEllipse(2200, 555, 94, 132);

    tree.fillStyle(0x477a58, 1);
    tree.fillCircle(2120, 350, 150);
    tree.fillCircle(2250, 330, 180);
    tree.fillStyle(0x5f966a, 1);
    tree.fillCircle(2190, 280, 180);
    tree.fillCircle(2290, 420, 130);
    tree.fillStyle(0x76aa72, 0.62);
    tree.fillCircle(2105, 292, 58);
    tree.fillCircle(2268, 258, 64);

    // Soft moss at the base gives it age without changing the collision silhouette.
    tree.fillStyle(0x7aa56c, 0.8);
    tree.fillEllipse(2146, 656, 58, 18);
    tree.fillEllipse(2258, 650, 52, 17);
    tree.fillEllipse(2196, 679, 70, 16);

    tree.fillStyle(0xb98ce8, 0.28);
    tree.fillCircle(2200, 555, 18);
    tree.fillStyle(0xe2c9ff, 0.3);
    tree.fillCircle(2196, 549, 7);

    return tree;
  }
}

let browserWorldOcclusionManager: WorldOcclusionManager | null = null;

export function getWorldOcclusionManager(game: Phaser.Game): WorldOcclusionManager {
  browserWorldOcclusionManager ??= new WorldOcclusionManager(game);
  return browserWorldOcclusionManager;
}
