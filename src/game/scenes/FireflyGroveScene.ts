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
import { WoodsDepthStoryService } from '../story/WoodsDepthStoryService';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { setWhisperingWoodsPlayerSpawn } from '../world/WhisperingWoodsMap';

const PLAYER_TEXTURE_KEY = 'player-unicorn-firefly-grove';
const WOODS_RETURN = { x: 2960, y: 835 } as const;

export class FireflyGroveScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private activeInteraction: InteractionTarget | null = null;
  private feedback: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private story: WoodsDepthStoryService | null = null;
  private lanternPlant: Phaser.GameObjects.Ellipse | null = null;
  private lanternPlantLabel: Phaser.GameObjects.Text | null = null;
  private fireflyLights: Phaser.GameObjects.Arc[] = [];

  public constructor() {
    super('FireflyGroveScene');
  }

  public create(): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    this.story = new WoodsDepthStoryService(saveService, getBrowserQuestEngine());
    this.createEnvironment(this.story.isGroveLit());

    createUnicornAppearanceTexture(
      this,
      PLAYER_TEXTURE_KEY,
      parseUnicornAppearance(save.profile.appearance),
    );
    this.physics.world.setBounds(65, 115, GAME_WIDTH - 130, GAME_HEIGHT - 185);
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
    this.feedback = this.add
      .text(GAME_WIDTH / 2, 112, '', {
        color: '#36564e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: '#f5fff2f0',
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
      this.lanternPlant = null;
      this.lanternPlantLabel = null;
      this.fireflyLights = [];
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }
    this.inputController.update();
    if (this.inputController.justPressed('BACK')) {
      this.leaveGrove();
      return;
    }

    this.player.applyMovement(
      resolvePlayerMovement(
        this.inputController.getAxis('MOVE_X'),
        this.inputController.getAxis('MOVE_Y'),
        DEFAULT_PLAYER_SPEED,
        this.player.getFacing(),
      ),
    );
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
        id: 'interaction:firefly-grove-exit',
        label: 'Whispering Woods',
        actionLabel: 'Go outside',
        position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 88 },
        interactionRadius: 130,
        priority: 30,
        result: { type: 'message', title: 'Exit', message: '' },
      },
      {
        id: 'interaction:firefly-grove-friendly-tree',
        label: 'Ancient Friendly Tree',
        actionLabel: 'Touch the bark',
        position: { x: 335, y: 330 },
        interactionRadius: 150,
        priority: 20,
        result: { type: 'message', title: 'Friendly Tree', message: '' },
      },
      {
        id: 'interaction:firefly-grove-heart',
        label: 'Lantern plant',
        actionLabel: 'Watch the lights',
        position: { x: 825, y: 315 },
        interactionRadius: 150,
        priority: 20,
        result: { type: 'message', title: 'Lantern Plant', message: '' },
      },
      {
        id: 'interaction:firefly-grove-pool',
        label: 'Firefly pool',
        actionLabel: 'Make a ripple',
        position: { x: 620, y: 470 },
        interactionRadius: 145,
        result: { type: 'message', title: 'Firefly Pool', message: '' },
      },
    ];
  }

  private activate(id: string): void {
    if (id === 'interaction:firefly-grove-exit') {
      this.leaveGrove();
      return;
    }
    if (id === 'interaction:firefly-grove-friendly-tree') {
      if (this.story?.greetAncientTree()) {
        this.showFeedback(
          'The old trunk answers with one warm hummm. A handful of leaves drift down like a very slow hello. 🌳✨',
        );
        this.cameras.main.flash(90, 218, 247, 184, false);
      } else {
        this.showFeedback(
          this.story?.isFernStoryComplete()
            ? 'The friendly old tree gives its familiar wooden hum. It seems pleased the Grove is still glowing.'
            : 'The bark feels warm, but Fern’s patient firefly trail should be followed before this clue makes sense.',
        );
      }
      return;
    }
    if (id === 'interaction:firefly-grove-heart') {
      if (this.story?.discoverGroveHeart()) {
        this.refreshGroveLighting();
        this.showFeedback(
          'The lantern plant opens. Every firefly in the clearing gathers around it, and the whole Grove keeps a new warm glow. 🏮✨',
        );
        this.cameras.main.flash(150, 255, 238, 154, false);
      } else {
        this.showFeedback(
          this.story?.isFernStoryComplete()
            ? 'The Grove heart opens again and the permanent trail outside twinkles in answer.'
            : 'The lantern plant is almost ready to open. Fern’s earlier clues still need following in order.',
        );
      }
      return;
    }

    this.showFeedback(
      this.story?.isGroveLit()
        ? 'Plip! A ripple crosses the pool and the settled fireflies brighten one after another.'
        : 'Plip! A ripple crosses the dark little pool and three curious fireflies follow it to the edge.',
    );
    this.cameras.main.flash(55, 194, 239, 211, false);
  }

  private refreshGroveLighting(): void {
    this.lanternPlant?.setFillStyle(0xffe78a, 0.86).setStrokeStyle(5, 0xfff2b1, 0.82);
    this.lanternPlantLabel?.setText('✦ 🏮 ✦').setColor('#fff3af');
    for (const light of this.fireflyLights) {
      light.setRadius(9).setFillStyle(0xffef91, 0.92);
    }
  }

  private leaveGrove(): void {
    setWhisperingWoodsPlayerSpawn(WOODS_RETURN);
    this.scene.start('WhisperingWoodsScene');
  }

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedback?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(3900, () => {
      this.feedback?.setVisible(false);
      this.feedbackTimer = null;
    });
  }

  private createEnvironment(lit: boolean): void {
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x29483e)
      .setName('firefly-grove:room');
    this.add.ellipse(620, 470, 570, 170, 0x315f59, 0.92).setName('firefly-grove:pool');
    this.add.ellipse(620, 470, 455, 115, 0x72aaa0, 0.28);

    this.add.rectangle(335, 340, 82, 300, 0x68503e, 1).setName('firefly-grove:friendly-tree');
    this.add.circle(270, 205, 120, 0x35664d, 1);
    this.add.circle(370, 190, 140, 0x407657, 1);
    this.add.circle(455, 235, 105, 0x2f5a47, 1);

    this.lanternPlant = this.add
      .ellipse(825, 340, 150, 80, lit ? 0xffe78a : 0x88ba79, lit ? 0.86 : 0.5)
      .setStrokeStyle(5, lit ? 0xfff2b1 : 0xb6d89e, 0.82)
      .setName('firefly-grove:lantern-plant');
    this.lanternPlantLabel = this.add
      .text(825, 320, lit ? '✦ 🏮 ✦' : '🌿 ✧ 🌿', {
        color: lit ? '#fff3af' : '#d9efbf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const fireflies = [
      [510, 240],
      [585, 190],
      [690, 235],
      [760, 180],
      [890, 210],
      [965, 270],
    ] as const;
    this.fireflyLights = [];
    for (const [index, [x, y]] of fireflies.entries()) {
      const light = this.add.circle(x, y, lit ? 9 : 6, 0xffef91, lit ? 0.92 : 0.68).setDepth(12);
      this.fireflyLights.push(light);
      this.tweens.add({
        targets: light,
        y: y - 16,
        alpha: { from: lit ? 0.5 : 0.32, to: 1 },
        duration: 850 + index * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    this.add
      .ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 76, 250, 88, 0x49614b, 0.96)
      .setStrokeStyle(5, 0xc8e8b8, 0.7)
      .setName('firefly-grove:exit');
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 76, '🌿 Whispering Woods', {
        color: '#f2ffe8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 54, '✨ Firefly Grove', {
        color: '#f2ffe4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        backgroundColor: '#243f37dd',
        padding: { x: 16, y: 7 },
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 91, 'A quiet clearing where the little lights choose to gather', {
        color: '#d9edcf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5);
  }
}
