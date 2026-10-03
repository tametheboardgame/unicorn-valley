import Phaser from 'phaser';
import { PEBBLE_FOUNTAIN_REPAIRED_FLAG } from '../../content/r4PebbleStory';
import {
  TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID,
  TANSY_MAP_HUNT_ACTIVE_FLAG,
  TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID,
  TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID,
} from '../../content/r6VillageContent';
import { buildSunbeamNoticeBoard } from '../activities/SunbeamNoticeBoardModel';
import { VillageNoticeBoardScene } from '../activities/VillageNoticeBoardScene';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { DiscoveryService } from '../discovery/DiscoveryService';
import type { InteractionActionKind, InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserSaveService } from '../save/browserSaveService';
import { MINI_GAME_IDS } from '../minigames/MiniGameCatalogue';
import { launchMiniGame } from '../minigames/MiniGameLauncher';
import { getWorldFeedbackPresenter } from '../ui/WorldFeedbackPresenter';
import { SUNBEAM_VILLAGE_LAYOUT } from './SunbeamVillageLayout';
import { worldDepthForY } from './WorldDepth';

interface VillageLifePoint {
  id: string;
  label: string;
  actionLabel: string;
  actionKind: InteractionActionKind;
  x: number;
  y: number;
  radius: number;
  createProp: (scene: Phaser.Scene) => Phaser.GameObjects.GameObject[];
}

interface VillageLifeRuntime {
  definition: VillageLifePoint;
  container: Phaser.GameObjects.Container;
}

interface VillageLifeState {
  scene: Phaser.Scene;
  points: VillageLifeRuntime[];
}

