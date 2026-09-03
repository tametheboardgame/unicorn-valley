import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { CrystalGrottoStoryService, type CrystalNoteId } from '../story/CrystalGrottoStoryService';
import { setCrystalBrookPlayerSpawn } from '../world/CrystalBrookMap';
import { InteractiveMicroLocationScene } from './InteractiveMicroLocationScene';

const PLAYER_TEXTURE_KEY = 'player-unicorn-crystal-grotto';
const BROOK_RETURN = { x: 3020, y: 1740 } as const;
const NOTE_INTERACTIONS = [
  {
    id: 'interaction:grotto-note-low',
    note: 'low',
    label: 'Broad blue crystal',
    actionLabel: 'Tap gently',
    position: { x: 315, y: 365 },
    interactionRadius: 145,
  },
  {
    id: 'interaction:grotto-note-bright',
    note: 'bright',
    label: 'Slim aqua crystal',
    actionLabel: 'Tap gently',
    position: { x: 650, y: 245 },
    interactionRadius: 145,
  },
  {
    id: 'interaction:grotto-note-bell',
    note: 'bell',
    label: 'Little lavender crystal',
    actionLabel: 'Tap gently',
    position: { x: 955, y: 390 },
    interactionRadius: 145,
  },
] as const;

export class CrystalGrottoScene extends InteractiveMicroLocationScene {
  private story: CrystalGrottoStoryService | null = null;

  public constructor() {
    super('CrystalGrottoScene');
  }

