import Phaser from 'phaser';
import { PIP_POSITION } from '../intro/PipIntro';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  CoreNpcPresenceService,
  NOVA_CHARACTER_ID,
  type CoreNpcPresenceArea,
} from '../world/CoreNpcPresenceService';
import { RAINBOW_MEADOW_MAP } from '../world/RainbowMeadowMap';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import { worldDepthForY } from '../world/WorldDepth';
import { addCoreNpcIdleTween, createCoreNpcSprite } from './CoreNpcProductionArt';

const LUMI_WORLD_POSITION = { x: 2980, y: 1530 } as const;
const NOVA_PICNIC_POSITION = { x: 2045, y: 1400 } as const;
const NOVA_PRESENCE_REFRESH_MS = 500;
const NOVA_OFFSTAGE_INTERACTION_POSITION = { x: -10000, y: -10000 } as const;
const novaRaceMarker = RAINBOW_MEADOW_MAP.npcMarkers.find((candidate) => candidate.id === 'nova');
const NOVA_RACE_POSITION = novaRaceMarker
  ? { x: novaRaceMarker.position.x, y: novaRaceMarker.position.y }
  : null;

interface PositionedGameObject {
  x: number;
  y: number;
}

function sceneIfActive(game: Phaser.Game, key: string): Phaser.Scene | null {
  const scene = game.scene.getScene(key);
  return scene?.scene.isActive() ? scene : null;
}

function hasWorldPosition(
  object: Phaser.GameObjects.GameObject,
): object is Phaser.GameObjects.GameObject & PositionedGameObject {
  const positioned = object as Phaser.GameObjects.GameObject & Partial<PositionedGameObject>;
  return typeof positioned.x === 'number' && typeof positioned.y === 'number';
}

function destroyNamedObject(scene: Phaser.Scene, name: string): void {
  const object = scene.children.getByName(name);
  if (!object) {
    return;
  }
  scene.tweens.killTweensOf(object);
  object.destroy();
}

function syncNovaRaceInteractionTarget(atRaceHub: boolean): void {
  if (!novaRaceMarker || !NOVA_RACE_POSITION) {
    return;
  }

  // RainbowMeadowScene's Nova interaction keeps the same marker-position object by reference.
  // Moving that shared target off-stage removes the talk interaction while Nova is elsewhere;
  // restoring the canonical coordinates re-enables it without duplicating scene progression rules.
  const mutablePosition = novaRaceMarker.position as { x: number; y: number };
  const target = atRaceHub ? NOVA_RACE_POSITION : NOVA_OFFSTAGE_INTERACTION_POSITION;
  mutablePosition.x = target.x;
  mutablePosition.y = target.y;
}

function hideVillagePrototypeMarker(
  scene: Phaser.Scene,
  id: 'willow' | 'marigold' | 'pebble',
  prototypeIcon: string,
): void {
  const marker = SUNBEAM_VILLAGE_MAP.npcMarkers.find((candidate) => candidate.id === id);
  if (!marker) {
    return;
  }

  for (const object of scene.children.list) {
    if (!hasWorldPosition(object)) {
      continue;
    }
    const atMarker =
      Math.abs(object.x - marker.position.x) <= 1 && Math.abs(object.y - marker.position.y) <= 1;
    if (!atMarker) {
      continue;
    }

    const prototypeCircle =
      object instanceof Phaser.GameObjects.Arc &&
      object.displayWidth <= 90 &&
      object.displayHeight <= 90;
    const prototypeText =
      object instanceof Phaser.GameObjects.Text &&
      (object.text === prototypeIcon || object.text === '✦');
    if (prototypeCircle || prototypeText) {
      object.setVisible(false);
    }
  }
}