const REGISTRY_OWNER = 'village-life';
const VILLAGE_POINTS: readonly VillageLifePoint[] = [
  {
    id: 'notice-board',
    label: 'Village notice board',
    actionLabel: 'Read',
    actionKind: 'inspect',
    x: SUNBEAM_VILLAGE_LAYOUT.villageLife.noticeBoard.x,
    y: SUNBEAM_VILLAGE_LAYOUT.villageLife.noticeBoard.y,
    radius: SUNBEAM_VILLAGE_LAYOUT.villageLife.noticeBoard.interactionRadius,
    createProp: (scene) => [
      scene.add.ellipse(0, 46, 174, 72, 0x7eb66d, 0.26),
      scene.add.rectangle(-42, 50, 12, 86, 0x795641, 1),
      scene.add.rectangle(42, 50, 12, 86, 0x795641, 1),
      scene.add.rectangle(0, 0, 126, 96, 0x9a684c, 1).setStrokeStyle(5, 0x6e4939, 0.95),
      scene.add.rectangle(0, -2, 102, 70, 0xffedbd, 1).setStrokeStyle(2, 0xd8a76d, 0.9),
      scene.add
        .text(0, -4, '📌  ✦  📜', { fontFamily: 'system-ui, sans-serif', fontSize: '20px' })
        .setOrigin(0.5),
      scene.add.circle(-66, 48, 9, 0xf2a2b8, 0.9),
      scene.add.circle(66, 48, 9, 0xf3cc70, 0.9),
    ],
  },
  {
    id: 'sundial',
    label: 'Sunny little sundial',
    actionLabel: 'Inspect',
    actionKind: 'inspect',
    x: SUNBEAM_VILLAGE_LAYOUT.villageLife.sundial.x,
    y: SUNBEAM_VILLAGE_LAYOUT.villageLife.sundial.y,
    radius: SUNBEAM_VILLAGE_LAYOUT.villageLife.sundial.interactionRadius,
    createProp: (scene) => {
      const objects: Phaser.GameObjects.GameObject[] = [
        scene.add.ellipse(0, 48, 154, 62, 0x6f654f, 0.2),
        scene.add.ellipse(0, 31, 126, 58, 0xbca77f, 1).setStrokeStyle(4, 0x8b7659, 0.92),
        scene.add.rectangle(0, 8, 42, 58, 0xc7b28a, 1).setStrokeStyle(3, 0x8c775a, 0.94),
        scene.add.ellipse(0, -22, 116, 58, 0xd9c79b, 1).setStrokeStyle(5, 0x927c5b, 0.96),
        scene.add.ellipse(0, -24, 92, 43, 0xcaa55a, 1).setStrokeStyle(3, 0x8f6c3c, 0.92),
      ];

      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        const tick = scene.add
          .rectangle(Math.cos(angle) * 37, -24 + Math.sin(angle) * 16, 3, 10, 0x7c5b38, 0.9)
          .setRotation(angle + Math.PI / 2);
        objects.push(tick);
      }

      objects.push(
        scene.add.triangle(0, -41, 0, -30, -7, 14, 7, 14, 0x715039, 1),
        scene.add.rectangle(4, -23, 33, 4, 0x624735, 0.24).setRotation(0.16).setOrigin(0, 0.5),
        scene.add.circle(0, -24, 4, 0x6a4933, 1).setStrokeStyle(1, 0xe1c88c, 0.85),
        scene.add
          .text(0, -49, 'N', {
            color: '#6f5239',
            fontFamily: 'Georgia, serif',
            fontSize: '10px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );

      return objects;
    },
  },
  {
    id: 'bench',
    label: 'Village bench',
    actionLabel: 'Sit',
    actionKind: 'interact',
    x: SUNBEAM_VILLAGE_LAYOUT.villageLife.bench.x,
    y: SUNBEAM_VILLAGE_LAYOUT.villageLife.bench.y,
    radius: SUNBEAM_VILLAGE_LAYOUT.villageLife.bench.interactionRadius,
    // H3.11.8C renders the grouped seating as part of the authored chess plaza.
    // Village Life keeps ownership of the familiar Sit interaction only.
    createProp: () => [],
  },
  {
    id: 'thread-window',
    label: 'Twinkle & Thread window',
    actionLabel: 'Look',
    actionKind: 'inspect',
    x: SUNBEAM_VILLAGE_LAYOUT.villageLife.threadWindow.x,
    y: SUNBEAM_VILLAGE_LAYOUT.villageLife.threadWindow.y,
    radius: SUNBEAM_VILLAGE_LAYOUT.villageLife.threadWindow.interactionRadius,
    // The display itself is now a child of the Twinkle & Thread facade. Village Life owns only
    // the nearby inspect target so it cannot drift away from the authored shop frontage again.
    createProp: () => [],
  },
  {
    id: 'fountain-splash',
    label: 'Sunbeam Fountain water',
    actionLabel: 'Splash',
    actionKind: 'interact',
    x: SUNBEAM_VILLAGE_LAYOUT.fountain.x,
    y: SUNBEAM_VILLAGE_LAYOUT.fountain.y,
    radius: SUNBEAM_VILLAGE_LAYOUT.fountain.interactionRadius,
    // The fountain already communicates water visually. Keep only the interaction anchor instead
    // of adding a detached droplet marker on top of the plaza.
    createProp: () => [],
  },
];

export class VillageLifeWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly discoveryService = new DiscoveryService(this.saveService);
  private readonly timeService = getBrowserAtmosphericTimeService(this.saveService);
  private state: VillageLifeState | null = null;
  private noticeBoardLaunchPending = false;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('SunbeamVillageScene');
    if (!scene?.scene.isActive()) {
      this.destroyState();
      return;
    }
    this.ensureState(scene);
  }

  private ensureState(scene: Phaser.Scene): VillageLifeState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();
    const state: VillageLifeState = { scene, points: [] };
    for (const definition of VILLAGE_POINTS) {
      const container = scene.add
        .container(definition.x, definition.y, definition.createProp(scene))
        .setName(`village-life:${definition.id}`)
        .setDepth(worldDepthForY(definition.y + 24, 0.3));
      state.points.push({ definition, container });
    }
    this.state = state;
    this.publishTargets(state);
    return state;
  }

  private publishTargets(state: VillageLifeState): void {
    const targets: InteractionTarget[] = state.points.map(({ definition, container }) => ({
      id: `interaction:village-life:${definition.id}`,
      label: definition.label,
      actionLabel: definition.actionLabel,
      actionKind: definition.actionKind,
      position: { x: definition.x, y: definition.y },
      interactionRadius: definition.radius,
      priority: 10,
      visible: () => container.active,
      result: {
        type: 'callback',
        activate: () => this.activate(state, definition),
      },
    }));
    const { table } = SUNBEAM_VILLAGE_LAYOUT.chessPlaza;
    targets.push({
      id: 'interaction:activity:sunbeam-chess',
      label: 'Sunbeam chess table',
      actionLabel: 'Play chess',
      actionKind: 'start',
      position: { ...table.interaction },
      interactionRadius: table.interactionRadius,
      priority: 24,
      visible: () => state.scene.scene.isActive(),
      result: {
        type: 'callback',
        activate: () => this.launchChess(state.scene),
      },
    });

    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
  }

  private launchChess(scene: Phaser.Scene): void {
    void launchMiniGame(scene, {
      gameId: MINI_GAME_IDS.sunbeamChess,
      source: 'world',
      worldContext: { interactionId: 'interaction:village:chess-plaza' },
    });
  }

  private launchNoticeBoard(
    scene: Phaser.Scene,
    options: { fountainRepaired: boolean; mapCornerFoundNow: boolean },
  ): void {
    if (this.noticeBoardLaunchPending) {
      return;
    }

    this.noticeBoardLaunchPending = true;
    try {
      if (!this.game.scene.keys.VillageNoticeBoardScene) {
        this.game.scene.add('VillageNoticeBoardScene', VillageNoticeBoardScene);
      }
      scene.scene.launch('VillageNoticeBoardScene', {
        returnScene: 'SunbeamVillageScene',
        notices: buildSunbeamNoticeBoard({
          timeState: this.timeService.getState(),
          fountainRepaired: options.fountainRepaired,
          mapCornerFoundNow: options.mapCornerFoundNow,
        }),
        initialNoticeId: options.mapCornerFoundNow ? 'map-corner' : undefined,
      });
      scene.scene.pause();
    } finally {
      this.noticeBoardLaunchPending = false;
    }
  }

  private activate(state: VillageLifeState, definition: VillageLifePoint): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const hunting = save.world.flags[TANSY_MAP_HUNT_ACTIVE_FLAG] === true;
    const noticeFound = this.discoveryService.hasDiscovery(TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID);
    const bakeryFound = this.discoveryService.hasDiscovery(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID);
    const sundialFound = this.discoveryService.hasDiscovery(TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID);

    if (definition.id === 'notice-board') {
      const mapCornerFoundNow = hunting && !noticeFound;
      if (mapCornerFoundNow) {
        this.discoveryService.unlockDiscovery(TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID);
      }
      this.launchNoticeBoard(state.scene, {
        fountainRepaired: save.world.flags[PEBBLE_FOUNTAIN_REPAIRED_FLAG] === true,
        mapCornerFoundNow,
      });
      return;
    }

    if (definition.id === 'sundial') {
      if (hunting && noticeFound && bakeryFound && !sundialFound) {
        this.discoveryService.unlockDiscovery(TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID);
        this.showFeedback(
          state,
          definition,
          '🗺️ Final map corner found! It was wedged beneath the sundial where the breeze could not steal it again.',
        );
        return;
      }
      const sundialMessage = {
        morning: '🌤️ The short morning shadow leans west. Sunbeam is only just getting busy.',
        afternoon:
          '☀️ The sundial shadow is tucked close to its marker. The square is bright and bustling.',
        sunset: '🌅 The long shadow reaches east as warm sunset light washes across the plaza.',
        night:
          '🌙 There is no useful shadow now. Tiny moonlit marks around the rim glimmer instead.',
      }[this.timeService.getState()];
      this.showFeedback(state, definition, sundialMessage);
      return;
    }

    if (definition.id === 'bench') {
      this.showFeedback(
        state,
        definition,
        '🪑 You sit for a moment. From here you can see the Bakery, the fountain and unicorns crossing the square.',
      );
      return;
    }
    if (definition.id === 'thread-window') {
      this.showFeedback(
        state,
        definition,
        '🎀 The window has a starter bow beside two empty stands labelled “More treasures appear as your adventures grow.”',
      );
      return;
    }

    const repaired = save.world.flags[PEBBLE_FOUNTAIN_REPAIRED_FLAG] === true;
    this.showFeedback(
      state,
      definition,
      repaired
        ? '✨ Chime! Pebble’s repaired fountain answers with a bright shimmer and a ring of rainbow sparkles.'
        : '💦 Splash! The quiet fountain sends three tiny rainbow fish-shaped sparkles into the air.',
    );
    if (repaired) {
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        const sparkle = state.scene.add
          .text(definition.x, definition.y, '✦', {
            color: '#fff0a8',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(worldDepthForY(definition.y + 36, 0.9));
        state.scene.tweens.add({
          targets: sparkle,
          x: definition.x + Math.cos(angle) * 94,
          y: definition.y + Math.sin(angle) * 58 - 24,
          alpha: 0,
          duration: 620,
          ease: 'Quad.Out',
          onComplete: () => sparkle.destroy(),
        });
      }
    }
    state.scene.cameras.main.flash(90, 255, 238, 164, false);
  }

  private showFeedback(
    state: VillageLifeState,
    definition: VillageLifePoint,
    message: string,
  ): void {
    getWorldFeedbackPresenter(state.scene).showReaction(
      message,
      { x: definition.x, y: definition.y },
      3300,
    );
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    for (const runtime of this.state.points) {
      runtime.container.destroy(true);
    }
    this.state = null;
  }
}

let browserVillageLifeWorldManager: VillageLifeWorldManager | null = null;

export function getVillageLifeWorldManager(game: Phaser.Game): VillageLifeWorldManager {
  browserVillageLifeWorldManager ??= new VillageLifeWorldManager(game);
  return browserVillageLifeWorldManager;
}
