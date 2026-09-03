import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import type { PlayerFacing } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import { ensureStarlightBeachScene } from '../scenes/StarlightBeachSceneRegistration';
import { shouldActivateWalkThroughGateway } from './RegionGatewayRules';
import {
  setStarlightBeachPlayerSpawn,
  STARLIGHT_BEACH_LOCATION_ID,
  STARLIGHT_BEACH_MAP,
} from './StarlightBeachMap';
import { setWorldArrivalFacing } from './WorldArrivalState';
import { setWhisperingWoodsPlayerSpawn, WHISPERING_WOODS_LOCATION_ID } from './WhisperingWoodsMap';
import { WORLD_PLAYER_NAME } from './WorldTraversalPolishManager';

interface BeachGatewayDefinition {
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
}

interface BeachGatewayState {
  scene: Phaser.Scene;
  definition: BeachGatewayDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
  insideWalkThrough: boolean;
}

const WOODS_BEACH_GATE_POSITION = { x: 3180, y: 1690 } as const;
const WOODS_BEACH_RETURN_POSITION = { x: 2940, y: 1690 } as const;
const BEACH_ENTRANCE = STARLIGHT_BEACH_MAP.entrances[0];

const BEACH_GATEWAYS: readonly BeachGatewayDefinition[] = [
  {
    id: 'gateway:whispering-woods-starlight-beach',
    sceneKey: 'WhisperingWoodsScene',
    label: 'Starlight Beach',
    position: WOODS_BEACH_GATE_POSITION,
    destinationSceneKey: 'StarlightBeachScene',
    destinationLocationId: STARLIGHT_BEACH_LOCATION_ID,
    destinationSpawn: BEACH_ENTRANCE.approach,
    destinationFacing: 'right',
    accent: 0xf2c97d,
    icon: '🏖️',
  },
  {
    id: 'gateway:starlight-beach-whispering-woods',
    sceneKey: 'StarlightBeachScene',
    label: 'Whispering Woods',
    position: BEACH_ENTRANCE.position,
    destinationSceneKey: 'WhisperingWoodsScene',
    destinationLocationId: WHISPERING_WOODS_LOCATION_ID,
    destinationSpawn: WOODS_BEACH_RETURN_POSITION,
    destinationFacing: 'left',
    accent: 0x75a97a,
    icon: '🌲',
  },
];

function findPlayer(scene: Phaser.Scene): Phaser.GameObjects.Sprite | null {
  const player = scene.children.getByName(WORLD_PLAYER_NAME);
  return player instanceof Phaser.GameObjects.Sprite ? player : null;
}

export class R65StarlightBeachGatewayManager {
  private readonly throttle = new RefreshThrottle(90);
  private readonly states = new Map<string, BeachGatewayState>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      for (const id of [...this.states.keys()]) {
        this.clearState(id);
      }
    });
  }

  private update(): void {
    if (!this.throttle.shouldRun(this.game.loop.time)) {
      return;
    }

    for (const definition of BEACH_GATEWAYS) {
      const scene = this.game.scene.keys[definition.sceneKey];
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
      const inside = shouldActivateWalkThroughGateway(distance, false);
      if (inside && !state.insideWalkThrough) {
        state.insideWalkThrough = true;
        void this.activateGateway(state);
        return;
      }
      state.insideWalkThrough = inside;
    }
  }

  private ensureState(scene: Phaser.Scene, definition: BeachGatewayDefinition): BeachGatewayState {
    const existing = this.states.get(definition.id);
    if (existing?.scene === scene && existing.container.active) {
      return existing;
    }

    this.clearState(definition.id);
    const glow = scene.add.circle(0, 0, 78, definition.accent, 0.16);
    const arch = scene.add
      .rectangle(0, 0, 112, 188, 0xfff4d5, 0.92)
      .setStrokeStyle(7, definition.accent, 0.95);
    const opening = scene.add.rectangle(0, 16, 72, 132, 0x6ea8a3, 0.78);
    const icon = scene.add
      .text(0, -58, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
      })
      .setOrigin(0.5);
    const sign = scene.add
      .text(0, 118, definition.label, {
        color: '#5a5767',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e8e8',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);
    const prompt = scene.add
      .text(0, 158, `Walk through to ${definition.label} →`, {
        color: '#5a5767',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#fff9eef0',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const container = scene.add
      .container(definition.position.x, definition.position.y, [
        glow,
        arch,
        opening,
        icon,
        sign,
        prompt,
      ])
      .setName(definition.id)
      .setDepth(17);

    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.12, to: 0.32 },
      scale: { from: 0.94, to: 1.1 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    const state: BeachGatewayState = {
      scene,
      definition,
      container,
      prompt,
      insideWalkThrough: false,
    };
    this.states.set(definition.id, state);
    return state;
  }

  private async activateGateway(state: BeachGatewayState): Promise<void> {
    if (!state.scene.scene.isActive()) {
      return;
    }

    if (state.definition.destinationSceneKey === 'StarlightBeachScene') {
      await ensureStarlightBeachScene(this.game);
      setStarlightBeachPlayerSpawn(state.definition.destinationSpawn);
    } else if (state.definition.destinationSceneKey === 'WhisperingWoodsScene') {
      setWhisperingWoodsPlayerSpawn(state.definition.destinationSpawn);
    }

    if (!state.scene.scene.isActive()) {
      return;
    }

    setWorldArrivalFacing(state.definition.destinationSceneKey, state.definition.destinationFacing);
    saveLocationCheckpoint(getBrowserSaveService(), state.definition.destinationLocationId);
    state.scene.scene.start(state.definition.destinationSceneKey);
  }

  private clearState(id: string): void {
    const state = this.states.get(id);
    if (!state) {
      return;
    }
    state.container.destroy(true);
    this.states.delete(id);
  }
}

let manager: R65StarlightBeachGatewayManager | null = null;

export function getR65StarlightBeachGatewayManager(
  game: Phaser.Game,
): R65StarlightBeachGatewayManager {
  manager ??= new R65StarlightBeachGatewayManager(game);
  return manager;
}