function hideNovaPlaceholder(scene: Phaser.Scene, hideRaceLabel: boolean): void {
  if (!NOVA_RACE_POSITION) {
    return;
  }

  for (const object of scene.children.list) {
    if (
      object instanceof Phaser.GameObjects.Container &&
      object.name !== 'core-npc:nova:world' &&
      Math.abs(object.x - NOVA_RACE_POSITION.x) <= 1 &&
      Math.abs(object.y - NOVA_RACE_POSITION.y) <= 8 &&
      object.list.length >= 8
    ) {
      object.setVisible(false);
      continue;
    }

    if (
      hideRaceLabel &&
      object instanceof Phaser.GameObjects.Text &&
      object.text === 'Nova' &&
      Math.abs(object.x - NOVA_RACE_POSITION.x) <= 4 &&
      Math.abs(object.y - (NOVA_RACE_POSITION.y + 72)) <= 10
    ) {
      object.setVisible(false);
    }
  }
}

function hidePicnicNovaPlaceholder(scene: Phaser.Scene): void {
  for (const object of scene.children.list) {
    if (!hasWorldPosition(object)) {
      continue;
    }
    const nearPicnicNova =
      Math.abs(object.x - NOVA_PICNIC_POSITION.x) <= 55 &&
      Math.abs(object.y - NOVA_PICNIC_POSITION.y) <= 70;
    if (!nearPicnicNova) {
      continue;
    }

    const prototypeCircle =
      object instanceof Phaser.GameObjects.Arc &&
      object.displayWidth <= 90 &&
      object.displayHeight <= 90;
    const prototypeText =
      object instanceof Phaser.GameObjects.Text && (object.text === '⭐' || object.text === 'Nova');
    if (prototypeCircle || prototypeText) {
      object.setVisible(false);
    }
  }
}

function hidePipPlaceholder(scene: Phaser.Scene): void {
  for (const object of scene.children.list) {
    if (
      !(object instanceof Phaser.GameObjects.Arc) &&
      !(object instanceof Phaser.GameObjects.Ellipse) &&
      !(object instanceof Phaser.GameObjects.Triangle)
    ) {
      continue;
    }
    const nearPip =
      Math.abs(object.x - PIP_POSITION.x) <= 72 && Math.abs(object.y - PIP_POSITION.y) <= 82;
    if (nearPip) {
      object.setVisible(false);
    }
  }
}

function hidePebblePlaceholder(scene: Phaser.Scene): void {
  const marker = SUNBEAM_VILLAGE_MAP.npcMarkers.find((candidate) => candidate.id === 'pebble');
  if (!marker) {
    return;
  }
  const container = scene.children.list.find(
    (object): object is Phaser.GameObjects.Container =>
      object instanceof Phaser.GameObjects.Container &&
      object.name === 'pebble-world-presentation' &&
      Math.abs(object.x - marker.position.x) <= 1 &&
      Math.abs(object.y - marker.position.y) <= 1,
  );
  if (!container) {
    return;
  }
  for (const child of container.list) {
    if (child instanceof Phaser.GameObjects.Text && child.text === '🪨') {
      child.setVisible(false);
    }
  }
}

function hideLumiPlaceholder(scene: Phaser.Scene): void {
  const container = scene.children.list.find(
    (object): object is Phaser.GameObjects.Container =>
      object instanceof Phaser.GameObjects.Container &&
      object.name === 'lumi-woods-presentation' &&
      Math.abs(object.x - LUMI_WORLD_POSITION.x) <= 1 &&
      Math.abs(object.y - LUMI_WORLD_POSITION.y) <= 1,
  );
  if (!container) {
    return;
  }

  for (const child of container.list) {
    const keepPrompt =
      child instanceof Phaser.GameObjects.Text && child.text.includes('Talk to Lumi');
    if (keepPrompt || child instanceof Phaser.GameObjects.Zone) {
      continue;
    }
    if ('setVisible' in child && typeof child.setVisible === 'function') {
      child.setVisible(false);
    }
  }
}

