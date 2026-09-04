import Phaser from 'phaser';
import {
  MOONCAP_TRAIL_RACE_ID,
  PETAL_PARADE_RACE_ID,
  RAINBOW_CUP_COMPLETE_FLAG,
  SHORELINE_SURGE_RACE_ID,
} from '../../content/r65RaceExpansion';
import { BEACH_RACE_ROUTE_READY_FLAG } from '../../content/r65StarlightBeach';
import { WHISPERING_WOODS_REGION_DISCOVERY_ID } from '../../content/r5WhisperingWoods';
import { GAME_WIDTH } from '../config/gameConstants';
import {
  WORLD_INTERACTION_PROMPT,
  WorldInteractionInput,
} from '../interaction/WorldInteractionInput';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import type { SaveGame } from '../save/saveSchema';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';
import {
  setStarlightBeachPlayerSpawn,
  STARLIGHT_BEACH_LOCATION_ID,
} from '../world/StarlightBeachMap';
import {
  setWhisperingWoodsPlayerSpawn,
  WHISPERING_WOODS_LOCATION_ID,
} from '../world/WhisperingWoodsMap';
import { setWorldArrivalFacing } from '../world/WorldArrivalState';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import { getActiveRaceCourse, selectRaceCourse } from './RaceCourse';
import {
  createR65RacePresentation,
  getR65RaceThemeIcon,
  isR65ExpandedRace,
} from './R65RacePresentation';
import { createRainbowCupOverlay } from './R65RainbowCupOverlay';
import type { RaceRunState } from './RaceRun';

type WorldSceneKey = 'RainbowMeadowScene' | 'WhisperingWoodsScene' | 'StarlightBeachScene';
type RaceLaunchMode = 'direct' | 'cup';

interface Point {
  x: number;
  y: number;
}

interface RaceEntryDefinition {
  id: string;
  sceneKey: WorldSceneKey;
  label: string;
  actionLabel: string;
  icon: string;
  position: Point;
  radius: number;
  courseId?: string;
  cup?: boolean;
}

interface RaceEntryRuntime {
  definition: RaceEntryDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
}

interface WorldSceneState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  entries: RaceEntryRuntime[];
  feedback: Phaser.GameObjects.Text;
  feedbackTimer: Phaser.Time.TimerEvent | null;
}

interface RaceLaunchContext {
  mode: RaceLaunchMode;
  originSceneKey: WorldSceneKey;
}

interface RaceSceneRuntime extends Phaser.Scene {
  runState: RaceRunState;
}

const WORLD_SCENE_KEYS: readonly WorldSceneKey[] = [
  'RainbowMeadowScene',
  'WhisperingWoodsScene',
  'StarlightBeachScene',
];

const ENTRIES: readonly RaceEntryDefinition[] = [
  {
    id: 'petal-parade',
    sceneKey: 'RainbowMeadowScene',
    label: 'Petal Parade',
    actionLabel: 'Race',
    icon: '🌸',
    position: { x: 3000, y: 780 },
    radius: 165,
    courseId: PETAL_PARADE_RACE_ID,
  },
  {
    id: 'rainbow-cup',
    sceneKey: 'RainbowMeadowScene',
    label: 'Rainbow Cup',
    actionLabel: 'View events',
    icon: '🏆',
    position: { x: 3060, y: 1480 },
    radius: 170,
    cup: true,
  },
  {
    id: 'mooncap-trail',
    sceneKey: 'WhisperingWoodsScene',
    label: 'Mooncap Trail',
    actionLabel: 'Race',
    icon: '🍄',
    position: { x: 1500, y: 560 },
    radius: 165,
    courseId: MOONCAP_TRAIL_RACE_ID,
  },
  {
    id: 'shoreline-surge',
    sceneKey: 'StarlightBeachScene',
    label: 'Shoreline Surge',
    actionLabel: 'Race',
    icon: '🐚',
    position: { x: 2850, y: 720 },
    radius: 165,
    courseId: SHORELINE_SURGE_RACE_ID,
  },
];

