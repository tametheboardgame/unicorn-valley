import Phaser from 'phaser';
import { PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import { isReducedMotionEnabled } from '../accessibility/AccessibilitySettings';
import { getWorldConversationPresenter } from '../dialogue/WorldConversationPresenter';
import { DiscoveryService } from '../discovery/DiscoveryService';
import {
  FIRST_DISCOVERY_ID,
  FIRST_SPARKLE_POSITION,
  isPipIntroduced,
  PIP_INTRO_APPEARED_FLAG,
  PIP_POSITION,
  PIP_WELCOME_COMPLETE_FLAG,
  shouldTriggerPipArrival,
} from '../intro/PipIntro';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { worldDepthForY } from '../world/WorldDepth';
import {
  PIP_EGG_CLUE_SPOTS,
  getActivePipEggClue,
  getPipEggStage,
  type PipEggClueSpot,
  type PipEggStage,
} from './PipEggArc';
import { getBrowserPipEggArcService } from './browserPipEggArc';

const COTTAGE_NEST_POSITION = { x: 1225, y: 970 } as const;
const CLUE_INTERACTION_RADIUS = 155;
const PIP_PRODUCTION_NAME = 'core-npc:pip:world';

interface WorldMarker {
  id: string;
  container: Phaser.GameObjects.Container;
  key: Phaser.Input.Keyboard.Key | null;
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
  return (
    scene.children.list.find(
      (object): object is Phaser.GameObjects.Container =>
        object instanceof Phaser.GameObjects.Container &&
        Math.abs(object.x - FIRST_SPARKLE_POSITION.x) <= 1 &&
        Math.abs(object.y - FIRST_SPARKLE_POSITION.y) <= 1 &&
        object.list.some((child) => child instanceof Phaser.GameObjects.Text && child.text === '✦'),
    ) ?? null
  );
}

function setNamedVisibility(scene: Phaser.Scene, name: string, visible: boolean): void {
  const object = scene.children.getByName(name) as
    | (Phaser.GameObjects.GameObject & { setVisible?: (value: boolean) => unknown })
    | null;
  object?.setVisible?.(visible);
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
      this.destroyMarker(this.gladeMarker);
      this.gladeMarker = null;
      this.gladeLuma = this.updateLumaFollower(scene, player, this.gladeLuma);
      return;
    }
    this.gladeLuma?.destroy(true);
    this.gladeLuma = null;

    if (!isFirstDiscoveryComplete()) {
      this.destroyMarker(this.gladeMarker);
      this.gladeMarker = null;
      return;
    }

    const progress = getBrowserQuestEngine().getProgress(PIP_STRANGE_EGG_QUEST_ID);
    const activeClue = getActivePipEggClue(progress);
    if (!activeClue) {
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
    }

    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      activeClue.position.x,
      activeClue.position.y,
    );
    if (
      distance <= CLUE_INTERACTION_RADIUS &&
      this.gladeMarker.key &&
      Phaser.Input.Keyboard.JustDown(this.gladeMarker.key)
    ) {
      this.activateGladeTarget(scene, activeClue);
    }
  }

  private syncInitialPipEncounter(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite): void {
    const save = getBrowserSaveService().load();
    const introduced = isPipIntroduced(save);
    const welcomeComplete = save?.world.flags[PIP_WELCOME_COMPLETE_FLAG] === true;
    const firstDiscoveryComplete = isFirstDiscoveryComplete();
    const sparkle = findFirstSparkle(scene);

    this.hideLegacyPip(scene);

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
      this.showFeedback(
        scene,
        'Pip spotted a bright green sparkle beside the path. Go and have a look!',
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

  private hideLegacyPip(scene: Phaser.Scene): void {
    for (const object of scene.children.list) {
      if (object.name === PIP_PRODUCTION_NAME) {
        continue;
      }
      const positioned = object as Phaser.GameObjects.GameObject & { x?: number; y?: number };
      if (typeof positioned.x !== 'number' || typeof positioned.y !== 'number') {
        continue;
      }
      const nearPip =
        Math.abs(positioned.x - PIP_POSITION.x) <= 75 &&
        Math.abs(positioned.y - PIP_POSITION.y) <= 90;
      if (!nearPip) {
        continue;
      }
      if (
        object instanceof Phaser.GameObjects.Arc ||
        object instanceof Phaser.GameObjects.Ellipse ||
        object instanceof Phaser.GameObjects.Triangle
      ) {
        object.setVisible(false);
      } else if (object instanceof Phaser.GameObjects.Text && object.text === 'Pip') {
        object.setVisible(false);
      }
    }
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
      const nestBack = scene.add.ellipse(0, 24, 108, 48, 0x9b7456, 0.8);
      const egg = scene.add.ellipse(0, -9, 64, 82, 0xf6edda, 1).setStrokeStyle(4, 0xb99bc7, 0.92);
      const spotA = scene.add.circle(-12, -19, 7, 0xc8afe3, 0.72);
      const spotB = scene.add.circle(14, 2, 5, 0x9fd7d0, 0.72);
      const spotC = scene.add.circle(3, -34, 4, 0xe4b9d8, 0.78);
      const nestFront = scene.add.ellipse(0, 29, 92, 28, 0xc39768, 0.94);
      parts.push(trackLead, nestBack, egg, spotA, spotB, spotC, nestFront);
    }

    const moteLeft = scene.add.circle(-27, -28, 3.5, 0xa9efff, 0.88);
    const moteRight = scene.add.circle(30, -18, 2.5, 0xe4fbff, 0.88);
    const label = scene.add
      .text(0, 62, target.label, {
        color: '#5b4870',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#fff9edee',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const zone = scene.add
      .zone(0, 0, CLUE_INTERACTION_RADIUS, CLUE_INTERACTION_RADIUS)
      .setInteractive({ useHandCursor: true });
    parts.push(moteLeft, moteRight, label, zone);

    const container = scene.add
      .container(target.position.x, target.position.y, parts)
      .setName(`pip-trail:${target.id}`)
      .setDepth(worldDepthForY(target.position.y, 0.78));

    zone.on('pointerdown', () => this.activateGladeTarget(scene, target));
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
    const key = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null;
    return { id: target.id, container, key };
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

    this.discoveryService.unlockDiscovery(target.discoveryId);
    scene.cameras.main.flash(180, 220, 246, 255, false);
    this.showFeedback(scene, target.feedback);
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
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        COTTAGE_NEST_POSITION.x,
        COTTAGE_NEST_POSITION.y,
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
    const nestBack = scene.add.ellipse(0, 18, 180, 78, 0xb88758, 0.72);
    const nestFront = scene.add.ellipse(0, 34, 150, 52, 0xd1a06b, 0.94);
    const glowAlpha =
      stage === 'found' ? 0.08 : stage === 'warm' ? 0.2 : stage === 'glowing' ? 0.38 : 0.48;
    const glow = scene.add.circle(0, -42, stage === 'cracking' ? 90 : 72, 0xffe989, glowAlpha);
    const egg = scene.add.ellipse(0, -30, 96, 126, 0xf3e7d0, 1).setStrokeStyle(5, 0xb899c8, 1);
    const marks = scene.add
      .text(0, -30, stage === 'cracking' ? '✦ ϟ' : '✦ ☾', {
        color: stage === 'glowing' || stage === 'cracking' ? '#9c77c0' : '#b58bc7',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const label = scene.add
      .text(0, 92, stage === 'cracking' ? 'The egg is cracking!' : 'Strange egg', {
        color: '#604b6d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#fff9eddd',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const zone = scene.add.zone(0, -18, 180, 190).setInteractive({ useHandCursor: true });
    const container = scene.add
      .container(COTTAGE_NEST_POSITION.x, COTTAGE_NEST_POSITION.y, [
        glow,
        nestBack,
        egg,
        marks,
        nestFront,
        label,
        zone,
      ])
      .setDepth(15);
    zone.on('pointerdown', () => this.inspectCottageEgg(scene));
    if (!isReducedMotionEnabled()) {
      scene.tweens.add({
        targets: [egg, marks, glow],
        scale: stage === 'cracking' ? 1.07 : 1.03,
        angle: stage === 'cracking' ? 2 : 0,
        duration: stage === 'cracking' ? 420 : 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
    const key = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null;
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
    marker?.container.destroy(true);
  }
}

let browserPipEggWorldManager: PipEggWorldManager | null = null;

export function getPipEggWorldManager(game: Phaser.Game): PipEggWorldManager {
  browserPipEggWorldManager ??= new PipEggWorldManager(game);
  return browserPipEggWorldManager;
}
