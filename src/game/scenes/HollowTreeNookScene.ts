import Phaser from 'phaser';
import { HOLLOW_TREE_HEART_DISCOVERY_ID } from '../../content/r6GladeHomeContent';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { selectInteractionTarget } from '../interaction/InteractionTargeting';
import { PlayerEntity } from '../player/PlayerEntity';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { HollowTreeStoryService } from '../story/HollowTreeStoryService';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { MOONFLOWER_GLADE_MAP, setMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';

const PLAYER_TEXTURE_KEY = 'player-unicorn-hollow-tree-nook';

export class HollowTreeNookScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private activeInteraction: InteractionTarget | null = null;
  private feedback: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private story: HollowTreeStoryService | null = null;
  private discoveryService: DiscoveryService | null = null;

  public constructor() {
    super('HollowTreeNookScene');
  }

  public create(): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    this.story = new HollowTreeStoryService(saveService, getBrowserQuestEngine());
    this.discoveryService = new DiscoveryService(saveService);

    this.createEnvironment();
    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, PLAYER_TEXTURE_KEY, appearance);
    this.physics.world.setBounds(65, 115, GAME_WIDTH - 130, GAME_HEIGHT - 180);
    this.player = new PlayerEntity(this, GAME_WIDTH / 2, GAME_HEIGHT - 150, PLAYER_TEXTURE_KEY);
    this.player.sprite.setDisplaySize(104, 86).setCollideWorldBounds(true);

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
    this.createFeedback();

    this.cameras.main.setBackgroundColor('#342b43');
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
      this.activeInteraction = null;
      this.feedback = null;
      this.story = null;
      this.discoveryService = null;
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }
    this.inputController.update();
    if (this.inputController.justPressed('BACK')) {
      this.leaveNook();
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

    const targets = this.createInteractionTargets();
    this.activeInteraction = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      targets,
    );
    this.interactionPrompt?.setTarget(this.activeInteraction);
    if (this.inputController.justPressed('INTERACT') && this.activeInteraction) {
      this.activateInteraction(this.activeInteraction.id);
    }
  }

  private createInteractionTargets(): readonly InteractionTarget[] {
    return [
      {
        id: 'interaction:hollow-tree-nook-exit',
        label: 'Moonflower Glade',
        actionLabel: 'Go outside',
        position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 88 },
        interactionRadius: 120,
        priority: 30,
        result: { type: 'message', title: 'Exit', message: '' },
      },
      {
        id: 'interaction:hollow-tree-heart-light',
        label: 'Heart-light Shelf',
        actionLabel: 'Reach for the glow',
        position: { x: 865, y: 300 },
        interactionRadius: 145,
        priority: 25,
        result: { type: 'message', title: 'Heart-light', message: '' },
      },
      {
        id: 'interaction:hollow-tree-memory-shelf',
        label: 'Old little shelf',
        actionLabel: 'Inspect',
        position: { x: 405, y: 320 },
        interactionRadius: 130,
        result: { type: 'message', title: 'Old Shelf', message: '' },
      },
      {
        id: 'interaction:hollow-tree-root-chimes',
        label: 'Root chimes',
        actionLabel: 'Listen',
        position: { x: 635, y: 210 },
        interactionRadius: 125,
        result: { type: 'message', title: 'Root Chimes', message: '' },
      },
    ];
  }

  private activateInteraction(id: string): void {
    if (id === 'interaction:hollow-tree-nook-exit') {
      this.leaveNook();
      return;
    }
    if (id === 'interaction:hollow-tree-heart-light') {
      if (this.story?.discoverHeartLight()) {
        this.showFeedback(
          'The warm light settles into a tiny star jar for your Cottage. Pip calls from outside: “The tree wanted you to find that!” 🌟',
        );
        this.cameras.main.flash(160, 255, 232, 157, false);
        return;
      }
      this.showFeedback(
        this.discoveryService?.hasDiscovery(HOLLOW_TREE_HEART_DISCOVERY_ID)
          ? 'The Heart-light Shelf still glows softly. The little star jar it gave you now belongs at home.'
          : 'The shelf is warm and bright, but the Hollow Tree seems to be waiting for its clues to line up first.',
      );
      return;
    }
    if (id === 'interaction:hollow-tree-memory-shelf') {
      this.showFeedback(
        'The shelf has tiny smooth dents shaped like acorns, shells and pebbles. Other valley visitors may have kept treasures here long ago.',
      );
      return;
    }
    this.showFeedback(
      'Three hanging roots tap together: ting, ting, tumm. It is the same gentle rhythm the bridge answered outside.',
    );
  }

  private leaveNook(): void {
    const tree = MOONFLOWER_GLADE_MAP.landmarks.find(({ id }) => id === 'hollow-tree');
    if (tree) {
      setMoonflowerGladePlayerSpawn(tree.approach);
    }
    this.scene.start('MoonflowerGladeScene');
  }

  private createEnvironment(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x352b43)
      .setName('hollow-tree-nook:room');
    this.add
      .ellipse(GAME_WIDTH / 2, 410, 1120, 620, 0x4a3650, 1)
      .setStrokeStyle(18, 0x6c4d58, 0.95);
    this.add
      .ellipse(GAME_WIDTH / 2, 430, 980, 500, 0x59435c, 0.72)
      .setStrokeStyle(6, 0x7a5a67, 0.5);

    for (const [x, y, scale] of [
      [210, 180, 1.1],
      [1045, 165, 0.9],
      [260, 545, 0.75],
      [1005, 535, 0.8],
    ] as const) {
      this.add
        .text(x, y, '🍄', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: `${34 * scale}px`,
        })
        .setOrigin(0.5);
    }

    this.add
      .rectangle(405, 320, 220, 68, 0x7c5a50, 1)
      .setStrokeStyle(5, 0x5f413d, 0.9)
      .setName('hollow-tree-nook:memory-shelf');
    this.add
      .text(405, 300, '🌰   🪶   🐚', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '25px',
      })
      .setOrigin(0.5);

    this.add
      .rectangle(865, 315, 220, 72, 0x7c5a50, 1)
      .setStrokeStyle(5, 0x5f413d, 0.9)
      .setName('hollow-tree-nook:heart-shelf');
    const glow = this.add.circle(865, 275, 42, 0xffe5a0, 0.25).setStrokeStyle(4, 0xfff3c7, 0.62);
    this.add
      .text(865, 275, '✦', {
        color: '#fff0a8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.16, to: 0.42 },
      scale: { from: 0.9, to: 1.18 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(635, 185, '✧   ✦   ✧', {
        color: '#dbc5ec',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
      })
      .setOrigin(0.5)
      .setName('hollow-tree-nook:root-chimes');
    this.add
      .ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 76, 240, 90, 0x2d2336, 1)
      .setStrokeStyle(6, 0xffe5a2, 0.45)
      .setName('hollow-tree-nook:exit');
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 78, '🌿 Moonflower Glade', {
        color: '#fff4d8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 58, '🌳 Hollow Tree Nook', {
        color: '#fff3d8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 92, 'A tiny room hidden inside one of the oldest trees near home', {
        color: '#decde0',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5);
  }

  private createFeedback(): void {
    this.feedback = this.add
      .text(GAME_WIDTH / 2, 126, '', {
        color: '#58455d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: '#fff7eaf2',
        padding: { x: 16, y: 9 },
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setVisible(false);
  }

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedback?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(4200, () => {
      this.feedback?.setVisible(false);
      this.feedbackTimer = null;
    });
  }
}
