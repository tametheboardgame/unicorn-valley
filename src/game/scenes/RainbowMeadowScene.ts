import Phaser from 'phaser';
import type { DiscoveryId } from '../../content/contentTypes';
import { MARIGOLD_CHARACTER_ID } from '../../content/r4PicnicEvent';
import { GAME_WIDTH } from '../config/gameConstants';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import { isInteractionModalActive } from '../interaction/InteractionModalState';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { selectInteractionTarget } from '../interaction/InteractionTargeting';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import { launchRainbowDiscActivity } from './RainbowDiscActivityRegistration';
import {
  createMarigoldPicnicPresentation,
  createPicnicHillLandscape,
} from '../story/MarigoldPicnicPresentation';
import { startMarigoldConversation } from '../story/WorldStoryConversations';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import {
  RAINBOW_MEADOW_LAYOUT,
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
} from '../world/RainbowMeadowMap';
import {
  setSunbeamVillagePlayerSpawn,
  SUNBEAM_VILLAGE_LOCATION_ID,
  SUNBEAM_VILLAGE_MAP,
} from '../world/SunbeamVillageMap';
import { CoreNpcPresenceService } from '../world/CoreNpcPresenceService';
import { createRainbowDiscMeadowPresentation } from '../world/RainbowDiscMeadowPresentation';
import { resolveRainbowMeadowWalkThroughDestination } from '../world/RainbowMeadowTraversal';
import { RAINBOW_RUN_HUB_LOCATION_ID } from '../world/RainbowRunHubMap';
import { worldDepthForY } from '../world/WorldDepth';

const COLLISION_TEXTURE_KEY = 'rainbow-meadow-collision-pixel';
const SAVED_PLAYER_TEXTURE_KEY = 'player-unicorn-rainbow-meadow';
const MEADOW_DISCOVERY_ID: DiscoveryId = 'discovery:rainbow-meadow';
const MEADOW_VISITED_FLAG = 'flag:visited-rainbow-meadow';

function entranceApproach(id: string): { x: number; y: number } {
  const entrance = RAINBOW_MEADOW_MAP.entrances.find((candidate) => candidate.id === id);
  if (!entrance) {
    throw new Error(`Rainbow Meadow interaction references missing entrance: ${id}`);
  }

  return entrance.approach;
}

function hubApproach(id: string): { x: number; y: number } {
  const feature = RAINBOW_MEADOW_MAP.hubFeatures.find((candidate) => candidate.id === id);
  if (!feature) {
    throw new Error(`Rainbow Meadow interaction references missing hub feature: ${id}`);
  }

  return feature.approach;
}

function createMeadowInteractions(scene: Phaser.Scene): readonly InteractionTarget[] {
  const presenceService = new CoreNpcPresenceService(getBrowserSaveService());

  return [
    {
      id: 'interaction:meadow-village-gate',
      label: 'Sunbeam Village',
      actionLabel: 'Go to village',
      position: entranceApproach('sunbeam-village'),
      interactionRadius: 170,
      priority: 20,
      result: {
        type: 'scene-transition',
        sceneKey: 'SunbeamVillageScene',
      },
    },
    {
      id: 'interaction:meadow-marigold-picnic',
      label: 'Marigold',
      actionLabel: 'Talk',
      actionKind: 'talk',
      position: RAINBOW_MEADOW_LAYOUT.picnicHill.marigold,
      interactionRadius: 155,
      priority: 30,
      visible: () => presenceService.resolve(MARIGOLD_CHARACTER_ID)?.area === 'picnic-hill',
      result: { type: 'callback', activate: () => startMarigoldConversation(scene) },
    },
    {
      id: 'interaction:rainbow-disc',
      label: 'Rainbow Disc',
      actionLabel: 'Join the game',
      actionKind: 'start',
      position: RAINBOW_MEADOW_LAYOUT.rainbowDisc.approach,
      approachPosition: RAINBOW_MEADOW_LAYOUT.rainbowDisc.approach,
      interactionRadius: 230,
      priority: 28,
      result: {
        type: 'callback',
        activate: () => void launchRainbowDiscActivity(scene),
      },
    },
    {
      id: 'interaction:rainbow-disc-practice',
      label: 'Rainbow Disc Practice',
      actionLabel: 'Practice throws',
      actionKind: 'start',
      position: RAINBOW_MEADOW_LAYOUT.rainbowDisc.practice.approach,
      approachPosition: RAINBOW_MEADOW_LAYOUT.rainbowDisc.practice.approach,
      interactionRadius: 210,
      priority: 27,
      result: {
        type: 'callback',
        activate: () => void launchRainbowDiscActivity(scene, 'practice'),
      },
    },
    {
      id: 'interaction:meadow-race-entrance',
      label: 'Rainbow Run Race Hub',
      actionLabel: 'Enter Race Hub',
      position: hubApproach('rainbow-run-entrance'),
      interactionRadius: 175,
      priority: 25,
      result: {
        type: 'scene-transition',
        sceneKey: 'RainbowRunEntryScene',
      },
    },
  ] satisfies readonly InteractionTarget[];
}

