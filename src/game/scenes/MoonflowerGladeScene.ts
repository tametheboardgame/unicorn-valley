import Phaser from 'phaser';
import type { DialogueChoice, DialogueEffect, DialogueId } from '../../content/contentTypes';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { GAME_WIDTH } from '../config/gameConstants';
import { DialogueCard } from '../dialogue/DialogueCard';
import { DialogueSession } from '../dialogue/DialogueSession';
import { DiscoveryService } from '../discovery/DiscoveryService';
import {
  createPipInteraction,
  FIRST_DISCOVERY_FLAG,
  FIRST_DISCOVERY_ID,
  FIRST_SPARKLE_COLLECTION_RADIUS,
  FIRST_SPARKLE_POSITION,
  PIP_POSITION,
} from '../intro/PipIntro';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { selectInteractionTarget } from '../interaction/InteractionTargeting';
import { MOONFLOWER_GLADE_INTERACTIONS } from '../interaction/MoonflowerGladeInteractions';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';

const COLLISION_TEXTURE_KEY = 'glade-collision-pixel';
const SAVED_PLAYER_TEXTURE_KEY = 'player-unicorn-saved';

export class MoonflowerGladeScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private activeInteraction: InteractionTarget | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private guideText: Phaser.GameObjects.Text | null = null;
  private discoveryService: DiscoveryService | null = null;
  private hasFirstDiscovery = false;
  private sparkleContainer: Phaser.GameObjects.Container | null = null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;

  public constructor() {
    super('MoonflowerGladeScene');
  }

  public create(): void {
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    this.discoveryService = new DiscoveryService(saveService);
    this.hasFirstDiscovery = this.discoveryService.hasDiscovery(FIRST_DISCOVERY_ID);

    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, SAVED_PLAYER_TEXTURE_KEY, appearance);

    const map = MOONFLOWER_GLADE_MAP;
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
    this.interactionPrompt = new InteractionPrompt(this, this.pointerInput);
    this.dialogueCard = new DialogueCard(this, this.pointerInput);

    this.createPip();
    if (!this.hasFirstDiscovery) {
      this.createFirstSparkle();
    }

    const camera = this.cameras.main;
    camera.setBackgroundColor('#a8ddba');
    camera.setBounds(0, 0, map.width, map.height);
    camera.startFollow(this.player.sprite, true, 0.11, 0.11);
    camera.setDeadzone(260, 150);

    this.createHud();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.feedbackTimer?.destroy();
      this.feedbackTimer = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.interactionPrompt?.destroy();
      this.interactionPrompt = null;
      this.dialogueCard?.destroy();
      this.dialogueCard = null;
      this.dialogueSession = null;
      this.sparkleContainer?.destroy(true);
      this.sparkleContainer = null;
      this.discoveryService = null;
      this.player?.destroy();
      this.player = null;
      this.collisionGroup = null;
      this.activeInteraction = null;
      this.feedbackText = null;
      this.guideText = null;
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (this.dialogueSession) {
      this.updateDialogue(time);
      return;
    }

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
    this.tryCollectFirstSparkle();

    const targets = [
      ...MOONFLOWER_GLADE_INTERACTIONS,
      createPipInteraction(this.hasFirstDiscovery),
    ];
    this.activeInteraction = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      targets,
    );
    this.interactionPrompt?.setTarget(this.activeInteraction);

    if (this.inputController.justPressed('INTERACT') && this.activeInteraction) {
      this.activateInteraction(this.activeInteraction);
    }
  }

  private updateDialogue(time: number): void {
    if (!this.inputController || !this.player || !this.dialogueSession) {
      return;
    }

    this.interactionPrompt?.setTarget(null);
    this.player.applyMovement({
      velocityX: 0,
      velocityY: 0,
      facing: this.player.getFacing(),
      motionState: 'idle',
    });
    this.player.updatePresentation(time);

    if (this.inputController.justPressed('BACK')) {
      this.closeDialogue();
      return;
    }

    if (!this.inputController.justPressed('INTERACT')) {
      return;
    }

    const node = this.dialogueSession.getCurrentNode();
    if (node?.type === 'line') {
      this.dialogueSession.advanceLine();
      this.refreshDialogue();
      return;
    }

    const defaultChoice = this.dialogueSession.getDefaultChoice();
    if (defaultChoice) {
      this.selectDialogueChoice(defaultChoice);
    }
  }

  private activateInteraction(target: InteractionTarget): void {
    if (target.result.type === 'scene-transition') {
      if (target.result.sceneKey === 'WonderbookScene') {
        this.scene.launch(target.result.sceneKey, target.result.payload);
        this.scene.pause();
      } else {
        this.scene.start(target.result.sceneKey, target.result.payload);
      }
      return;
    }

    if (target.result.type === 'dialogue') {
      this.startDialogue(target.result.dialogueId);
      return;
    }

    this.showFeedback(`${target.result.title}\n${target.result.message}`);
  }

  private startDialogue(dialogueId: DialogueId): void {
    this.dialogueSession = new DialogueSession(dialogueRegistry.get(dialogueId));
    this.refreshDialogue();
  }

  private refreshDialogue(): void {
    if (!this.dialogueSession || this.dialogueSession.isComplete()) {
      this.closeDialogue();
      return;
    }

    const node = this.dialogueSession.getCurrentNode();
    if (!node) {
      this.closeDialogue();
      return;
    }

    const speaker = characterRegistry.get(node.speakerId);
    this.dialogueCard?.show(node, speaker.name, (choice) => this.selectDialogueChoice(choice));
  }

  private selectDialogueChoice(choice: DialogueChoice): void {
    if (!this.dialogueSession) {
      return;
    }

    const effects = this.dialogueSession.choose(choice.id);
    this.applyDialogueEffects(effects);
    this.refreshDialogue();
  }

  private applyDialogueEffects(effects: readonly DialogueEffect[]): void {
    for (const effect of effects) {
      if (effect.type === 'set-flag') {
        this.registry.set(effect.flagId, effect.value);
      }
    }
  }

  private closeDialogue(): void {
    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.hide();
  }

  private tryCollectFirstSparkle(): void {
    if (this.hasFirstDiscovery || !this.player || !this.sparkleContainer) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      FIRST_SPARKLE_POSITION.x,
      FIRST_SPARKLE_POSITION.y,
    );
    if (distance > FIRST_SPARKLE_COLLECTION_RADIUS) {
      return;
    }

    this.discoveryService?.unlockDiscovery(FIRST_DISCOVERY_ID, FIRST_DISCOVERY_FLAG);
    this.hasFirstDiscovery = true;
    this.sparkleContainer.destroy(true);
    this.sparkleContainer = null;
    this.cameras.main.flash(180, 255, 239, 177, false);
    this.showFeedback('New discovery!\nMoonflower Sparkle ✨');
    this.guideText?.setText('Pip noticed! Go and tell your new friend what you found.');
  }

  private createPip(): void {
    const body = this.add.circle(PIP_POSITION.x, PIP_POSITION.y, 38, 0xf3a4c8, 1).setDepth(17);
    const belly = this.add.ellipse(PIP_POSITION.x, PIP_POSITION.y + 12, 48, 38, 0xffd7e8, 0.95);
    belly.setDepth(18);
    this.add
      .triangle(PIP_POSITION.x - 19, PIP_POSITION.y - 42, 0, 30, 15, 0, 28, 32, 0xe683b2, 1)
      .setDepth(16);
    this.add
      .triangle(PIP_POSITION.x + 18, PIP_POSITION.y - 42, 0, 32, 14, 0, 29, 30, 0xe683b2, 1)
      .setDepth(16);
    this.add.circle(PIP_POSITION.x - 13, PIP_POSITION.y - 7, 4, 0x563b66, 1).setDepth(19);
    this.add.circle(PIP_POSITION.x + 13, PIP_POSITION.y - 7, 4, 0x563b66, 1).setDepth(19);
    this.add
      .text(PIP_POSITION.x, PIP_POSITION.y + 64, 'Pip', {
        color: '#543965',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#fff9eddd',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(19);

    this.tweens.add({
      targets: [body, belly],
      y: '-=5',
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createFirstSparkle(): void {
    const glow = this.add.circle(0, 0, 34, 0xfff4a8, 0.2);
    const ring = this.add.circle(0, 0, 18, 0xfff8c7, 0.42).setStrokeStyle(3, 0xffffff, 0.85);
    const star = this.add
      .text(0, 0, '✦', {
        color: '#fff9cf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.sparkleContainer = this.add
      .container(FIRST_SPARKLE_POSITION.x, FIRST_SPARKLE_POSITION.y, [glow, ring, star])
      .setDepth(18);
    this.tweens.add({
      targets: this.sparkleContainer,
      scale: 1.2,
      angle: 8,
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedbackText?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(3600, () => {
      this.feedbackText?.setVisible(false);
      this.feedbackTimer = null;
    });
  }

  private createEnvironment(): void {
    const map = MOONFLOWER_GLADE_MAP;

    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0xa8ddba).setDepth(0);
    this.add.circle(520, 1040, 390, 0x9ed7ae, 0.55).setDepth(1);
    this.add.circle(2210, 1180, 500, 0xb6e5bd, 0.48).setDepth(1);
    this.add.circle(2060, 420, 360, 0x9bd3ac, 0.5).setDepth(1);

    this.createPaths();
    this.createStreamAndBridge();
    this.createCottage();
    this.createGarden();
    this.createDisplayStump();
    this.createHollowTree();
    this.createMoonflowerField();
    this.createEntranceMarkers();
    this.createBoundaryFoliage();
    this.createFireflies();
    this.createForegroundLayeringTest();
  }

  private createPaths(): void {
    const path = this.add.graphics().setDepth(2);
    path.lineStyle(112, 0xead7aa, 0.92);
    path.beginPath();
    path.moveTo(560, 720);
    path.lineTo(830, 820);
    path.lineTo(1100, 870);
    path.lineTo(1400, 900);
    path.lineTo(1750, 900);
    path.lineTo(2150, 900);
    path.lineTo(2690, 900);
    path.strokePath();

    path.lineStyle(92, 0xe4cf9f, 0.9);
    path.beginPath();
    path.moveTo(1260, 900);
    path.lineTo(1230, 650);
    path.lineTo(1030, 515);
    path.lineTo(820, 410);
    path.strokePath();
    path.beginPath();
    path.moveTo(1510, 900);
    path.lineTo(1510, 1100);
    path.lineTo(1530, 1260);
    path.strokePath();
    path.beginPath();
    path.moveTo(2160, 900);
    path.lineTo(2250, 660);
    path.lineTo(2320, 510);
    path.strokePath();
  }

  private createStreamAndBridge(): void {
    const map = MOONFLOWER_GLADE_MAP;
    const water = this.add.graphics().setDepth(3);
    water.fillStyle(0x87cde2, 0.9);
    water.fillRoundedRect(0, map.stream.y, map.width, map.stream.height, 48);
    water.lineStyle(5, 0xbde9ef, 0.75);
    water.lineBetween(
      0,
      map.stream.y + 28,
      map.bridge.x - map.bridge.width / 2 - 40,
      map.stream.y + 28,
    );
    water.lineBetween(
      map.bridge.x + map.bridge.width / 2 + 40,
      map.stream.y + 28,
      map.width,
      map.stream.y + 28,
    );

    const bridgeWidth = 260;
    const bridge = this.add
      .rectangle(map.bridge.x, map.bridge.y, bridgeWidth, 118, 0xc9976d, 1)
      .setDepth(8);
    bridge.setStrokeStyle(5, 0x9d6d4d, 1);
    for (let offset = -94; offset <= 94; offset += 47) {
      this.add
        .rectangle(map.bridge.x + offset, map.bridge.y, 10, 108, 0x996546, 0.35)
        .setDepth(8.2);
    }
    this.add
      .rectangle(map.bridge.x, map.bridge.y - 54, bridgeWidth + 14, 12, 0x9c6e52, 1)
      .setDepth(16);
    this.add
      .rectangle(map.bridge.x, map.bridge.y + 54, bridgeWidth + 14, 12, 0x9c6e52, 1)
      .setDepth(16);
  }

  private createCottage(): void {
    const cottage = MOONFLOWER_GLADE_MAP.landmarks.find(({ id }) => id === 'moonflower-cottage');
    if (!cottage) {
      return;
    }

    this.add
      .rectangle(cottage.position.x, cottage.position.y, 390, 310, 0xf3d9d7, 1)
      .setStrokeStyle(8, 0xa5778a, 1)
      .setDepth(7);
    this.add
      .triangle(
        cottage.position.x,
        cottage.position.y - 250,
        -230,
        170,
        0,
        0,
        230,
        170,
        0xbd83b6,
        1,
      )
      .setDepth(9);
    this.add
      .rectangle(cottage.position.x, cottage.position.y + 65, 94, 150, 0x966d80, 1)
      .setDepth(10);
    this.add.circle(cottage.position.x + 28, cottage.position.y + 72, 8, 0xf5d37e, 1).setDepth(11);
    this.add
      .rectangle(cottage.position.x - 120, cottage.position.y - 20, 72, 66, 0xb9e7ec, 1)
      .setStrokeStyle(5, 0x966d80, 1)
      .setDepth(10);
    this.add
      .rectangle(cottage.position.x + 120, cottage.position.y - 20, 72, 66, 0xb9e7ec, 1)
      .setStrokeStyle(5, 0x966d80, 1)
      .setDepth(10);
  }

  private createGarden(): void {
    const garden = MOONFLOWER_GLADE_MAP.landmarks.find(({ id }) => id === 'garden-plot');
    if (!garden) {
      return;
    }
    this.add.ellipse(garden.position.x, garden.position.y, 440, 230, 0x795747, 0.9).setDepth(4);
    this.add.ellipse(garden.position.x, garden.position.y, 390, 190, 0x936b53, 0.85).setDepth(4.2);
    for (const x of [-110, 0, 110]) {
      this.add.circle(garden.position.x + x, garden.position.y, 24, 0x4f9b63, 0.8).setDepth(5);
    }
  }

  private createDisplayStump(): void {
    const stump = MOONFLOWER_GLADE_MAP.landmarks.find(({ id }) => id === 'display-stump');
    if (!stump) {
      return;
    }
    this.add.ellipse(stump.position.x, stump.position.y, 210, 110, 0x8b634e, 1).setDepth(6);
    this.add.ellipse(stump.position.x, stump.position.y - 22, 190, 78, 0xa87b5c, 1).setDepth(7);
    this.add
      .text(stump.position.x, stump.position.y - 12, '📖', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '44px',
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createHollowTree(): void {
    const tree = MOONFLOWER_GLADE_MAP.landmarks.find(({ id }) => id === 'hollow-tree');
    if (!tree) {
      return;
    }
    this.add.rectangle(tree.position.x, tree.position.y, 130, 310, 0x6f5446, 1).setDepth(8);
    this.add.circle(tree.position.x, tree.position.y - 160, 170, 0x557b5b, 1).setDepth(9);
    this.add.ellipse(tree.position.x, tree.position.y + 35, 65, 85, 0x302b31, 0.9).setDepth(10);
  }

  private createMoonflowerField(): void {
    const field = MOONFLOWER_GLADE_MAP.landmarks.find(({ id }) => id === 'moonflower-field');
    if (!field) {
      return;
    }
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const radius = index % 2 === 0 ? 120 : 72;
      const x = field.position.x + Math.cos(angle) * radius;
      const y = field.position.y + Math.sin(angle) * radius * 0.55;
      this.add.circle(x, y, 24, 0xded4ff, 0.92).setDepth(6);
      this.add.circle(x, y, 8, 0xffefad, 1).setDepth(7);
    }
  }

  private createEntranceMarkers(): void {
    for (const entrance of MOONFLOWER_GLADE_MAP.entrances) {
      this.add
        .rectangle(entrance.position.x, entrance.position.y, 170, 68, 0x5d765f, 0.8)
        .setDepth(5);
      this.add
        .text(entrance.position.x, entrance.position.y, entrance.label, {
          color: '#fff7e9',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(6);
    }
  }

  private createBoundaryFoliage(): void {
    const map = MOONFLOWER_GLADE_MAP;
    const top = map.margin;
    const bottom = map.height - map.margin;
    for (let x = 0; x <= map.width; x += 155) {
      this.add.circle(x, top, 78, 0x547a61, 0.85).setDepth(9);
      this.add.circle(x, bottom, 78, 0x547a61, 0.85).setDepth(9);
    }
    for (let y = top + 120; y <= bottom - 120; y += 155) {
      this.add.circle(0, y, 78, 0x547a61, 0.85).setDepth(9);
      this.add.circle(map.width, y, 78, 0x547a61, 0.85).setDepth(9);
    }
  }

  private createFireflies(): void {
    const positions = [
      [390, 500],
      [470, 590],
      [2300, 520],
      [2380, 620],
      [2050, 1150],
    ] as const;
    for (const [x, y] of positions) {
      const firefly = this.add.circle(x, y, 7, 0xffef91, 0.95).setDepth(15);
      this.tweens.add({
        targets: firefly,
        alpha: 0.35,
        y: '-=15',
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private createForegroundLayeringTest(): void {
    const flower = this.add
      .circle(
        MOONFLOWER_GLADE_MAP.layeringProofPoint.x,
        MOONFLOWER_GLADE_MAP.layeringProofPoint.y,
        78,
        0xd9bde8,
        0.88,
      )
      .setDepth(25);
    flower.setStrokeStyle(5, 0xf3e0ff, 0.8);
  }

  private ensureCollisionTexture(): void {
    if (this.textures.exists(COLLISION_TEXTURE_KEY)) {
      return;
    }
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture(COLLISION_TEXTURE_KEY, 2, 2);
    graphics.destroy();
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const collisionGroup = this.physics.add.staticGroup();
    for (const collider of MOONFLOWER_GLADE_MAP.colliders) {
      const object = collisionGroup.create(
        collider.x,
        collider.y,
        COLLISION_TEXTURE_KEY,
      ) as Phaser.Physics.Arcade.Image;
      object.setDisplaySize(collider.width, collider.height);
      object.refreshBody();
      object.setVisible(false);
    }
    return collisionGroup;
  }

  private createHud(): void {
    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, 112, '', {
        color: '#513a61',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff9edee',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(122)
      .setVisible(false);

    this.guideText = this.add
      .text(GAME_WIDTH / 2, 174, '', {
        color: '#5c4768',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        align: 'center',
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);
  }
}
