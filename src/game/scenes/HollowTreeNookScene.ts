import Phaser from 'phaser';
import { HOLLOW_TREE_HEART_DISCOVERY_ID } from '../../content/r6GladeHomeContent';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DiscoveryService } from '../discovery/DiscoveryService';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { HollowTreeStoryService } from '../story/HollowTreeStoryService';
import { MOONFLOWER_GLADE_MAP, setMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';
import { InteractiveMicroLocationScene } from './InteractiveMicroLocationScene';

const PLAYER_TEXTURE_KEY = 'player-unicorn-hollow-tree-nook';

export class HollowTreeNookScene extends InteractiveMicroLocationScene {
  private story: HollowTreeStoryService | null = null;
  private discoveryService: DiscoveryService | null = null;

  public constructor() {
    super('HollowTreeNookScene');
  }

  public create(): void {
    const saveService = getBrowserSaveService();
    this.story = new HollowTreeStoryService(saveService, getBrowserQuestEngine());
    this.discoveryService = new DiscoveryService(saveService);
    this.createEnvironment();
    this.initialiseMicroLocation({
      playerTextureKey: PLAYER_TEXTURE_KEY,
      worldBounds: { x: 65, y: 115, width: GAME_WIDTH - 130, height: GAME_HEIGHT - 180 },
      feedback: {
        y: 126,
        color: '#58455d',
        backgroundColor: '#fff7eaf2',
        depth: 50,
        durationMs: 4200,
      },
    });
    this.cameras.main.setBackgroundColor('#342b43');
  }

  protected getMicroLocationInteractions(): readonly InteractionTarget[] {
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

  protected activateMicroLocationInteraction(id: string): void {
    if (id === 'interaction:hollow-tree-nook-exit') {
      this.leaveMicroLocation();
      return;
    }
    if (id === 'interaction:hollow-tree-heart-light') {
      if (this.story?.discoverHeartLight()) {
        this.showMicroLocationFeedback(
          'The warm light settles into a tiny star jar for your Cottage. Pip calls from outside: “The tree wanted you to find that!” 🌟',
        );
        this.cameras.main.flash(160, 255, 232, 157, false);
        return;
      }
      this.showMicroLocationFeedback(
        this.discoveryService?.hasDiscovery(HOLLOW_TREE_HEART_DISCOVERY_ID)
          ? 'The Heart-light Shelf still glows softly. The little star jar it gave you now belongs at home.'
          : 'The shelf is warm and bright, but the Hollow Tree seems to be waiting for its clues to line up first.',
      );
      return;
    }
    if (id === 'interaction:hollow-tree-memory-shelf') {
      this.showMicroLocationFeedback(
        'The shelf has tiny smooth dents shaped like acorns, shells and pebbles. Other valley visitors may have kept treasures here long ago.',
      );
      return;
    }
    this.showMicroLocationFeedback(
      'Three hanging roots tap together: ting, ting, tumm. It is the same gentle rhythm the bridge answered outside.',
    );
  }

  protected leaveMicroLocation(): void {
    const tree = MOONFLOWER_GLADE_MAP.landmarks.find(({ id }) => id === 'hollow-tree');
    if (tree) {
      setMoonflowerGladePlayerSpawn(tree.approach);
    }
    this.scene.start('MoonflowerGladeScene');
  }

  protected onMicroLocationShutdown(): void {
    this.story = null;
    this.discoveryService = null;
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
        .text(x, y, '🍄', { fontFamily: 'system-ui, sans-serif', fontSize: `${34 * scale}px` })
        .setOrigin(0.5);
    }
    this.add
      .rectangle(405, 320, 220, 68, 0x7c5a50, 1)
      .setStrokeStyle(5, 0x5f413d, 0.9)
      .setName('hollow-tree-nook:memory-shelf');
    this.add
      .text(405, 300, '🌰   🪶   🐚', { fontFamily: 'system-ui, sans-serif', fontSize: '25px' })
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
}