export class CoreNpcProductionPresentationManager {
  private readonly presenceService = new CoreNpcPresenceService(getBrowserSaveService());
  private readonly presenceRefresh = new RefreshThrottle(NOVA_PRESENCE_REFRESH_MS);
  private novaArea: CoreNpcPresenceArea = 'rainbow-run-hub';

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    if (this.presenceRefresh.shouldRun(Date.now())) {
      this.refreshPresenceAuthority();
    }
    this.refreshPipWorld();
    this.refreshVillageWorld();
    this.refreshNovaWorld();
    this.refreshLumiWorld();
  }

  private refreshPresenceAuthority(): void {
    this.novaArea = this.presenceService.resolve(NOVA_CHARACTER_ID)?.area ?? 'rainbow-run-hub';
    syncNovaRaceInteractionTarget(this.novaArea === 'rainbow-run-hub');
  }

  private refreshPipWorld(): void {
    const scene = sceneIfActive(this.game, 'MoonflowerGladeScene');
    if (!scene || scene.children.getByName('core-npc:pip:world')) {
      return;
    }
    hidePipPlaceholder(scene);
    const pip = createCoreNpcSprite(scene, 'pip', PIP_POSITION.x, PIP_POSITION.y + 8, 'world')
      .setDisplaySize(92, 74)
      .setDepth(worldDepthForY(PIP_POSITION.y + 44, 0.35));
    addCoreNpcIdleTween(scene, pip, 'pip', 4);
  }

  private refreshVillageWorld(): void {
    const scene = sceneIfActive(this.game, 'SunbeamVillageScene');
    if (!scene) {
      return;
    }

    this.ensureVillageNpc(scene, 'willow', '🌿', 100, 83);
    this.ensureVillageNpc(scene, 'marigold', '🥐', 102, 84);

    const pebbleMarker = SUNBEAM_VILLAGE_MAP.npcMarkers.find(
      (candidate) => candidate.id === 'pebble',
    );
    if (!pebbleMarker || scene.children.getByName('core-npc:pebble:world')) {
      return;
    }
    hideVillagePrototypeMarker(scene, 'pebble', '✦');
    hidePebblePlaceholder(scene);
    const pebble = createCoreNpcSprite(
      scene,
      'pebble',
      pebbleMarker.position.x,
      pebbleMarker.position.y + 5,
      'world',
    )
      .setDisplaySize(102, 84)
      .setDepth(worldDepthForY(pebbleMarker.position.y + 48, 0.32));
    addCoreNpcIdleTween(scene, pebble, 'pebble', 3);
  }

  private ensureVillageNpc(
    scene: Phaser.Scene,
    id: 'willow' | 'marigold',
    emoji: string,
    width: number,
    height: number,
  ): void {
    if (scene.children.getByName(`core-npc:${id}:world`)) {
      return;
    }
    const marker = SUNBEAM_VILLAGE_MAP.npcMarkers.find((candidate) => candidate.id === id);
    if (!marker) {
      return;
    }
    hideVillagePrototypeMarker(scene, id, emoji);
    const sprite = createCoreNpcSprite(scene, id, marker.position.x, marker.position.y + 4, 'world')
      .setDisplaySize(width, height)
      .setDepth(worldDepthForY(marker.position.y + 47, 0.32));
    addCoreNpcIdleTween(scene, sprite, id, 3);
  }

  private refreshNovaWorld(): void {
    const scene = sceneIfActive(this.game, 'RainbowMeadowScene');
    if (!scene) {
      return;
    }

    const tighteningNova = scene.children.getByName('nova-canonical-world');
    if (tighteningNova instanceof Phaser.GameObjects.Sprite) {
      tighteningNova.setVisible(false);
    }

    hideNovaPlaceholder(scene, this.novaArea !== 'rainbow-run-hub');
    hidePicnicNovaPlaceholder(scene);

    if (this.novaArea === 'moonflower-cottage') {
      destroyNamedObject(scene, 'core-npc:nova:world');
      destroyNamedObject(scene, 'core-npc:nova:picnic');
      destroyNamedObject(scene, 'core-npc:nova:picnic-label');
      return;
    }

    if (this.novaArea === 'picnic-hill') {
      destroyNamedObject(scene, 'core-npc:nova:world');
      this.ensurePicnicNova(scene);
      return;
    }

    destroyNamedObject(scene, 'core-npc:nova:picnic');
    destroyNamedObject(scene, 'core-npc:nova:picnic-label');
    this.ensureRaceHubNova(scene);
  }

  private ensureRaceHubNova(scene: Phaser.Scene): void {
    if (scene.children.getByName('core-npc:nova:world') || !NOVA_RACE_POSITION) {
      return;
    }
    const nova = createCoreNpcSprite(
      scene,
      'nova',
      NOVA_RACE_POSITION.x,
      NOVA_RACE_POSITION.y + 4,
      'world',
    )
      .setDisplaySize(112, 92)
      .setDepth(worldDepthForY(NOVA_RACE_POSITION.y + 50, 0.32));
    addCoreNpcIdleTween(scene, nova, 'nova', 5);
  }

  private ensurePicnicNova(scene: Phaser.Scene): void {
    if (!scene.children.getByName('core-npc:nova:picnic')) {
      const nova = createCoreNpcSprite(
        scene,
        'nova',
        NOVA_PICNIC_POSITION.x,
        NOVA_PICNIC_POSITION.y + 4,
        'world',
      )
        .setName('core-npc:nova:picnic')
        .setDisplaySize(112, 92)
        .setDepth(worldDepthForY(NOVA_PICNIC_POSITION.y + 50, 0.32));
      addCoreNpcIdleTween(scene, nova, 'nova', 5);
    }

    if (!scene.children.getByName('core-npc:nova:picnic-label')) {
      scene.add
        .text(NOVA_PICNIC_POSITION.x, NOVA_PICNIC_POSITION.y + 72, 'Nova', {
          color: '#5e4669',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          backgroundColor: '#fff8dfdd',
          padding: { x: 7, y: 3 },
        })
        .setName('core-npc:nova:picnic-label')
        .setOrigin(0.5)
        .setDepth(worldDepthForY(NOVA_PICNIC_POSITION.y + 82, 0.34));
    }
  }

  private refreshLumiWorld(): void {
    const scene = sceneIfActive(this.game, 'WhisperingWoodsScene');
    if (!scene || scene.children.getByName('core-npc:lumi:world')) {
      return;
    }

    // Lumi only appears after the Starwell manager has materialised her interaction container.
    const lumiContainer = scene.children.list.find(
      (object) =>
        object instanceof Phaser.GameObjects.Container &&
        object.name === 'lumi-woods-presentation' &&
        Math.abs(object.x - LUMI_WORLD_POSITION.x) <= 1 &&
        Math.abs(object.y - LUMI_WORLD_POSITION.y) <= 1,
    );
    if (!lumiContainer) {
      return;
    }

    hideLumiPlaceholder(scene);
    const lumi = createCoreNpcSprite(
      scene,
      'lumi',
      LUMI_WORLD_POSITION.x,
      LUMI_WORLD_POSITION.y + 3,
      'world',
    )
      .setDisplaySize(108, 90)
      .setDepth(worldDepthForY(LUMI_WORLD_POSITION.y + 50, 0.34));
    addCoreNpcIdleTween(scene, lumi, 'lumi', 4);
  }
}

let browserCoreNpcProductionPresentationManager: CoreNpcProductionPresentationManager | null = null;

export function getCoreNpcProductionPresentationManager(
  game: Phaser.Game,
): CoreNpcProductionPresentationManager {
  browserCoreNpcProductionPresentationManager ??= new CoreNpcProductionPresentationManager(game);
  return browserCoreNpcProductionPresentationManager;
}
