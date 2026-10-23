import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConstants';
import { getBrowserQuestEngine } from '../../quests/browserQuestEngine';
import { getBrowserSaveService } from '../../save/browserSaveService';
import { returnFromMiniGame } from '../MiniGameLauncher';
import { readMiniGameSession, type MiniGameSession } from '../MiniGameSession';
import { completeCrystalariumOpening } from './CrystalariumWorldOutcome';
import {
  CRYSTALARIUM_FULL_VARIANT_ID,
  CRYSTALARIUM_OPENING_VARIANT_ID,
  CRYSTAL_NOTE_PRESENTATION,
  OPENING_BOARD_COLUMNS,
  OPENING_BOARD_ROWS,
  OPENING_MELODY,
  createOpeningMelodyState,
  playOpeningMerge,
  type CrystalFamily,
  type OpeningMelodyState,
} from './CrystalariumOpeningRules';

const CELL_SIZE = 94;
const GAP = 15;
const STEP = CELL_SIZE + GAP;
const BOARD_LEFT = GAME_WIDTH / 2 - (OPENING_BOARD_COLUMNS * STEP - GAP) / 2;
const BOARD_TOP = 235;

const REJECTION_MESSAGES = {
  'already-complete': 'The melody is already complete!',
  'invalid-cell': 'Choose a crystal on the board.',
  'same-cell': 'Choose two different crystals.',
  'empty-cell': 'That socket is empty. Find two crystals.',
  'mismatched-pieces': 'These are different crystals. Match the same shape and size.',
  'wrong-note': 'Listen for the next note in the melody strip.',
} as const;

/**
 * One scene, one pure-rule engine, two launch contexts.
 * H6.9B's Just Games practice shares the opening board while H6.9C will extend
 * resonance-patterns to the deeper full Crystalarium without a second scene.
 */
export class CrystalariumActivityScene extends Phaser.Scene {
  private session: MiniGameSession | null = null;
  private state: OpeningMelodyState = createOpeningMelodyState();
  private selected: number | null = null;
  private cursor = 0;
  private body: Phaser.GameObjects.Container | null = null;
  private message = '';
  private quiet = false;
  private completedWorldUnlock = false;

  public constructor() {
    super('CrystalariumActivityScene');
  }

