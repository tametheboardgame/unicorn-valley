import Phaser from 'phaser';
import {
  MOONCAP_TRAIL_RACE_ID,
  PETAL_PARADE_RACE_ID,
  RAINBOW_CUP_COMPLETE_FLAG,
  SHORELINE_SURGE_RACE_ID,
} from '../../content/r65RaceExpansion';
import { BEACH_RACE_ROUTE_READY_FLAG } from '../../content/r65StarlightBeach';
import { WHISPERING_WOODS_REGION_DISCOVERY_ID } from '../../content/r5WhisperingWoods';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
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
import { getRainbowCupEventStates, isRainbowCupComplete } from './RainbowCup';
import { getActiveRaceCourse, selectRaceCourse } from './RaceCourse';
import type { RaceRunState } from './RaceRun';
import { getRaceShortcut } from './RaceShortcut';

interface Point {
  x: number;
  y: number;
}

interface RaceEntryDefinition {
  id: string;
  sceneKey: 'RainbowMeadowScene' | 'WhisperingWoodsScene' | 'StarlightBeachScene';
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
  zone: Phaser.GameObjects.Zone;
}

interface WorldSceneState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  entries: RaceEntryRuntime[];
  feedback: Phaser.GameObjects.Text;
  feedbackTimer: Phaser.Time.TimerEvent | null;
}

type RaceLaunchMode = 'direct' | 'cup';

interface RaceLaunchContext {
  mode: RaceLaunchMode;
  courseId: string;
  originSceneKey: RaceEntryDefinition['sceneKey'];
}

interface RaceSceneRuntime extends Phaser.Scene {
  runState: RaceRunState;
}

interface RaceTheme {
  background: string;
  terrain: number;
  accent: number;
  secondary: number;
  icon: string;
  subtitle: string;
}

const NEW_COURSE_IDS = new Set([
  PETAL_PARADE_RACE_ID,
  MOONCAP_TRAIL_RACE_ID,
  SHORELINE_SURGE_RACE_ID,
]);

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

const THEMES: Readonly<Record<string, RaceTheme>> = {
  [PETAL_PARADE_RACE_ID]: {
    background: '#a8e4f2',
    terrain: 0x8ccd78,
    accent: 0xf3a7ce,
    secondary: 0xffda72,
    icon: '🌸',
    subtitle: 'Meadow petals, breezes and bright flower gates',
  },
  [MOONCAP_TRAIL_RACE_ID]: {
    background: '#294b48',
    terrain: 0x466b4d,
    accent: 0xb8e58a,
    secondary: 0xcab4e7,
    icon: '🍄',
    subtitle: 'Mooncaps, roots and a hidden Root Hop route',
  },
  [SHORELINE_SURGE_RACE_ID]: {
    background: '#8fdcf0',
    terrain: 0xe6d196,
    accent: 0x7bd4e4,
    secondary: 0xf5d7b2,
    icon: '🐚',
    subtitle: 'Skipper’s dunes-to-Moonlit-Point shoreline run',
  },
};

const COURSE_START_X = 260;
const COURSE_GROUND_Y = 575;

