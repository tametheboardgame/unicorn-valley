import Phaser from 'phaser';
import { getBrowserAudioSettingsStore } from '../../audio/AudioSettings';
import { getBrowserSaveService } from '../../save/browserSaveService';
import type { MiniGameSession } from '../MiniGameSession';
import {
  CRYSTAL_FAMILIES,
  FULL_CELL_COUNT,
  FULL_COLUMNS,
  FULL_ROWS,
  RESONANCE_PATTERNS,
  activeResonancePattern,
  canOfferPattern,
  chooseCrystalSource,
  createHarmony,
  moveOrMergeCrystal,
  offerResonancePattern,
  restoreCrystal,
  shelveCrystal,
  spawnCrystal,
  startFreshCrystalariumBoard,
  unlockedCrystalFamilies,
  washCrystal,
  type CrystalariumFullState,
  type FullActionResult,
} from './CrystalariumFullRules';
import { loadCrystalariumProgress, saveCrystalariumProgress } from './CrystalariumFullPersistence';
import {
  CRYSTAL_NOTE_PRESENTATION,
  CRYSTAL_TIER_NAMES,
  type CrystalFamily,
  type CrystalPiece,
} from './CrystalariumOpeningRules';

const CELL = 56;
const STEP = 62;
const LEFT = 174;
const TOP = 181;
const PANEL_X = 820;
const FONT = 'system-ui, sans-serif';

