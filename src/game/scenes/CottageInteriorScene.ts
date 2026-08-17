import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConstants';
import { buildCottageHomeView, type CottageHomeView } from '../home/CottageHomeView';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { selectInteractionTarget } from '../interaction/InteractionTargeting';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  MOONFLOWER_GLADE_LOCATION_ID,
  saveLocationCheckpoint,
} from '../save/saveLocationCheckpoint';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { COTTAGE_INTERIOR_LOCATION_ID, COTTAGE_INTERIOR_MAP } from '../world/CottageInteriorMap';
import { MOONFLOWER_GLADE_MAP, setMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';

const COLLISION_TEXTURE_KEY = 'cottage-collision-pixel';
const SAVED_PLAYER_TEXTURE_KEY = 'player-unicorn-cottage';

export class CottageInteriorScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private activeInteraction: InteractionTarget | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private homeView: CottageHomeView | null = null;
  private interactions: readonly InteractionTarget[] = [];

  public constructor() {
    super('CottageInteriorScene');
  }

  public create(): void {
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, COTTAGE_INTERIOR_LOCATION_ID);
    this.homeView = buildCottageHomeView(save);
    this.renderHomeState(this.homeView);
    this.interactions = this.createInteractions(this.homeView);

    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, SAVED_PLAYER_TEXTURE_KEY, appearance);

    const map = COTTAGE_INTERIOR_MAP;
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

    const camera = this.cameras.main;
    camera.setBackgroundColor('#f5dfcb');
    camera.setBounds(0, 0, map.width, map.height);
    camera.startFollow(this.player.sprite, true, 0.11, 0.11);
    camera.setDeadzone(250, 145);

    this.createHud();

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
      this.player?.destroy();
      this.player = null;
      this.collisionGroup?.clear(true, true);
      this.collisionGroup = null;
      this.activeInteraction = null;
      this.feedbackText = null;
      this.homeView = null;
      this.interactions = [];
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

    const movement = resolvePlayerMovement(
      this.inputController.getAxis('MOVE_X'),
      this.inputController.getAxis('MOVE_Y'),
      DEFAULT_PLAYER_SPEED,
      this.player.getFacing(),
    );
    this.player.applyMovement(movement);
    this.player.updatePresentation(time);

    this.activeInteraction = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      this.interactions,
    );
    this.interactionPrompt?.setTarget(this.activeInteraction);

    if (this.inputController.justPressed('INTERACT') && this.activeInteraction) {
      this.activateInteraction(this.activeInteraction);
    }
  }

  private createInteractions(homeView: CottageHomeView): readonly InteractionTarget[] {
    const treasureNames = homeView.treasureRewards.map((reward) => reward.name);
    const treasureVerb = treasureNames.length === 1 ? 'is' : 'are';
    const treasureMessage =
      treasureNames.length > 0
        ? `${treasureNames.join(' and ')} ${treasureVerb} glowing here. Your adventure is home too.`
        : 'A tiny shelf waits for special treasures from your adventures.';

    return [
      {
        id: 'interaction:cottage-exit',
        label: 'Moonflower Glade',
        actionLabel: 'Go outside',
        position: COTTAGE_INTERIOR_MAP.exit.approach,
        interactionRadius: 150,
        priority: 30,
        result: {
          type: 'scene-transition',
          sceneKey: 'MoonflowerGladeScene',
        },
      },
      {
        id: 'interaction:cottage-treasure-display',
        label: 'Treasure Shelf',
        actionLabel: 'Look',
        position: COTTAGE_INTERIOR_MAP.treasureDisplay.approach,
        interactionRadius: 155,
        priority: 20,
        result: {
          type: 'message',
          title: 'Your Treasure Shelf',
          message: treasureMessage,
        },
      },
    ] satisfies readonly InteractionTarget[];
  }

  private activateInteraction(target: InteractionTarget): void {
    if (target.result.type === 'scene-transition') {
      if (target.result.sceneKey === 'MoonflowerGladeScene') {
        const cottage = MOONFLOWER_GLADE_MAP.landmarks.find(
          (landmark) => landmark.id === 'moonflower-cottage',
        );
        if (cottage) {
          setMoonflowerGladePlayerSpawn(cottage.approach);
        }
        saveLocationCheckpoint(getBrowserSaveService(), MOONFLOWER_GLADE_LOCATION_ID);
      }

      this.scene.start(target.result.sceneKey, target.result.payload);
      return;
    }

    if (target.result.type === 'message') {
      this.showFeedback(`${target.result.title}\n${target.result.message}`);
    }
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
    const map = COTTAGE_INTERIOR_MAP;
    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0xf4ddc7).setDepth(0);
    this.add
      .rectangle(map.width / 2, map.height / 2 + 35, map.width - 160, map.height - 170, 0xf7e8d6)
      .setStrokeStyle(18, 0xb98b72, 0.9)
      .setDepth(1);

    this.createFloorboards();
    this.createWindows();
    this.createFireplace();
    this.createBed();
    this.createTeaTable();
    this.createSofa();
    this.createTreasureShelf();
    this.createDoor();
    this.createMoonflowerDetails();
  }

  private createFloorboards(): void {
    for (let y = 160; y <= 1040; y += 72) {
      this.add.rectangle(900, y, 1610, 3, 0xcda889, 0.28).setDepth(2);
    }

    this.add
      .ellipse(900, 815, 470, 285, 0xc9a2d6, 0.26)
      .setStrokeStyle(6, 0xa77bb8, 0.24)
      .setDepth(3);
  }

  private createWindows(): void {
    for (const x of [670, 1130]) {
      this.add
        .rectangle(x, 150, 210, 125, 0xbcebf1, 0.92)
        .setStrokeStyle(12, 0x9b785f, 0.95)
        .setDepth(5);
      this.add.rectangle(x, 150, 8, 112, 0xffffff, 0.55).setDepth(6);
      this.add.rectangle(x, 150, 195, 8, 0xffffff, 0.55).setDepth(6);
      this.add.circle(x + 42, 126, 20, 0xfff3a8, 0.5).setDepth(6);
    }
  }

  private createFireplace(): void {
    this.add
      .rectangle(285, 305, 250, 150, 0xa87967, 1)
      .setStrokeStyle(10, 0x815e54, 0.95)
      .setDepth(6);
    this.add.rectangle(285, 330, 125, 95, 0x55404a, 1).setDepth(7);
    this.add.ellipse(285, 345, 72, 60, 0xf8a958, 0.78).setDepth(8);
    this.add.ellipse(285, 353, 42, 42, 0xffdd75, 0.9).setDepth(9);
    this.add.rectangle(285, 215, 285, 30, 0x8f6858, 1).setDepth(7);
    this.add
      .text(285, 205, '🌙', { fontFamily: 'system-ui, sans-serif', fontSize: '36px' })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createBed(): void {
    this.add
      .rectangle(390, 670, 300, 230, 0xecc9dc, 1)
      .setStrokeStyle(8, 0x9a705f, 0.9)
      .setDepth(6);
    this.add.rectangle(390, 585, 272, 62, 0xfff4e5, 1).setDepth(7);
    this.add.rectangle(390, 706, 272, 115, 0xc9a5d8, 0.9).setDepth(7);
    this.add
      .text(390, 688, '☾  ✦  ☾', {
        color: '#fff4cb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createTeaTable(): void {
    this.add.ellipse(900, 500, 230, 165, 0xc4936f, 1).setStrokeStyle(7, 0x8c644f, 0.9).setDepth(6);
    this.add
      .text(900, 494, '🫖', { fontFamily: 'system-ui, sans-serif', fontSize: '40px' })
      .setOrigin(0.5)
      .setDepth(8);
    for (const [x, y] of [
      [770, 510],
      [1030, 510],
    ] as const) {
      this.add.circle(x, y, 48, 0xe3bd91, 1).setDepth(5);
      this.add.circle(x, y, 29, 0xf8e7d1, 0.9).setDepth(6);
    }
  }

  private createSofa(): void {
    this.add
      .rectangle(1245, 735, 300, 145, 0x93bfac, 1)
      .setStrokeStyle(8, 0x648e7e, 0.95)
      .setDepth(6);
    this.add.rectangle(1245, 682, 276, 58, 0xa9cfbe, 1).setDepth(7);
    this.add.circle(1175, 730, 32, 0xffd995, 1).setDepth(8);
    this.add.circle(1315, 730, 32, 0xdcb9eb, 1).setDepth(8);
  }

  private createTreasureShelf(): void {
    this.add
      .rectangle(1515, 345, 220, 95, 0xb17c5f, 1)
      .setStrokeStyle(7, 0x805848, 0.95)
      .setDepth(6);
    this.add.rectangle(1515, 300, 250, 18, 0x8e624e, 1).setDepth(7);
    this.add
      .text(1515, 415, 'Treasure Shelf', {
        color: '#70515f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff7e6dd',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createDoor(): void {
    this.add
      .rectangle(COTTAGE_INTERIOR_MAP.exit.position.x, 1080, 185, 180, 0x8d654f, 1)
      .setStrokeStyle(10, 0x6d4d43, 1)
      .setDepth(6);
    this.add.circle(957, 1080, 9, 0xffe5a5, 1).setDepth(7);
    this.add
      .text(900, 1000, 'Moonflower Glade', {
        color: '#6f5361',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#fff7e6dd',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createMoonflowerDetails(): void {
    const positions = [
      [170, 860],
      [1600, 840],
      [1580, 590],
      [620, 900],
    ] as const;
    for (const [x, y] of positions) {
      this.add.circle(x, y, 25, 0xffefad, 0.16).setDepth(4);
      this.add
        .text(x, y, '🌙', { fontFamily: 'system-ui, sans-serif', fontSize: '28px' })
        .setOrigin(0.5)
        .setDepth(5);
    }
  }

  private renderHomeState(homeView: CottageHomeView): void {
    const occupiedSlots = new Set(homeView.placements.map((placement) => placement.slotId));

    for (const slot of COTTAGE_INTERIOR_MAP.decorationSlots) {
      if (occupiedSlots.has(slot.id)) {
        continue;
      }

      this.add
        .circle(slot.position.x, slot.position.y, 44, 0xd9b8e5, 0.1)
        .setStrokeStyle(3, 0xb98ac9, 0.18)
        .setDepth(4);
      this.add
        .text(slot.position.x, slot.position.y, '✦', {
          color: '#b78bc2',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
        })
        .setOrigin(0.5)
        .setAlpha(0.5)
        .setDepth(5);
    }

    for (const placement of homeView.placements) {
      this.add.circle(placement.position.x, placement.position.y, 52, 0xfff0b8, 0.22).setDepth(8);
      this.add
        .text(placement.position.x, placement.position.y - 4, placement.icon, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '48px',
        })
        .setOrigin(0.5)
        .setDepth(9);
      this.add
        .text(placement.position.x, placement.position.y + 60, placement.name, {
          color: '#6c5268',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          backgroundColor: '#fff8e8cc',
          padding: { x: 7, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(10);
    }

    const shelf = COTTAGE_INTERIOR_MAP.treasureDisplay.position;
    homeView.treasureRewards.forEach((reward, index) => {
      const x = shelf.x + (index - (homeView.treasureRewards.length - 1) / 2) * 70;
      this.add.circle(x, shelf.y - 18, 36, 0xffe9a0, 0.2).setDepth(8);
      const icon = this.add
        .text(x, shelf.y - 24, reward.icon, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '44px',
        })
        .setOrigin(0.5)
        .setDepth(9);
      this.tweens.add({
        targets: icon,
        y: '-=5',
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

    if (homeView.treasureRewards.length === 0) {
      this.add
        .text(shelf.x, shelf.y - 20, '✦', {
          color: '#f5d98c',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '32px',
        })
        .setOrigin(0.5)
        .setAlpha(0.55)
        .setDepth(8);
    }
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const collisionGroup = this.physics.add.staticGroup();

    for (const collider of COTTAGE_INTERIOR_MAP.colliders) {
      const blocker = collisionGroup.create(
        collider.x,
        collider.y,
        COLLISION_TEXTURE_KEY,
      ) as Phaser.Physics.Arcade.Image;
      blocker.setDisplaySize(collider.width, collider.height).setVisible(false).refreshBody();
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
      .text(GAME_WIDTH / 2, 34, 'Moonflower Cottage', {
        color: '#6e5064',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        backgroundColor: '#fff5e7e8',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);

    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, 120, '', {
        color: '#664c5f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: '#fff8ecee',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(116)
      .setVisible(false);
  }
}