  public create(): void {
    const saveService = getBrowserSaveService();
    this.story = new CrystalGrottoStoryService(saveService, getBrowserQuestEngine());
    this.createEnvironment(this.story.isGrottoGlowing());
    this.initialiseMicroLocation({
      playerTextureKey: PLAYER_TEXTURE_KEY,
      worldBounds: { x: 70, y: 115, width: GAME_WIDTH - 140, height: GAME_HEIGHT - 185 },
      playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 155 },
      feedback: { y: 112, color: '#4b4668', backgroundColor: '#f4fbfff0' },
    });
  }

  protected getMicroLocationInteractions(): readonly InteractionTarget[] {
    return [
      {
        id: 'interaction:grotto-exit',
        label: 'Crystal Brook',
        actionLabel: 'Go outside',
        position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 88 },
        interactionRadius: 135,
        priority: 30,
        result: { type: 'message', title: 'Exit', message: '' },
      },
      ...NOTE_INTERACTIONS.map(
        (note): InteractionTarget => ({
          id: note.id,
          label: note.label,
          actionLabel: note.actionLabel,
          position: note.position,
          interactionRadius: note.interactionRadius,
          priority: 20,
          result: { type: 'message', title: note.label, message: '' },
        }),
      ),
      {
        id: 'interaction:grotto-pool',
        label: 'Singing pool',
        actionLabel: 'Listen',
        position: { x: 640, y: 440 },
        interactionRadius: 145,
        result: { type: 'message', title: 'Singing Pool', message: '' },
      },
    ];
  }

  protected activateMicroLocationInteraction(id: string): void {
    if (id === 'interaction:grotto-exit') {
      this.leaveMicroLocation();
      return;
    }
    if (id === 'interaction:grotto-pool') {
      this.showMicroLocationFeedback(
        this.story?.isStoryComplete()
          ? 'The pool carries all three crystal notes now. Ripples spread them around the cave in a soft repeating tune. 🎵'
          : 'Water drips into the pool in a steady rhythm. The surrounding crystals seem ready to answer it.',
      );
      return;
    }
    const note = NOTE_INTERACTIONS.find((candidate) => candidate.id === id);
    if (note) {
      this.playNote(note.note, note.position);
    }
  }

  protected leaveMicroLocation(): void {
    setCrystalBrookPlayerSpawn(BROOK_RETURN);
    this.scene.start('CrystalBrookScene');
  }

  protected onMicroLocationShutdown(): void {
    this.story = null;
  }

  private playNote(note: CrystalNoteId, position: { x: number; y: number }): void {
    const messages: Record<CrystalNoteId, string> = {
      low: 'Hummm. The broad blue crystal makes a low note you can almost feel through the floor. 💎',
      bright: 'Ping! The aqua crystal answers with a clear bright note above the pool. ✨',
      bell: 'Ting! The little lavender crystal finishes the pattern. All three notes echo back together. 🔔🎵',
    };
    if (this.story?.playCrystalNote(note)) {
      this.showMicroLocationFeedback(messages[note]);
      this.playCrystalBurst(position, note === 'bell');
      return;
    }
    this.showMicroLocationFeedback(
      this.story?.isStoryComplete()
        ? `${messages[note]} The grotto already knows where this note belongs.`
        : 'That crystal makes a lovely sound, but Echo’s pattern is waiting for a different note first.',
    );
  }

  private playCrystalBurst(position: { x: number; y: number }, grand: boolean): void {
    for (let index = 0; index < (grand ? 10 : 6); index += 1) {
      const sparkle = this.add
        .text(position.x, position.y, index % 2 === 0 ? '✦' : '·', {
          color: grand ? '#fff1a8' : '#c9f7ff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: grand ? '24px' : '18px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(30);
      const count = grand ? 10 : 6;
      const angle = (Math.PI * 2 * index) / count;
      this.tweens.add({
        targets: sparkle,
        x: position.x + Math.cos(angle) * (grand ? 115 : 75),
        y: position.y + Math.sin(angle) * (grand ? 80 : 55),
        alpha: 0,
        duration: grand ? 950 : 650,
        onComplete: () => sparkle.destroy(),
      });
    }
    this.cameras.main.flash(grand ? 180 : 90, 205, 245, 255, false);
  }

  private createEnvironment(glowing: boolean): void {
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x334b69)
      .setName('crystal-grotto:room');
    this.add.ellipse(640, 470, 760, 250, 0x62cbd7, 0.6).setName('crystal-grotto:pool');
    this.add.ellipse(640, 470, 610, 170, 0xa0eced, 0.35);
    const crystalData = [
      { x: 315, y: 365, width: 78, height: 220, colour: 0x78bfe2, name: 'low-crystal' },
      { x: 650, y: 245, width: 55, height: 175, colour: 0x82e0e0, name: 'bright-crystal' },
      { x: 955, y: 390, width: 48, height: 135, colour: 0xb7a0e8, name: 'bell-crystal' },
    ] as const;
    for (const crystal of crystalData) {
      this.add
        .triangle(
          crystal.x,
          crystal.y,
          0,
          crystal.height,
          crystal.width / 2,
          0,
          crystal.width,
          crystal.height,
          crystal.colour,
          0.96,
        )
        .setOrigin(0.5, 1)
        .setStrokeStyle(3, 0xe3fbff, 0.55)
        .setName(`crystal-grotto:${crystal.name}`);
      this.add.circle(
        crystal.x,
        crystal.y - crystal.height / 2,
        glowing ? 80 : 52,
        crystal.colour,
        glowing ? 0.22 : 0.1,
      );
    }
    if (glowing) {
      const glow = this.add
        .text(640, 325, '✦   ✧   ✦   ✧   ✦', {
          color: '#fff0ad',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '34px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setName('crystal-grotto:completed-glow');
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.45, to: 1 },
        duration: 1150,
        yoyo: true,
        repeat: -1,
      });
    }
    this.add
      .ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 76, 250, 88, 0x58705f, 0.95)
      .setStrokeStyle(5, 0xcaf1dc, 0.78)
      .setName('crystal-grotto:exit');
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 76, '🌿 Crystal Brook', {
        color: '#f4fff7',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 54, '💎 Crystal Grotto', {
        color: '#f2fbff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        backgroundColor: '#263a55dc',
        padding: { x: 16, y: 7 },
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 91, 'Three crystals, three notes, one very echoey pool', {
        color: '#d8edf1',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5);
  }
}
