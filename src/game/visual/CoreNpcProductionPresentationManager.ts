import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConstants';
import { PIP_POSITION } from '../intro/PipIntro';
import { RAINBOW_MEADOW_MAP } from '../world/RainbowMeadowMap';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import { worldDepthForY } from '../world/WorldDepth';
import {
  addCoreNpcIdleTween,
  CORE_NPC_VISUALS,
  createCoreNpcSprite,
  type CoreNpcId,
  playCoreNpcReaction,
} from './CoreNpcProductionArt';

const LUMI_WORLD_POSITION = { x: 2980, y: 1530 } as const;

interface StoryPortraitDefinition {
  sceneKey: string;
  id: CoreNpcId;
  y: number;
}

const STORY_PORTRAITS: readonly StoryPortraitDefinition[] = [
  { sceneKey: 'NovaStoryScene', id: 'nova', y: 255 },
  { sceneKey: 'WillowStoryScene', id: 'willow', y: 252 },
  { sceneKey: 'PipEggStoryScene', id: 'pip', y: 268 },
  { sceneKey: 'PebbleStoryScene', id: 'pebble', y: 252 },
  { sceneKey: 'LumiStoryScene', id: 'lumi', y: 252 },
  { sceneKey: 'MarigoldPicnicScene', id: 'marigold', y: 240 },
] as const;

function sceneIfActive(game: Phaser.Game, key: string): Phaser.Scene | null {
  const scene = game.scene.getScene(key);
  return scene?.scene.isActive() ? scene : null;
}

function hideVillageEmoji(scene: Phaser.Scene, id: 'willow' | 'marigold', emoji: string): void {
  const marker = SUNBEAM_VILLAGE_MAP.npcMarkers.find((candidate) => candidate.id === id);
  if (!marker) {
    return;
  }
  for (const object of scene.children.list) {
    if (
      object instanceof Phaser.GameObjects.Text &&
      object.text === emoji &&
      Math.abs(object.x - marker.position.x) <= 1 &&
      Math.abs(object.y - marker.position.y) <= 1
    ) {
      object.setVisible(false);
    }
  }
}

function hideNovaPlaceholder(scene: Phaser.Scene): void {
  const marker = RAINBOW_MEADOW_MAP.npcMarkers.find((candidate) => candidate.id === 'nova');
  if (!marker) {
    return;
  }
  for (const object of scene.children.list) {
    if (
      object instanceof Phaser.GameObjects.Container &&
      object.name !== 'core-npc:nova:world' &&
      Math.abs(object.x - marker.position.x) <= 1 &&
      Math.abs(object.y - marker.position.y) <= 8 &&
      object.list.length >= 8
    ) {
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
  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    this.refreshStoryPortraits();
    this.refreshPipWorld();
    this.refreshVillageWorld();
    this.refreshNovaWorld();
    this.refreshLumiWorld();
  }

  private refreshStoryPortraits(): void {
    for (const definition of STORY_PORTRAITS) {
      const scene = sceneIfActive(this.game, definition.sceneKey);
      if (!scene || scene.children.getByName(`core-npc:${definition.id}:portrait`)) {
        continue;
      }

      const spec = CORE_NPC_VISUALS[definition.id];
      scene.add
        .circle(GAME_WIDTH / 2, definition.y, 98, spec.frame, 0.99)
        .setName(`core-npc:${definition.id}:portrait-frame`)
        .setStrokeStyle(6, spec.outline, 0.82)
        .setDepth(7);
      const portrait = createCoreNpcSprite(
        scene,
        definition.id,
        GAME_WIDTH / 2,
        definition.y + 12,
        'portrait',
      )
        .setDisplaySize(definition.id === 'pip' ? 174 : 190, definition.id === 'pip' ? 140 : 148)
        .setDepth(8);
      addCoreNpcIdleTween(scene, portrait, definition.id, 2.5);
      scene.time.delayedCall(380, () => {
        if (portrait.active) {
          playCoreNpcReaction(scene, portrait);
        }
      });
    }
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
    hideVillageEmoji(scene, id, emoji);
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
    hideNovaPlaceholder(scene);

    if (scene.children.getByName('core-npc:nova:world')) {
      return;
    }
    const marker = RAINBOW_MEADOW_MAP.npcMarkers.find((candidate) => candidate.id === 'nova');
    if (!marker) {
      return;
    }
    const nova = createCoreNpcSprite(
      scene,
      'nova',
      marker.position.x,
      marker.position.y + 4,
      'world',
    )
      .setDisplaySize(112, 92)
      .setDepth(worldDepthForY(marker.position.y + 50, 0.32));
    addCoreNpcIdleTween(scene, nova, 'nova', 5);
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
