import Phaser from 'phaser';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import { GAME_WIDTH } from '../config/gameConstants';
import {
  WORLD_INTERACTION_PROMPT,
  WorldInteractionInput,
} from '../interaction/WorldInteractionInput';
import type { PlayerFacing } from '../player/PlayerMovement';
import { getActiveRaceCourse, resetActiveRaceCourse, selectRaceCourse } from '../racing/RaceCourse';
import { getCrystalCascadeUnlockState } from '../racing/RaceProgression';
import type { RaceRunState } from '../racing/RaceRun';
import { getRaceShortcut } from '../racing/RaceShortcut';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import {
  CRYSTAL_BROOK_LOCATION_ID,
  CRYSTAL_BROOK_MAP,
  setCrystalBrookPlayerSpawn,
} from './CrystalBrookMap';
import { RAINBOW_MEADOW_LOCATION_ID, setRainbowMeadowPlayerSpawn } from './RainbowMeadowMap';
import { isWithinInteractiveGateway, shouldActivateWalkThroughGateway } from './RegionGatewayRules';
import { setWorldArrivalFacing } from './WorldArrivalState';
import {
  setWhisperingWoodsPlayerSpawn,
  WHISPERING_WOODS_LOCATION_ID,
  WHISPERING_WOODS_MAP,
} from './WhisperingWoodsMap';
import { WORLD_PLAYER_NAME } from './WorldTraversalPolishManager';

interface RegionGatewayDefinition {
  id: string;
  sceneKey: string;
  label: string;
  position: { x: number; y: number };
  destinationSceneKey: string;
  destinationLocationId: string;
  destinationSpawn: { x: number; y: number };
  destinationFacing: PlayerFacing;
  accent: number;
  icon: string;
  raceCourseId?: string;
}

interface GatewayState {
  scene: Phaser.Scene;
  definition: RegionGatewayDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
  interaction: WorldInteractionInput | null;
  insideWalkThrough: boolean;
}

interface RaceSceneRuntime extends Phaser.Scene {
  runState: RaceRunState;
}

interface CrystalRacePresentationState {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  finishNote: Phaser.GameObjects.Text | null;
  shortcutNoteShown: boolean;
}

const MEADOW_GATE_POSITION = { x: 3030, y: 1750 } as const;
const MEADOW_RETURN_POSITION = { x: 2870, y: 1700 } as const;
const BROOK_ENTRANCE = CRYSTAL_BROOK_MAP.entrances[0];
const BROOK_WOODS_GATE_POSITION = { x: 3260, y: 990 } as const;
const BROOK_WOODS_RETURN_POSITION = { x: 3070, y: 1010 } as const;
const CRYSTAL_CASCADE_GATE_POSITION = { x: 2860, y: 850 } as const;
const CRYSTAL_CASCADE_RETURN_POSITION = { x: 2660, y: 900 } as const;
const WOODS_ENTRANCE = WHISPERING_WOODS_MAP.entrances[0];
const RACE_COURSE_START_X = 260;
const RACE_GROUND_Y = 575;

