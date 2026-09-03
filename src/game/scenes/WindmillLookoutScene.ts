import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
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
import { MeadowWindmillStoryService } from '../story/MeadowWindmillStoryService';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { setRainbowMeadowPlayerSpawn } from '../world/RainbowMeadowMap';

const PLAYER_TEXTURE_KEY = 'player-unicorn-windmill-lookout';
const MEADOW_RETURN = { x: 1280, y: 430 } as const;

export class WindmillLookoutScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private activeInteraction: InteractionTarget | null = null;
  private feedback: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private story: MeadowWindmillStoryService | null = null;

  public constructor() {
    super('WindmillLookoutScene');
  }

  public create(): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    this.story = new MeadowWindmillStoryService(saveService, getBrowserQuestEngine());

    this.createEnvironment();
    createUnicornAppearanceTexture(
      this,
      PLAYER_TEXTURE_KEY,
      parseUnicornAppearance(save.profile.appearance),
    );
    this.physics.world.setBounds(70, 120, GAME_WIDTH - 140, GAME_HEIGHT - 190);
    this.player = new PlayerEntity(this, GAME_WIDTH / 2, GAME_HEIGHT - 160, PLAYER_TEXTURE_KEY);
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
    this.feedback = this.add
      .text(GAME_WIDTH / 2, 122, '', {
        color: '#4d4a68',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: '#fff9eaf2',
        padding: { x: 16, y: 9 },
      })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);

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
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }
    this.inputController.update();
    if (this.inputController.justPressed('BACK')) {
      this.leaveLookout();
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
      this.interactions(),
    );
    this.interactionPrompt?.setTarget(this.activeInteraction);
    if (this.inputController.justPressed('INTERACT') && this.activeInteraction) {
      this.activate(this.activeInteraction.id);
    }
  }

  private interactions(): readonly InteractionTarget[] {
    return [
      {
        id: 'interaction:windmill-lookout-exit',
        label: 'Rainbow Meadow',
        actionLabel: 'Go back down',
        position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 92 },
        interactionRadius: 130,
        priority: 30,
        result: { type: 'message', title: 'Exit', message: '' },
      },
      {
        id: 'interaction:windmill-sky-glint',
        label: 'Bright Meadow glint',
        actionLabel: 'Look closely',
        position: { x: 935, y: 300 },
        interactionRadius: 155,
        priority: 25,
        result: { type: 'message', title: 'Sky Glint', message: '' },
      },
      {
        id: 'interaction:windmill-view',
        label: 'Lookout rail',
        actionLabel: 'Take in the view',
        position: { x: 640, y: 250 },
        interactionRadius: 150,
        result: { type: 'message', title: 'View', message: '' },
      },
      {
        id: 'interaction:windmill-chimes',
        label: 'Wind chimes',
        actionLabel: 'Listen',
        position: { x: 330, y: 325 },
        interactionRadius: 145,
        result: { type: 'message', title: 'Chimes', message: '' },
      },
    ];
  }

  private activate(id: string): void {
    if (id === 'interaction:windmill-lookout-exit') {
      this.leaveLookout();
      return;
    }
    if (id === 'interaction:windmill-sky-glint') {
      if (this.story?.discoverSkyGlint()) {
        this.showFeedback(
          'There! A bright line curves from the pond towards a hidden flower patch. Breeze was right: the Meadow looks different from up here. ✨',
        );
        this.cameras.main.flash(150, 255, 239, 167, false);
        return;
      }
      this.showFeedback(
        this.story?.isStoryComplete()
          ? 'The curved path is easy to recognise now. Your Windmill Sky Pennant flutters in the same colours.'
          : 'Sunlight skips across the Meadow below. One flash near the flowers looks almost deliberate.',
      );
      return;
    }
    if (id === 'interaction:windmill-view') {
      this.showFeedback(
        'From here you can see Rainbow Pond, the picnic hill, the race flags and a surprising number of tiny flower paths all at once. 🌈',
      );
      return;
    }
    this.showFeedback('The chimes answer the wind with three soft notes: ting, ting, taaang. 🌬️');
  }

  private leaveLookout(): void {
    setRainbowMeadowPlayerSpawn(MEADOW_RETURN);
    this.scene.start('RainbowMeadowScene');
  }

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedback?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(4000, () => {
      this.feedback?.setVisible(false);
      this.feedbackTimer = null;
    });
  }

  private createEnvironment(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xbfe8f2)
      .setName('windmill-lookout:sky');
    this.add.rectangle(GAME_WIDTH / 2, 560, GAME_WIDTH, 330, 0x9ed887, 1);
    this.add.ellipse(840, 510, 440, 175, 0x72cadc, 0.92);
    this.add.ellipse(250, 520, 430, 190, 0xa8df8d, 1);
    this.add
      .rectangle(GAME_WIDTH / 2, 520, 1020, 170, 0xc99d70, 1)
      .setStrokeStyle(8, 0x8a664d, 0.92);
    this.add.rectangle(GAME_WIDTH / 2, 420, 1060, 26, 0x8a664d, 1).setName('windmill-lookout:rail');

    const tower = this.add
      .rectangle(195, 300, 126, 300, 0xe8d2a2, 1)
      .setStrokeStyle(7, 0x9a7455, 0.92);
    tower.setName('windmill-lookout:tower');
    const hub = this.add.circle(195, 155, 25, 0xf4c96b, 1);
    for (const angle of [0, 45, 90, 135]) {
      this.add
        .rectangle(195, 155, 12, 210, 0xf7edcf, 1)
        .setAngle(angle)
        .setStrokeStyle(2, 0xb78f65, 0.8);
    }
    hub.setDepth(3);

    this.add
      .text(330, 305, '♫', {
        color: '#fff6ce',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
      })
      .setOrigin(0.5)
      .setName('windmill-lookout:chimes');
    const glint = this.add
      .text(935, 286, '✦', {
        color: '#fff7a4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('windmill-lookout:sky-glint');
    this.tweens.add({
      targets: glint,
      alpha: { from: 0.3, to: 1 },
      scale: { from: 0.85, to: 1.15 },
      duration: 850,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 78, 250, 90, 0x8a664d, 0.88)
      .setStrokeStyle(5, 0xffe7a2, 0.75)
      .setName('windmill-lookout:exit');
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 79, '🌿 Rainbow Meadow', {
        color: '#fff8df',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 55, '🌬️ Windmill Lookout', {
        color: '#554b71',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e6dc',
        padding: { x: 16, y: 7 },
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 92, 'A breezy little platform above the bright Meadow paths', {
        color: '#615b74',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5);
  }
}
