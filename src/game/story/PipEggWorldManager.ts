import Phaser from 'phaser';
import { PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import { isReducedMotionEnabled } from '../accessibility/AccessibilitySettings';
import { getWorldConversationPresenter } from '../dialogue/WorldConversationPresenter';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import {
  FIRST_DISCOVERY_ID,
  isPipIntroduced,
  PIP_INTRO_APPEARED_FLAG,
  PIP_POSITION,
  PIP_WELCOME_COMPLETE_FLAG,
  shouldTriggerPipArrival,
} from '../intro/PipIntro';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getWorldFeedbackPresenter } from '../ui/WorldFeedbackPresenter';
import {
  COTTAGE_SEMANTIC_ANCHOR_IDS,
  resolveCottageSemanticAnchor,
} from '../world/CottageSemanticAnchors';
import { worldDepthForY } from '../world/WorldDepth';
import {
  PIP_EGG_CLUE_SPOTS,
  getActivePipEggClue,
  getPipEggStage,
  type PipEggClueSpot,
  type PipEggStage,
} from './PipEggArc';
import { getBrowserPipEggArcService } from './browserPipEggArc';

const CLUE_INTERACTION_RADIUS = 155;
const PIP_PRODUCTION_NAME = 'core-npc:pip:world';
const PIP_TRAIL_INTERACTION_OWNER = 'h1:pip-egg-trail';
const FIRST_SPARKLE_NAME = 'pip-first-green-sparkle';
const EGG_COLLISION_TEXTURE_KEY = 'pip-egg-collision-pixel';

interface WorldMarker {
  id: string;
  container: Phaser.GameObjects.Container;
  key: Phaser.Input.Keyboard.Key | null;
  blocker?: Phaser.Physics.Arcade.Image;
  collider?: Phaser.Physics.Arcade.Collider;
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  return (
    scene.children.list.find(
      (object): object is Phaser.Physics.Arcade.Sprite =>
        object instanceof Phaser.Physics.Arcade.Sprite &&
        object.texture.key.startsWith('player-unicorn'),
    ) ?? null
  );
}

function isFirstDiscoveryComplete(): boolean {
  const save = getBrowserSaveService().load();
  return Boolean(
    save?.collections.discoveryIds.includes(FIRST_DISCOVERY_ID) ||
      save?.world.uniqueDiscoveryIds.includes(FIRST_DISCOVERY_ID),
  );
}

function setWorldFlag(flagId: string, value: boolean): void {
  const saveService = getBrowserSaveService();
  const save = saveService.load() ?? saveService.createNewGame();
  saveService.save({
    ...save,
    world: {
      ...save.world,
      flags: {
        ...save.world.flags,
        [flagId]: value,
      },
    },
  });
}

function findFirstSparkle(scene: Phaser.Scene): Phaser.GameObjects.Container | null {
  const sparkle = scene.children.getByName(FIRST_SPARKLE_NAME);
  return sparkle instanceof Phaser.GameObjects.Container ? sparkle : null;
}

function setNamedVisibility(scene: Phaser.Scene, name: string, visible: boolean): void {
  const object = scene.children.getByName(name) as
    | (Phaser.GameObjects.GameObject & { setVisible?: (value: boolean) => unknown })
    | null;
  object?.setVisible?.(visible);
}

function isPickupClue(target: PipEggClueSpot): boolean {
  return target.id !== 'interaction:pip-egg-clue-star';
}