function findPlayer(scene: Phaser.Scene): Phaser.GameObjects.Sprite | null {
  const named = scene.children.getByName(WORLD_PLAYER_NAME);
  if (named instanceof Phaser.GameObjects.Sprite) {
    return named;
  }
  return (
    (scene.children.list.find(
      (object) =>
        object instanceof Phaser.GameObjects.Sprite &&
        object.texture.key.startsWith('player-unicorn-'),
    ) as Phaser.GameObjects.Sprite | undefined) ?? null
  );
}

function distance(left: Point, right: Point): number {
  return Phaser.Math.Distance.Between(left.x, left.y, right.x, right.y);
}

function courseUnlock(save: SaveGame, courseId: string): { unlocked: boolean; clue: string } {
  if (courseId === SHORELINE_SURGE_RACE_ID) {
    const unlocked = save.world.flags[BEACH_RACE_ROUTE_READY_FLAG] === true;
    return unlocked
      ? { unlocked: true, clue: 'Skipper’s route is ready.' }
      : { unlocked: false, clue: 'Help Skipper finish Follow the Wind first.' };
  }
  if (courseId === MOONCAP_TRAIL_RACE_ID) {
    const unlocked = save.collections.discoveryIds.includes(WHISPERING_WOODS_REGION_DISCOVERY_ID);
    return unlocked
      ? { unlocked: true, clue: 'Mooncap Trail is ready.' }
      : { unlocked: false, clue: 'Explore Whispering Woods first.' };
  }
  return { unlocked: true, clue: 'Ready to race.' };
}