export class CrystalariumFullMode {
  private state: CrystalariumFullState;
  private holder: Phaser.GameObjects.Container | null = null;
  private cursor = 0;
  private selected: number | null = null;
  private message = 'Choose a crystal vein to grow shards, then merge matching pairs.';
  private washArmed = false;
  private resetArmed = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: MiniGameSession,
    private readonly onExit: () => void,
  ) {
    this.state = loadCrystalariumProgress(session, getBrowserSaveService());
  }

  public start(): void {
    this.scene.cameras.main.setBackgroundColor('#142944');
    this.scene.input.keyboard?.on('keydown', this.keyDown, this);
    this.scene.input.on('pointerup', this.pointerUp, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.input.keyboard?.off('keydown', this.keyDown, this);
      this.scene.input.off('pointerup', this.pointerUp, this);
      this.holder?.destroy(true);
      this.holder = null;
    });
    this.render();
  }

  private apply(result: FullActionResult): void {
    if (!result.accepted) {
      this.message = result.reason;
      this.render();
      return;
    }
    if (!saveCrystalariumProgress(this.session, result.state, getBrowserSaveService())) {
      this.message = 'Progress could not be saved. Check browser storage before continuing.';
      this.render();
      return;
    }
    const merged = result.state.merges > this.state.merges;
    const completed = result.state.completed > this.state.completed;
    this.state = result.state;
    this.message = result.message;
    this.washArmed = false;
    this.resetArmed = false;
    if (merged || completed) this.scene.cameras.main.flash(110, 160, 225, 255, false);
    this.render();
  }

  private keyDown(event: KeyboardEvent): void {
    const row = Math.floor(this.cursor / FULL_COLUMNS);
    const col = this.cursor % FULL_COLUMNS;
    switch (event.code) {
      case 'ArrowLeft':
        this.cursor = row * FULL_COLUMNS + Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        this.cursor = row * FULL_COLUMNS + Math.min(FULL_COLUMNS - 1, col + 1);
        break;
      case 'ArrowUp':
        this.cursor = Math.max(0, row - 1) * FULL_COLUMNS + col;
        break;
      case 'ArrowDown':
        this.cursor = Math.min(FULL_ROWS - 1, row + 1) * FULL_COLUMNS + col;
        break;
      case 'Enter':
      case 'Space':
        event.preventDefault();
        this.pick(this.cursor);
        return;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3': {
        const family = CRYSTAL_FAMILIES[Number(event.code.at(-1)) - 1];
        if (family) this.apply(chooseCrystalSource(this.state, family));
        return;
      }
      case 'KeyN':
        this.apply(spawnCrystal(this.state));
        return;
      case 'KeyO':
        this.apply(offerResonancePattern(this.state));
        return;
      case 'KeyS':
        this.shelveSelected();
        return;
      case 'KeyW':
        this.washSelected();
        return;
      case 'KeyH':
        this.apply(createHarmony(this.state));
        return;
      case 'Escape':
        this.onExit();
        return;
      default:
        return;
    }
    event.preventDefault();
    this.render();
  }

  private pointerUp(pointer: Phaser.Input.Pointer): void {
    // Pointer-down selects a source; lifting over another tile completes a drag.
    if (this.selected === null) return;
    const x = Math.floor((pointer.x - LEFT) / STEP);
    const y = Math.floor((pointer.y - TOP) / STEP);
    if (x < 0 || x >= FULL_COLUMNS || y < 0 || y >= FULL_ROWS) return;
    const target = y * FULL_COLUMNS + x;
    if (target !== this.selected) this.pick(target);
  }

  private pick(index: number): void {
    this.cursor = index;
    this.washArmed = false;
    this.resetArmed = false;
    if (this.selected === null) {
      if (this.state.cells[index]) {
        this.selected = index;
        this.message = 'Select a matching crystal to merge, or an empty space to move.';
      } else {
        this.message = 'Empty socket. Tap Grow shard to add a new crystal.';
      }
      this.render();
      return;
    }
    if (this.selected === index) {
      this.selected = null;
      this.message = 'Selection cleared.';
      this.render();
      return;
    }
    const result = moveOrMergeCrystal(this.state, this.selected, index);
    this.selected = null;
    this.apply(result);
  }

  private shelveSelected(): void {
    if (this.selected === null) {
      this.message = 'Select a crystal to put on the shelf.';
      this.render();
      return;
    }
    const source = this.selected;
    this.selected = null;
    this.apply(shelveCrystal(this.state, source));
  }

  private washSelected(): void {
    if (this.selected === null) {
      this.message = 'Select a crystal before using Brook Wash.';
      this.render();
      return;
    }
    if (!this.washArmed) {
      this.washArmed = true;
      this.message = 'Tap Brook Wash again to recycle the selected crystal. No cost.';
      this.render();
      return;
    }
    const source = this.selected;
    this.selected = null;
    this.apply(washCrystal(this.state, source));
  }

  private freshBoard(): void {
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.message = 'Tap Fresh board again to clear pieces. Completed chapters stay saved.';
      this.render();
      return;
    }
    this.apply({
      accepted: true,
      state: startFreshCrystalariumBoard(this.state),
      message: 'Fresh board ready. Your songbook progress is safe.',
    });
    this.selected = null;
  }

  private addText(
    holder: Phaser.GameObjects.Container,
    x: number,
    y: number,
    value: string,
    size: number,
    colour = '#effaff',
    width = 850,
  ): Phaser.GameObjects.Text {
    const text = this.scene.add.text(x, y, value, {
      fontFamily: FONT,
      fontSize: size + 'px',
      color: colour,
      wordWrap: { width },
      align: 'left',
    });
    holder.add(text);
    return text;
  }

  private button(
    holder: Phaser.GameObjects.Container,
    x: number,
    y: number,
    w: number,
    label: string,
    name: string,
    action: () => void,
    active = true,
  ): void {
    const back = this.scene.add
      .rectangle(x + w / 2, y + 22, w, 44, active ? 0x335c87 : 0x2a3a54)
      .setStrokeStyle(2, active ? 0x9adbea : 0x62788d)
      .setName(name)
      .setInteractive({ useHandCursor: active });
    back.on('pointerdown', action);
    holder.add(back);
    this.addText(
      holder,
      x + w / 2,
      y + 22,
      label,
      15,
      active ? '#ffffff' : '#a5b4c4',
      w - 12,
    ).setOrigin(0.5);
  }

  private pieceGlyph(piece: CrystalPiece): string {
    return CRYSTAL_NOTE_PRESENTATION[piece.family].symbol;
  }

  private render(): void {
    this.holder?.destroy(true);
    const holder = this.scene.add.container(0, 0).setDepth(20);
    this.holder = holder;
    holder.add(this.scene.add.rectangle(640, 360, 1280, 720, 0x142944));
    holder.add(
      this.scene.add.rectangle(640, 358, 1194, 694, 0x243f63, 0.98).setStrokeStyle(3, 0x82badc),
    );
    this.addText(holder, 93, 32, '✦ CRYSTALARIUM • RESONANCE GARDEN ✦', 30, '#e1f7ff');
    const savedLabel =
      this.session.source === 'just-games'
        ? 'Just Games: separate saved songbook'
        : 'Crystal Brook: adventure songbook';
    this.addText(holder, 94, 75, savedLabel, 16, '#bce8e5');
    const chapter = activeResonancePattern(this.state);
    this.addText(
      holder,
      94,
      124,
      chapter
        ? 'Merge crystals to fulfil the next Resonance Pattern'
        : 'The Symphony is complete! Keep creating your favourite crystals.',
      17,
    );
    holder.add(
      this.scene.add.rectangle(390, 359, 464, 388, 0x172d4d, 1).setStrokeStyle(3, 0x6da8c9),
    );
    for (let i = 0; i < FULL_CELL_COUNT; i += 1) {
      const piece = this.state.cells[i];
      const x = LEFT + (i % FULL_COLUMNS) * STEP + CELL / 2;
      const y = TOP + Math.floor(i / FULL_COLUMNS) * STEP + CELL / 2;
      const focused = this.cursor === i;
      const selected = this.selected === i;
      const bg = selected ? 0x547da0 : focused ? 0x395b86 : 0x233c5c;
      const cell = this.scene.add
        .rectangle(x, y, CELL, CELL, bg)
        .setStrokeStyle(
          selected ? 4 : focused ? 3 : 1,
          selected ? 0xffe5a0 : focused ? 0xcdf3ff : 0x54718d,
        )
        .setName('crystalarium-full-cell:' + i)
        .setInteractive({ useHandCursor: true });
      cell.on('pointerdown', () => this.pick(i));
      holder.add(cell);
      if (piece) {
        const colour = CRYSTAL_NOTE_PRESENTATION[piece.family].colour;
        holder.add(
          this.scene.add
            .circle(x, y - 4, 19 + Math.min(piece.tier, 3), colour, 0.98)
            .setStrokeStyle(piece.tier > 2 ? 3 : 1, 0xffffff, 0.8),
        );
        this.addText(holder, x, y - 9, this.pieceGlyph(piece), 24, '#152640', 50).setOrigin(0.5);
        this.addText(holder, x, y + 18, String(piece.tier + 1), 13, '#ffffff', 50)
          .setOrigin(0.5)
          .setName('crystalarium-tier:' + i);
      }
    }
    this.addText(
      holder,
      173,
      579,
      'Tap two matching crystals to merge • arrows + Enter to select',
      15,
      '#d1e7f5',
      490,
    );
    this.button(holder, 160, 624, 162, '← Leave & save', 'crystalarium-full-exit', this.onExit);
    this.button(holder, 330, 624, 144, 'Shelf selected', 'crystalarium-full-shelve', () =>
      this.shelveSelected(),
    );
    this.button(
      holder,
      481,
      624,
      151,
      this.washArmed ? 'Confirm wash' : 'Brook Wash',
      'crystalarium-full-wash',
      () => this.washSelected(),
    );

    holder.add(
      this.scene.add.rectangle(921, 371, 482, 478, 0x192f4e, 0.95).setStrokeStyle(2, 0x678bab),
    );
    const pattern = activeResonancePattern(this.state);
    this.addText(
      holder,
      698,
      146,
      'RESONANCE PATTERN  ' + this.state.completed + ' / ' + RESONANCE_PATTERNS.length,
      18,
      '#a8e9f5',
      440,
    );
    this.addText(
      holder,
      698,
      175,
      pattern ? pattern.chapter : 'Great Harmonic Garden',
      16,
      '#e8cffe',
      440,
    );
    this.addText(
      holder,
      698,
      202,
      pattern ? pattern.title : 'All chapters restored',
      24,
      '#ffffff',
      440,
    );
    const goals = pattern
      ? pattern.goals.map(
          (goal) =>
            CRYSTAL_NOTE_PRESENTATION[goal.family].symbol +
            ' ' +
            CRYSTAL_TIER_NAMES[goal.tier] +
            ' ×' +
            goal.quantity,
        )
      : [];
    if (pattern?.harmonies) goals.push('♫ Harmony ×' + pattern.harmonies);
    this.addText(
      holder,
      698,
      244,
      goals.join('   •   ') || 'Experiment freely!',
      16,
      '#f1faff',
      427,
    );
    this.button(
      holder,
      700,
      301,
      196,
      canOfferPattern(this.state) ? 'Offer pattern ✓' : 'Offer pattern',
      'crystalarium-full-offer',
      () => this.apply(offerResonancePattern(this.state)),
    );
    this.button(holder, 905, 301, 202, 'Craft harmony ♫', 'crystalarium-full-harmony', () =>
      this.apply(createHarmony(this.state)),
    );

    this.addText(holder, 701, 372, 'CRYSTAL VEINS', 16, '#a8e9f5');
    CRYSTAL_FAMILIES.forEach((family: CrystalFamily, index) => {
      const note = CRYSTAL_NOTE_PRESENTATION[family];
      const unlocked = unlockedCrystalFamilies(this.state).includes(family);
      this.button(
        holder,
        697 + index * 143,
        402,
        135,
        unlocked ? note.symbol + ' ' + note.label.split(' ')[0] : 'Locked',
        'crystalarium-source:' + family,
        () => this.apply(chooseCrystalSource(this.state, family)),
        unlocked,
      );
    });
    this.button(
      holder,
      699,
      458,
      203,
      'Grow ' + this.state.selectedFamily + ' shard',
      'crystalarium-full-grow',
      () => this.apply(spawnCrystal(this.state)),
    );
    this.button(
      holder,
      910,
      458,
      193,
      this.resetArmed ? 'Confirm reset' : 'Fresh board',
      'crystalarium-full-fresh',
      () => this.freshBoard(),
    );
    this.addText(
      holder,
      702,
      513,
      'SHELF (tap to return)   •   Harmony tokens: ' + this.state.harmonies,
      15,
      '#cbe9f2',
      410,
    );
    for (let i = 0; i < 4; i += 1) {
      const piece = this.state.shelf[i];
      const label = piece ? this.pieceGlyph(piece) + ' ' + (piece.tier + 1) : 'Empty';
      this.button(holder, 698 + 105 * i, 545, 99, label, 'crystalarium-full-shelf:' + i, () =>
        this.apply(restoreCrystal(this.state, i)),
      );
    }
    this.addText(holder, 692, 610, this.message, 15, '#fbe8ba', 450);
    this.addText(
      holder,
      691,
      666,
      'N grow • 1–3 veins • O offer • H harmony • S shelf • W wash • Esc exit',
      13,
      '#bfd6ec',
      465,
    );
  }
}
