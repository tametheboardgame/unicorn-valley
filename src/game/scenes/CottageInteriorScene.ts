import Phaser from 'phaser';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import {
  COTTAGE_DECORATE_MODE_DATA_KEY,
  COTTAGE_DECORATE_TOGGLE_EVENT,
  COTTAGE_STYLE_OPEN_EVENT,
} from '../home/CottageDecorateModeState';
import {
  COTTAGE_FRIEND_VISIT_INTERACTION_ID,
  CottageFriendVisitManager,
} from '../home/CottageFriendVisitManager';
import {
  renderCottagePermanentFurnishings,
  renderCottageWonderbookNook,
} from '../home/CottageFurnitureRenderer';
import { buildCottageHomeView, type CottageHomeView } from '../home/CottageHomeView';
import { HomeDecorationService } from '../home/HomeDecorationService';
import { CottageStyleService } from '../home/CottageStyleService';
import { renderCottageRoomSurfaces } from '../home/CottageSurfaceRenderer';
import { CottageSleepController } from '../home/CottageSleepController';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import { setInteractionModalActive } from '../interaction/InteractionModalState';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { selectInteractionTarget } from '../interaction/InteractionTargeting';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import type { HomeStyleState } from '../save/saveSchema';
import {
  MOONFLOWER_GLADE_LOCATION_ID,
  saveLocationCheckpoint,
} from '../save/saveLocationCheckpoint';
import { createConfirmationButton, createConfirmationPanel } from '../ui/ConfirmationModalStyle';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { UI_DESIGN_TOKENS } from '../ui/UiDesignSystem';
import { renderWonderbookWorldProp } from '../wonderbook/WonderbookWorldProp';
import {
  COTTAGE_INTERIOR_LOCATION_ID,
  COTTAGE_INTERIOR_MAP,
  type CottageDecorationSlot,
} from '../world/CottageInteriorMap';
import {
  COTTAGE_SEMANTIC_ANCHOR_IDS,
  resolveCottageSemanticAnchor,
} from '../world/CottageSemanticAnchors';
import { MOONFLOWER_GLADE_MAP, setMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';
import { worldDepthForY } from '../world/WorldDepth';

interface CottageInteriorSceneData {
  decorateMode?: boolean;
}

const COLLISION_TEXTURE_KEY = 'cottage-collision-pixel';
const SAVED_PLAYER_TEXTURE_KEY = 'player-unicorn-cottage';
const DECORATION_INTERACTION_PREFIX = 'interaction:cottage-decoration:';
const DECORATE_MARKER_FILL = 0x8dd5ec;
const DECORATE_MARKER_STROKE = 0x4f9fc4;

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
  private decorationService: HomeDecorationService | null = null;
  private friendVisitManager: CottageFriendVisitManager | null = null;
  private sleepController: CottageSleepController | null = null;
  private homeStateObjects: Phaser.GameObjects.GameObject[] = [];
  private decorateModeObjects: Phaser.GameObjects.GameObject[] = [];
  private finishDecoratingObjects: Phaser.GameObjects.GameObject[] = [];
  private finishDecoratingPromptActive = false;
  private finishDecoratingDoorLatch = false;
  private normalInteractions: readonly InteractionTarget[] = [];
  private decorationInteractions: readonly InteractionTarget[] = [];
  private interactions: readonly InteractionTarget[] = [];
  private decorateModeActive = false;

  public constructor() {
    super('CottageInteriorScene');
  }

  public create(data: CottageInteriorSceneData = {}): void {
    this.decorateModeActive = data.decorateMode === true;
    // Scene start data is transient. Phaser retains scene settings between starts, so consume the
    // editor-return flag immediately or a later ordinary cottage entry can resurrect Decorate mode.
    this.sys.settings.data = {};
    this.data.set(COTTAGE_DECORATE_MODE_DATA_KEY, this.decorateModeActive);
    this.events.on(COTTAGE_DECORATE_TOGGLE_EVENT, this.toggleDecorateMode, this);
    this.events.on(COTTAGE_STYLE_OPEN_EVENT, this.openStyleEditor, this);

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, COTTAGE_INTERIOR_LOCATION_ID);
    const cottageStyle = new CottageStyleService(saveService).getResolvedStyle();

    this.createEnvironment(cottageStyle);
    this.ensureCollisionTexture();
    this.decorationService = new HomeDecorationService(saveService);
    const homeView = buildCottageHomeView(save);
    this.renderHomeState(homeView);
    this.normalInteractions = this.createNormalInteractions(homeView);
    this.decorationInteractions = this.createDecorationInteractions(homeView);
    this.interactions = this.decorateModeActive
      ? this.decorationInteractions
      : this.normalInteractions;

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
    this.updatePlayerDepth();
    this.sleepController = new CottageSleepController(
      this,
      this.player,
      getBrowserAtmosphericTimeService(saveService),
      () => this.updatePlayerDepth(),
    );

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
    this.friendVisitManager = new CottageFriendVisitManager(
      this,
      saveService,
      homeView,
      this.pointerInput,
    );

    const camera = this.cameras.main;
    camera.setBackgroundColor('#f5dfcb');
    camera.setBounds(0, 0, map.width, map.height);
    camera.startFollow(this.player.sprite, true, 0.11, 0.11);
    camera.setDeadzone(250, 145);

    this.createHud();
    this.refreshDecorateModePresentation();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(COTTAGE_DECORATE_TOGGLE_EVENT, this.toggleDecorateMode, this);
      this.events.off(COTTAGE_STYLE_OPEN_EVENT, this.openStyleEditor, this);
      this.closeFinishDecoratingPrompt();
      this.feedbackTimer?.destroy();
      this.feedbackTimer = null;
      this.clearDecorateModePresentation();
      this.sleepController?.destroy();
      this.sleepController = null;
      this.friendVisitManager?.destroy();
      this.friendVisitManager = null;
      this.touchMovementPad?.destroy();
      this.touchMovementPad = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.interactionPrompt?.destroy();
      this.interactionPrompt = null;
      this.player?.destroy();
      this.player = null;
      this.collisionGroup = null;
      this.activeInteraction = null;
      this.feedbackText = null;
      this.decorationService = null;
      this.homeStateObjects = [];
      this.finishDecoratingObjects = [];
      this.finishDecoratingPromptActive = false;
      this.finishDecoratingDoorLatch = false;
      this.normalInteractions = [];
      this.decorationInteractions = [];
      this.interactions = [];
      this.decorateModeActive = false;
      this.data.set(COTTAGE_DECORATE_MODE_DATA_KEY, false);
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (this.finishDecoratingPromptActive) {
      this.player.sprite.setVelocity(0, 0);
      this.activeInteraction = null;
      this.interactionPrompt?.setTarget(null);
      return;
    }

    if (this.sleepController?.isActive()) {
      this.player.sprite.setVelocity(0, 0);
      this.activeInteraction = null;
      this.interactionPrompt?.setTarget(null);
      return;
    }

    if (!this.decorateModeActive && this.friendVisitManager?.update(this.inputController)) {
      this.player.sprite.setVelocity(0, 0);
      this.player.updatePresentation(time);
      this.updatePlayerDepth();
      this.activeInteraction = null;
      this.interactionPrompt?.setTarget(null);
      return;
    }

    if (this.inputController.justPressed('BACK')) {
      if (this.decorateModeActive) {
        this.setDecorateMode(false);
      } else {
        this.scene.start('TitleScene');
      }
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
    this.updatePlayerDepth();

    if (this.decorateModeActive) {
      this.updateDecorateDoorwayPrompt();
      if (this.finishDecoratingPromptActive) {
        this.player.sprite.setVelocity(0, 0);
        this.activeInteraction = null;
        this.interactionPrompt?.setTarget(null);
        return;
      }
    }

    const friendInteraction = this.decorateModeActive
      ? null
      : this.friendVisitManager?.getInteraction();
    const availableInteractions = friendInteraction
      ? [...this.interactions, friendInteraction]
      : this.interactions;
    this.activeInteraction = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      availableInteractions,
    );
    this.interactionPrompt?.setTarget(this.activeInteraction);

    if (this.inputController.justPressed('INTERACT') && this.activeInteraction) {
      this.activateInteraction(this.activeInteraction);
    }
  }

  private updatePlayerDepth(): void {
    if (!this.player || this.sleepController?.isActive()) {
      return;
    }

    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body | null;
    const feetY = body?.bottom ?? this.player.sprite.y + 22;
    this.player.sprite.setDepth(worldDepthForY(feetY, 0.12));
  }

  private createNormalInteractions(homeView: CottageHomeView): readonly InteractionTarget[] {
    const treasureNames = homeView.treasureRewards.map((reward) => reward.name);
    const treasureVerb = treasureNames.length === 1 ? 'is' : 'are';
    const treasureMessage =
      treasureNames.length > 0
        ? `${treasureNames.join(' and ')} ${treasureVerb} glowing here. Your adventure is home too.`
        : 'A tiny shelf waits for special treasures from your adventures.';
    const doorAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.door);
    const wonderbookAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.wonderbook);
    const sleepAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.sleep);

    return [
      {
        id: 'interaction:cottage-sleep',
        label: 'Bed',
        actionLabel: 'Sleep',
        actionKind: 'use',
        position: sleepAnchor.position,
        interactionRadius: 82,
        priority: 40,
        result: {
          type: 'callback',
          activate: () => this.startSleep(),
        },
      },
      {
        id: 'interaction:cottage-exit',
        label: 'Moonflower Glade',
        actionLabel: 'Go outside',
        position: doorAnchor.interactionPosition ?? doorAnchor.position,
        interactionRadius: 150,
        priority: 30,
        result: {
          type: 'scene-transition',
          sceneKey: 'MoonflowerGladeScene',
        },
      },
      {
        id: 'interaction:cottage-wonderbook',
        label: 'Wonderbook',
        actionLabel: 'Open book',
        actionKind: 'inspect',
        position: wonderbookAnchor.interactionPosition ?? wonderbookAnchor.position,
        interactionRadius: 150,
        priority: 28,
        result: {
          type: 'scene-transition',
          sceneKey: 'WonderbookScene',
          payload: {
            returnScene: 'CottageInteriorScene',
          },
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

  private createDecorationInteractions(homeView: CottageHomeView): readonly InteractionTarget[] {
    const placementBySlotId = new Map(
      homeView.placements.map((placement) => [placement.slotId, placement] as const),
    );
    const slots: readonly CottageDecorationSlot[] = [
      ...COTTAGE_INTERIOR_MAP.decorationSlots,
      ...COTTAGE_INTERIOR_MAP.deferredDecorationSlots,
    ];

    return slots.map((slot) => {
      const placement = placementBySlotId.get(slot.id);
      return {
        id: `${DECORATION_INTERACTION_PREFIX}${slot.id}`,
        label: placement ? `${slot.label} · ${placement.name}` : slot.label,
        actionLabel: placement ? 'Change decoration' : 'Decorate',
        actionKind: 'interact',
        position: slot.interactionPosition ?? slot.position,
        interactionRadius: 135,
        priority: 60,
        result: {
          type: 'callback' as const,
          activate: () => this.openDecorationSlot(slot.id),
        },
      } satisfies InteractionTarget;
    });
  }

  private activateInteraction(target: InteractionTarget): void {
    if (target.id === COTTAGE_FRIEND_VISIT_INTERACTION_ID) {
      this.friendVisitManager?.activate();
      this.activeInteraction = null;
      this.interactionPrompt?.setTarget(null);
      return;
    }

    if (target.id.startsWith(DECORATION_INTERACTION_PREFIX)) {
      this.openDecorationSlot(target.id.slice(DECORATION_INTERACTION_PREFIX.length));
      return;
    }

    if (target.result.type === 'callback') {
      target.result.activate();
      return;
    }

    if (target.result.type === 'scene-transition') {
      if (target.result.sceneKey === 'WonderbookScene') {
        this.scene.launch(target.result.sceneKey, target.result.payload);
        this.scene.pause();
        return;
      }

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

  private startSleep(): void {
    if (!this.sleepController?.start()) {
      return;
    }
    this.activeInteraction = null;
    this.interactionPrompt?.setTarget(null);
  }

  private openDecorationSlot(slotId: string): void {
    if (!this.decorateModeActive || !this.decorationService) {
      return;
    }

    this.scene.start('CottageDecorateScene', {
      slotId,
      returnToDecorateMode: true,
    });
  }

  private async openStyleEditor(): Promise<void> {
    if (!this.decorateModeActive || !this.scene.isActive()) {
      return;
    }

    if (!this.game.scene.keys.CottageStyleScene) {
      const { CottageStyleScene } = await import('./CottageStyleScene');
      this.scene.add('CottageStyleScene', CottageStyleScene, false);
    }

    if (!this.scene.isActive()) {
      return;
    }

    this.scene.start('CottageStyleScene', { returnToDecorateMode: true });
  }

  private readonly toggleDecorateMode = (): void => {
    this.setDecorateMode(!this.decorateModeActive);
  };

  private setDecorateMode(active: boolean): void {
    if (this.decorateModeActive === active) {
      return;
    }

    if (!active) {
      this.closeFinishDecoratingPrompt();
      this.finishDecoratingDoorLatch = false;
    }

    this.decorateModeActive = active;
    this.data.set(COTTAGE_DECORATE_MODE_DATA_KEY, active);
    this.interactions = active ? this.decorationInteractions : this.normalInteractions;
    this.activeInteraction = null;
    this.interactionPrompt?.setTarget(null);
    this.feedbackText?.setVisible(false);
    this.feedbackTimer?.destroy();
    this.feedbackTimer = null;
    this.refreshDecorateModePresentation();
  }

  private updateDecorateDoorwayPrompt(): void {
    if (!this.player || !this.decorateModeActive || this.finishDecoratingPromptActive) {
      return;
    }

    const door = COTTAGE_INTERIOR_MAP.furnitureLayout.door;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body | null;
    const feetY = body?.bottom ?? this.player.sprite.y + 22;
    const horizontalDistance = Math.abs(this.player.sprite.x - door.x);
    const triggerHalfWidth = door.width / 2 - 16;
    const triggerFeetY = COTTAGE_INTERIOR_MAP.roomShell.bottom - 52;
    const insideDoorway = horizontalDistance <= triggerHalfWidth && feetY >= triggerFeetY;

    if (!insideDoorway) {
      const clearlyAwayFromDoor =
        horizontalDistance > triggerHalfWidth + 54 || feetY < triggerFeetY - 92;
      if (clearlyAwayFromDoor) {
        this.finishDecoratingDoorLatch = false;
      }
      return;
    }

    if (this.finishDecoratingDoorLatch) {
      return;
    }

    this.finishDecoratingDoorLatch = true;
    this.openFinishDecoratingPrompt();
  }

  private openFinishDecoratingPrompt(): void {
    if (this.finishDecoratingPromptActive) {
      return;
    }

    this.finishDecoratingPromptActive = true;
    this.activeInteraction = null;
    this.interactionPrompt?.setTarget(null);
    this.player?.sprite.setVelocity(0, 0);
    setInteractionModalActive(this, true);

    const centreX = GAME_WIDTH / 2;
    const centreY = GAME_HEIGHT / 2;
    const backdrop = this.add
      .rectangle(centreX, centreY, GAME_WIDTH, GAME_HEIGHT, 0x241a3d, 0.38)
      .setName('cottage-finish-decorating-backdrop')
      .setScrollFactor(0)
      .setDepth(20_300)
      .setInteractive();
    const panelObjects = createConfirmationPanel(this, {
      name: 'cottage-finish-decorating-dialog',
      x: centreX,
      y: centreY,
      width: 548,
      height: 250,
      depth: 20_301,
    });
    const title = this.add
      .text(centreX, centreY - 62, 'Are you finished decorating?', {
        color: UI_DESIGN_TOKENS.colour.conceptBlueDeep,
        fontFamily: UI_DESIGN_TOKENS.typography.family,
        fontSize: '26px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setName('cottage-finish-decorating-title')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20_302);
    const hint = this.add
      .text(
        centreX,
        centreY - 16,
        'Choose Yes to finish decorating, then you can leave the cottage.',
        {
          color: UI_DESIGN_TOKENS.colour.softInk,
          fontFamily: UI_DESIGN_TOKENS.typography.family,
          fontSize: '16px',
          align: 'center',
          wordWrap: { width: 430 },
        },
      )
      .setName('cottage-finish-decorating-hint')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20_302);

    const noButton = createConfirmationButton(this, {
      name: 'cottage-finish-decorating-no',
      x: centreX - 112,
      y: centreY + 70,
      width: 176,
      height: 58,
      depth: 20_302,
      label: 'No',
      variant: 'secondary',
      onActivate: () => this.closeFinishDecoratingPrompt(),
    });
    const yesButton = createConfirmationButton(this, {
      name: 'cottage-finish-decorating-yes',
      x: centreX + 112,
      y: centreY + 70,
      width: 176,
      height: 58,
      depth: 20_302,
      label: 'Yes',
      variant: 'primary',
      onActivate: () => {
        this.closeFinishDecoratingPrompt();
        this.setDecorateMode(false);
      },
    });

    this.finishDecoratingObjects.push(
      backdrop,
      ...panelObjects,
      title,
      hint,
      ...noButton.objects,
      ...yesButton.objects,
    );
  }

  private closeFinishDecoratingPrompt(): void {
    if (!this.finishDecoratingPromptActive && this.finishDecoratingObjects.length === 0) {
      return;
    }

    for (const object of this.finishDecoratingObjects) {
      object.destroy();
    }
    this.finishDecoratingObjects = [];
    this.finishDecoratingPromptActive = false;
    setInteractionModalActive(this, false);
  }

  private refreshDecorateModePresentation(): void {
    this.clearDecorateModePresentation();

    if (!this.decorateModeActive) {
      return;
    }

    const slots: readonly CottageDecorationSlot[] = [
      ...COTTAGE_INTERIOR_MAP.decorationSlots,
      ...COTTAGE_INTERIOR_MAP.deferredDecorationSlots,
    ];

    for (const slot of slots) {
      const halo = this.add
        .circle(slot.position.x, slot.position.y, 30, DECORATE_MARKER_FILL, 0.12)
        .setName(`cottage-decorate-marker:${slot.id}`)
        .setStrokeStyle(2, DECORATE_MARKER_STROKE, 0.62)
        .setDepth(12);
      const sparkle = this.add
        .text(slot.position.x, slot.position.y, '✦', {
          color: '#5ca7c9',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
        })
        .setName(`cottage-decorate-sparkle:${slot.id}`)
        .setOrigin(0.5)
        .setAlpha(0.78)
        .setDepth(13);

      this.decorateModeObjects.push(halo, sparkle);
      this.tweens.add({
        targets: halo,
        alpha: 0.28,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private clearDecorateModePresentation(): void {
    for (const object of this.decorateModeObjects) {
      this.tweens.killTweensOf(object);
      object.destroy();
    }
    this.decorateModeObjects = [];
  }

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedbackText?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(4000, () => {
      this.feedbackText?.setVisible(false);
      this.feedbackTimer = null;
    });
  }

  private createEnvironment(style: HomeStyleState): void {
    const wonderbookAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.wonderbook);

    renderCottageRoomSurfaces(this, style);
    renderCottagePermanentFurnishings(this, style);
    renderCottageWonderbookNook(this, wonderbookAnchor.position);
    renderWonderbookWorldProp(this, wonderbookAnchor.position);
  }

  private renderHomeState(homeView: CottageHomeView): void {
    this.clearHomeStatePresentation();

    for (const placement of homeView.placements) {
      this.trackHomeStateObject(
        this.add.circle(placement.position.x, placement.position.y, 52, 0xfff0b8, 0.22).setDepth(8),
      );
      this.trackHomeStateObject(
        this.add
          .text(placement.position.x, placement.position.y - 4, placement.icon, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '48px',
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
      this.trackHomeStateObject(
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
          .setDepth(10),
      );
    }

    const shelf = COTTAGE_INTERIOR_MAP.treasureDisplay.position;
    homeView.treasureRewards.forEach((reward, index) => {
      const x = shelf.x + (index - (homeView.treasureRewards.length - 1) / 2) * 70;
      this.trackHomeStateObject(this.add.circle(x, shelf.y - 18, 36, 0xffe9a0, 0.2).setDepth(8));
      const icon = this.trackHomeStateObject(
        this.add
          .text(x, shelf.y - 24, reward.icon, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '44px',
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
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
      this.trackHomeStateObject(
        this.add
          .text(shelf.x, shelf.y - 20, '✦', {
            color: '#f5d98c',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '32px',
          })
          .setOrigin(0.5)
          .setAlpha(0.55)
          .setDepth(8),
      );
    }
  }

  private trackHomeStateObject<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.homeStateObjects.push(object);
    return object;
  }

  private clearHomeStatePresentation(): void {
    for (const object of this.homeStateObjects) {
      this.tweens.killTweensOf(object);
      object.destroy();
    }
    this.homeStateObjects = [];
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
      blocker.setName(`cottage-collider:${collider.id}`);
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
        fontSize: '27px',
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
      .setDepth(122)
      .setVisible(false);
  }
}
