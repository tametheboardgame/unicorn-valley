import Phaser from 'phaser';
import {
  BEACHCOMBING_READY_FLAG,
  CORAL_SHELL_STORIES_QUEST_ID,
} from '../../content/r65StarlightBeach';
import { MAPLE_CAKE_QUEST_ID } from '../../content/r6VillageContent';
import {
  WORLD_INTERACTION_PROMPT,
  WorldInteractionInput,
} from '../interaction/WorldInteractionInput';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT, applyButtonHover } from '../ui/uiTheme';
import { worldDepthForY } from '../world/WorldDepth';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

interface Point {
  x: number;
  y: number;
}

interface SceneRuntime {
  scene: Phaser.Scene;
  objects: Phaser.GameObjects.GameObject[];
  input: WorldInteractionInput | null;
}

const BEACH_ENTRY = { x: 1210, y: 1490, radius: 116 } as const;
const BEACH_PROMPT_NAME = 'wp14-activity-entry:coral-beachcombing-prompt';

function findPlayer(scene: Phaser.Scene): Point | null {
  const object = scene.children.getByName(WORLD_PLAYER_NAME) as
    | (Phaser.GameObjects.GameObject & Partial<Point>)
    | null;
  if (object && typeof object.x === 'number' && typeof object.y === 'number') {
    return { x: object.x, y: object.y };
  }
  return null;
}

function distance(left: Point, right: Point): number {
  return Phaser.Math.Distance.Between(left.x, left.y, right.x, right.y);
}

function isBakeryScene(scene: Phaser.Scene): boolean {
  const interior = scene as Phaser.Scene & { interiorId?: string };
  return scene.scene.key === 'VillageInteriorScene' && interior.interiorId === 'bakery';
}