export class R65RaceExpansionWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly worldStates = new Map<string, WorldSceneState>();
  private launchContext: RaceLaunchContext | null = null;
  private raceWasActive = false;
  private raceTheme: Phaser.GameObjects.Container | null = null;
  private raceFinishNote: Phaser.GameObjects.Text | null = null;
  private cupOverlay: Phaser.GameObjects.Container | null = null;
  private reopenCupAfterRace = false;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyAll();
    });
  }

  private update(): void {
    this.updateRacePresentationAndReturn();

    for (const sceneKey of WORLD_SCENE_KEYS) {
      const scene = this.game.scene.getScene(sceneKey);
      if (!scene?.scene.isActive()) {
        this.destroyWorldState(sceneKey);
        continue;
      }
      this.updateWorldState(this.ensureWorldState(scene, sceneKey));
    }

    if (!this.reopenCupAfterRace) {
      return;
    }
    const meadow = this.game.scene.getScene('RainbowMeadowScene');
    if (meadow?.scene.isActive()) {
      this.reopenCupAfterRace = false;
      this.openCupOverlay(meadow);
    }
  }

  private ensureWorldState(scene: Phaser.Scene, sceneKey: WorldSceneKey): WorldSceneState {
    const existing = this.worldStates.get(sceneKey);
    if (existing?.scene === scene && existing.feedback.active) {
      return existing;
    }
    this.destroyWorldState(sceneKey);

    const state: WorldSceneState = {
      scene,
      input: new WorldInteractionInput(scene),
      entries: [],
      feedback: scene.add
        .text(GAME_WIDTH / 2, 128, '', {
          color: '#514b65',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#fff8eaf2',
          padding: { x: 16, y: 9 },
          wordWrap: { width: 720 },
        })
        .setName('r6.5-wp12-race-feedback')
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(20_200)
        .setVisible(false),
      feedbackTimer: null,
    };

    for (const definition of ENTRIES.filter((entry) => entry.sceneKey === sceneKey)) {
      state.entries.push(this.createEntry(state, definition));
    }
    this.worldStates.set(sceneKey, state);
    return state;
  }

  private createEntry(state: WorldSceneState, definition: RaceEntryDefinition): RaceEntryRuntime {
    const plate = state.scene.add
      .circle(0, 0, definition.cup ? 46 : 38, definition.cup ? 0xffd76e : 0xffefb6, 0.88)
      .setStrokeStyle(5, definition.cup ? 0xb57cb4 : 0xffffff, 0.95);
    const icon = state.scene.add
      .text(0, -2, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: definition.cup ? '38px' : '32px',
      })
      .setOrigin(0.5);
    const name = state.scene.add
      .text(0, -62, definition.label, {
        color: '#594c67',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e8ee',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5);
    const prompt = state.scene.add
      .text(0, 61, '', {
        color: '#594c67',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff9e8f0',
        padding: { x: 9, y: 5 },
        wordWrap: { width: 310 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 150, 150);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [plate, icon, name, prompt, zone])
      .setName(`r6.5-wp12-race-entry:${definition.id}`)
      .setDepth(16);

    state.input.bindPointer(zone, () => this.tryActivateEntry(state, definition));
    state.scene.tweens.add({
      targets: plate,
      alpha: { from: 0.56, to: 1 },
      scale: { from: 0.94, to: 1.08 },
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return { definition, container, prompt };
  }

  private updateWorldState(state: WorldSceneState): void {
    const player = findPlayer(state.scene);
    if (!player) {
      return;
    }
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    let nearest: RaceEntryRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const runtime of state.entries) {
      const pointDistance = distance(player, runtime.definition.position);
      const unlock = runtime.definition.courseId
        ? courseUnlock(save, runtime.definition.courseId)
        : { unlocked: true, clue: '' };
      runtime.prompt.setText(
        unlock.unlocked
          ? `${runtime.definition.actionLabel}: ${runtime.definition.label} · ${WORLD_INTERACTION_PROMPT}`
          : `🔒 ${unlock.clue}`,
      );
      runtime.prompt.setVisible(pointDistance <= runtime.definition.radius + 105);
      if (pointDistance <= runtime.definition.radius && pointDistance < nearestDistance) {
        nearest = runtime;
        nearestDistance = pointDistance;
      }
    }

    if (nearest && state.input.justPressed()) {
      this.tryActivateEntry(state, nearest.definition);
    }
  }

  private tryActivateEntry(state: WorldSceneState, definition: RaceEntryDefinition): void {
    const player = findPlayer(state.scene);
    if (!player || distance(player, definition.position) > definition.radius) {
      return;
    }
    if (definition.cup) {
      this.openCupOverlay(state.scene);
      return;
    }
    if (!definition.courseId) {
      return;
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const unlock = courseUnlock(save, definition.courseId);
    if (!unlock.unlocked) {
      this.showFeedback(state, `🔒 ${unlock.clue}`);
      return;
    }
    this.startRace(state.scene, definition.courseId, 'direct', definition.sceneKey);
  }

  private startRace(
    scene: Phaser.Scene,
    courseId: string,
    mode: RaceLaunchMode,
    originSceneKey: WorldSceneKey,
  ): void {
    this.closeCupOverlay();
    this.launchContext = { mode, originSceneKey };
    this.reopenCupAfterRace = false;

    if (originSceneKey === 'RainbowMeadowScene') {
      saveLocationCheckpoint(this.saveService, RAINBOW_MEADOW_LOCATION_ID);
    } else if (originSceneKey === 'WhisperingWoodsScene') {
      saveLocationCheckpoint(this.saveService, WHISPERING_WOODS_LOCATION_ID);
    } else {
      saveLocationCheckpoint(this.saveService, STARLIGHT_BEACH_LOCATION_ID);
    }
    selectRaceCourse(courseId);
    scene.scene.start('RaceScene');
  }

  private openCupOverlay(scene: Phaser.Scene): void {
    if (this.cupOverlay?.active) {
      return;
    }
    this.closeCupOverlay();
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    this.cupOverlay = createRainbowCupOverlay(
      scene,
      save,
      (courseId) => this.startRace(scene, courseId, 'cup', 'RainbowMeadowScene'),
      () => {
        this.cupOverlay = null;
      },
    );
  }

  private closeCupOverlay(): void {
    this.cupOverlay?.destroy(true);
    this.cupOverlay = null;
  }

  private updateRacePresentationAndReturn(): void {
    const raceScene = this.game.scene.getScene('RaceScene');
    const course = getActiveRaceCourse();
    const newRaceActive = raceScene?.scene.isActive() && isR65ExpandedRace(course.id);

    if (newRaceActive && raceScene) {
      this.raceWasActive = true;
      this.ensureRacePresentation(raceScene, course.id);
      const runtime = raceScene as RaceSceneRuntime;
      if (runtime.runState?.movement.finished && !this.raceFinishNote?.active) {
        this.createFinishNote(raceScene, course.id, course.name);
      }
      return;
    }

    this.clearRacePresentation();
    if (!this.raceWasActive) {
      return;
    }
    const meadow = this.game.scene.getScene('RainbowMeadowScene');
    if (!meadow?.scene.isActive()) {
      return;
    }

    this.raceWasActive = false;
    const context = this.launchContext;
    this.launchContext = null;
    if (!context) {
      return;
    }
    if (context.mode === 'cup') {
      this.reopenCupAfterRace = true;
      return;
    }
    this.returnDirectRace(meadow, context.originSceneKey);
  }

  private ensureRacePresentation(scene: Phaser.Scene, courseId: string): void {
    const expectedName = `r6.5-wp12-race-theme:${courseId}`;
    if (this.raceTheme?.active && this.raceTheme.name === expectedName) {
      return;
    }
    this.clearRacePresentation();
    this.raceTheme = createR65RacePresentation(scene, courseId);
  }

  private createFinishNote(scene: Phaser.Scene, courseId: string, courseName: string): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const cupComplete = save.world.flags[RAINBOW_CUP_COMPLETE_FLAG] === true;
    this.raceFinishNote = scene.add
      .text(
        GAME_WIDTH / 2,
        135,
        cupComplete
          ? '🏆 Rainbow Cup complete • your Pennant is waiting in the Cottage!'
          : `${getR65RaceThemeIcon(courseId)} ${courseName} result saved • every finish counts`,
        {
          color: '#564b67',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          backgroundColor: '#fff9e8ee',
          padding: { x: 12, y: 7 },
        },
      )
      .setName('r6.5-wp12-race-finish-note')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(230);
  }

  private returnDirectRace(meadow: Phaser.Scene, originSceneKey: WorldSceneKey): void {
    if (originSceneKey === 'WhisperingWoodsScene') {
      setWhisperingWoodsPlayerSpawn({ x: 1500, y: 720 });
      setWorldArrivalFacing('WhisperingWoodsScene', 'left');
      saveLocationCheckpoint(this.saveService, WHISPERING_WOODS_LOCATION_ID);
      meadow.scene.start('WhisperingWoodsScene');
      return;
    }
    if (originSceneKey === 'StarlightBeachScene') {
      setStarlightBeachPlayerSpawn({ x: 2740, y: 900 });
      setWorldArrivalFacing('StarlightBeachScene', 'left');
      saveLocationCheckpoint(this.saveService, STARLIGHT_BEACH_LOCATION_ID);
      meadow.scene.start('StarlightBeachScene');
      return;
    }

    const raceEntrance = RAINBOW_MEADOW_MAP.hubFeatures.find(
      (feature) => feature.id === 'rainbow-run-entrance',
    );
    if (raceEntrance) {
      setRainbowMeadowPlayerSpawn(raceEntrance.approach);
    }
    saveLocationCheckpoint(this.saveService, RAINBOW_MEADOW_LOCATION_ID);
  }

  private clearRacePresentation(): void {
    this.raceTheme?.destroy(true);
    this.raceTheme = null;
    this.raceFinishNote?.destroy();
    this.raceFinishNote = null;
  }

  private showFeedback(state: WorldSceneState, message: string): void {
    state.feedbackTimer?.destroy();
    state.feedback.setText(message).setVisible(true);
    state.feedbackTimer = state.scene.time.delayedCall(3200, () => {
      if (state.feedback.active) {
        state.feedback.setVisible(false);
      }
      state.feedbackTimer = null;
    });
  }

  private destroyWorldState(sceneKey: string): void {
    const state = this.worldStates.get(sceneKey);
    if (!state) {
      return;
    }
    state.feedbackTimer?.destroy();
    state.input.destroy();
    for (const entry of state.entries) {
      entry.container.destroy(true);
    }
    state.feedback.destroy();
    this.worldStates.delete(sceneKey);
    if (sceneKey === 'RainbowMeadowScene') {
      this.closeCupOverlay();
    }
  }

  private destroyAll(): void {
    for (const sceneKey of [...this.worldStates.keys()]) {
      this.destroyWorldState(sceneKey);
    }
    this.closeCupOverlay();
    this.clearRacePresentation();
    this.launchContext = null;
  }
}

let manager: R65RaceExpansionWorldManager | null = null;

export function getR65RaceExpansionWorldManager(game: Phaser.Game): R65RaceExpansionWorldManager {
  manager ??= new R65RaceExpansionWorldManager(game);
  return manager;
}
