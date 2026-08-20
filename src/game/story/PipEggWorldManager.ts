import Phaser from 'phaser';
import { PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { FIRST_DISCOVERY_ID } from '../intro/PipIntro';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { setMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';
import {
  PIP_EGG_CLUE_SPOTS,
  getActivePipEggClue,
  getPipEggStage,
  type PipEggClueSpot,
  type PipEggStage,
} from './PipEggArc';

const COTTAGE_NEST_POSITION = { x: 1225, y: 970 } as const;

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

export class PipEggWorldManager {
  private readonly discoveryService = new DiscoveryService(getBrowserSaveService());
  private gladeMarker: WorldMarker | null = null;
  private cottageMarker: WorldMarker | null = null;
  private gladeLuma: Phaser.GameObjects.Container | null = null;
  private cottageLuma: Phaser.GameObjects.Container | null = null;
  private hatchSceneRequested = false;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
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
      return;
    }

    const player = findPlayer(scene);
    if (!player) {
      return;
    }

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

    const questEngine = getBrowserQuestEngine();
    const progress = questEngine.getProgress(PIP_STRANGE_EGG_QUEST_ID);
    const awaitingIntro =
      progress.status === 'not-started' ||
      progress.currentStepId === 'quest-step:pips-strange-egg:0';
    const activeClue = getActivePipEggClue(progress);
    const target = awaitingIntro ? PIP_EGG_CLUE_SPOTS[0] : activeClue;

    if (!target) {
      this.destroyMarker(this.gladeMarker);
      this.gladeMarker = null;
      return;
    }

    const markerId = awaitingIntro ? 'pip-egg-intro-marker' : target.id;
    if (!this.gladeMarker || !this.gladeMarker.container.active || this.gladeMarker.id !== markerId) {
      this.destroyMarker(this.gladeMarker);
      this.gladeMarker = this.createGladeMarker(scene, target, markerId, awaitingIntro);
    }

    const distance = Phaser.Math.Distance.Between(player.x, player.y, target.position.x, target.position.y);
    if (distance <= 150 && this.gladeMarker.key && Phaser.Input.Keyboard.JustDown(this.gladeMarker.key)) {
      this.activateGladeTarget(scene, player, target, awaitingIntro);
    }
  }

  private createGladeMarker(
    scene: Phaser.Scene,
    target: PipEggClueSpot,
    markerId: string,
    awaitingIntro: boolean,
  ): WorldMarker {
    const glow = scene.add.circle(0, 0, 46, 0xffef9c, 0.22).setStrokeStyle(3, 0xffffff, 0.72);
    const star = scene.add.text(0, -4, '✦', {
      color: '#fff7bc',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '40px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const label = scene.add.text(0, 64, awaitingIntro ? "Pip's mysterious trail" : target.label, {
      color: '#5b4870',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      backgroundColor: '#fff9edee',
      padding: { x: 8, y: 5 },
    }).setOrigin(0.5);
    const zone = scene.add.zone(0, 0, 150, 150).setInteractive({ useHandCursor: true });
    const container = scene.add.container(target.position.x, target.position.y, [glow, star, label, zone]).setDepth(21);
    zone.on('pointerdown', () => {
      const player = findPlayer(scene);
      if (player) {
        this.activateGladeTarget(scene, player, target, awaitingIntro);
      }
    });
    scene.tweens.add({ targets: [glow, star], scale: 1.18, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const key = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null;
    return { id: markerId, container, key };
  }

  private activateGladeTarget(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    target: PipEggClueSpot,
    awaitingIntro: boolean,
  ): void {
    if (awaitingIntro) {
      setMoonflowerGladePlayerSpawn({ x: player.x, y: player.y });
      scene.scene.start('PipEggStoryScene', { returnScene: 'MoonflowerGladeScene' });
      return;
    }

    const progress = getBrowserQuestEngine().getProgress(PIP_STRANGE_EGG_QUEST_ID);
    const active = getActivePipEggClue(progress);
    if (!active || active.id !== target.id) {
      return;
    }

    this.discoveryService.unlockDiscovery(target.discoveryId);
    scene.cameras.main.flash(180, 255, 242, 172, false);
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
    if (!this.cottageMarker || !this.cottageMarker.container.active || this.cottageMarker.id !== markerId) {
      this.destroyMarker(this.cottageMarker);
      this.cottageMarker = this.createCottageEgg(scene, stage);
    }

    if (player && this.cottageMarker.key) {
      const distance = Phaser.Math.Distance.Between(player.x, player.y, COTTAGE_NEST_POSITION.x, COTTAGE_NEST_POSITION.y);
      if (distance <= 150 && Phaser.Input.Keyboard.JustDown(this.cottageMarker.key)) {
        this.showFeedback(scene, this.eggStageMessage(stage));
      }
    }
  }

  private createCottageEgg(scene: Phaser.Scene, stage: Exclude<PipEggStage, 'none' | 'hatch-ready' | 'hatched'>): WorldMarker {
    const nestBack = scene.add.ellipse(0, 18, 180, 78, 0xb88758, 0.72);
    const nestFront = scene.add.ellipse(0, 34, 150, 52, 0xd1a06b, 0.94);
    const glowAlpha = stage === 'found' ? 0.08 : stage === 'warm' ? 0.2 : stage === 'glowing' ? 0.38 : 0.48;
    const glow = scene.add.circle(0, -42, stage === 'cracking' ? 90 : 72, 0xffe989, glowAlpha);
    const egg = scene.add.ellipse(0, -30, 96, 126, 0xf3e7d0, 1).setStrokeStyle(5, 0xb899c8, 1);
    const marks = scene.add.text(0, -30, stage === 'cracking' ? '✦ ϟ' : '✦ ☾', {
      color: stage === 'glowing' || stage === 'cracking' ? '#9c77c0' : '#b58bc7',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '23px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const label = scene.add.text(0, 92, stage === 'cracking' ? 'The egg is cracking!' : 'Strange egg', {
      color: '#604b6d',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      backgroundColor: '#fff9eddd',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    const zone = scene.add.zone(0, -18, 180, 190).setInteractive({ useHandCursor: true });
    const container = scene.add.container(COTTAGE_NEST_POSITION.x, COTTAGE_NEST_POSITION.y, [glow, nestBack, egg, marks, nestFront, label, zone]).setDepth(15);
    zone.on('pointerdown', () => this.showFeedback(scene, this.eggStageMessage(stage)));
    scene.tweens.add({
      targets: [egg, marks, glow],
      scale: stage === 'cracking' ? 1.07 : 1.03,
      angle: stage === 'cracking' ? 2 : 0,
      duration: stage === 'cracking' ? 420 : 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    const key = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null;
    return { id: `cottage-egg-${stage}`, container, key };
  }

  private eggStageMessage(stage: PipEggStage): string {
    if (stage === 'warm') {
      return 'Strange egg\nIt feels cosy and warm. Something inside seems to be listening. ✨';
    }
    if (stage === 'glowing') {
      return 'Strange egg\nThe shell is glowing brighter after your adventures. 🌟';
    }
    if (stage === 'cracking') {
      return 'Strange egg\nA tiny crack has appeared! It sounds like something is shuffling inside. 🥚';
    }
    return 'Strange egg\nSafe in its cottage nest. Adventures around the valley may help it grow.';
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
    const star = scene.add.text(0, -24, '✦', {
      color: '#fff3a8',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const container = scene.add.container(x, y, [glow, earLeft, earRight, body, belly, eyeLeft, eyeRight, star]).setDepth(12);
    scene.tweens.add({ targets: container, scaleY: 1.05, duration: 760, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    return container;
  }

  private showFeedback(scene: Phaser.Scene, message: string): void {
    const text = scene.add.text(640, 120, message, {
      color: '#5f4b6d',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: '#fff9edf2',
      padding: { x: 18, y: 12 },
      wordWrap: { width: 560 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(120);
    scene.time.delayedCall(3200, () => text.destroy());
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
