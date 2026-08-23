import Phaser from 'phaser';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import { GAME_WIDTH } from '../config/gameConstants';
import { getActiveRaceCourse, resetActiveRaceCourse, selectRaceCourse } from '../racing/RaceCourse';
import type { RaceRunState } from '../racing/RaceRun';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import {
  CRYSTAL_BROOK_LOCATION_ID,
  CRYSTAL_BROOK_MAP,
  setCrystalBrookPlayerSpawn,
} from './CrystalBrookMap';
import { RAINBOW_MEADOW_LOCATION_ID, setRainbowMeadowPlayerSpawn } from './RainbowMeadowMap';
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
  accent: number;
  icon: string;
  raceCourseId?: string;
}

interface GatewayState {
  scene: Phaser.Scene;
  definition: RegionGatewayDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
  interactKey: Phaser.Input.Keyboard.Key | null;
}

interface RaceSceneRuntime extends Phaser.Scene {
  runState: RaceRunState;
}

interface CrystalRacePresentationState {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  finishNote: Phaser.GameObjects.Text | null;
}

const MEADOW_GATE_POSITION = { x: 3030, y: 1750 } as const;
const MEADOW_RETURN_POSITION = { x: 2870, y: 1700 } as const;
const BROOK_ENTRANCE = CRYSTAL_BROOK_MAP.entrances[0];
const BROOK_WOODS_GATE_POSITION = { x: 3260, y: 990 } as const;
const BROOK_WOODS_RETURN_POSITION = { x: 3070, y: 1010 } as const;
const CRYSTAL_CASCADE_GATE_POSITION = { x: 2860, y: 850 } as const;
const CRYSTAL_CASCADE_RETURN_POSITION = { x: 2660, y: 900 } as const;
const WOODS_ENTRANCE = WHISPERING_WOODS_MAP.entrances[0];

const R5_REGION_GATEWAYS: readonly RegionGatewayDefinition[] = [
  {
    id: 'gateway:meadow-crystal-brook',
    sceneKey: 'RainbowMeadowScene',
    label: 'Crystal Brook',
    position: MEADOW_GATE_POSITION,
    destinationSceneKey: 'CrystalBrookScene',
    destinationLocationId: CRYSTAL_BROOK_LOCATION_ID,
    destinationSpawn: BROOK_ENTRANCE.approach,
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
      state.prompt.setVisible(distance <= 245);

      if (
        distance <= 170 &&
        state.interactKey &&
        Phaser.Input.Keyboard.JustDown(state.interactKey)
      ) {
        this.activateGateway(state);
        return;
      }
    }
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
    const prompt = scene.add
      .text(0, 160, `E / tap: Go to ${definition.label}`, {
        color: '#5d5068',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#fff9eef0',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = scene.add.zone(0, 20, 170, 230).setInteractive({ useHandCursor: true });
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

    const state: GatewayState = {
      scene,
      definition,
      container,
      prompt,
      interactKey: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null,
    };

    zone.on('pointerdown', () => {
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
      if (distance <= 190) {
        this.activateGateway(state);
      }
    });

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
      setCrystalBrookPlayerSpawn(state.definition.destinationSpawn);
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

    saveLocationCheckpoint(getBrowserSaveService(), state.definition.destinationLocationId);
    state.scene.scene.start(state.definition.destinationSceneKey);
  }

  private updateCrystalCascadeRace(): void {
    const raceScene = this.game.scene.getScene('RaceScene');
    const crystalRaceActive =
      raceScene?.scene.isActive() && getActiveRaceCourse().id === CRYSTAL_CASCADE_RACE_ID;

    if (crystalRaceActive && raceScene) {
      this.crystalRaceWasActive = true;
      const presentation = this.ensureCrystalRacePresentation(raceScene);
      const runtime = asRaceScene(raceScene);
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
    const water = scene.add.rectangle(worldWidth / 2, 674, worldWidth, 82, 0x65c7d3, 0.28);
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
    const scenery: Phaser.GameObjects.GameObject[] = [water, label];

    for (const [index, x] of [520, 1110, 1740, 2370, 3040, 3660].entries()) {
      const crystal = scene.add
        .text(x, index % 2 === 0 ? 476 : 654, index % 3 === 0 ? '💎' : '✦', {
          color: '#dfffff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: index % 3 === 0 ? '34px' : '26px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      scenery.push(crystal);
      scene.tweens.add({
        targets: crystal,
        alpha: { from: 0.45, to: 1 },
        y: crystal.y - 8,
        duration: 950 + index * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    const container = scene.add.container(0, 0, scenery).setDepth(7);
    label.setDepth(1);
    this.crystalRacePresentation = { scene, container, finishNote: null };
    return this.crystalRacePresentation;
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
