import Phaser from 'phaser';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import { MOONFLOWER_GLADE_MAP } from './MoonflowerGladeMap';
import {
  setSunbeamVillagePlayerSpawn,
  SUNBEAM_VILLAGE_LOCATION_ID,
  SUNBEAM_VILLAGE_MAP,
} from './SunbeamVillageMap';

export const WORLD_TRAVERSAL_POLISH_DETAIL_NAME = 'world-traversal-polish-detail';
export const WORLD_PLAYER_NAME = 'world-player-unicorn';
const WORLD_TRAVERSAL_POLISH_ANCHOR_NAME = 'world-traversal-polish-anchor';

const SUPPORTED_SCENES = new Set(['MoonflowerGladeScene']);

interface Point {
  x: number;
  y: number;
}

function hideLegacyGatewayObjects(scene: Phaser.Scene): void {
  for (const object of scene.children.list) {
    if (object instanceof Phaser.GameObjects.Text) {
      if (
        object.text === 'Sunbeam Village → Rainbow Meadow' ||
        object.text === '← Moonflower Glade' ||
        object.text === 'Rainbow Meadow →'
      ) {
        object.setVisible(false);
      }
      continue;
    }

    if (
      object instanceof Phaser.GameObjects.Rectangle ||
      object instanceof Phaser.GameObjects.Ellipse
    ) {
      const isOldArchPart =
        object.depth === 8 && Math.abs(object.x - 2680) <= 120 && Math.abs(object.y - 900) <= 110;
      if (isOldArchPart) {
        object.setVisible(false);
      }
    }
  }
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  const namedPlayer = scene.children.getByName(WORLD_PLAYER_NAME);
  if (namedPlayer instanceof Phaser.Physics.Arcade.Sprite) {
    return namedPlayer;
  }

  return (
    (scene.children.list.find(
      (object) =>
        object instanceof Phaser.Physics.Arcade.Sprite &&
        object.texture.key.startsWith('player-unicorn-'),
    ) as Phaser.Physics.Arcade.Sprite | undefined) ?? null
  );
}

function isInsideGateway(player: Phaser.Physics.Arcade.Sprite, point: Point): boolean {
  return Math.abs(player.x - point.x) <= 90 && Math.abs(player.y - point.y) <= 105;
}

function transitionFromGlade(scene: Phaser.Scene): void {
  const villageEntrance = SUNBEAM_VILLAGE_MAP.entrances.find(
    (entrance) => entrance.id === 'moonflower-glade',
  );
  if (villageEntrance) {
    setSunbeamVillagePlayerSpawn(villageEntrance.approach);
  }
  saveLocationCheckpoint(getBrowserSaveService(), SUNBEAM_VILLAGE_LOCATION_ID);
  scene.scene.start('SunbeamVillageScene');
}

/**
 * Legacy traversal compatibility retained only for Moonflower Glade.
 *
 * Rainbow Meadow completed its ownership migration in R6.5-WP19H4.11: its paths,
 * gateway presentation and walk-through transitions are scene-owned and must not
 * be reintroduced here.
 */
export class WorldTraversalPolishManager {
  private readonly transitionLocks = new Map<string, boolean>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (!SUPPORTED_SCENES.has(scene.scene.key)) {
        continue;
      }

      const alreadyDecorated = scene.children.list.some(
        (object) => object.name === WORLD_TRAVERSAL_POLISH_ANCHOR_NAME,
      );
      if (!alreadyDecorated) {
        scene.add
          .zone(-64, -64, 2, 2)
          .setName(WORLD_TRAVERSAL_POLISH_ANCHOR_NAME)
          .setVisible(false);
        hideLegacyGatewayObjects(scene);
      }

      const player = findPlayer(scene);
      if (!player) {
        continue;
      }

      const entrance = MOONFLOWER_GLADE_MAP.entrances.find(
        (candidate) => candidate.id === 'sunbeam-village',
      );
      const insideGateway = entrance ? isInsideGateway(player, entrance.position) : false;
      if (insideGateway && !this.transitionLocks.get(scene.scene.key)) {
        this.transitionLocks.set(scene.scene.key, true);
        transitionFromGlade(scene);
      }

      if (!insideGateway) {
        this.transitionLocks.set(scene.scene.key, false);
      }
    }
  }
}

let browserWorldTraversalPolishManager: WorldTraversalPolishManager | null = null;

export function getWorldTraversalPolishManager(game: Phaser.Game): WorldTraversalPolishManager {
  browserWorldTraversalPolishManager ??= new WorldTraversalPolishManager(game);
  return browserWorldTraversalPolishManager;
}
