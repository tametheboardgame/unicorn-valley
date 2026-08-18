import Phaser from 'phaser';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  MOONFLOWER_GLADE_LOCATION_ID,
  saveLocationCheckpoint,
} from '../save/saveLocationCheckpoint';
import { MOONFLOWER_GLADE_MAP, setMoonflowerGladePlayerSpawn } from './MoonflowerGladeMap';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from './RainbowMeadowMap';
import {
  setSunbeamVillagePlayerSpawn,
  SUNBEAM_VILLAGE_LOCATION_ID,
  SUNBEAM_VILLAGE_MAP,
} from './SunbeamVillageMap';

export const WORLD_TRAVERSAL_POLISH_DETAIL_NAME = 'world-traversal-polish-detail';
export const WORLD_PLAYER_NAME = 'world-player-unicorn';
const WORLD_TRAVERSAL_POLISH_ANCHOR_NAME = 'world-traversal-polish-anchor';

const SUPPORTED_SCENES = new Set([
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
]);

interface Point {
  x: number;
  y: number;
}

interface PathStroke {
  points: readonly Point[];
  outerWidth: number;
  innerWidth: number;
}

interface GatewayDefinition {
  x: number;
  y: number;
  label: string;
  direction: 'west' | 'east';
}

function markDetail<T extends Phaser.GameObjects.GameObject>(object: T): T {
  object.setName(WORLD_TRAVERSAL_POLISH_DETAIL_NAME);
  return object;
}

function drawRoundedStroke(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly Point[],
  width: number,
  colour: number,
): void {
  graphics.lineStyle(width, colour, 1);
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    graphics.lineTo(point.x, point.y);
  }
  graphics.strokePath();

  graphics.fillStyle(colour, 1);
  const radius = width / 2;
  for (const point of points) {
    graphics.fillCircle(point.x, point.y, radius);
  }
}

function drawPathNetwork(scene: Phaser.Scene, strokes: readonly PathStroke[]): void {
  const graphics = markDetail(scene.add.graphics().setDepth(2.45));

  for (const stroke of strokes) {
    drawRoundedStroke(graphics, stroke.points, stroke.outerWidth, 0xd7c18f);
  }
  for (const stroke of strokes) {
    drawRoundedStroke(graphics, stroke.points, stroke.innerWidth, 0xf0dfb2);
  }
}

function hideLegacyGatewayObjects(scene: Phaser.Scene): void {
  const key = scene.scene.key;

  for (const object of scene.children.list) {
    if (object instanceof Phaser.GameObjects.Text) {
      const isLegacyLabel =
        object.text === 'Sunbeam Village → Rainbow Meadow' ||
        object.text === '← Moonflower Glade' ||
        object.text === 'Rainbow Meadow →' ||
        object.text === '← Sunbeam Village';
      if (isLegacyLabel) {
        object.setVisible(false);
      }
      continue;
    }

    if (key === 'SunbeamVillageScene' && object instanceof Phaser.GameObjects.Rectangle) {
      const gateRectangle =
        Math.abs(object.y - 950) < 3 &&
        Math.abs(object.displayWidth - 110) < 3 &&
        Math.abs(object.displayHeight - 370) < 3;
      if (gateRectangle && (Math.abs(object.x - 125) < 3 || Math.abs(object.x - 2875) < 3)) {
        object.setVisible(false);
      }
      continue;
    }

    if (key === 'RainbowMeadowScene' && object instanceof Phaser.GameObjects.Rectangle) {
      const gateRectangle =
        Math.abs(object.x - 125) < 3 &&
        Math.abs(object.y - 1050) < 3 &&
        Math.abs(object.displayWidth - 110) < 3 &&
        Math.abs(object.displayHeight - 370) < 3;
      if (gateRectangle) {
        object.setVisible(false);
      }
      continue;
    }

    if (
      key === 'MoonflowerGladeScene' &&
      (object instanceof Phaser.GameObjects.Rectangle ||
        object instanceof Phaser.GameObjects.Ellipse)
    ) {
      const isOldArchPart =
        object.depth === 8 && Math.abs(object.x - 2680) <= 120 && Math.abs(object.y - 900) <= 110;
      if (isOldArchPart) {
        object.setVisible(false);
      }
    }
  }
}

function addFlowerCluster(scene: Phaser.Scene, x: number, y: number, depth: number): void {
  markDetail(scene.add.circle(x - 12, y, 12, 0xf3a5c4, 1).setDepth(depth));
  markDetail(scene.add.circle(x + 10, y + 3, 10, 0xc7a2df, 1).setDepth(depth));
  markDetail(scene.add.circle(x, y - 8, 9, 0xffdf79, 1).setDepth(depth + 0.1));
}

