import Phaser from 'phaser';
import { MARIGOLD_CHARACTER_ID } from '../../content/r4PicnicEvent';
import { isPipIntroduced, PIP_POSITION } from '../intro/PipIntro';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { SUPPORTING_RESIDENT_ART_LAYOUT } from '../population/SupportingResidentArt';
import { getBrowserSaveService } from '../save/browserSaveService';
import { RAINBOW_MEADOW_LAYOUT } from '../world/RainbowMeadowMap';
import {
  CoreNpcPresenceService,
  NOVA_CHARACTER_ID,
  type MarigoldPresenceArea,
  type NovaPresenceArea,
} from '../world/CoreNpcPresenceService';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import { worldDepthForY } from '../world/WorldDepth';
import { addCoreNpcIdleTween, createCoreNpcSprite } from './CoreNpcProductionArt';
import {
  createVillageCoreResidentSprite,
  type VillageCoreResidentId,
} from './VillageCoreResidentArt';

const LUMI_WORLD_POSITION = { x: 2980, y: 1530 } as const;
const NOVA_PRESENCE_REFRESH_MS = 500;
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

function hidePicnicNovaPlaceholder(scene: Phaser.Scene): void {
  for (const object of scene.children.list) {
    if (!hasWorldPosition(object)) {
      continue;
    }
    const nearPicnicNova =
      Math.abs(object.x - RAINBOW_MEADOW_LAYOUT.picnicHill.nova.x) <= 55 &&
      Math.abs(object.y - RAINBOW_MEADOW_LAYOUT.picnicHill.nova.y) <= 70;
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
  private novaArea: NovaPresenceArea = 'rainbow-run-hub';
  private marigoldArea: MarigoldPresenceArea = 'sunbeam-village';

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    if (this.presenceRefresh.shouldRun(Date.now())) {
      this.refreshPresenceAuthority();
    }
    this.refreshPipWorld();
    this.refreshVillageWorld();
    this.refreshMarigoldWorld();
    this.refreshNovaWorld();
    this.refreshLumiWorld();
  }

  private refreshPresenceAuthority(): void {
    const novaPresence = this.presenceService.resolve(NOVA_CHARACTER_ID);
    this.novaArea =
      novaPresence?.area === 'picnic-hill' || novaPresence?.area === 'moonflower-cottage'
        ? novaPresence.area
        : 'rainbow-run-hub';

    const marigoldPresence = this.presenceService.resolve(MARIGOLD_CHARACTER_ID);
    this.marigoldArea =
      marigoldPresence?.area === 'picnic-hill' ? 'picnic-hill' : 'sunbeam-village';
  }

  private refreshPipWorld(): void {
    const scene = sceneIfActive(this.game, 'MoonflowerGladeScene');
    if (
      !scene ||
      !isPipIntroduced(getBrowserSaveService().load()) ||
      scene.children.getByName('core-npc:pip:world')
    ) {
      return;
    }
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

    this.ensureVillageNpc(scene, 'willow', 4);
    if (this.marigoldArea === 'sunbeam-village') {
      this.ensureVillageNpc(scene, 'marigold', 4);
    }
    // Presence changes are committed immediately, but an NPC already visible in the current
    // scene keeps that scene-session lease until the player leaves. On the next Sunbeam load
    // the picnic authority prevents Marigold being recreated.
    this.ensureVillageNpc(scene, 'pebble', 5);
  }

  private ensureVillageNpc(scene: Phaser.Scene, id: VillageCoreResidentId, yOffset: number): void {
    const objectName = `core-npc:${id}:world`;
    if (scene.children.getByName(objectName)) {
      return;
    }
    const marker = SUNBEAM_VILLAGE_MAP.npcMarkers.find((candidate) => candidate.id === id);
    if (!marker) {
      return;
    }

    createVillageCoreResidentSprite(scene, id, objectName)
      .setPosition(marker.position.x, marker.position.y + yOffset)
      .setDepth(
        worldDepthForY(
          marker.position.y + SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight * 0.44,
          0.32,
        ),
      );
    // Static village core residents deliberately share the exact art geometry used by moving
    // supporting residents. They remain fixed in place and receive no idle bob/tween.
  }

  private refreshMarigoldWorld(): void {
    const scene = sceneIfActive(this.game, 'RainbowMeadowScene');
    if (!scene) {
      return;
    }

    if (this.marigoldArea !== 'picnic-hill') {
      destroyNamedObject(scene, 'core-npc:marigold:picnic');
      return;
    }

    if (scene.children.getByName('core-npc:marigold:picnic')) {
      return;
    }

    createVillageCoreResidentSprite(scene, 'marigold', 'core-npc:marigold:picnic')
      .setPosition(
        RAINBOW_MEADOW_LAYOUT.picnicHill.marigold.x,
        RAINBOW_MEADOW_LAYOUT.picnicHill.marigold.y,
      )
      .setDepth(
        worldDepthForY(
          RAINBOW_MEADOW_LAYOUT.picnicHill.marigold.y +
            SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight * 0.44,
          0.32,
        ),
      );
  }

  private refreshNovaWorld(): void {
    const scene = sceneIfActive(this.game, 'RainbowMeadowScene');
    if (!scene) {
      return;
    }

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
    destroyNamedObject(scene, 'core-npc:nova:world');
  }

  private ensurePicnicNova(scene: Phaser.Scene): void {
    if (!scene.children.getByName('core-npc:nova:picnic')) {
      const nova = createCoreNpcSprite(
        scene,
        'nova',
        RAINBOW_MEADOW_LAYOUT.picnicHill.nova.x,
        RAINBOW_MEADOW_LAYOUT.picnicHill.nova.y + 4,
        'world',
      )
        .setName('core-npc:nova:picnic')
        .setDisplaySize(112, 92)
        .setDepth(worldDepthForY(RAINBOW_MEADOW_LAYOUT.picnicHill.nova.y + 50, 0.32));
      addCoreNpcIdleTween(scene, nova, 'nova', 5);
    }

    if (!scene.children.getByName('core-npc:nova:picnic-label')) {
      scene.add
        .text(
          RAINBOW_MEADOW_LAYOUT.picnicHill.nova.x,
          RAINBOW_MEADOW_LAYOUT.picnicHill.nova.y + 72,
          'Nova',
          {
            color: '#5e4669',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            backgroundColor: '#fff8dfdd',
            padding: { x: 7, y: 3 },
          },
        )
        .setName('core-npc:nova:picnic-label')
        .setOrigin(0.5)
        .setDepth(worldDepthForY(RAINBOW_MEADOW_LAYOUT.picnicHill.nova.y + 82, 0.34));
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
