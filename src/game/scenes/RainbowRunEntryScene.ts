import Phaser from 'phaser';
import { SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
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
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { selectRaceCourse } from '../racing/RaceCourse';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import { getNovaFirstRacePhase } from '../story/NovaFirstRaceStory';
import { startNovaConversation } from '../story/WorldStoryConversations';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { createCoreNpcSprite } from '../visual/CoreNpcProductionArt';
import { CoreNpcPresenceService, NOVA_CHARACTER_ID } from '../world/CoreNpcPresenceService';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';
import {
  RAINBOW_RUN_HUB_LAYOUT,
  RAINBOW_RUN_HUB_LOCATION_ID,
  RAINBOW_RUN_HUB_MAP,
} from '../world/RainbowRunHubMap';
import { worldDepthForY } from '../world/WorldDepth';

const COLLISION_TEXTURE_KEY = 'rainbow-run-hub-collision-pixel';
const PLAYER_TEXTURE_KEY = 'player-unicorn-rainbow-run-hub';

function raceRibbonCount(): number {
  const save = getBrowserSaveService().load();
  return Object.values(save?.activities.racesById ?? {}).reduce(
    (total, record) => total + record.ribbonIds.length,
    0,
  );
}

function raceRecordMessage(): string {
  const save = getBrowserSaveService().load();
  const records = Object.values(save?.activities.racesById ?? {});
  const ribbons = records.reduce((total, record) => total + record.ribbonIds.length, 0);
  const sunrise = save?.activities.racesById[SUNRISE_SPRINT_RACE_ID];
  if (ribbons === 0 && !sunrise?.bestTimeMs) {
    return 'The ribbon hooks are waiting for your first finish. Every completed run leaves something here.';
  }
  const best = sunrise?.bestTimeMs ? `${(sunrise.bestTimeMs / 1000).toFixed(1)}s` : 'not timed yet';
  return `${ribbons} ribbon${ribbons === 1 ? '' : 's'} recorded. Sunrise Sprint best: ${best}. 🎀`;
}

export class RainbowRunEntryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private activeInteraction: InteractionTarget | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private interactions: readonly InteractionTarget[] = [];

  public constructor() {
    super('RainbowRunEntryScene');
  }

  public create(): void {
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, RAINBOW_RUN_HUB_LOCATION_ID);
    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, PLAYER_TEXTURE_KEY, appearance);

    this.physics.world.setBounds(
      RAINBOW_RUN_HUB_MAP.margin,
      RAINBOW_RUN_HUB_MAP.margin,
      RAINBOW_RUN_HUB_MAP.width - RAINBOW_RUN_HUB_MAP.margin * 2,
      RAINBOW_RUN_HUB_MAP.height - RAINBOW_RUN_HUB_MAP.margin * 2,
    );

    this.collisionGroup = this.createCollisionMap();
    this.player = new PlayerEntity(
      this,
      RAINBOW_RUN_HUB_MAP.playerSpawn.x,
      RAINBOW_RUN_HUB_MAP.playerSpawn.y,
      PLAYER_TEXTURE_KEY,
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
    this.interactions = this.createInteractions();

    this.cameras.main.setBackgroundColor('#a7df90');
    this.cameras.main.setBounds(0, 0, RAINBOW_RUN_HUB_MAP.width, RAINBOW_RUN_HUB_MAP.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.11, 0.11);
    this.cameras.main.setDeadzone(260, 150);

    this.createHud();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.feedbackTimer?.destroy();
      this.feedbackTimer = null;
      this.touchMovementPad?.destroy();
      this.touchMovementPad = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.player = null;
      this.interactionPrompt?.destroy();
      this.interactionPrompt = null;
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (isInteractionModalActive(this)) {
      this.player.applyMovement(
        resolvePlayerMovement(0, 0, DEFAULT_PLAYER_SPEED, this.player.getFacing()),
      );
      this.player.updatePresentation(time);
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

    this.activeInteraction = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      this.interactions,
    );
    this.interactionPrompt?.setTarget(this.activeInteraction);

    if (this.inputController.justPressed('INTERACT') && this.activeInteraction) {
      this.activateInteraction(this.activeInteraction);
    }
    if (this.inputController.justPressed('BACK')) {
      this.exitToMeadow();
    }
  }

  private createInteractions(): readonly InteractionTarget[] {
    const presence = new CoreNpcPresenceService(getBrowserSaveService());
    return [
      {
        id: 'interaction:race-hub-exit',
        label: 'Rainbow Meadow',
        actionLabel: 'Return to Meadow',
        actionKind: 'enter',
        position: RAINBOW_RUN_HUB_LAYOUT.meadowExit.approach,
        interactionRadius: 165,
        priority: 25,
        result: { type: 'callback', activate: () => this.exitToMeadow() },
      },
      {
        id: 'interaction:race-hub-nova',
        label: 'Nova',
        actionLabel: 'Talk',
        actionKind: 'talk',
        position: RAINBOW_RUN_HUB_LAYOUT.nova,
        interactionRadius: 155,
        priority: 35,
        visible: () => presence.resolve(NOVA_CHARACTER_ID)?.area === 'rainbow-run-hub',
        result: { type: 'callback', activate: () => startNovaConversation(this) },
      },
      {
        id: 'interaction:race-hub-ribbons',
        label: 'Ribbon Board',
        actionLabel: 'Check record',
        actionKind: 'inspect',
        position: RAINBOW_RUN_HUB_LAYOUT.ribbonBoard.approach,
        interactionRadius: 150,
        priority: 20,
        result: { type: 'callback', activate: () => this.showFeedback(raceRecordMessage()) },
      },
      {
        id: 'interaction:race-hub-cup',
        label: 'Rainbow Cup',
        actionLabel: 'Look',
        actionKind: 'inspect',
        position: RAINBOW_RUN_HUB_LAYOUT.cupBoard.approach,
        interactionRadius: 150,
        priority: 20,
        result: {
          type: 'callback',
          activate: () =>
            this.showFeedback(
              'Five course spaces wait on the Rainbow Cup board. Every finish counts; best times are just for fun. 🏆',
            ),
        },
      },
      {
        id: 'interaction:race-hub-poster',
        label: 'Course board',
        actionLabel: 'Look',
        actionKind: 'inspect',
        position: RAINBOW_RUN_HUB_LAYOUT.coursePoster.approach,
        interactionRadius: 145,
        priority: 20,
        result: {
          type: 'callback',
          activate: () =>
            this.showFeedback(
              'Sunrise Sprint is pinned up first, with space for more Rainbow Run courses later. 🏁',
            ),
        },
      },
      {
        id: 'interaction:race-hub-start',
        label: 'Rainbow Run start',
        actionLabel: 'Start race',
        actionKind: 'enter',
        position: RAINBOW_RUN_HUB_LAYOUT.raceGate.approach,
        interactionRadius: 175,
        priority: 30,
        result: { type: 'callback', activate: () => this.startRace() },
      },
    ] satisfies readonly InteractionTarget[];
  }

  private activateInteraction(target: InteractionTarget): void {
    if (target.result.type === 'callback') {
      target.result.activate();
    }
  }

  private startRace(): void {
    const progress = getBrowserQuestEngine().getProgress(NOVA_FIRST_RACE_QUEST_ID);
    const phase = getNovaFirstRacePhase(progress);

    if (phase === 'ready-to-race') {
      this.scene.start('NovaTutorialRaceScene');
      return;
    }

    if (phase === 'complete') {
      selectRaceCourse(SUNRISE_SPRINT_RACE_ID);
      this.scene.start('RaceScene');
      return;
    }

    this.showFeedback(
      phase === 'result-ready'
        ? 'Nova is waiting by the tent to hear how your first run went.'
        : 'Talk to Nova before heading onto the course.',
    );
  }

  private exitToMeadow(): void {
    const entrance = RAINBOW_MEADOW_MAP.hubFeatures.find(
      (feature) => feature.id === 'rainbow-run-entrance',
    );
    if (entrance) {
      setRainbowMeadowPlayerSpawn(entrance.approach);
    }
    saveLocationCheckpoint(getBrowserSaveService(), RAINBOW_MEADOW_LOCATION_ID);
    this.scene.start('RainbowMeadowScene');
  }

  private createEnvironment(): void {
    this.add
      .rectangle(
        RAINBOW_RUN_HUB_MAP.width / 2,
        RAINBOW_RUN_HUB_MAP.height / 2,
        RAINBOW_RUN_HUB_MAP.width,
        RAINBOW_RUN_HUB_MAP.height,
        0xa7df90,
        1,
      )
      .setName('rainbow-run-hub:ground')
      .setDepth(0);

    this.add
      .ellipse(1120, 720, 1780, 980, 0xc9eca2, 0.46)
      .setName('rainbow-run-hub:event-lawn')
      .setDepth(1);

    const path = this.add.graphics().setName('rainbow-run-hub:path').setDepth(2);
    path.lineStyle(150, 0xd5bc84, 0.95);
    path.beginPath();
    const [first, ...rest] = RAINBOW_RUN_HUB_LAYOUT.pathPoints;
    path.moveTo(first.x, first.y);
    for (const point of rest) {
      path.lineTo(point.x, point.y);
    }
    path.strokePath();
    path.lineStyle(104, 0xf3dfab, 1);
    path.beginPath();
    path.moveTo(first.x, first.y);
    for (const point of rest) {
      path.lineTo(point.x, point.y);
    }
    path.strokePath();

    this.createExitGate();
    this.createTent();
    this.createRibbonBoard();
    this.createCupBoard();
    this.createCoursePoster();
    this.createRaceGate();
    this.createFlags();
    this.createNova();
  }

  private createExitGate(): void {
    const { x, y } = RAINBOW_RUN_HUB_LAYOUT.meadowExit.position;
    this.add.rectangle(x - 110, y, 24, 180, 0x765244, 1).setDepth(8);
    this.add.rectangle(x + 110, y, 24, 180, 0x765244, 1).setDepth(8);
    this.add
      .rectangle(x, y - 85, 250, 58, 0xffedbc, 1)
      .setStrokeStyle(5, 0x9d78a7, 1)
      .setDepth(9);
    this.add
      .text(x, y - 85, 'RAINBOW MEADOW', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private createTent(): void {
    const { x, y } = RAINBOW_RUN_HUB_LAYOUT.tent;
    const tent = this.add
      .graphics()
      .setName('rainbow-run-hub:tent')
      .setDepth(worldDepthForY(y + 130));
    tent.fillStyle(0xfff1cb, 1);
    tent.fillRoundedRect(x - 215, y - 20, 430, 150, 22);
    tent.fillStyle(0xc79bdd, 1);
    tent.fillTriangle(x - 230, y - 5, x, y - 190, x + 230, y - 5);
    tent.fillStyle(0xf2a0b7, 0.96);
    tent.fillTriangle(x - 115, y - 20, x, y - 170, x + 115, y - 20);
    tent.fillStyle(0x8a684c, 1);
    tent.fillRect(x - 25, y + 35, 50, 95);
  }

  private createRibbonBoard(): void {
    const { x, y } = RAINBOW_RUN_HUB_LAYOUT.ribbonBoard.position;
    this.add
      .rectangle(x, y, 310, 180, 0x8e674d, 1)
      .setName('rainbow-run-hub:ribbon-board')
      .setStrokeStyle(8, 0x6f4d3d, 1)
      .setDepth(8);
    this.add
      .text(x, y - 62, 'RIBBONS', {
        color: '#fff1be',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(9);

    const ribbonCount = Math.min(6, raceRibbonCount());
    for (let index = 0; index < 6; index += 1) {
      const rx = x - 92 + (index % 3) * 92;
      const ry = y + 5 + Math.floor(index / 3) * 55;
      this.add.rectangle(rx, ry - 10, 4, 34, 0xd8bc8a, 0.7).setDepth(9);
      if (index < ribbonCount) {
        this.add
          .text(rx, ry, index % 2 === 0 ? '🎀' : '🏅', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '24px',
          })
          .setOrigin(0.5)
          .setDepth(10);
      }
    }
  }

  private createCupBoard(): void {
    const { x, y } = RAINBOW_RUN_HUB_LAYOUT.cupBoard.position;
    this.add
      .rectangle(x, y, 330, 170, 0x8a684c, 0.96)
      .setName('rainbow-run-hub:cup-board')
      .setStrokeStyle(7, 0xf1ce77, 0.9)
      .setDepth(8);
    this.add
      .text(x, y - 46, '🏆 RAINBOW CUP', {
        color: '#fff3ba',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(9);
    this.add
      .text(x, y + 18, '●  ○  ○  ○  ○', {
        color: raceRibbonCount() > 0 ? '#fff0a8' : '#d8c79d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(9);
  }

  private createCoursePoster(): void {
    const { x, y } = RAINBOW_RUN_HUB_LAYOUT.coursePoster.position;
    this.add
      .rectangle(x, y, 290, 210, 0xfff5d7, 1)
      .setName('rainbow-run-hub:course-poster')
      .setStrokeStyle(6, 0xb68ab6, 0.95)
      .setDepth(8);
    this.add
      .text(x, y - 55, 'SUNRISE SPRINT', {
        color: '#674b73',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(9);
    this.add
      .text(x, y + 20, '🏁   ✦   🪵   ✦   🏁', {
        color: '#8c667f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
      })
      .setOrigin(0.5)
      .setDepth(9);
  }

  private createRaceGate(): void {
    const { x, y } = RAINBOW_RUN_HUB_LAYOUT.raceGate.position;
    const colours = [0xf08aa3, 0xf4b66d, 0xf4db75, 0x81c77b, 0x79b9df, 0xb392da];
    this.add.rectangle(x, y - 150, 44, 200, 0x6d4d43, 1).setDepth(8);
    this.add.rectangle(x, y + 150, 44, 200, 0x6d4d43, 1).setDepth(8);
    const rainbow = this.add.graphics().setName('rainbow-run-hub:race-gate').setDepth(9);
    for (let index = 0; index < colours.length; index += 1) {
      rainbow.lineStyle(13, colours[index], 0.96);
      rainbow.beginPath();
      rainbow.arc(x - 12, y, 142 - index * 13, -Math.PI / 2, Math.PI / 2, false);
      rainbow.strokePath();
    }
    this.add
      .text(x - 142, y, 'TO THE COURSE →', {
        color: '#66476f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#fff7dfe8',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private createFlags(): void {
    const colours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];
    RAINBOW_RUN_HUB_LAYOUT.flags.forEach(({ x, y }, index) => {
      this.add.rectangle(x, y - 70, 7, 145, 0x83614c, 1).setDepth(7);
      this.add
        .triangle(x + 4, y - 140, 0, 0, 76, 20, 0, 40, colours[index % colours.length], 1)
        .setDepth(8);
    });
  }

  private createNova(): void {
    if (
      new CoreNpcPresenceService(getBrowserSaveService()).resolve(NOVA_CHARACTER_ID)?.area !==
      'rainbow-run-hub'
    ) {
      return;
    }
    const nova = createCoreNpcSprite(
      this,
      'nova',
      RAINBOW_RUN_HUB_LAYOUT.nova.x,
      RAINBOW_RUN_HUB_LAYOUT.nova.y + 4,
      'world',
    )
      .setName('core-npc:nova:race-hub')
      .setDisplaySize(112, 92)
      .setDepth(worldDepthForY(RAINBOW_RUN_HUB_LAYOUT.nova.y + 50, 0.32));
    this.add
      .text(RAINBOW_RUN_HUB_LAYOUT.nova.x, RAINBOW_RUN_HUB_LAYOUT.nova.y + 76, 'Nova', {
        color: '#5e4669',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#fff8dfdd',
        padding: { x: 7, y: 3 },
      })
      .setName('core-npc:nova:race-hub-label')
      .setOrigin(0.5)
      .setDepth(nova.depth + 0.02);
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const group = this.physics.add.staticGroup();
    for (const collider of RAINBOW_RUN_HUB_MAP.colliders) {
      const blocker = group.create(
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
    return group;
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
      .text(640, 24, 'Rainbow Run Race Hub', {
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
      .text(640, 120, '', {
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

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedbackText?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(3200, () => {
      this.feedbackText?.setVisible(false);
      this.feedbackTimer = null;
    });
  }
}
