import Phaser from 'phaser';
import {
  BEACHCOMBING_READY_FLAG,
  CORAL_SHELL_STORIES_QUEST_ID,
} from '../../content/r65StarlightBeach';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { MINI_GAME_IDS } from '../minigames/MiniGameCatalogue';
import { launchMiniGame } from '../minigames/MiniGameLauncher';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_FONT } from '../ui/uiTheme';
import { worldDepthForY } from '../world/WorldDepth';

interface SceneRuntime {
  scene: Phaser.Scene;
  objects: Phaser.GameObjects.GameObject[];
}

const BEACH_ENTRY = { x: 1210, y: 1490, radius: 116 } as const;
const REGISTRY_OWNER = 'repeatable-activity-entry';

export class RepeatableActivityEntryWorldManager {
  private runtime: SceneRuntime | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyRuntime();
    });
  }

  private update(): void {
    const beach = this.game.scene.getScene('StarlightBeachScene');
    const target = beach?.scene.isActive() ? beach : null;

    if (!target) {
      this.destroyRuntime();
      return;
    }

    if (this.runtime?.scene !== target) {
      this.buildRuntime(target);
    }
  }

  private buildRuntime(scene: Phaser.Scene): void {
    this.destroyRuntime();
    this.runtime = { scene, objects: [] };
    this.buildBeachEntry(scene);
  }

  private buildBeachEntry(scene: Phaser.Scene): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const storyComplete =
      getBrowserQuestEngine().getProgress(CORAL_SHELL_STORIES_QUEST_ID).status === 'completed';
    if (save.world.flags[BEACHCOMBING_READY_FLAG] !== true || !storyComplete) {
      return;
    }

    const plate = scene.add.circle(0, 0, 31, 0xccefeb, 0.22).setStrokeStyle(3, 0xffffff, 0.38);
    const icon = scene.add
      .text(0, 0, '📓', { fontFamily: UI_FONT, fontSize: '29px' })
      .setOrigin(0.5);
    const container = scene.add
      .container(BEACH_ENTRY.x, BEACH_ENTRY.y, [plate, icon])
      .setDepth(worldDepthForY(BEACH_ENTRY.y + 20, 0.5))
      .setName('wp14-activity-entry:coral-beachcombing');
    this.runtime?.objects.push(container);

    getSceneInteractionRegistry(scene).replaceOwnerTargets(REGISTRY_OWNER, [
      {
        id: 'interaction:activity:coral-beachcombing',
        label: 'Beachcombing notebook',
        actionLabel: 'Start beachcombing',
        actionKind: 'start',
        position: BEACH_ENTRY,
        interactionRadius: BEACH_ENTRY.radius,
        priority: 20,
        visible: () => container.active,
        result: {
          type: 'callback',
          activate: () => void this.launchBeachcombing(scene),
        },
      },
    ]);
  }

  private launchBeachcombing(scene: Phaser.Scene): void {
    void launchMiniGame(scene, {
      gameId: MINI_GAME_IDS.coralBeachcombing,
      source: 'world',
      worldContext: {
        locationId: 'starlight-beach',
        interactionId: 'interaction:activity:coral-beachcombing',
      },
    });
  }

  private destroyRuntime(): void {
    if (!this.runtime) {
      return;
    }
    getSceneInteractionRegistry(this.runtime.scene).clearOwner(REGISTRY_OWNER);
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