export class PipEggWorldManager {
  private readonly discoveryService = new DiscoveryService(getBrowserSaveService());
  private readonly eggArc = getBrowserPipEggArcService();
  private gladeMarker: WorldMarker | null = null;
  private cottageMarker: WorldMarker | null = null;
  private gladeLuma: Phaser.GameObjects.Container | null = null;
  private cottageLuma: Phaser.GameObjects.Container | null = null;
  private hatchSceneRequested = false;
  private introSequenceRunning = false;
  private introScene: Phaser.Scene | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    this.updateGlade();
    this.updateCottage();
  }

  private updateGlade(): void {
    const scene = this.game.scene.getScene('MoonflowerGladeScene');
    if (!scene?.scene.isActive()) {
      if (scene) {
        getSceneInteractionRegistry(scene).clearOwner(PIP_TRAIL_INTERACTION_OWNER);
      }
      this.destroyMarker(this.gladeMarker);
      this.gladeMarker = null;
      this.gladeLuma?.destroy(true);
      this.gladeLuma = null;
      if (this.introScene && this.introScene !== scene) {
        this.introSequenceRunning = false;
        this.introScene = null;
      }
      return;
    }

    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    this.syncInitialPipEncounter(scene, player);

    const save = getBrowserSaveService().load();
    const stage = getPipEggStage(save);
    if (stage === 'hatched') {
      getSceneInteractionRegistry(scene).clearOwner(PIP_TRAIL_INTERACTION_OWNER);
      this.destroyMarker(this.gladeMarker);
      this.gladeMarker = null;
      this.gladeLuma = this.updateLumaFollower(scene, player, this.gladeLuma);
      return;
    }
    this.gladeLuma?.destroy(true);
    this.gladeLuma = null;

    if (!isFirstDiscoveryComplete()) {
      getSceneInteractionRegistry(scene).clearOwner(PIP_TRAIL_INTERACTION_OWNER);
      this.destroyMarker(this.gladeMarker);
      this.gladeMarker = null;
      return;
    }

    const progress = getBrowserQuestEngine().getProgress(PIP_STRANGE_EGG_QUEST_ID);
    const activeClue = getActivePipEggClue(progress);
    if (!activeClue) {
      getSceneInteractionRegistry(scene).clearOwner(PIP_TRAIL_INTERACTION_OWNER);
      this.destroyMarker(this.gladeMarker);
      this.gladeMarker = null;
      return;
    }

    if (
      !this.gladeMarker ||
      !this.gladeMarker.container.active ||
      this.gladeMarker.id !== activeClue.id
    ) {
      this.destroyMarker(this.gladeMarker);
      this.gladeMarker = this.createGladeClue(scene, activeClue);
      this.syncGladeInteraction(scene, activeClue);
    }
  }

  private syncInitialPipEncounter(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite): void {
    const save = getBrowserSaveService().load();
    const introduced = isPipIntroduced(save);
    const welcomeComplete = save?.world.flags[PIP_WELCOME_COMPLETE_FLAG] === true;
    const firstDiscoveryComplete = isFirstDiscoveryComplete();
    const sparkle = findFirstSparkle(scene);

    if (!introduced) {
      setNamedVisibility(scene, PIP_PRODUCTION_NAME, false);
      sparkle?.setVisible(false);
      if (!this.introSequenceRunning && shouldTriggerPipArrival(player.x, save)) {
        this.startPipArrival(scene);
      }
      return;
    }

    setNamedVisibility(scene, PIP_PRODUCTION_NAME, true);

    if (!welcomeComplete && !firstDiscoveryComplete && !this.introSequenceRunning) {
      sparkle?.setVisible(false);
      this.resumeInterruptedWelcome(scene);
      return;
    }

    sparkle?.setVisible(welcomeComplete || firstDiscoveryComplete);
  }

  private startPipArrival(scene: Phaser.Scene): void {
    this.introSequenceRunning = true;
    this.introScene = scene;
    scene.physics.pause();
    const puff = this.createPipPuff(scene);

    const revealDelay = isReducedMotionEnabled() ? 90 : 260;
    const conversationDelay = isReducedMotionEnabled() ? 180 : 560;

    scene.time.delayedCall(revealDelay, () => {
      if (!scene.scene.isActive()) {
        return;
      }
      setWorldFlag(PIP_INTRO_APPEARED_FLAG, true);
      setNamedVisibility(scene, PIP_PRODUCTION_NAME, true);
    });

    scene.time.delayedCall(conversationDelay, () => {
      puff.destroy(true);
      if (!scene.scene.isActive()) {
        this.introSequenceRunning = false;
        this.introScene = null;
        return;
      }
      setNamedVisibility(scene, PIP_PRODUCTION_NAME, true);
      this.startWelcomeConversation(scene);
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.introScene === scene) {
        this.introSequenceRunning = false;
        this.introScene = null;
      }
    });
  }

  private resumeInterruptedWelcome(scene: Phaser.Scene): void {
    this.introSequenceRunning = true;
    this.introScene = scene;
    scene.physics.pause();
    scene.time.delayedCall(180, () => {
      if (scene.scene.isActive()) {
        this.startWelcomeConversation(scene);
      }
    });
  }

  private startWelcomeConversation(scene: Phaser.Scene): void {
    const finish = () => {
      if (!scene.scene.isActive()) {
        return;
      }
      setWorldFlag(PIP_WELCOME_COMPLETE_FLAG, true);
      findFirstSparkle(scene)?.setVisible(true);
      scene.physics.resume();
      this.introSequenceRunning = false;
      this.introScene = null;
      getWorldFeedbackPresenter(scene).showGuidance(
        'Pip spotted a bright green sparkle beside the path. Go and have a look!',
        4200,
      );
    };

    getWorldConversationPresenter().start(scene, 'dialogue:pip-welcome', {
      onComplete: finish,
      onClose: finish,
    });
  }

  private createPipPuff(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const parts: Phaser.GameObjects.GameObject[] = [];
    for (const [x, y, radius, colour, alpha] of [
      [-34, 8, 30, 0xe8d5ff, 0.72],
      [-14, -18, 35, 0xffffff, 0.8],
      [18, -10, 38, 0xdcc8ff, 0.76],
      [38, 14, 28, 0xf7e6ff, 0.68],
      [2, 24, 33, 0xc9eff2, 0.55],
    ] as const) {
      parts.push(scene.add.circle(x, y, radius, colour, alpha));
    }
    for (const [x, y, size] of [
      [-45, -30, 20],
      [36, -32, 17],
      [52, 2, 13],
      [-4, -48, 15],
    ] as const) {
      parts.push(
        scene.add
          .text(x, y, '✦', {
            color: '#fff2a9',
            fontFamily: 'system-ui, sans-serif',
            fontSize: `${size}px`,
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
    }

    const puff = scene.add
      .container(PIP_POSITION.x, PIP_POSITION.y + 2, parts)
      .setName('pip-arrival-puff')
      .setDepth(worldDepthForY(PIP_POSITION.y, 1.6));

    if (!isReducedMotionEnabled()) {
      scene.tweens.add({
        targets: parts,
        scale: { from: 0.5, to: 1.65 },
        alpha: { from: 0.9, to: 0 },
        duration: 650,
        ease: 'Cubic.Out',
      });
      scene.tweens.add({
        targets: puff,
        angle: 8,
        duration: 650,
        ease: 'Sine.Out',
      });
    }
    return puff;
  }

  private createEggArtwork(
    scene: Phaser.Scene,
    stage: Exclude<PipEggStage, 'none' | 'hatch-ready' | 'hatched'>,
    scale = 1,
  ): Phaser.GameObjects.Container {
    const glowAlpha =
      stage === 'found' ? 0.08 : stage === 'warm' ? 0.14 : stage === 'glowing' ? 0.25 : 0.32;
    const shellColour =
      stage === 'found'
        ? 0xf8efe0
        : stage === 'warm'
          ? 0xf8ead8
          : stage === 'glowing'
            ? 0xfff0cf
            : 0xffedc8;

    const glow = scene.add.circle(0, -24 * scale, 46 * scale, 0xffe989, glowAlpha);
    const shadow = scene.add.ellipse(2 * scale, 23 * scale, 82 * scale, 24 * scale, 0x5e4a4d, 0.16);
    const nestBack = scene.add.ellipse(0, 16 * scale, 104 * scale, 42 * scale, 0x9e7758, 0.82);

    const strawBack = scene.add.graphics();
    strawBack.lineStyle(Math.max(1.5, 2.2 * scale), 0xd6aa73, 0.9);
    for (const [x1, y1, x2, y2] of [
      [-45, 10, -18, 25],
      [-31, 5, 3, 25],
      [-7, 4, 27, 24],
      [18, 5, 46, 20],
      [-40, 22, -8, 8],
      [4, 24, 35, 8],
    ] as const) {
      strawBack.lineBetween(x1 * scale, y1 * scale, x2 * scale, y2 * scale);
    }

    const shellShadow = scene.add.ellipse(
      3 * scale,
      -17 * scale,
      57 * scale,
      75 * scale,
      0xbca8b7,
      0.34,
    );
    const egg = scene.add
      .ellipse(0, -21 * scale, 54 * scale, 72 * scale, shellColour, 1)
      .setStrokeStyle(Math.max(2, 3 * scale), 0xae90be, 0.96);
    const lowerTint = scene.add.ellipse(
      2 * scale,
      -4 * scale,
      43 * scale,
      28 * scale,
      0xe4c8dd,
      stage === 'glowing' || stage === 'cracking' ? 0.18 : 0.1,
    );
    const highlight = scene.add.ellipse(
      -11 * scale,
      -40 * scale,
      11 * scale,
      22 * scale,
      0xffffff,
      0.58,
    );

    const shellDetails = scene.add.graphics();
    shellDetails.fillStyle(0xc7ace0, 0.72);
    shellDetails.fillCircle(-12 * scale, -28 * scale, 4.2 * scale);
    shellDetails.fillCircle(14 * scale, -12 * scale, 3.5 * scale);
    shellDetails.fillStyle(0x8fd4c9, 0.74);
    shellDetails.fillCircle(10 * scale, -35 * scale, 2.8 * scale);
    shellDetails.fillCircle(-7 * scale, -7 * scale, 2.4 * scale);
    shellDetails.lineStyle(Math.max(1.4, 1.8 * scale), 0xa986bf, 0.8);
    shellDetails.strokeCircle(5 * scale, -22 * scale, 7 * scale);
    shellDetails.fillStyle(shellColour, 1);
    shellDetails.fillCircle(8 * scale, -24 * scale, 6.2 * scale);

    if (stage === 'cracking') {
      shellDetails.lineStyle(Math.max(1.8, 2.2 * scale), 0x87679d, 0.95);
      shellDetails.beginPath();
      shellDetails.moveTo(-3 * scale, -51 * scale);
      shellDetails.lineTo(4 * scale, -42 * scale);
      shellDetails.lineTo(-2 * scale, -34 * scale);
      shellDetails.lineTo(7 * scale, -26 * scale);
      shellDetails.strokePath();
    }

    const nestFront = scene.add.ellipse(0, 24 * scale, 92 * scale, 25 * scale, 0xc99a68, 0.96);
    const strawFront = scene.add.graphics();
    strawFront.lineStyle(Math.max(1.5, 2 * scale), 0xedc58a, 0.9);
    for (const [x1, y1, x2, y2] of [
      [-37, 19, -11, 29],
      [-18, 18, 10, 29],
      [4, 18, 30, 28],
      [22, 18, 42, 25],
    ] as const) {
      strawFront.lineBetween(x1 * scale, y1 * scale, x2 * scale, y2 * scale);
    }

    return scene.add
      .container(0, 0, [
        glow,
        shadow,
        nestBack,
        strawBack,
        shellShadow,
        egg,
        lowerTint,
        highlight,
        shellDetails,
        nestFront,
        strawFront,
      ])
      .setName(`pip-egg-art:${stage}`);
  }

  private attachEggCollision(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    x: number,
    y: number,
    width: number,
    height: number,
    name: string,
  ): Pick<WorldMarker, 'blocker' | 'collider'> {
    if (!scene.textures.exists(EGG_COLLISION_TEXTURE_KEY)) {
      const pixel = scene.add.graphics();
      pixel.fillStyle(0xffffff, 1);
      pixel.fillRect(0, 0, 2, 2);
      pixel.generateTexture(EGG_COLLISION_TEXTURE_KEY, 2, 2);
      pixel.destroy();
    }

    const blocker = scene.physics.add
      .staticImage(x, y, EGG_COLLISION_TEXTURE_KEY)
      .setName(name)
      .setDisplaySize(width, height)
      .setVisible(false)
      .refreshBody();
    const collider = scene.physics.add.collider(player, blocker);
    return { blocker, collider };
  }

  private createGladeClue(scene: Phaser.Scene, target: PipEggClueSpot): WorldMarker {
    const parts: Phaser.GameObjects.GameObject[] = [];
    const glow = scene.add.circle(0, 0, 36, 0x7edcff, 0.1);
    parts.push(glow);

    if (target.id === 'interaction:pip-egg-clue-feather') {
      const feather = scene.add.graphics();
      feather.lineStyle(4, 0xdce9ef, 0.98);
      feather.lineBetween(-18, 25, 21, -29);
      feather.fillStyle(0xeaf4f7, 0.96);
      feather.fillEllipse(1, -8, 26, 55);
      feather.fillStyle(0xb9cdd6, 0.72);
      feather.fillTriangle(-3, -31, 3, 15, -19, -4);
      feather.fillTriangle(3, -27, 6, 13, 21, -8);
      parts.push(feather);
    } else if (target.id === 'interaction:pip-egg-clue-moss') {
      for (const [x, y, width, height, colour] of [
        [-25, 6, 48, 25, 0x6faa72],
        [9, 3, 54, 29, 0x83bd76],
        [32, 10, 36, 22, 0x5f9865],
        [-5, -8, 42, 24, 0x91c77d],
      ] as const) {
        parts.push(scene.add.ellipse(x, y, width, height, colour, 0.98));
      }
      parts.push(scene.add.circle(2, 0, 10, 0xffdda0, 0.18));
    } else if (target.id === 'interaction:pip-egg-clue-star') {
      const tracks = scene.add.graphics();
      const points = [
        [-38, -24],
        [-18, -9],
        [4, 5],
        [29, 19],
        [55, 34],
        [82, 49],
        [110, 65],
      ] as const;
      tracks.fillStyle(0xd7c0ea, 0.88);
      for (const [x, y] of points) {
        this.drawStarTrack(tracks, x, y, 7);
      }
      parts.push(tracks);
    } else {
      const trackLead = scene.add.graphics();
      trackLead.fillStyle(0xd7c0ea, 0.66);
      for (const [x, y] of [
        [-270, -190],
        [-220, -155],
        [-165, -116],
        [-112, -76],
        [-62, -42],
      ] as const) {
        this.drawStarTrack(trackLead, x, y, 6);
      }
      const eggArt = this.createEggArtwork(scene, 'found', 0.86);
      parts.push(trackLead, eggArt);
    }

    const moteLeft = scene.add.circle(-27, -28, 3.5, 0xa9efff, 0.88);
    const moteRight = scene.add.circle(30, -18, 2.5, 0xe4fbff, 0.88);
    parts.push(moteLeft, moteRight);

    const container = scene.add
      .container(target.position.x, target.position.y, parts)
      .setName(`pip-trail:${target.id}`)
      .setDepth(worldDepthForY(target.position.y, 0.78));

    if (!isReducedMotionEnabled()) {
      scene.tweens.add({
        targets: [glow, moteLeft, moteRight],
        alpha: { from: 0.22, to: 0.9 },
        scale: { from: 0.92, to: 1.12 },
        duration: 980,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
    if (target.id === 'interaction:pip-strange-egg') {
      const player = findPlayer(scene);
      if (player) {
        return {
          id: target.id,
          container,
          key: null,
          ...this.attachEggCollision(
            scene,
            player,
            target.position.x,
            target.position.y + 11,
            66,
            34,
            'pip-egg-collider:glade',
          ),
        };
      }
    }

    return { id: target.id, container, key: null };
  }

  private syncGladeInteraction(scene: Phaser.Scene, target: PipEggClueSpot): void {
    const pickup = isPickupClue(target);
    getSceneInteractionRegistry(scene).replaceOwnerTargets(PIP_TRAIL_INTERACTION_OWNER, [
      {
        id: target.id,
        label: target.label,
        actionLabel: pickup ? 'Pick up' : 'Inspect',
        actionKind: pickup ? 'pick-up' : 'inspect',
        worldAffordance: true,
        position: target.position,
        interactionRadius: CLUE_INTERACTION_RADIUS,
        priority: 18,
        directArea: {
          width: target.id === 'interaction:pip-strange-egg' ? 128 : 190,
          height: target.id === 'interaction:pip-strange-egg' ? 128 : 190,
          name: `pip-trail-direct:${target.id}`,
        },
        result: {
          type: 'callback',
          activate: () => this.activateGladeTarget(scene, target),
        },
      },
    ]);
  }

  private drawStarTrack(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
  ): void {
    const inner = radius * 0.35;
    graphics.fillTriangle(x, y - radius, x - inner, y, x + inner, y);
    graphics.fillTriangle(x, y + radius, x - inner, y, x + inner, y);
    graphics.fillTriangle(x - radius, y, x, y - inner, x, y + inner);
    graphics.fillTriangle(x + radius, y, x, y - inner, x, y + inner);
  }

  private activateGladeTarget(scene: Phaser.Scene, target: PipEggClueSpot): void {
    const progress = getBrowserQuestEngine().getProgress(PIP_STRANGE_EGG_QUEST_ID);
    const active = getActivePipEggClue(progress);
    if (!active || active.id !== target.id) {
      return;
    }

    this.discoveryService.unlockDiscovery(target.discoveryId, undefined, {
      suppressRewardFeedback: true,
    });
    scene.cameras.main.flash(180, 220, 246, 255, false);
    getWorldFeedbackPresenter(scene).showGuidance(target.feedback, 4400);
  }

  private updateCottage(): void {
    const scene = this.game.scene.getScene('CottageInteriorScene');
    if (!scene?.scene.isActive()) {
      this.destroyMarker(this.cottageMarker);
      this.cottageMarker = null;
      this.cottageLuma?.destroy(true);
      this.cottageLuma = null;
      this.hatchSceneRequested = false;
      return;
    }

    const save = getBrowserSaveService().load();
    const stage = getPipEggStage(save);
    const player = findPlayer(scene);

    if (stage === 'hatch-ready') {
      this.destroyMarker(this.cottageMarker);
      this.cottageMarker = null;
      if (!this.hatchSceneRequested) {
        this.hatchSceneRequested = true;
        scene.scene.start('PipEggHatchScene');
      }
      return;
    }

    this.hatchSceneRequested = false;
    if (stage === 'none') {
      this.destroyMarker(this.cottageMarker);
      this.cottageMarker = null;
      this.cottageLuma?.destroy(true);
      this.cottageLuma = null;
      return;
    }

    if (stage === 'hatched') {
      this.destroyMarker(this.cottageMarker);
      this.cottageMarker = null;
      if (player) {
        this.cottageLuma = this.updateLumaFollower(scene, player, this.cottageLuma);
      }
      return;
    }

    this.cottageLuma?.destroy(true);
    this.cottageLuma = null;
    const markerId = `cottage-egg-${stage}`;
    if (
      !this.cottageMarker ||
      !this.cottageMarker.container.active ||
      this.cottageMarker.id !== markerId
    ) {
      this.destroyMarker(this.cottageMarker);
      this.cottageMarker = this.createCottageEgg(scene, stage);
    }

    if (player && this.cottageMarker.key) {
      const nestAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest);
      const inspectionPoint = nestAnchor.interactionPosition ?? nestAnchor.position;
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        inspectionPoint.x,
        inspectionPoint.y,
      );
      if (distance <= 150 && Phaser.Input.Keyboard.JustDown(this.cottageMarker.key)) {
        this.inspectCottageEgg(scene);
      }
    }
  }

  private createCottageEgg(
    scene: Phaser.Scene,
    stage: Exclude<PipEggStage, 'none' | 'hatch-ready' | 'hatched'>,
  ): WorldMarker {
    const eggArt = this.createEggArtwork(scene, stage, 0.96);
    const label = scene.add
      .text(0, 66, stage === 'cracking' ? 'The egg is cracking!' : 'Strange egg', {
        color: '#604b6d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#fff9eddd',
        padding: { x: 7, y: 3 },
      })
      .setOrigin(0.5);
    const zone = scene.add
      .zone(0, -12, 124, 124)
      .setName('cottage-story:egg-inspect')
      .setInteractive({ useHandCursor: true });
    const nestAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest);
    const container = scene.add
      .container(nestAnchor.position.x, nestAnchor.position.y, [eggArt, label, zone])
      .setName(`cottage-story:egg-nest:${stage}`)
      .setDepth(worldDepthForY(nestAnchor.position.y + 28, 0.24));
    zone.on('pointerdown', () => this.inspectCottageEgg(scene));
    if (!isReducedMotionEnabled()) {
      scene.tweens.add({
        targets: eggArt,
        scale: stage === 'cracking' ? 1.035 : 1.015,
        angle: stage === 'cracking' ? 1.4 : 0,
        duration: stage === 'cracking' ? 420 : 1050,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
    const key = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null;
    const player = findPlayer(scene);
    if (player) {
      return {
        id: `cottage-egg-${stage}`,
        container,
        key,
        ...this.attachEggCollision(
          scene,
          player,
          nestAnchor.position.x,
          nestAnchor.position.y + 11,
          70,
          36,
          'pip-egg-collider:cottage',
        ),
      };
    }
    return { id: `cottage-egg-${stage}`, container, key };
  }

  private inspectCottageEgg(scene: Phaser.Scene): void {
    const before = this.eggArc.getStage();
    const pending = this.eggArc.hasPendingGrowth();
    const after = this.eggArc.inspectEgg();

    if (!pending || before === after) {
      this.showFeedback(scene, this.eggStageMessage(after, false));
      return;
    }

    scene.cameras.main.flash(220, 255, 238, 178, false);
    this.showFeedback(scene, this.eggStageMessage(after, true));
  }

  private eggStageMessage(stage: PipEggStage, justGrew: boolean): string {
    if (stage === 'warm') {
      return justGrew
        ? 'The egg changed!\nIt feels warm and cosy after your adventure. Have another adventure, then come back and check it again.'
        : 'The egg is warm.\nHave another adventure somewhere in the valley, then come home and check it again.';
    }
    if (stage === 'glowing') {
      return justGrew
        ? 'The egg changed again!\nA soft light is glowing through the shell. One more adventure might wake it further.'
        : 'The egg is glowing softly.\nHave another adventure, then come back and inspect it again.';
    }
    if (stage === 'cracking') {
      return justGrew
        ? 'Crack!\nA tiny crack has appeared in the shell. Have one more adventure, then hurry back to check the nest.'
        : 'A tiny crack is visible.\nHave one more adventure, then come back and inspect the egg.';
    }
    if (stage === 'hatch-ready') {
      return 'The egg is wobbling!\nSomething inside is ready to hatch.';
    }
    return 'The strange egg is safe in its cottage nest.\nHave an adventure somewhere in the valley, then come back and inspect it.';
  }

  private updateLumaFollower(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    existing: Phaser.GameObjects.Container | null,
  ): Phaser.GameObjects.Container {
    let luma = existing;
    if (!luma || !luma.active || luma.scene !== scene) {
      luma?.destroy(true);
      luma = this.createLuma(scene, player.x - 75, player.y + 50);
    }
    const targetX = player.x - 78;
    const targetY = player.y + 52;
    luma.x = Phaser.Math.Linear(luma.x, targetX, 0.08);
    luma.y = Phaser.Math.Linear(luma.y, targetY, 0.08);
    luma.setDepth(Math.max(10, player.depth - 1));
    return luma;
  }

  private createLuma(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
    const glow = scene.add.circle(0, 0, 48, 0xffef9a, 0.16);
    const body = scene.add.ellipse(0, 0, 72, 56, 0xc6b2eb, 1);
    const belly = scene.add.ellipse(0, 8, 43, 31, 0xf3e9ff, 0.96);
    const earLeft = scene.add.triangle(-26, -28, 0, 28, 12, 0, 24, 27, 0x9c82ca, 1);
    const earRight = scene.add.triangle(25, -28, 0, 27, 12, 0, 25, 29, 0x9c82ca, 1);
    const eyeLeft = scene.add.circle(-13, -6, 3.5, 0x493d67, 1);
    const eyeRight = scene.add.circle(13, -6, 3.5, 0x493d67, 1);
    const star = scene.add
      .text(0, -24, '✦', {
        color: '#fff3a8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const container = scene.add
      .container(x, y, [glow, earLeft, earRight, body, belly, eyeLeft, eyeRight, star])
      .setDepth(12);
    scene.tweens.add({
      targets: container,
      scaleY: 1.05,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return container;
  }

  private showFeedback(scene: Phaser.Scene, message: string): void {
    const text = scene.add
      .text(640, 120, message, {
        color: '#5f4b6d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff9edf2',
        padding: { x: 18, y: 12 },
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120);
    scene.time.delayedCall(4200, () => text.destroy());
  }

  private destroyMarker(marker: WorldMarker | null): void {
    marker?.collider?.destroy();
    marker?.blocker?.destroy();
    marker?.container.destroy(true);
  }
}

let browserPipEggWorldManager: PipEggWorldManager | null = null;

export function getPipEggWorldManager(game: Phaser.Game): PipEggWorldManager {
  browserPipEggWorldManager ??= new PipEggWorldManager(game);
  return browserPipEggWorldManager;
}