function addGateway(scene: Phaser.Scene, gateway: GatewayDefinition): void {
  const { x, y, label, direction } = gateway;
  const arrow = direction === 'east' ? '→' : '←';
  const signX = direction === 'east' ? x - 78 : x + 78;
  const sparkleDirection = direction === 'east' ? 1 : -1;

  // A pair of planted stone posts frames an open route instead of blocking it with a solid bar.
  for (const yOffset of [-104, 104]) {
    markDetail(
      scene.add
        .rectangle(x, y + yOffset, 42, 72, 0xb79a79, 1)
        .setStrokeStyle(5, 0x8d725d, 0.95)
        .setDepth(8.7),
    );
    markDetail(scene.add.ellipse(x, y + yOffset - 39, 58, 24, 0xd9c39e, 1).setDepth(8.8));
    addFlowerCluster(scene, x, y + yOffset - 56, 9);

    const hedgeY = y + yOffset + Math.sign(yOffset) * 76;
    markDetail(scene.add.ellipse(x, hedgeY, 78, 94, 0x6da66f, 0.96).setDepth(7.8));
    markDetail(
      scene.add
        .ellipse(
          x + sparkleDirection * 14,
          hedgeY + Math.sign(yOffset) * 28,
          58,
          66,
          0x82b77a,
          0.94,
        )
        .setDepth(7.9),
    );
  }

  // Small threshold stones and sparkles make the direction of travel legible without requiring a button prompt.
  for (const yOffset of [-44, 0, 44]) {
    markDetail(scene.add.ellipse(x, y + yOffset, 32, 20, 0xe1cda5, 0.92).setDepth(3.1));
  }
  for (let index = 1; index <= 3; index += 1) {
    const sparkleX = x + sparkleDirection * (30 + index * 28);
    const sparkleY = y + (index - 2) * 25;
    const sparkle = markDetail(scene.add.circle(sparkleX, sparkleY, 6 + index, 0xffef9c, 0.42));
    sparkle.setDepth(9.2);
    scene.tweens.add({
      targets: sparkle,
      alpha: 0.9,
      scale: 1.35,
      duration: 650 + index * 120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  const sign = markDetail(
    scene.add
      .text(signX, y - 154, `${arrow} ${label}`, {
        color: '#5b465d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff4d9f2',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(direction === 'east' ? 1 : 0, 0.5)
      .setDepth(10.2),
  );
  sign.setStroke('#ffffff', 1);
}

function decorateGlade(scene: Phaser.Scene): void {
  drawPathNetwork(scene, [
    {
      points: [
        { x: 560, y: 720 },
        { x: 830, y: 820 },
        { x: 1100, y: 870 },
        { x: 1400, y: 900 },
        { x: 1750, y: 900 },
        { x: 2150, y: 900 },
        { x: 2690, y: 900 },
      ],
      outerWidth: 128,
      innerWidth: 108,
    },
    {
      points: [
        { x: 1770, y: 930 },
        { x: 1840, y: 1160 },
        { x: 1940, y: 1420 },
        { x: 1980, y: 1720 },
      ],
      outerWidth: 104,
      innerWidth: 84,
    },
    {
      points: [
        { x: 760, y: 850 },
        { x: 840, y: 1070 },
      ],
      outerWidth: 70,
      innerWidth: 54,
    },
  ]);

  addGateway(scene, { x: 2680, y: 900, label: 'Sunbeam Village', direction: 'east' });
}

function decorateVillage(scene: Phaser.Scene): void {
  drawPathNetwork(scene, [
    {
      points: [
        { x: 120, y: 950 },
        { x: 760, y: 950 },
        { x: 1500, y: 1050 },
        { x: 2240, y: 950 },
        { x: 2880, y: 950 },
      ],
      outerWidth: 140,
      innerWidth: 116,
    },
    {
      points: [
        { x: 900, y: 710 },
        { x: 900, y: 625 },
      ],
      outerWidth: 102,
      innerWidth: 78,
    },
    {
      points: [
        { x: 1500, y: 690 },
        { x: 1500, y: 585 },
      ],
      outerWidth: 102,
      innerWidth: 78,
    },
    {
      points: [
        { x: 2110, y: 720 },
        { x: 2110, y: 635 },
      ],
      outerWidth: 102,
      innerWidth: 78,
    },
  ]);

  addGateway(scene, { x: 120, y: 950, label: 'Moonflower Glade', direction: 'west' });
  addGateway(scene, { x: 2880, y: 950, label: 'Rainbow Meadow', direction: 'east' });
}

function decorateMeadow(scene: Phaser.Scene): void {
  drawPathNetwork(scene, [
    {
      points: [
        { x: 100, y: 1050 },
        { x: 760, y: 1050 },
        { x: 1330, y: 1110 },
        { x: 1900, y: 1040 },
        { x: 2350, y: 1050 },
        { x: 3190, y: 1040 },
      ],
      outerWidth: 148,
      innerWidth: 108,
    },
    {
      points: [
        { x: 1110, y: 1065 },
        { x: 1190, y: 610 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
    {
      points: [
        { x: 1800, y: 1050 },
        { x: 1850, y: 1610 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
    {
      points: [
        { x: 2500, y: 1060 },
        { x: 2510, y: 1260 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
  ]);

  addGateway(scene, { x: 120, y: 1050, label: 'Sunbeam Village', direction: 'west' });
}

function decorateScene(scene: Phaser.Scene): void {
  hideLegacyGatewayObjects(scene);
  switch (scene.scene.key) {
    case 'MoonflowerGladeScene':
      decorateGlade(scene);
      break;
    case 'SunbeamVillageScene':
      decorateVillage(scene);
      break;
    case 'RainbowMeadowScene':
      decorateMeadow(scene);
      break;
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

function transitionFromVillage(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite): boolean {
  const gladeEntrance = SUNBEAM_VILLAGE_MAP.entrances.find(
    (entrance) => entrance.id === 'moonflower-glade',
  );
  if (gladeEntrance && isInsideGateway(player, gladeEntrance.position)) {
    const villageEntrance = MOONFLOWER_GLADE_MAP.entrances.find(
      (entrance) => entrance.id === 'sunbeam-village',
    );
    if (villageEntrance) {
      setMoonflowerGladePlayerSpawn(villageEntrance.approach);
    }
    saveLocationCheckpoint(getBrowserSaveService(), MOONFLOWER_GLADE_LOCATION_ID);
    scene.scene.start('MoonflowerGladeScene');
    return true;
  }

  const meadowEntrance = SUNBEAM_VILLAGE_MAP.entrances.find(
    (entrance) => entrance.id === 'rainbow-meadow',
  );
  if (meadowEntrance && isInsideGateway(player, meadowEntrance.position)) {
    const villageEntrance = RAINBOW_MEADOW_MAP.entrances.find(
      (entrance) => entrance.id === 'sunbeam-village',
    );
    if (villageEntrance) {
      setRainbowMeadowPlayerSpawn(villageEntrance.approach);
    }
    saveLocationCheckpoint(getBrowserSaveService(), RAINBOW_MEADOW_LOCATION_ID);
    scene.scene.start('RainbowMeadowScene');
    return true;
  }

  return false;
}

function transitionFromMeadow(scene: Phaser.Scene): void {
  const meadowEntrance = SUNBEAM_VILLAGE_MAP.entrances.find(
    (entrance) => entrance.id === 'rainbow-meadow',
  );
  if (meadowEntrance) {
    setSunbeamVillagePlayerSpawn(meadowEntrance.approach);
  }
  saveLocationCheckpoint(getBrowserSaveService(), SUNBEAM_VILLAGE_LOCATION_ID);
  scene.scene.start('SunbeamVillageScene');
}

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
        decorateScene(scene);
      }

      const player = findPlayer(scene);
      if (!player) {
        continue;
      }

      const key = scene.scene.key;
      let insideGateway = false;

      if (key === 'MoonflowerGladeScene') {
        const entrance = MOONFLOWER_GLADE_MAP.entrances.find(
          (candidate) => candidate.id === 'sunbeam-village',
        );
        insideGateway = entrance ? isInsideGateway(player, entrance.position) : false;
        if (insideGateway && !this.transitionLocks.get(key)) {
          this.transitionLocks.set(key, true);
          transitionFromGlade(scene);
        }
      } else if (key === 'SunbeamVillageScene') {
        insideGateway = SUNBEAM_VILLAGE_MAP.entrances.some((entrance) =>
          isInsideGateway(player, entrance.position),
        );
        if (insideGateway && !this.transitionLocks.get(key)) {
          this.transitionLocks.set(key, true);
          transitionFromVillage(scene, player);
        }
      } else if (key === 'RainbowMeadowScene') {
        const entrance = RAINBOW_MEADOW_MAP.entrances.find(
          (candidate) => candidate.id === 'sunbeam-village',
        );
        insideGateway = entrance ? isInsideGateway(player, entrance.position) : false;
        if (insideGateway && !this.transitionLocks.get(key)) {
          this.transitionLocks.set(key, true);
          transitionFromMeadow(scene);
        }
      }

      if (!insideGateway) {
        this.transitionLocks.set(key, false);
      }
    }
  }
}

let browserWorldTraversalPolishManager: WorldTraversalPolishManager | null = null;

export function getWorldTraversalPolishManager(game: Phaser.Game): WorldTraversalPolishManager {
  browserWorldTraversalPolishManager ??= new WorldTraversalPolishManager(game);
  return browserWorldTraversalPolishManager;
}
