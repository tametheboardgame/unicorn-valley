import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';

type VillageInteriorId = 'bakery' | 'accessory-shop' | 'library';

function findInteriorId(scene: Phaser.Scene): VillageInteriorId | null {
  for (const object of scene.children.list) {
    if (!(object instanceof Phaser.GameObjects.Text)) {
      continue;
    }
    if (object.text.includes('Sunbeam Bakery')) {
      return 'bakery';
    }
    if (object.text.includes('Twinkle & Thread')) {
      return 'accessory-shop';
    }
    if (object.text.includes('Story House')) {
      return 'library';
    }
  }
  return null;
}

function findRectangleAt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  interactiveOnly = false,
): Phaser.GameObjects.Rectangle | null {
  const pending: Phaser.GameObjects.GameObject[] = [...scene.children.list];
  while (pending.length > 0) {
    const object = pending.shift();
    if (!object) {
      continue;
    }
    if (object instanceof Phaser.GameObjects.Container) {
      pending.push(...object.list);
      continue;
    }
    if (
      object instanceof Phaser.GameObjects.Rectangle &&
      (!interactiveOnly || object.input?.enabled === true) &&
      Math.abs(object.x - x) < 0.5 &&
      Math.abs(object.y - y) < 0.5
    ) {
      return object;
    }
  }
  return null;
}

function nameRectangleAt(scene: Phaser.Scene, x: number, y: number, name: string): void {
  findRectangleAt(scene, x, y)?.setName(name);
}

function nameInteractiveRectangleAt(scene: Phaser.Scene, x: number, y: number, name: string): void {
  findRectangleAt(scene, x, y, true)?.setName(name);
}

export class VillageInteriorContractManager {
  private namedScene: Phaser.Scene | null = null;
  private namedInterior: VillageInteriorId | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('VillageInteriorScene');
    if (!scene?.scene.isActive()) {
      this.namedScene = null;
      this.namedInterior = null;
      return;
    }

    const interiorId = findInteriorId(scene);
    if (!interiorId || (this.namedScene === scene && this.namedInterior === interiorId)) {
      return;
    }

    nameRectangleAt(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, `village-interior:${interiorId}`);
    nameInteractiveRectangleAt(scene, 170, GAME_HEIGHT - 46, 'village-interior-back');

    if (interiorId === 'bakery') {
      nameRectangleAt(scene, 640, 372, 'village-interior-bakery-counter');
    } else if (interiorId === 'library') {
      nameRectangleAt(scene, 430, 335, 'village-interior-library-shelves');
    } else {
      nameRectangleAt(scene, 640, 350, 'village-interior-accessory-counter');
      nameInteractiveRectangleAt(scene, 470, 475, 'village-interior-action');
    }

    this.namedScene = scene;
    this.namedInterior = interiorId;
  }
}

let browserVillageInteriorContractManager: VillageInteriorContractManager | null = null;

export function getVillageInteriorContractManager(
  game: Phaser.Game,
): VillageInteriorContractManager {
  browserVillageInteriorContractManager ??= new VillageInteriorContractManager(game);
  return browserVillageInteriorContractManager;
}