  public create(data: unknown): void {
    this.session = readMiniGameSession(data);
    if (
      !this.session ||
      this.session.gameId !== 'crystalarium' ||
      (this.session.variantId !== CRYSTALARIUM_OPENING_VARIANT_ID &&
        this.session.variantId !== CRYSTALARIUM_FULL_VARIANT_ID)
    ) {
      this.scene.start('TitleScene');
      return;
    }
    // The story opening is world-only; Just Games only receives isolated practice.
    if (
      this.session.variantId === CRYSTALARIUM_OPENING_VARIANT_ID &&
      this.session.source !== 'world'
    ) {
      this.returnToCaller();
      return;
    }

    this.state = createOpeningMelodyState();
    this.selected = null;
    this.cursor = 0;
    this.message = 'Choose two matching shards. Start with the deep blue hum.';
    this.quiet = false;
    this.completedWorldUnlock = false;
    this.cameras.main.setBackgroundColor('#192d4c');
    this.input.keyboard?.on('keydown', this.onKeyDown, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.onKeyDown, this);
      this.input.off('pointerup', this.onPointerUp, this);
      this.body?.destroy(true);
      this.body = null;
    });
    this.render();
  }

  private onKeyDown(event: KeyboardEvent): void {
    const row = Math.floor(this.cursor / OPENING_BOARD_COLUMNS);
    const col = this.cursor % OPENING_BOARD_COLUMNS;
    switch (event.code) {
      case 'ArrowLeft':
        this.cursor = row * OPENING_BOARD_COLUMNS + Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        this.cursor = row * OPENING_BOARD_COLUMNS + Math.min(OPENING_BOARD_COLUMNS - 1, col + 1);
        break;
      case 'ArrowUp':
        this.cursor = Math.max(0, row - 1) * OPENING_BOARD_COLUMNS + col;
        break;
      case 'ArrowDown':
        this.cursor = Math.min(OPENING_BOARD_ROWS - 1, row + 1) * OPENING_BOARD_COLUMNS + col;
        break;
      case 'Enter':
      case 'Space':
        event.preventDefault();
        this.selectCell(this.cursor);
        return;
      case 'KeyR':
        this.resetBoard();
        return;
      case 'Escape':
        this.returnToCaller();
        return;
      default:
        return;
    }
    event.preventDefault();
    this.render();
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    // Supports drag between tiles as well as tap source / tap destination.
    if (this.selected === null || this.state.complete) return;
    const target = this.indexAt(pointer.x, pointer.y);
    if (target !== null && target !== this.selected) this.selectCell(target);
  }

  private indexAt(x: number, y: number): number | null {
    const col = Math.floor((x - BOARD_LEFT + GAP / 2) / STEP);
    const row = Math.floor((y - BOARD_TOP + GAP / 2) / STEP);
    if (col < 0 || col >= OPENING_BOARD_COLUMNS || row < 0 || row >= OPENING_BOARD_ROWS)
      return null;
    const centerX = BOARD_LEFT + col * STEP + CELL_SIZE / 2;
    const centerY = BOARD_TOP + row * STEP + CELL_SIZE / 2;
    if (Math.abs(x - centerX) > CELL_SIZE / 2 || Math.abs(y - centerY) > CELL_SIZE / 2) return null;
    return row * OPENING_BOARD_COLUMNS + col;
  }

  private selectCell(index: number): void {
    if (this.state.complete) return;
    this.cursor = index;
    if (this.selected === null) {
      if (this.state.cells[index] === null) {
        this.message = 'That socket is empty. Pick a glowing shard.';
      } else {
        this.selected = index;
        this.message = 'Now choose its matching twin.';
      }
      this.render();
      return;
    }

    if (this.selected === index) {
      this.selected = null;
      this.message = 'Selection cleared. Choose your first shard.';
      this.render();
      return;
    }

    const result = playOpeningMerge(this.state, this.selected, index);
    this.selected = null;
    if (!result.accepted) {
      this.message = REJECTION_MESSAGES[result.reason];
      this.render();
      return;
    }

    this.state = result.state;
    this.playNote(result.note);
    this.message = result.state.complete
      ? 'The three crystal notes sing together!'
      : 'Beautiful! Follow the next note on the melody strip.';
    if (result.state.complete) this.finish();
    this.render();
  }

  private playNote(note: CrystalFamily): void {
    this.cameras.main.flash(120, 177, 224, 255);
    if (this.quiet) return;
    // Use the already-created Phaser audio context; no separate audio engine.
    const audio = this.sound as Phaser.Sound.WebAudioSoundManager;
    const context = audio.context;
    if (!context || context.state !== 'running') return;
    const frequencies: Record<CrystalFamily, number> = { low: 196, bright: 392, bell: 659.25 };
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = note === 'bell' ? 'sine' : 'triangle';
      oscillator.frequency.value = frequencies[note];
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.44);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      // Audio is optional: shape, glyph and melody-strip feedback remain visible.
    }
  }

  private finish(): void {
    if (
      this.session?.source === 'world' &&
      this.session.variantId === CRYSTALARIUM_OPENING_VARIANT_ID
    ) {
      this.completedWorldUnlock = completeCrystalariumOpening(
        this.session,
        getBrowserSaveService(),
        getBrowserQuestEngine(),
      );
      this.message = this.completedWorldUnlock
        ? 'The sealed Grotto doorway opens! Return to the Brook to explore it.'
        : 'The melody is complete. No story progress was changed.';
    } else {
      this.message = 'Melody mastered! You can practise again without changing your adventure.';
    }
  }

  private resetBoard(): void {
    this.state = createOpeningMelodyState();
    this.selected = null;
    this.cursor = 0;
    this.message = 'A fresh set of shards is ready. Start with the deep hum.';
    this.render();
  }

  private returnToCaller(): void {
    if (this.session) {
      returnFromMiniGame(this, this.session);
    } else {
      this.scene.start('TitleScene');
    }
  }

  private createButton(
    holder: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    label: string,
    name: string,
    callback: () => void,
  ): void {
    const backing = this.add
      .rectangle(x, y, width, 48, 0x345c86, 1)
      .setStrokeStyle(2, 0xaddaff, 0.9)
      .setName(name)
      .setInteractive({ useHandCursor: true });
    backing.on('pointerdown', callback);
    const caption = this.add
      .text(x, y, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    holder.add([backing, caption]);
  }

  private render(): void {
    this.body?.destroy(true);
    const holder = this.add.container(0, 0).setDepth(10);
    this.body = holder;
    const add = (object: Phaser.GameObjects.GameObject) => {
      holder.add(object);
      return object;
    };

    add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x192d4c));
    add(this.add.ellipse(640, 350, 1080, 680, 0x4c4f83, 0.32));
    add(this.add.rectangle(640, 360, 1050, 664, 0x283c60, 0.96).setStrokeStyle(4, 0x83c8e0));
    add(
      this.add
        .text(640, 74, '✦ CRYSTALARIUM ✦', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '38px',
          fontStyle: 'bold',
          color: '#e5f8ff',
        })
        .setOrigin(0.5),
    );
    add(
      this.add
        .text(
          640,
          112,
          this.session?.source === 'world'
            ? 'Play the melody to unlock the Grotto'
            : 'Melody practice • Your adventure is safe',
          {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
            color: '#d1edfb',
          },
        )
        .setOrigin(0.5),
    );

    const familyOrder: CrystalFamily[] = [...OPENING_MELODY];
    for (let i = 0; i < familyOrder.length; i += 1) {
      const family = familyOrder[i];
      const note = CRYSTAL_NOTE_PRESENTATION[family];
      const played = this.state.notesPlayed.length > i;
      const upcoming = this.state.notesPlayed.length === i;
      const x = 447 + 193 * i;
      const color = played ? 0x4b9c88 : upcoming ? 0x576fa4 : 0x364e70;
      add(this.add.rectangle(x, 164, 179, 55, color).setStrokeStyle(upcoming ? 3 : 1, note.colour));
      add(
        this.add
          .text(x, 164, (played ? '✓ ' : '') + note.symbol + ' ' + note.label, {
            color: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
    }

    for (let index = 0; index < this.state.cells.length; index += 1) {
      const col = index % OPENING_BOARD_COLUMNS;
      const row = Math.floor(index / OPENING_BOARD_COLUMNS);
      const x = BOARD_LEFT + col * STEP + CELL_SIZE / 2;
      const y = BOARD_TOP + row * STEP + CELL_SIZE / 2;
      const piece = this.state.cells[index];
      const selected = this.selected === index;
      const focused = this.cursor === index;
      const background = selected ? 0x547d9c : focused ? 0x385d85 : 0x203653;
      const tile = this.add
        .rectangle(x, y, CELL_SIZE, CELL_SIZE, background)
        .setStrokeStyle(
          selected ? 5 : focused ? 3 : 2,
          selected ? 0xffe2a8 : focused ? 0xc5f3ff : 0x6180a8,
        )
        .setName('crystalarium-cell:' + index)
        .setInteractive({ useHandCursor: true });
      tile.on('pointerdown', () => this.selectCell(index));
      add(tile);
      if (piece) {
        const note = CRYSTAL_NOTE_PRESENTATION[piece.family];
        add(this.add.circle(x, y, 35, note.colour, piece.tier > 0 ? 0.95 : 0.8));
        add(
          this.add
            .text(x, y - 2, note.symbol, {
              fontFamily: 'system-ui, sans-serif',
              fontSize: '38px',
              fontStyle: 'bold',
              color: '#132640',
            })
            .setOrigin(0.5),
        );
        if (piece.tier > 0) {
          add(this.add.text(x, y + 33, '✧', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5));
        }
      } else {
        add(this.add.circle(x, y, 17, 0x7298bd, 0.14).setStrokeStyle(2, 0x7594af, 0.45));
      }
    }

    add(
      this.add
        .text(640, 594, this.message, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#e8fcff',
          align: 'center',
          wordWrap: { width: 850 },
        })
        .setOrigin(0.5)
        .setName('crystalarium-feedback'),
    );
    add(
      this.add
        .text(640, 625, 'Tap or drag a pair • Arrow keys + Enter/Space • R resets • Esc exits', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#c9e5f2',
        })
        .setOrigin(0.5),
    );

    this.createButton(
      holder,
      235,
      660,
      214,
      this.session?.source === 'world' ? 'Back to Brook' : 'Back to Games',
      'crystalarium-exit',
      () => this.returnToCaller(),
    );
    this.createButton(
      holder,
      530,
      660,
      172,
      this.state.complete ? 'Play again' : 'Reset board',
      'crystalarium-reset',
      () => this.resetBoard(),
    );
    this.createButton(
      holder,
      790,
      660,
      174,
      this.quiet ? 'Sound: Off' : 'Sound: On',
      'crystalarium-audio',
      () => {
        this.quiet = !this.quiet;
        this.render();
      },
    );
    if (this.state.complete) {
      this.createButton(
        holder,
        1040,
        660,
        178,
        this.completedWorldUnlock ? 'Enter Grotto →' : 'Finish →',
        'crystalarium-finish',
        () => this.returnToCaller(),
      );
    }
  }
}