const R5_REGION_GATEWAYS: readonly RegionGatewayDefinition[] = [
  {
    id: 'gateway:meadow-crystal-brook',
    sceneKey: 'RainbowMeadowScene',
    label: 'Crystal Brook',
    position: MEADOW_GATE_POSITION,
    destinationSceneKey: 'CrystalBrookScene',
    destinationLocationId: CRYSTAL_BROOK_LOCATION_ID,
    destinationSpawn: BROOK_ENTRANCE.approach,
    destinationFacing: 'right',
    accent: 0x74cbd3,
    icon: '💎',
  },
  {
    id: 'gateway:crystal-brook-meadow',
    sceneKey: 'CrystalBrookScene',
    label: 'Rainbow Meadow',
    position: BROOK_ENTRANCE.position,
    destinationSceneKey: 'RainbowMeadowScene',
    destinationLocationId: RAINBOW_MEADOW_LOCATION_ID,
    destinationSpawn: MEADOW_RETURN_POSITION,
    destinationFacing: 'left',
    accent: 0xe5b6df,
    icon: '🌈',
  },
  {
    id: 'gateway:crystal-brook-whispering-woods',
    sceneKey: 'CrystalBrookScene',
    label: 'Whispering Woods',
    position: BROOK_WOODS_GATE_POSITION,
    destinationSceneKey: 'WhisperingWoodsScene',
    destinationLocationId: WHISPERING_WOODS_LOCATION_ID,
    destinationSpawn: WOODS_ENTRANCE.approach,
    destinationFacing: 'right',
    accent: 0x7aaa78,
    icon: '🌲',
  },
  {
    id: 'gateway:whispering-woods-crystal-brook',
    sceneKey: 'WhisperingWoodsScene',
    label: 'Crystal Brook',
    position: WOODS_ENTRANCE.position,
    destinationSceneKey: 'CrystalBrookScene',
    destinationLocationId: CRYSTAL_BROOK_LOCATION_ID,
    destinationSpawn: BROOK_WOODS_RETURN_POSITION,
    destinationFacing: 'left',
    accent: 0x74cbd3,
    icon: '💎',
  },
  {
    id: 'gateway:crystal-brook-crystal-cascade',
    sceneKey: 'CrystalBrookScene',
    label: 'Crystal Cascade',
    position: CRYSTAL_CASCADE_GATE_POSITION,
    destinationSceneKey: 'RaceScene',
    destinationLocationId: CRYSTAL_BROOK_LOCATION_ID,
    destinationSpawn: CRYSTAL_CASCADE_RETURN_POSITION,
    destinationFacing: 'left',
    accent: 0x70d2da,
    icon: '🏁',
    raceCourseId: CRYSTAL_CASCADE_RACE_ID,
  },
];

function findPlayer(scene: Phaser.Scene): Phaser.GameObjects.Sprite | null {
  const player = scene.children.getByName(WORLD_PLAYER_NAME);
  return player instanceof Phaser.GameObjects.Sprite ? player : null;
}

function asRaceScene(scene: Phaser.Scene): RaceSceneRuntime {
  return scene as unknown as RaceSceneRuntime;
}

export class R5RegionGatewayManager {
  private readonly states = new Map<string, GatewayState>();
  private crystalRacePresentation: CrystalRacePresentationState | null = null;
  private crystalRaceWasActive = false;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    this.updateCrystalCascadeRace();

    for (const definition of R5_REGION_GATEWAYS) {
      const scene = this.game.scene.getScene(definition.sceneKey);
      if (!scene?.scene.isActive()) {
        this.clearState(definition.id);
        continue;
      }

      const state = this.ensureState(scene, definition);
      const player = findPlayer(scene);
      if (!player) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        definition.position.x,
        definition.position.y,
      );

      if (!definition.raceCourseId) {
        state.prompt.setVisible(distance <= 245);
        const insideWalkThrough = shouldActivateWalkThroughGateway(distance, false);
        if (insideWalkThrough && !state.insideWalkThrough) {
          state.insideWalkThrough = true;
          this.activateGateway(state);
          return;
        }
        state.insideWalkThrough = insideWalkThrough;
        continue;
      }