export class RepeatableActivityEntryWorldManager {
  private runtime: SceneRuntime | null = null;
  private launchPending = false;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyRuntime();
    });
  }

  private update(): void {
    const bakery = this.game.scene.getScene('VillageInteriorScene');
    const beach = this.game.scene.getScene('StarlightBeachScene');
    const target =
      bakery?.scene.isActive() && isBakeryScene(bakery)
        ? bakery
        : beach?.scene.isActive()
          ? beach
          : null;

    if (!target) {
      this.destroyRuntime();
      return;
    }

    if (this.runtime?.scene !== target) {
      this.buildRuntime(target);
    }

    if (target.scene.key === 'StarlightBeachScene') {
      this.updateBeachInteraction(target);
    }
  }

  private buildRuntime(scene: Phaser.Scene): void {
    this.destroyRuntime();
    this.runtime = { scene, objects: [], input: null };

    if (isBakeryScene(scene)) {
      this.buildBakeryEntry(scene);
      return;
    }
    this.buildBeachEntry(scene);
  }

  private buildBakeryEntry(scene: Phaser.Scene): void {
    const completed =
      getBrowserQuestEngine().getProgress(MAPLE_CAKE_QUEST_ID).status === 'completed';
    if (!completed) {
      return;
    }

    const button = scene.add
      .rectangle(1010, 548, 250, 58, UI_COLOURS.mint, 1)
      .setStrokeStyle(3, 0x6aa996, 1)
      .setScrollFactor(0)
      .setDepth(32)
      .setInteractive({ useHandCursor: true })
      .setName('wp14-activity-entry:maple-baking');
    const label = scene.add
      .text(1010, 548, '🎂 Bake with Maple', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(33)
      .setInteractive({ useHandCursor: true });
    applyButtonHover(button, UI_COLOURS.mint, UI_COLOURS.blush);
    const launch = () => void this.launchMapleBaking(scene);
    button.on('pointerdown', launch);
    label.on('pointerdown', launch);
    this.runtime?.objects.push(button, label);
  }

  private buildBeachEntry(scene: Phaser.Scene): void {
    const save = getBrowserSaveService().load() ?? getBrowserSaveService().createNewGame();
    const storyComplete =
      getBrowserQuestEngine().getProgress(CORAL_SHELL_STORIES_QUEST_ID).status === 'completed';
    if (save.world.flags[BEACHCOMBING_READY_FLAG] !== true || !storyComplete) {
      return;
    }

    const input = new WorldInteractionInput(scene);
    this.runtime!.input = input;
    const plate = scene.add.circle(0, 0, 31, 0xccefeb, 0.22).setStrokeStyle(3, 0xffffff, 0.38);
    const icon = scene.add
      .text(0, 0, '📓', { fontFamily: UI_FONT, fontSize: '29px' })
      .setOrigin(0.5);
    const prompt = scene.add
      .text(0, 55, `Beachcombing notebook  ·  ${WORLD_INTERACTION_PROMPT}`, {
        color: '#496474',
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: '#f5ffffef',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setName(BEACH_PROMPT_NAME)
      .setVisible(false);
    const zone = scene.add.zone(0, 0, 190, 156);
    const container = scene.add
      .container(BEACH_ENTRY.x, BEACH_ENTRY.y, [plate, icon, prompt, zone])
      .setDepth(worldDepthForY(BEACH_ENTRY.y + 20, 0.5))
      .setName('wp14-activity-entry:coral-beachcombing');
    input.bindPointer(zone, () => {
      const player = findPlayer(scene);
      if (player && distance(player, BEACH_ENTRY) <= BEACH_ENTRY.radius) {
        void this.launchBeachcombing(scene);
      }
    });
    this.runtime?.objects.push(container);
  }

  private updateBeachInteraction(scene: Phaser.Scene): void {
    const runtime = this.runtime;
    const player = findPlayer(scene);
    const container = scene.children.getByName(
      'wp14-activity-entry:coral-beachcombing',
    ) as Phaser.GameObjects.Container | null;
    if (!runtime?.input || !player || !container) {
      return;
    }
    const prompt = container.getByName(BEACH_PROMPT_NAME) as Phaser.GameObjects.Text | null;
    const nearby = distance(player, BEACH_ENTRY) <= BEACH_ENTRY.radius;
    prompt?.setVisible(distance(player, BEACH_ENTRY) <= BEACH_ENTRY.radius + 90);
    if (nearby && runtime.input.justPressed()) {
      void this.launchBeachcombing(scene);
    }
  }

  private async launchMapleBaking(scene: Phaser.Scene): Promise<void> {
    if (this.launchPending) {
      return;
    }
    this.launchPending = true;
    try {
      if (!this.game.scene.keys.MapleBakingActivityScene) {
        const { MapleBakingActivityScene } = await import('./MapleBakingActivityScene');
        this.game.scene.add('MapleBakingActivityScene', MapleBakingActivityScene);
      }
      scene.scene.launch('MapleBakingActivityScene', { returnScene: 'VillageInteriorScene' });
      scene.scene.pause();
    } finally {
      this.launchPending = false;
    }
  }

  private async launchBeachcombing(scene: Phaser.Scene): Promise<void> {
    if (this.launchPending) {
      return;
    }
    this.launchPending = true;
    try {
      if (!this.game.scene.keys.CoralBeachcombingActivityScene) {
        const { CoralBeachcombingActivityScene } = await import('./CoralBeachcombingActivityScene');
        this.game.scene.add('CoralBeachcombingActivityScene', CoralBeachcombingActivityScene);
      }
      scene.scene.launch('CoralBeachcombingActivityScene', { returnScene: 'StarlightBeachScene' });
      scene.scene.pause();
    } finally {
      this.launchPending = false;
    }
  }

  private destroyRuntime(): void {
    if (!this.runtime) {
      return;
    }
    this.runtime.input?.destroy();
    for (const object of this.runtime.objects) {
      object.destroy();
    }
    this.runtime = null;
  }
}

let manager: RepeatableActivityEntryWorldManager | null = null;

export function getRepeatableActivityEntryWorldManager(
  game: Phaser.Game,
): RepeatableActivityEntryWorldManager {
  manager ??= new RepeatableActivityEntryWorldManager(game);
  return manager;
}