function findPlayer(scene: Phaser.Scene): Phaser.GameObjects.Sprite | null {
  const named = scene.children.getByName(WORLD_PLAYER_NAME);
  if (named instanceof Phaser.GameObjects.Sprite) {
    return named;
  }
  return (
    (scene.children.list.find(
      (object) =>
        object instanceof Phaser.GameObjects.Sprite && object.texture.key.startsWith('player-unicorn-'),
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

function formatBestTime(bestTimeMs: number | null): string {
  return bestTimeMs === null ? 'Not finished yet' : `Best ${(bestTimeMs / 1000).toFixed(1)}s`;
}

export class R65RaceExpansionWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly worldStates = new Map<string, WorldSceneState>();
  private launchContext: RaceLaunchContext | null = null;
  private raceWasActive = false;
  private raceThemeAnchor: Phaser.GameObjects.Container | null = null;
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

    for (const sceneKey of ['RainbowMeadowScene', 'WhisperingWoodsScene', 'StarlightBeachScene'] as const) {
      const scene = this.game.scene.getScene(sceneKey);
      if (!scene?.scene.isActive()) {
        this.destroyWorldState(sceneKey);
        continue;
      }
      const state = this.ensureWorldState(scene, sceneKey);
      this.updateWorldState(state);
    }

    if (this.reopenCupAfterRace) {
      const meadow = this.game.scene.getScene('RainbowMeadowScene');
      if (meadow?.scene.isActive()) {
        this.reopenCupAfterRace = false;
        this.openCupOverlay(meadow);
      }
    }
  }

  private ensureWorldState(
    scene: Phaser.Scene,
    sceneKey: RaceEntryDefinition['sceneKey'],
  ): WorldSceneState {
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
    return { definition, container, prompt, zone };
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
    originSceneKey: RaceEntryDefinition['sceneKey'],
  ): void {
    this.closeCupOverlay();
    this.launchContext = { mode, courseId, originSceneKey };
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
    const events = getRainbowCupEventStates(save);
    const complete = isRainbowCupComplete(save);
    const children: Phaser.GameObjects.GameObject[] = [];

    const shadow = scene.add.rectangle(GAME_WIDTH / 2 + 10, GAME_HEIGHT / 2 + 10, 900, 650, 0x3e3650, 0.38);
    const panel = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 880, 630, 0xfff9e8, 0.99)
      .setStrokeStyle(6, 0xb78ab9, 1);
    children.push(shadow, panel);
    children.push(
      scene.add
        .text(GAME_WIDTH / 2, 82, complete ? '🏆 Rainbow Cup Complete!' : '🏆 Rainbow Cup', {
          color: '#634d70',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '31px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
      scene.add
        .text(
          GAME_WIDTH / 2,
          122,
          complete
            ? 'You finished every regular course. Every finish counted.'
            : 'Finish all five courses. You never have to win for your finish to count.',
          {
            color: '#755e7d',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5),
    );

    events.forEach((event, index) => {
      const y = 185 + index * 78;
      const row = scene.add
        .rectangle(GAME_WIDTH / 2, y, 750, 64, event.completed ? 0xe9f6d7 : 0xf4e9f8, 1)
        .setStrokeStyle(3, event.unlocked ? 0xb58bc0 : 0xc2b9c6, 0.9);
      const status = event.completed
        ? `✓ ${formatBestTime(event.bestTimeMs)}`
        : event.unlocked
          ? `Ready • ${formatBestTime(event.bestTimeMs)}`
          : `🔒 ${event.clue}`;
      const text = scene.add
        .text(GAME_WIDTH / 2 - 338, y, `${event.icon}  ${event.name}\n${status}`, {
          color: event.unlocked ? '#5d4c68' : '#8a808e',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          lineSpacing: 4,
        })
        .setOrigin(0, 0.5);
      children.push(row, text);
      if (event.unlocked) {
        const button = scene.add
          .text(GAME_WIDTH / 2 + 315, y, event.completed ? 'Race again' : 'Race', {
            color: '#5c4668',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            backgroundColor: '#ffefb7',
            padding: { x: 12, y: 8 },
          })
          .setOrigin(1, 0.5)
          .setInteractive({ useHandCursor: true });
        button.on('pointerdown', () =>
          this.startRace(scene, event.courseId, 'cup', 'RainbowMeadowScene'),
        );
        children.push(button);
      }
    });

    if (complete) {
      children.push(
        scene.add
          .text(GAME_WIDTH / 2, 586, '🎏 Rainbow Cup Pennant added to your Cottage decorations', {
            color: '#765368',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
    }

    const close = scene.add
      .text(GAME_WIDTH / 2, 645, 'Close', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#eee1f7',
        padding: { x: 22, y: 9 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closeCupOverlay());
    children.push(close);

    this.cupOverlay = scene.add
      .container(0, 0, children)
      .setName('r6.5-wp12-rainbow-cup-overlay')
      .setScrollFactor(0)
      .setDepth(20_500);
  }

  private closeCupOverlay(): void {
    this.cupOverlay?.destroy(true);
    this.cupOverlay = null;
  }

  private updateRacePresentationAndReturn(): void {
    const raceScene = this.game.scene.getScene('RaceScene');
    const course = getActiveRaceCourse();
    const newRaceActive =
      raceScene?.scene.isActive() && NEW_COURSE_IDS.has(course.id as typeof PETAL_PARADE_RACE_ID);

    if (newRaceActive && raceScene) {
      this.raceWasActive = true;
      this.ensureRaceTheme(raceScene, course.id);
      const runtime = raceScene as RaceSceneRuntime;
      if (runtime.runState?.movement.finished && !this.raceFinishNote?.active) {
        const save = this.saveService.load() ?? this.saveService.createNewGame();
        const cupComplete = save.world.flags[RAINBOW_CUP_COMPLETE_FLAG] === true;
        this.raceFinishNote = raceScene.add
          .text(
            GAME_WIDTH / 2,
            135,
            cupComplete
              ? '🏆 Rainbow Cup complete • your Pennant is waiting in the Cottage!'
              : `${THEMES[course.id]?.icon ?? '🏁'} ${course.name} result saved • every finish counts`,
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
      return;
    }

    this.clearRaceTheme();
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

    if (context.originSceneKey === 'WhisperingWoodsScene') {
      setWhisperingWoodsPlayerSpawn({ x: 1500, y: 720 });
      setWorldArrivalFacing('WhisperingWoodsScene', 'left');
      saveLocationCheckpoint(this.saveService, WHISPERING_WOODS_LOCATION_ID);
      meadow.scene.start('WhisperingWoodsScene');
      return;
    }

    if (context.originSceneKey === 'StarlightBeachScene') {
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

  private ensureRaceTheme(scene: Phaser.Scene, courseId: string): void {
    const expectedName = `r6.5-wp12-race-theme:${courseId}`;
    if (this.raceThemeAnchor?.active && this.raceThemeAnchor.name === expectedName) {
      return;
    }
    this.clearRaceTheme();
    const theme = THEMES[courseId];
    if (!theme) {
      return;
    }
    const course = getActiveRaceCourse();
    const worldWidth = course.length + 760;
    scene.cameras.main.setBackgroundColor(theme.background);

    const objects: Phaser.GameObjects.GameObject[] = [];
    objects.push(
      scene.add.rectangle(worldWidth / 2, 250, worldWidth, 500, theme.terrain, 0.18),
      scene.add.rectangle(worldWidth / 2, 690, worldWidth, 110, theme.terrain, 0.62),
    );
    for (let x = 480, index = 0; x < COURSE_START_X + course.length - 120; x += 410, index += 1) {
      objects.push(
        scene.add
          .text(x, index % 2 === 0 ? 470 : 670, index % 3 === 0 ? theme.icon : '✦', {
            color: index % 2 === 0 ? '#fff7cf' : '#ffffff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: index % 3 === 0 ? '34px' : '24px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setAlpha(0.72),
      );
    }
    objects.push(
      scene.add
        .text(GAME_WIDTH / 2, 105, `${theme.icon} ${course.name}\n${theme.subtitle}`, {
          color: '#594b66',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#fff9e8e8',
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0),
    );

    const shortcut = getRaceShortcut(courseId);
    if (shortcut) {
      const entryX = COURSE_START_X + shortcut.entryStartProgress;
      const exitX = COURSE_START_X + shortcut.entryEndProgress + shortcut.progressSkip;
      objects.push(
        scene.add
          .rectangle((entryX + exitX) / 2, 500, Math.max(180, exitX - entryX), 48, theme.accent, 0.54)
          .setStrokeStyle(4, theme.secondary, 0.9),
        scene.add
          .text(entryX + 120, 446, `${shortcut.label.toUpperCase()} ↗\nJump into the glowing route!`, {
            color: '#4f4d62',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            align: 'center',
            backgroundColor: '#fff9e8e8',
            padding: { x: 9, y: 5 },
          })
          .setOrigin(0.5),
      );
    }

    this.raceThemeAnchor = scene.add
      .container(0, 0, objects)
      .setName(expectedName)
      .setDepth(8);
  }

  private clearRaceTheme(): void {
    this.raceThemeAnchor?.destroy(true);
    this.raceThemeAnchor = null;
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
    this.clearRaceTheme();
    this.launchContext = null;
  }
}

let manager: R65RaceExpansionWorldManager | null = null;

export function getR65RaceExpansionWorldManager(game: Phaser.Game): R65RaceExpansionWorldManager {
  manager ??= new R65RaceExpansionWorldManager(game);
  return manager;
}