      const unlock = this.getRaceUnlockState(definition);
      state.prompt.setText(
        unlock.unlocked
          ? `${WORLD_INTERACTION_PROMPT}: Race ${definition.label}`
          : `🔒 ${unlock.clue}`,
      );
      state.prompt.setVisible(distance <= 285);
      if (isWithinInteractiveGateway(distance) && state.interaction?.justPressed()) {
        this.activateGateway(state);
        return;
      }
    }
  }

  private getRaceUnlockState(definition: RegionGatewayDefinition): {
    unlocked: boolean;
    clue: string;
  } {
    if (definition.raceCourseId !== CRYSTAL_CASCADE_RACE_ID) {
      return { unlocked: true, clue: '' };
    }
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    return getCrystalCascadeUnlockState(save);
  }

  private ensureState(scene: Phaser.Scene, definition: RegionGatewayDefinition): GatewayState {
    const existing = this.states.get(definition.id);
    if (existing?.scene === scene && existing.container.active) {
      return existing;
    }

    this.clearState(definition.id);
    const glow = scene.add.circle(0, 0, 82, definition.accent, 0.15);
    const arch = scene.add
      .rectangle(0, 0, 110, 190, 0xfff5dc, 0.9)
      .setStrokeStyle(7, definition.accent, 0.9);
    const opening = scene.add.rectangle(0, 14, 72, 136, 0x5b7481, 0.82);
    const icon = scene.add
      .text(0, -58, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
      })
      .setOrigin(0.5);
    const sign = scene.add
      .text(0, 118, definition.label, {
        color: '#594e63',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e8e8',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);
    const promptLabel = definition.raceCourseId
      ? `${WORLD_INTERACTION_PROMPT}: Race ${definition.label}`
      : `Walk through to ${definition.label} →`;
    const prompt = scene.add
      .text(0, 160, promptLabel, {
        color: '#5d5068',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff9eef0',
        padding: { x: 9, y: 5 },
        wordWrap: { width: 360 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = scene.add.zone(0, 20, 170, 230);
    const container = scene.add
      .container(definition.position.x, definition.position.y, [
        glow,
        arch,
        opening,
        icon,
        sign,
        prompt,
        zone,
      ])
      .setDepth(17);

    const interaction = definition.raceCourseId ? new WorldInteractionInput(scene) : null;
    const state: GatewayState = {
      scene,
      definition,
      container,
      prompt,
      interaction,
      insideWalkThrough: false,
    };

    if (interaction) {
      interaction.bindPointer(zone, () => {
        const player = findPlayer(scene);
        if (!player) {
          return;
        }
        const distance = Phaser.Math.Distance.Between(
          player.x,
          player.y,
          definition.position.x,
          definition.position.y,
        );
        if (isWithinInteractiveGateway(distance)) {
          this.activateGateway(state);
        }
      });
    }

    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.12, to: 0.32 },
      scale: { from: 0.94, to: 1.12 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.states.set(definition.id, state);
    return state;
  }

  private activateGateway(state: GatewayState): void {
    if (!state.scene.scene.isActive()) {
      return;
    }

    if (state.definition.raceCourseId) {
      const unlock = this.getRaceUnlockState(state.definition);
      if (!unlock.unlocked) {
        this.showLockedRaceClue(state.scene, unlock.clue);
        return;
      }
      setCrystalBrookPlayerSpawn(state.definition.destinationSpawn);
      setWorldArrivalFacing('CrystalBrookScene', state.definition.destinationFacing);
      saveLocationCheckpoint(getBrowserSaveService(), CRYSTAL_BROOK_LOCATION_ID);
      selectRaceCourse(state.definition.raceCourseId);
      state.scene.scene.start('RaceScene');
      return;
    }

    if (state.definition.destinationSceneKey === 'CrystalBrookScene') {
      setCrystalBrookPlayerSpawn(state.definition.destinationSpawn);
    } else if (state.definition.destinationSceneKey === 'RainbowMeadowScene') {
      setRainbowMeadowPlayerSpawn(state.definition.destinationSpawn);
    } else if (state.definition.destinationSceneKey === 'WhisperingWoodsScene') {
      setWhisperingWoodsPlayerSpawn(state.definition.destinationSpawn);
    }

    setWorldArrivalFacing(state.definition.destinationSceneKey, state.definition.destinationFacing);
    saveLocationCheckpoint(getBrowserSaveService(), state.definition.destinationLocationId);
    state.scene.scene.start(state.definition.destinationSceneKey);
  }

  private showLockedRaceClue(scene: Phaser.Scene, clue: string): void {
    const existing = scene.children.getByName('crystal-cascade-lock-clue');
    existing?.destroy();
    const note = scene.add
      .text(CRYSTAL_CASCADE_GATE_POSITION.x, CRYSTAL_CASCADE_GATE_POSITION.y - 190, `🔒 ${clue}`, {
        color: '#3c5660',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#effffff2',
        padding: { x: 12, y: 8 },
        wordWrap: { width: 370 },
      })
      .setName('crystal-cascade-lock-clue')
      .setOrigin(0.5)
      .setDepth(80);
    scene.time.delayedCall(2600, () => note.destroy());
  }

  private updateCrystalCascadeRace(): void {
    const raceScene = this.game.scene.getScene('RaceScene');
    const crystalRaceActive =
      raceScene?.scene.isActive() && getActiveRaceCourse().id === CRYSTAL_CASCADE_RACE_ID;

    if (crystalRaceActive && raceScene) {
      this.crystalRaceWasActive = true;
      const presentation = this.ensureCrystalRacePresentation(raceScene);
      const runtime = asRaceScene(raceScene);
      const shortcut = getRaceShortcut(CRYSTAL_CASCADE_RACE_ID);
      if (
        shortcut &&
        !presentation.shortcutNoteShown &&
        runtime.runState?.usedShortcutIds.includes(shortcut.id)
      ) {
        presentation.shortcutNoteShown = true;
        this.showShortcutFeedback(raceScene);
      }
      if (runtime.runState?.movement.finished && !presentation.finishNote) {
        presentation.finishNote = raceScene.add
          .text(
            GAME_WIDTH / 2,
            104,
            '💎 Crystal Cascade result saved • this course has its own ribbons 🎀',
            {
              color: '#31515c',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '17px',
              fontStyle: 'bold',
              backgroundColor: '#ecffffee',
              padding: { x: 12, y: 7 },
            },
          )
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(220);
      }
      return;
    }

    this.clearCrystalRacePresentation();
    if (!this.crystalRaceWasActive) {
      return;
    }

    const meadowScene = this.game.scene.getScene('RainbowMeadowScene');
    if (!meadowScene?.scene.isActive()) {
      return;
    }

    this.crystalRaceWasActive = false;
    setCrystalBrookPlayerSpawn(CRYSTAL_CASCADE_RETURN_POSITION);
    setWorldArrivalFacing('CrystalBrookScene', 'left');
    saveLocationCheckpoint(getBrowserSaveService(), CRYSTAL_BROOK_LOCATION_ID);
    resetActiveRaceCourse();
    meadowScene.scene.start('CrystalBrookScene');
  }

  private ensureCrystalRacePresentation(scene: Phaser.Scene): CrystalRacePresentationState {
    if (
      this.crystalRacePresentation?.scene === scene &&
      this.crystalRacePresentation.container.active
    ) {
      return this.crystalRacePresentation;
    }
    this.clearCrystalRacePresentation();

    const course = getActiveRaceCourse();
    const worldWidth = course.length + 760;
    const scenery: Phaser.GameObjects.GameObject[] = [];

    const deepWater = scene.add.rectangle(worldWidth / 2, 650, worldWidth, 150, 0x3f9fb3, 0.86);
    const current = scene.add.rectangle(worldWidth / 2, 590, worldWidth, 76, 0x8be5e7, 0.74);
    const foam = scene.add.rectangle(worldWidth / 2, 552, worldWidth, 8, 0xe9ffff, 0.78);
    scenery.push(deepWater, current, foam);

    for (let x = 390, index = 0; x < worldWidth - 120; x += 260, index += 1) {
      const arrow = scene.add
        .text(x, 590 + (index % 2) * 14, index % 3 === 0 ? '◇  ➜' : '≈  ➜', {
          color: index % 3 === 0 ? '#f2d8ff' : '#e8ffff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '23px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0.72);
      scenery.push(arrow);
    }

    for (const [index, x] of [480, 980, 1510, 2050, 3190, 3680].entries()) {
      const crystal = scene.add
        .text(x, index % 2 === 0 ? 490 : 675, index % 3 === 0 ? '💎' : '✦', {
          color: '#e8ffff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: index % 3 === 0 ? '38px' : '29px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      scenery.push(crystal);
      scene.tweens.add({
        targets: crystal,
        alpha: { from: 0.42, to: 1 },
        y: crystal.y - 8,
        duration: 900 + index * 95,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    for (const obstacle of course.obstacles) {
      const x = RACE_COURSE_START_X + obstacle.progress;
      if (obstacle.kind === 'log') {
        scenery.push(
          scene.add
            .ellipse(x, RACE_GROUND_Y - 38, obstacle.width + 18, 30, 0x765641, 1)
            .setStrokeStyle(4, 0xa47a58, 1),
        );
      } else {
        for (const offset of [-38, -12, 14, 40]) {
          scenery.push(
            scene.add
              .rectangle(
                x + offset,
                RACE_GROUND_Y - 54,
                9,
                obstacle.clearanceHeight + 22,
                0x4c956f,
                1,
              )
              .setAngle(offset / 8),
          );
        }
      }
    }

    const shortcut = getRaceShortcut(course.id);
    if (shortcut) {
      const entryX = RACE_COURSE_START_X + shortcut.entryStartProgress;
      const exitX = RACE_COURSE_START_X + shortcut.entryEndProgress + shortcut.progressSkip;
      const prismLane = scene.add
        .rectangle((entryX + exitX) / 2, 500, exitX - entryX, 56, 0xcbb2ff, 0.62)
        .setStrokeStyle(5, 0xf5e9ff, 0.85)
        .setAngle(-2);
      const prismLabel = scene.add
        .text(entryX + 90, 440, 'PRISM CURRENT ↗\nJump into the glowing stream!', {
          color: '#4f4771',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#f5ecfff0',
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5);
      scenery.push(prismLane, prismLabel);
      for (let x = entryX + 45; x < exitX - 20; x += 92) {
        scenery.push(
          scene.add
            .text(x, 500, '✦ ➜', {
              color: '#fff5ff',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '20px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        );
      }
    }

    const startX = RACE_COURSE_START_X - 70;
    const finishX = RACE_COURSE_START_X + course.length;
    for (const [x, title] of [
      [startX, 'CASCADE START'],
      [finishX, 'CRYSTAL FINISH'],
    ] as const) {
      scenery.push(
        scene.add.rectangle(x - 68, 446, 22, 210, 0x467f8a, 1),
        scene.add.rectangle(x + 68, 446, 22, 210, 0x467f8a, 1),
        scene.add.rectangle(x, 350, 178, 42, 0xbceff0, 1).setStrokeStyle(5, 0x7b83c9, 1),
        scene.add
          .text(x, 350, title, {
            color: '#38545c',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '17px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
    }

    const label = scene.add
      .text(GAME_WIDTH - 22, 92, '💎 Crystal Brook • Crystal Cascade', {
        color: '#31515c',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#e9ffffe8',
        padding: { x: 11, y: 6 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0);
    scenery.push(label);

    const container = scene.add
      .container(0, 0, scenery)
      .setName('crystal-cascade-course-presentation')
      .setDepth(7);
    label.setDepth(1);
    this.crystalRacePresentation = {
      scene,
      container,
      finishNote: null,
      shortcutNoteShown: false,
    };
    return this.crystalRacePresentation;
  }

  private showShortcutFeedback(scene: Phaser.Scene): void {
    const note = scene.add
      .text(GAME_WIDTH / 2, 142, '✦ Prism Current! The shortcut carried you ahead! ✦', {
        color: '#54436f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#f2e9fff2',
        padding: { x: 13, y: 7 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(221);
    scene.cameras.main.flash(170, 227, 208, 255, false);
    scene.time.delayedCall(1800, () => note.destroy());
  }

  private clearCrystalRacePresentation(): void {
    if (!this.crystalRacePresentation) {
      return;
    }
    const { scene, container, finishNote } = this.crystalRacePresentation;
    scene.tweens.killTweensOf(container.getAll());
    finishNote?.destroy();
    container.destroy(true);
    this.crystalRacePresentation = null;
  }

  private clearState(id: string): void {
    const state = this.states.get(id);
    if (!state) {
      return;
    }
    state.interaction?.destroy();
    if (state.container.active) {
      state.container.destroy(true);
    }
    this.states.delete(id);
  }
}

let manager: R5RegionGatewayManager | null = null;

export function getR5RegionGatewayManager(game: Phaser.Game): R5RegionGatewayManager {
  manager ??= new R5RegionGatewayManager(game);
  return manager;
}