export class RainbowMeadowScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private activeInteraction: InteractionTarget | null = null;
  private meadowInteractions: readonly InteractionTarget[] = [];
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private discoveryService: DiscoveryService | null = null;
  private boundaryTransitionStarted = false;
  private readonly discoveryPickups = new Map<DiscoveryId, Phaser.GameObjects.Container>();

  public constructor() {
    super('RainbowMeadowScene');
  }

  public create(): void {
    this.boundaryTransitionStarted = false;
    this.meadowInteractions = createMeadowInteractions(this);
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, RAINBOW_MEADOW_LOCATION_ID);
    this.discoveryService = new DiscoveryService(saveService);
    const firstVisit = !this.discoveryService.hasDiscovery(MEADOW_DISCOVERY_ID);
    if (firstVisit) {
      this.discoveryService.unlockDiscovery(MEADOW_DISCOVERY_ID, MEADOW_VISITED_FLAG);
    }

    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, SAVED_PLAYER_TEXTURE_KEY, appearance);

    const map = RAINBOW_MEADOW_MAP;
    this.physics.world.setBounds(
      map.margin,
      map.margin,
      map.width - map.margin * 2,
      map.height - map.margin * 2,
    );

    this.collisionGroup = this.createCollisionMap();
    this.player = new PlayerEntity(
      this,
      map.playerSpawn.x,
      map.playerSpawn.y,
      SAVED_PLAYER_TEXTURE_KEY,
    );
    this.player.sprite.setDisplaySize(112, 92);
    this.player.sprite.setDepth(worldDepthForY(this.player.sprite.y, 0.5));
    this.physics.add.collider(this.player.sprite, this.collisionGroup);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    if (
      shouldShowTouchMovementPad(
        globalThis.navigator?.maxTouchPoints ?? 0,
        'ontouchstart' in globalThis,
      )
    ) {
      this.touchMovementPad = new TouchMovementPad(this, this.pointerInput);
    }
    this.interactionPrompt = new InteractionPrompt(this, this.pointerInput);

    this.createDiscoveryPickups();

    const camera = this.cameras.main;
    camera.setBackgroundColor('#9fdf8e');
    camera.setBounds(0, 0, map.width, map.height);
    camera.startFollow(this.player.sprite, true, 0.11, 0.11);
    camera.setDeadzone(260, 150);

    this.createHud();
    if (firstVisit) {
      this.showFeedback('New place discovered!\nRainbow Meadow 🌈');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.feedbackTimer?.destroy();
      this.feedbackTimer = null;
      this.touchMovementPad?.destroy();
      this.touchMovementPad = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.interactionPrompt?.destroy();
      this.interactionPrompt = null;
      for (const pickup of this.discoveryPickups.values()) {
        pickup.destroy(true);
      }
      this.discoveryPickups.clear();
      this.discoveryService = null;
      this.player?.destroy();
      this.player = null;
      this.collisionGroup = null;
      this.activeInteraction = null;
      this.meadowInteractions = [];
      this.feedbackText = null;
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (this.inputController.justPressed('BACK')) {
      this.scene.start('TitleScene');
      return;
    }

    if (isInteractionModalActive(this)) {
      this.player.applyMovement(
        resolvePlayerMovement(0, 0, DEFAULT_PLAYER_SPEED, this.player.getFacing()),
      );
      this.player.updatePresentation(time);
      this.player.sprite.setDepth(worldDepthForY(this.player.sprite.y, 0.5));
      this.activeInteraction = null;
      this.interactionPrompt?.setTarget(null);
      return;
    }

    const movement = resolvePlayerMovement(
      this.inputController.getAxis('MOVE_X'),
      this.inputController.getAxis('MOVE_Y'),
      DEFAULT_PLAYER_SPEED,
      this.player.getFacing(),
    );
    this.player.applyMovement(movement);
    this.player.updatePresentation(time);
    this.player.sprite.setDepth(worldDepthForY(this.player.sprite.y, 0.5));

    if (this.tryActivateBoundaryTransition()) {
      return;
    }

    this.tryCollectDiscoveries();

    this.activeInteraction = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      this.meadowInteractions,
    );
    this.interactionPrompt?.setTarget(this.activeInteraction);

    if (this.inputController.justPressed('INTERACT') && this.activeInteraction) {
      this.activateInteraction(this.activeInteraction);
    }
  }

  private activateInteraction(target: InteractionTarget): void {
    if (target.result.type === 'scene-transition') {
      if (target.result.sceneKey === 'SunbeamVillageScene') {
        this.transitionToSunbeamVillage();
        return;
      }
      if (target.result.sceneKey === 'RainbowRunEntryScene') {
        this.transitionToRaceHub();
        return;
      }
      this.scene.start(target.result.sceneKey, target.result.payload);
      return;
    }

    if (target.result.type === 'callback') {
      target.result.activate();
      return;
    }

    if (target.result.type === 'message') {
      this.showFeedback(`${target.result.title}\n${target.result.message}`);
    }
  }

  private tryActivateBoundaryTransition(): boolean {
    if (!this.player || this.boundaryTransitionStarted) {
      return false;
    }

    const destination = resolveRainbowMeadowWalkThroughDestination({
      x: this.player.sprite.x,
      y: this.player.sprite.y,
    });
    if (!destination) {
      return false;
    }

    this.boundaryTransitionStarted = true;
    if (destination === 'rainbow-run-hub') {
      this.transitionToRaceHub();
    } else {
      this.transitionToSunbeamVillage();
    }
    return true;
  }

  private transitionToSunbeamVillage(): void {
    const meadowEntrance = SUNBEAM_VILLAGE_MAP.entrances.find(
      (entrance) => entrance.id === 'rainbow-meadow',
    );
    if (meadowEntrance) {
      setSunbeamVillagePlayerSpawn(meadowEntrance.approach);
    }
    saveLocationCheckpoint(getBrowserSaveService(), SUNBEAM_VILLAGE_LOCATION_ID);
    this.scene.start('SunbeamVillageScene');
  }

  private transitionToRaceHub(): void {
    saveLocationCheckpoint(getBrowserSaveService(), RAINBOW_RUN_HUB_LOCATION_ID);
    this.scene.start('RainbowRunEntryScene');
  }

  private tryCollectDiscoveries(): void {
    if (!this.player || !this.discoveryService) {
      return;
    }

    for (const spot of RAINBOW_MEADOW_MAP.discoverySpots) {
      const pickup = this.discoveryPickups.get(spot.discoveryId);
      if (!pickup) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        spot.position.x,
        spot.position.y,
      );
      if (distance > spot.collectionRadius) {
        continue;
      }

      this.discoveryService.unlockDiscovery(spot.discoveryId);
      pickup.destroy(true);
      this.discoveryPickups.delete(spot.discoveryId);
      this.cameras.main.flash(180, 255, 244, 176, false);
      this.showFeedback(`New discovery!\n${spot.label} ✨`);
      break;
    }
  }

  private createDiscoveryPickups(): void {
    if (!this.discoveryService) {
      return;
    }

    for (const spot of RAINBOW_MEADOW_MAP.discoverySpots) {
      if (this.discoveryService.hasDiscovery(spot.discoveryId)) {
        continue;
      }

      const pickup =
        spot.id === 'prism-bloom'
          ? this.createPrismBloom(spot.position.x, spot.position.y)
          : this.createSunshowerFeather(spot.position.x, spot.position.y);
      this.discoveryPickups.set(spot.discoveryId, pickup);
    }
  }

  private createPrismBloom(x: number, y: number): Phaser.GameObjects.Container {
    const stem = this.add.rectangle(0, 17, 5, 38, 0x5e9f64, 1);
    const leafLeft = this.add.ellipse(-9, 18, 18, 10, 0x75b06f, 0.96).setAngle(-28);
    const leafRight = this.add.ellipse(10, 25, 18, 10, 0x75b06f, 0.96).setAngle(28);
    const colours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];
    const petals = colours.map((colour, index) => {
      const angle = (Math.PI * 2 * index) / colours.length - Math.PI / 2;
      return this.add.ellipse(Math.cos(angle) * 18, Math.sin(angle) * 18 - 7, 22, 34, colour, 0.98);
    });
    const centre = this.add.circle(0, -7, 10, 0xfff4b2, 1);
    const container = this.add
      .container(x, y, [stem, leafLeft, leafRight, ...petals, centre])
      .setName('rainbow-meadow:discovery:prism-bloom')
      .setDepth(worldDepthForY(y, 0.35));
    this.tweens.add({
      targets: container,
      angle: { from: -1.5, to: 1.5 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return container;
  }

  private createSunshowerFeather(x: number, y: number): Phaser.GameObjects.Container {
    const shaft = this.add.rectangle(0, 0, 4, 58, 0x8f7658, 0.96).setAngle(-18);
    const vaneLeft = this.add.ellipse(-8, -5, 18, 52, 0xf6d67d, 0.94).setAngle(-29);
    const vaneRight = this.add.ellipse(8, -7, 18, 48, 0xffecaa, 0.96).setAngle(-7);
    const tip = this.add.triangle(17, -31, 0, 13, 16, 0, 12, 20, 0xffefb2, 0.98).setAngle(-18);
    const container = this.add
      .container(x, y, [vaneLeft, vaneRight, shaft, tip])
      .setName('rainbow-meadow:discovery:sunshower-feather')
      .setDepth(worldDepthForY(y, 0.35));
    this.tweens.add({
      targets: container,
      y: y - 7,
      angle: { from: -3, to: 3 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return container;
  }

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedbackText?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(4000, () => {
      this.feedbackText?.setVisible(false);
      this.feedbackTimer = null;
    });
  }

  private createEnvironment(): void {
    const map = RAINBOW_MEADOW_MAP;
    this.add
      .rectangle(map.width / 2, map.height / 2, map.width, map.height, 0x9fdf8e)
      .setName('rainbow-meadow:ground')
      .setDepth(0);

    for (const district of RAINBOW_MEADOW_LAYOUT.districts) {
      this.add
        .ellipse(
          district.centre.x,
          district.centre.y,
          district.radiusX * 2,
          district.radiusY * 2,
          district.groundColour,
          district.groundAlpha,
        )
        .setName(`rainbow-meadow:district:${district.id}`)
        .setDepth(1);
    }

    void import('../world/RainbowMeadowTraversalPresentation').then(
      ({ createRainbowMeadowTraversalPresentation }) => {
        if (this.scene.isActive()) {
          createRainbowMeadowTraversalPresentation(this);
        }
      },
    );
    this.createPond();
    this.createGroves();
    this.createSunbeamVillageSign();
    this.createRainbowRunHubGateway();
    createRainbowDiscMeadowPresentation(this);
    createPicnicHillLandscape(this);
    createMarigoldPicnicPresentation(this, getBrowserSaveService().load());
    this.createMeadowFlowers();
  }

  private createPond(): void {
    const pond = RAINBOW_MEADOW_LAYOUT.natureFeatures.pond;
    this.add
      .ellipse(
        pond.position.x,
        pond.position.y + 8,
        pond.width + 34,
        pond.height + 24,
        0x6aa874,
        0.28,
      )
      .setName('rainbow-meadow:nature:pond-bank')
      .setDepth(2.9);
    this.add
      .ellipse(pond.position.x, pond.position.y, pond.width, pond.height, 0x67c8df, 0.96)
      .setName('rainbow-meadow:nature:pond')
      .setDepth(3);
    this.add
      .ellipse(
        pond.position.x - 28,
        pond.position.y - 20,
        pond.width - 105,
        pond.height - 92,
        0xb9eef0,
        0.36,
      )
      .setName('rainbow-meadow:nature:pond-reflection')
      .setDepth(4);
    for (const { x, y, scale } of pond.lilyPads) {
      this.add
        .ellipse(x, y, 52 * scale, 26 * scale, 0x6fa76c, 0.95)
        .setStrokeStyle(2, 0x4f8653, 0.55)
        .setDepth(5);
      this.add.circle(x + 7 * scale, y - 3 * scale, 8 * scale, 0xffd5ef, 0.95).setDepth(6);
    }

    for (const frog of pond.frogs) {
      const from = pond.lilyPads[frog.padIndex];
      const to = pond.lilyPads[frog.hopToPadIndex];
      if (from && to) {
        this.createPondFrog(frog.id, from, to, frog.colour, frog.delayMs);
      }
    }

    const reedBaseX = pond.position.x - pond.width / 2 + 34;
    const reedBaseY = pond.position.y + pond.height / 2 - 10;
    const reeds = this.add
      .graphics()
      .setName('rainbow-meadow:nature:pond-reeds')
      .setDepth(worldDepthForY(reedBaseY, 0.02));
    reeds.lineStyle(5, 0x5b9362, 0.9);
    for (const [offsetX, height] of [
      [0, 54],
      [16, 72],
      [34, 48],
      [52, 66],
    ] as const) {
      reeds.lineBetween(
        reedBaseX + offsetX,
        reedBaseY,
        reedBaseX + offsetX + 4,
        reedBaseY - height,
      );
      reeds.fillStyle(0x8d6c45, 0.94);
      reeds.fillEllipse(reedBaseX + offsetX + 4, reedBaseY - height - 7, 9, 20);
    }
  }

  private createPondFrog(
    id: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
    colour: number,
    delayMs: number,
  ): void {
    const body = this.add.ellipse(0, 2, 26, 18, colour, 1).setStrokeStyle(2, 0x4f7f4e, 0.8);
    const head = this.add.ellipse(0, -8, 24, 18, colour, 1).setStrokeStyle(2, 0x4f7f4e, 0.8);
    const leftEye = this.add.circle(-7, -17, 4.5, 0xf5f5d9, 1);
    const rightEye = this.add.circle(7, -17, 4.5, 0xf5f5d9, 1);
    const leftPupil = this.add.circle(-7, -17, 2, 0x3f4044, 1);
    const rightPupil = this.add.circle(7, -17, 2, 0x3f4044, 1);
    const frog = this.add
      .container(from.x, from.y - 13, [body, head, leftEye, rightEye, leftPupil, rightPupil])
      .setName(`rainbow-meadow:nature:frog:${id}`)
      .setDepth(worldDepthForY(from.y, 0.18));

    this.time.delayedCall(delayMs, () => {
      if (!frog.active) {
        return;
      }

      const flight = { progress: 0 };
      this.tweens.add({
        targets: flight,
        progress: 1,
        duration: 950,
        yoyo: true,
        repeat: -1,
        repeatDelay: 1500,
        ease: 'Sine.InOut',
        onUpdate: () => {
          const progress = flight.progress;
          frog
            .setPosition(
              Phaser.Math.Linear(from.x, to.x, progress),
              Phaser.Math.Linear(from.y - 13, to.y - 13, progress) -
                Math.sin(Math.PI * progress) * 34,
            )
            .setDepth(worldDepthForY(Phaser.Math.Linear(from.y, to.y, progress), 0.18));
        },
      });
    });
  }

  private createGroves(): void {
    for (const tree of RAINBOW_MEADOW_LAYOUT.scenery.trees) {
      this.createMeadowTree(tree.id, tree.x, tree.y, tree.scale);
    }
  }

  private createMeadowTree(id: string, x: number, y: number, scale: number): void {
    const trunk = this.add.rectangle(0, -48, 34, 96, 0x896349, 1);
    const left = this.add.circle(-38, -116, 68, 0x5e9d64, 1);
    const right = this.add.circle(42, -110, 76, 0x68aa68, 1);
    const top = this.add.circle(3, -164, 82, 0x78b970, 1);
    const blossom = this.add.circle(48, -150, 14, 0xffc7df, 0.78);
    this.add
      .container(x, y, [trunk, left, right, top, blossom])
      .setName(`rainbow-meadow:tree:${id}`)
      .setScale(scale)
      .setDepth(worldDepthForY(y, 0.25));
  }

  private createSunbeamVillageSign(): void {
    const { x, y } = RAINBOW_MEADOW_LAYOUT.sunbeamGateway.sign;
    const depth = worldDepthForY(y + 104, 0.28);
    const sign = this.add
      .container(x, y)
      .setName('rainbow-meadow:sunbeam-village-sign')
      .setDepth(depth);

    const leftPost = this.add
      .rectangle(-58, 58, 14, 118, 0x79573f, 1)
      .setStrokeStyle(2, 0x5c4234, 0.88);
    const rightPost = this.add
      .rectangle(58, 58, 14, 118, 0x79573f, 1)
      .setStrokeStyle(2, 0x5c4234, 0.88);

    const board = this.add.graphics();
    board.fillStyle(0xeadcaf, 1);
    board.lineStyle(5, 0x765442, 0.98);
    board.fillRoundedRect(-126, -42, 252, 86, 18);
    board.strokeRoundedRect(-126, -42, 252, 86, 18);
    board.fillStyle(0xd8b9e4, 0.82);
    board.fillRoundedRect(-112, -31, 224, 9, 5);

    const roofMark = this.add.graphics();
    roofMark.fillStyle(0x8d5963, 1);
    roofMark.fillTriangle(-101, 3, -82, -15, -63, 3);
    roofMark.fillStyle(0x8fc9d8, 1);
    roofMark.fillRect(-94, 3, 24, 19);
    roofMark.fillStyle(0x624b5d, 1);
    roofMark.fillRect(-85, 10, 7, 12);
    roofMark.fillStyle(0xffefb2, 1);
    roofMark.fillRect(-92, 6, 6, 6);

    const label = this.add
      .text(18, -8, 'SUNBEAM VILLAGE', {
        color: '#5d4968',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    const direction = this.add
      .text(18, 18, '←  THIS WAY', {
        color: '#80657f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    sign.add([leftPost, rightPost, board, roofMark, label, direction]);
  }

  private createRainbowRunHubGateway(): void {
    const feature = RAINBOW_MEADOW_MAP.hubFeatures.find(
      (item) => item.id === 'rainbow-run-entrance',
    );
    if (!feature) {
      return;
    }

    const { x, y } = feature.position;
    const signX = x + 138;
    const signY = y + 48;
    const postDepth = worldDepthForY(signY + 92, 0.18);

    this.add
      .rectangle(signX, signY + 72, 18, 150, 0x765442, 1)
      .setName('rainbow-meadow:rainbow-run-wayfinding-post')
      .setStrokeStyle(3, 0x5f4538, 0.88)
      .setDepth(postDepth);

    this.add
      .rectangle(signX, signY, 210, 72, 0xf2dfad, 1)
      .setName('rainbow-meadow:rainbow-run-hub-sign')
      .setStrokeStyle(5, 0x765442, 1)
      .setDepth(postDepth + 0.08);

    this.add
      .text(signX, signY, 'RAINBOW RUN\nRace Hub  ↑', {
        color: '#604f63',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 1,
      })
      .setName('rainbow-meadow:rainbow-run-wayfinding-text')
      .setOrigin(0.5)
      .setDepth(postDepth + 0.12);

    const verge = this.add
      .graphics()
      .setName('rainbow-meadow:rainbow-run-wayfinding-verge')
      .setDepth(postDepth - 0.04);
    for (const [offsetX, colour] of [
      [-32, 0xf3a2c0],
      [0, 0xffdd7e],
      [28, 0x91cde0],
    ] as const) {
      verge.fillStyle(0x62955f, 0.76);
      verge.fillRect(signX + offsetX - 2, signY + 130, 4, 24);
      verge.fillStyle(colour, 0.92);
      verge.fillCircle(signX + offsetX, signY + 123, 7);
    }
  }

  private createMeadowFlowers(): void {
    const palettes = [
      [0xd8c4ee, 0x92cfe1, 0xf7f0d0],
      [0xa9d8ea, 0xe5c7ef, 0xf4d58a],
      [0xf0d7e8, 0x9bcfbd, 0xc8b4e8],
    ] as const;
    const bloomOffsets = [
      { x: -24, y: 2, scale: 0.86 },
      { x: -8, y: -12, scale: 1 },
      { x: 10, y: 4, scale: 0.78 },
      { x: 26, y: -7, scale: 0.9 },
      { x: 2, y: -29, scale: 0.68 },
    ] as const;

    RAINBOW_MEADOW_LAYOUT.scenery.flowerClusters.forEach(({ x, y }, clusterIndex) => {
      const depth = worldDepthForY(y, -0.2);
      const stems = this.add.graphics();
      stems.lineStyle(3, 0x5d9563, 0.88);
      stems.fillStyle(0x75a66e, 0.78);

      bloomOffsets.forEach((bloom, bloomIndex) => {
        const stemBaseY = 18 + (bloomIndex % 2) * 3;
        stems.lineBetween(bloom.x, stemBaseY, bloom.x + 2, bloom.y + 4);
        stems.fillEllipse(bloom.x - 5, bloom.y + 11, 11, 5);
        stems.fillEllipse(bloom.x + 7, bloom.y + 15, 10, 5);
      });

      const children: Phaser.GameObjects.GameObject[] = [stems];
      const palette = palettes[clusterIndex % palettes.length] ?? palettes[0];

      bloomOffsets.forEach((bloom, bloomIndex) => {
        const colour = palette[(clusterIndex + bloomIndex) % palette.length] ?? palette[0];
        const kind = (clusterIndex + bloomIndex) % 3;

        if (kind === 0) {
          const petals = [0, 72, 144, 216, 288].map((angle) =>
            this.add
              .ellipse(
                bloom.x + Math.cos(Phaser.Math.DegToRad(angle)) * 7 * bloom.scale,
                bloom.y + Math.sin(Phaser.Math.DegToRad(angle)) * 7 * bloom.scale,
                8 * bloom.scale,
                14 * bloom.scale,
                colour,
                0.94,
              )
              .setAngle(angle + 90),
          );
          children.push(...petals);
          children.push(this.add.circle(bloom.x, bloom.y, 3.5 * bloom.scale, 0xf2cf75, 0.98));
        } else if (kind === 1) {
          const bell = this.add
            .triangle(
              bloom.x,
              bloom.y,
              -8 * bloom.scale,
              -6 * bloom.scale,
              8 * bloom.scale,
              -6 * bloom.scale,
              0,
              10 * bloom.scale,
              colour,
              0.94,
            )
            .setAngle(bloomIndex % 2 === 0 ? -8 : 9);
          children.push(bell);
          children.push(
            this.add.circle(bloom.x, bloom.y - 6 * bloom.scale, 3 * bloom.scale, 0xf4e6b0, 0.92),
          );
        } else {
          children.push(
            this.add.star(bloom.x, bloom.y, 5, 3.5 * bloom.scale, 9 * bloom.scale, colour, 0.94),
          );
          children.push(this.add.circle(bloom.x, bloom.y, 2.5 * bloom.scale, 0xffefb5, 0.96));
        }
      });

      this.add
        .container(x, y, children)
        .setName(`rainbow-meadow:wildflower-clump:${clusterIndex}`)
        .setDepth(depth);
    });
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const collisionGroup = this.physics.add.staticGroup();

    for (const collider of RAINBOW_MEADOW_MAP.colliders) {
      const blocker = collisionGroup.create(
        collider.x,
        collider.y,
        COLLISION_TEXTURE_KEY,
      ) as Phaser.Physics.Arcade.Image;
      blocker
        .setName(collider.id)
        .setDisplaySize(collider.width, collider.height)
        .setVisible(false)
        .refreshBody();
    }

    return collisionGroup;
  }

  private ensureCollisionTexture(): void {
    if (this.textures.exists(COLLISION_TEXTURE_KEY)) {
      return;
    }

    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture(COLLISION_TEXTURE_KEY, 2, 2);
    graphics.destroy();
  }

  private createHud(): void {
    this.add
      .text(GAME_WIDTH / 2, 24, 'Rainbow Meadow', {
        color: '#5f4756',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
        backgroundColor: '#fff7dff2',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);

    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, 120, '', {
        color: '#5b455f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: '#fff9e8ee',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(122)
      .setVisible(false);
  }
}
