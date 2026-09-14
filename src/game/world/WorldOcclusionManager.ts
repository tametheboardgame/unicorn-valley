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

const GLade_BOUNDARY_TREES = [
  [170, 220],
  [430, 150],
  [820, 170],
  [1180, 150],
  [1640, 150],
  [1980, 150],
  [2520, 170],
  [2660, 330],
  [2500, 1560],
  [2280, 1650],
  [1570, 1670],
  [1120, 1650],
  [620, 1630],
  [250, 1510],
  [150, 1160],
  [160, 620],
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
      state.overlays.push(this.createHollowTreeOccluder(scene));
    } else if (scene.scene.key === 'SunbeamVillageScene') {
      state.overlays.push(this.createVillageBuntingOccluder(scene));
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

    for (const [x, y] of GLade_BOUNDARY_TREES) {
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

  private createHollowTreeOccluder(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const tree = scene.add.graphics().setDepth(worldDepthForY(695));
    tree.fillStyle(0x8c6349, 1);
    tree.fillRoundedRect(2115, 395, 170, 300, 60);
    tree.fillStyle(0x5b413a, 1);
    tree.fillEllipse(2200, 555, 76, 112);
    tree.fillStyle(0x477a58, 1);
    tree.fillCircle(2120, 350, 150);
    tree.fillCircle(2250, 330, 180);
    tree.fillStyle(0x5f966a, 1);
    tree.fillCircle(2190, 280, 180);
    tree.fillCircle(2290, 420, 130);
    tree.fillStyle(0x2f2638, 0.92);
    tree.fillCircle(2200, 555, 22);
    tree.fillStyle(0xb98ce8, 0.28);
    tree.fillCircle(2200, 555, 8);
    return tree;
  }

  private createVillageBuntingOccluder(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics().setDepth(90);
    graphics.lineStyle(6, 0x8f6a75, 0.75);
    graphics.lineBetween(800, 745, 2200, 745);
    const colours = [0xf28aa5, 0xf5c968, 0x7cc6d8, 0x9bc477, 0xc99ed5];
    for (let x = 830, index = 0; x <= 2170; x += 85, index += 1) {
      graphics.fillStyle(colours[index % colours.length], 0.95);
      graphics.fillTriangle(x, 766, x + 30, 766, x + 15, 804);
    }
    return graphics;
  }
}

let browserWorldOcclusionManager: WorldOcclusionManager | null = null;

export function getWorldOcclusionManager(game: Phaser.Game): WorldOcclusionManager {
  browserWorldOcclusionManager ??= new WorldOcclusionManager(game);
  return browserWorldOcclusionManager;
}
