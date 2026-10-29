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
  growCrystalFromWell,
  moveOrMergeCrystal,
  offerResonancePattern,
  polishCrystal,
  restoreCrystal,
  restoreCrystalToCell,
  refinedSourceTier,
  spawnRefinedCrystal,
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
  CrystalariumPortraitView,
  type CrystalariumPortraitActions,
  type CrystalariumPortraitPresentation,
} from './CrystalariumPortraitView';
import { CrystalariumIllustratedView } from './CrystalariumIllustratedView';
import { paintCrystalArt } from './CrystalariumCrystalArt';
import { CrystalariumGuide } from './CrystalariumGuide';
import type { FirstLessonCommand } from './CrystalariumTutorialPolicy';
import { combineCrystalPieces, type CrystalPiece } from './CrystalariumOpeningRules';
import {
  CRYSTAL_NOTE_PRESENTATION,
  CRYSTAL_TIER_NAMES,
  type CrystalFamily,
} from './CrystalariumOpeningRules';

const CELL = 56;
const STEP = 62;
const LEFT = 174;
const TOP = 181;
const FONT = 'system-ui, sans-serif';

export class CrystalariumFullMode {
  private state: CrystalariumFullState;
  private readonly guide: CrystalariumGuide;
  private holder: Phaser.GameObjects.Container | null = null;
  private portrait: CrystalariumPortraitView | null = null;
  private illustrated: CrystalariumIllustratedView | null = null;
  private portraitQuery: MediaQueryList | null = null;
  private leaving = false;
  private dragSource: number | null = null;
  private dragSourceKind: 'cell' | 'shelf' | null = null;
  private dragStart: { x: number; y: number } | null = null;
  private dragGhost: Phaser.GameObjects.Graphics | null = null;
  private dragTargets: Phaser.GameObjects.Graphics | null = null;
  private cursor = 0;
  private selected: number | null = null;
  private message = 'Choose a crystal vein to grow shards, then merge matching pairs.';
  private celebration: 'merge' | 'offer' | 'harmony' | null = null;
  private washArmed = false;
  private resetArmed = false;
  private quiet = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: MiniGameSession,
    private readonly onExit: () => void,
  ) {
    this.state = loadCrystalariumProgress(session, getBrowserSaveService());
    this.guide = new CrystalariumGuide(session.source, this.state);
  }

  public start(): void {
    this.scene.cameras.main.setBackgroundColor('#142944');
    const actions: CrystalariumPortraitActions = {
      cell: (index) => this.pick(index),
      dragMove: (source, target) => {
        if (this.guide.getPrompt()?.lessonStep === 'pick-up') {
          if (!this.permitted({ kind: 'pick', index: source })) return;
          this.guide.picked(source);
        }
        if (!this.permitted({ kind: 'merge', source, target })) return;
        this.selected = null;
        this.apply(moveOrMergeCrystal(this.state, source, target));
      },
      dragShelve: (source) => {
        if (!this.permitted({ kind: 'other' })) return;
        this.selected = null;
        this.apply(shelveCrystal(this.state, source));
      },
      dragWash: (source) => {
        if (!this.permitted({ kind: 'other' })) return;
        this.selected = source;
        this.washSelected();
      },
      dragRestore: (slot, target) =>
        this.run({ kind: 'other' }, () => restoreCrystalToCell(this.state, slot, target)),
      dragInvalid: () => {
        this.message = 'Try an empty socket, a matching crystal, the shelf or Brook Wash.';
        this.render();
      },
      source: (family) =>
        this.run({ kind: 'other' }, () => chooseCrystalSource(this.state, family)),
      growFromWell: (family) => this.growFromWell(family),
      grow: () => this.run({ kind: 'grow' }, () => spawnCrystal(this.state)),
      growRefined: () => this.run({ kind: 'other' }, () => spawnRefinedCrystal(this.state)),
      offer: () => this.run({ kind: 'offer' }, () => offerResonancePattern(this.state)),
      inspectGoal: () => this.inspectGoal(),
      harmony: () => this.run({ kind: 'other' }, () => createHarmony(this.state)),
      polish: () => this.polishSelected(),
      shelve: () => this.shelveSelected(),
      wash: () => this.washSelected(),
      fresh: () => this.freshBoard(),
      restore: (index) => this.run({ kind: 'other' }, () => restoreCrystal(this.state, index)),
      sound: () => {
        this.quiet = !this.quiet;
        this.render();
      },
      guide: () => this.toggleGuide(),
      skipGuide: () => {
        this.guide.skip();
        this.render();
      },
      exit: () => this.leave(),
    };
    this.portrait = new CrystalariumPortraitView(actions);
    // This is real gameplay using the existing controller, save store and guide.
    // During C17 integration it is opt-in until the C18/C19/C20 gates pass.
    if (CrystalariumIllustratedView.enabled()) {
      this.illustrated = new CrystalariumIllustratedView(actions);
    }
    // Keep native controls independently interactive on portrait phones.
    // Never disable the Phaser scene-wide input subsystem; browser diagnostics,
    // canvas launch/return and orientation changes share that lifecycle.
    this.portraitQuery =
      globalThis.matchMedia?.(
        '(pointer: coarse) and (max-width: 700px) and (orientation: portrait)',
      ) ?? null;
    this.portraitQuery?.addEventListener('change', this.syncPortraitInput);
    this.scene.input.keyboard?.on('keydown', this.keyDown, this);
    this.scene.input.on('pointerup', this.pointerUp, this);
    this.scene.input.on('pointermove', this.pointerMove, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.portraitQuery?.removeEventListener('change', this.syncPortraitInput);
      this.portraitQuery = null;
      this.scene.input.keyboard?.off('keydown', this.keyDown, this);
      this.scene.input.off('pointerup', this.pointerUp, this);
      this.scene.input.off('pointermove', this.pointerMove, this);
      this.clearDrag();
      this.holder?.destroy(true);
      this.holder = null;
      this.portrait?.destroy();
      this.portrait = null;
      this.illustrated?.destroy();
      this.illustrated = null;
    });
    this.render();
  }

  private readonly syncPortraitInput = (): void => {
    this.render();
  };

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    // Hide the native touch surface before returning to the paused caller.
    // Late pointer events from the same touch must not activate the next scene.
    this.portrait?.destroy();
    this.portrait = null;
    this.illustrated?.destroy();
    this.illustrated = null;
    this.onExit();
  }

  private playResonanceTone(family: CrystalFamily): void {
    const settings = getBrowserAudioSettingsStore().load();
    const volume = 0.065 * settings.masterVolume * settings.sfxVolume;
    if (this.quiet || settings.muted || !settings.sfxEnabled || volume <= 0.0001) return;
    const audio = this.scene.sound as Phaser.Sound.WebAudioSoundManager;
    const context = audio.context;
    if (!context || context.state !== 'running') return;
    const frequencies: Record<CrystalFamily, number> = {
      low: 196,
      bright: 392,
      bell: 659.25,
    };
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = family === 'bell' ? 'sine' : 'triangle';
      oscillator.frequency.value = frequencies[family];
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.36);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      // Crystals retain visible glyphs, tier changes and status feedback when muted.
    }
  }

  /** Rejected lesson actions never touch rules, counters or saves. */
  private permitted(action: FirstLessonCommand): boolean {
    if (this.guide.allows(action)) return true;
    this.message = 'Follow the glowing tutorial action, or Skip guide.';
    this.render();
    return false;
  }

  private run(action: FirstLessonCommand, execute: () => FullActionResult): void {
    if (this.permitted(action)) this.apply(execute());
  }

  /** The physical well grows once, with one atomic source-and-spawn save. */
  private growFromWell(family: CrystalFamily): void {
    this.run({ kind: 'other' }, () => growCrystalFromWell(this.state, family));
  }

  private inspectGoal(): void {
    if (!this.permitted({ kind: 'inspect' })) return;
    this.guide.inspected(this.state);
    this.message = 'The crystal matches the picture. Offer it now!';
    this.render();
  }

  private apply(result: FullActionResult, note?: CrystalFamily): void {
    if (!result.accepted) {
      this.celebration = null;
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
    const craftedHarmony = result.state.harmonies > this.state.harmonies;
    this.guide.observe(this.state, result.state);
    this.state = result.state;
    this.message = result.message;
    this.celebration = completed ? 'offer' : craftedHarmony ? 'harmony' : merged ? 'merge' : null;
    this.washArmed = false;
    this.resetArmed = false;
    if (merged || completed || craftedHarmony) {
      this.scene.cameras.main.flash(110, 160, 225, 255, false);
      this.playResonanceTone(note ?? (completed ? 'bell' : 'bright'));
    }
    this.render();
  }

  private keyDown(event: KeyboardEvent): void {
    // Native portrait controls handle their own Enter/Space activation.
    if (event.target instanceof HTMLElement && event.target.closest('.crystalarium-portrait')) {
      if (event.code === 'Escape') this.leave();
      return;
    }
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
        if (family) this.run({ kind: 'other' }, () => chooseCrystalSource(this.state, family));
        return;
      }
      case 'F1':
        event.preventDefault();
        this.toggleGuide();
        return;
      case 'KeyI':
        this.inspectGoal();
        return;
      case 'KeyN':
        this.run({ kind: 'grow' }, () => spawnCrystal(this.state));
        return;
      case 'KeyO':
        this.run({ kind: 'offer' }, () => offerResonancePattern(this.state));
        return;
      case 'KeyS':
        this.shelveSelected();
        return;
      case 'KeyW':
        this.washSelected();
        return;
      case 'KeyH':
        this.run({ kind: 'other' }, () => createHarmony(this.state));
        return;
      case 'KeyP':
        this.polishSelected();
        return;
      case 'Escape':
        this.leave();
        return;
      default:
        return;
    }
    event.preventDefault();
    this.render();
  }

  private toggleGuide(): void {
    if (this.guide.getPrompt()) this.guide.skip();
    else this.guide.replay(this.state);
    this.render();
  }

  private clearDrag(): void {
    this.dragSourceKind = null;
    this.dragSource = null;
    this.dragStart = null;
    this.dragGhost?.destroy();
    this.dragGhost = null;
    this.dragTargets?.destroy();
    this.dragTargets = null;
  }

  /** Non-interactive drop hints use the same rules as touch: nothing is changed or saved here. */
  private drawDropCues(piece: CrystalPiece, pointerX: number, pointerY: number): void {
    const graphics = this.dragTargets;
    if (!graphics || this.dragSourceKind === null) return;
    graphics.clear();
    for (let index = 0; index < FULL_CELL_COUNT; index += 1) {
      const cell = this.state.cells[index];
      const isOrigin = this.dragSourceKind === 'cell' && index === this.dragSource;
      const valid =
        !isOrigin &&
        (!cell || (this.dragSourceKind === 'cell' && combineCrystalPieces(piece, cell) !== null));
      const x = LEFT + (index % FULL_COLUMNS) * STEP;
      const y = TOP + Math.floor(index / FULL_COLUMNS) * STEP;
      const hovered =
        pointerX >= x && pointerX <= x + CELL && pointerY >= y && pointerY <= y + CELL;
      if (!valid && !hovered) continue;
      graphics.lineStyle(
        hovered ? 4 : 2,
        isOrigin ? 0x9fc5e7 : valid ? (hovered ? 0xffefad : 0xa6eed7) : 0xf5afa8,
        hovered ? 1 : 0.75,
      );
      graphics.strokeRoundedRect(x + 2, y + 2, CELL - 4, CELL - 4, 10);
    }

    if (this.dragSourceKind !== 'cell') return;
    const shelfAvailable = this.state.shelf.some((slot) => slot === null);
    const shelfHovered = pointerX >= 690 && pointerX <= 1120 && pointerY >= 586 && pointerY <= 630;
    if (shelfAvailable || shelfHovered) {
      graphics.lineStyle(
        shelfHovered ? 4 : 2,
        shelfAvailable ? (shelfHovered ? 0xffefad : 0xa6eed7) : 0xf5afa8,
        0.95,
      );
      graphics.strokeRoundedRect(690, 586, 430, 44, 12);
    }
    const washHovered = pointerX >= 480 && pointerX <= 635 && pointerY >= 620 && pointerY <= 674;
    graphics.lineStyle(washHovered ? 4 : 2, washHovered ? 0xffefad : 0xa6eed7, 0.95);
    graphics.strokeRoundedRect(480, 620, 155, 54, 12);
  }

  private pointerMove(pointer: Phaser.Input.Pointer): void {
    if (
      this.dragSource === null ||
      !this.dragStart ||
      (this.dragSourceKind === 'cell' && this.selected !== this.dragSource)
    ) {
      return;
    }
    const dx = pointer.x - this.dragStart.x;
    const dy = pointer.y - this.dragStart.y;
    if (!this.dragGhost && Math.hypot(dx, dy) < 10) return;
    const piece =
      this.dragSourceKind === 'shelf'
        ? this.state.shelf[this.dragSource]
        : this.state.cells[this.dragSource];
    if (!piece) {
      this.clearDrag();
      return;
    }
    if (!this.dragGhost) {
      this.dragGhost = this.scene.add.graphics().setDepth(400);
      this.dragTargets = this.scene.add
        .graphics()
        .setName('crystalarium-full-drop-cues')
        .setDepth(390);
    }
    this.drawDropCues(piece, pointer.x, pointer.y);
    this.dragGhost.clear();
    paintCrystalArt(this.dragGhost, piece, pointer.x, pointer.y - 16, 0.92);
  }

  private pointerUp(pointer: Phaser.Input.Pointer): void {
    const wasDragging = this.dragGhost !== null;
    const source = this.dragSource;
    const kind = this.dragSourceKind;
    this.clearDrag();
    const x = Math.floor((pointer.x - LEFT) / STEP);
    const y = Math.floor((pointer.y - TOP) / STEP);
    if (kind === 'shelf' && source !== null) {
      if (wasDragging && x >= 0 && x < FULL_COLUMNS && y >= 0 && y < FULL_ROWS) {
        this.run({ kind: 'other' }, () =>
          restoreCrystalToCell(this.state, source, y * FULL_COLUMNS + x),
        );
      } else if (!wasDragging) {
        this.run({ kind: 'other' }, () => restoreCrystal(this.state, source));
      } else {
        this.message = 'Crystal returned safely to its shelf.';
        this.render();
      }
      return;
    }
    if (this.selected === null) return;
    if (x >= 0 && x < FULL_COLUMNS && y >= 0 && y < FULL_ROWS) {
      const target = y * FULL_COLUMNS + x;
      if (target !== this.selected) this.pick(target);
      else if (wasDragging) {
        this.selected = null;
        this.message = 'Crystal returned to its socket.';
        this.render();
      }
      return;
    }
    if (!wasDragging || source === null) return;
    // The desktop shelf and Brook Wash are physical drop destinations too.
    if (pointer.x >= 690 && pointer.x <= 1120 && pointer.y >= 586 && pointer.y <= 630) {
      this.shelveSelected();
    } else if (pointer.x >= 480 && pointer.x <= 635 && pointer.y >= 620 && pointer.y <= 674) {
      this.washSelected();
    } else {
      this.selected = null;
      this.message = 'Crystal returned safely. Try a matching shard or empty socket.';
      this.render();
    }
  }

  private pick(index: number): void {
    if (this.selected !== null && this.selected !== index) {
      if (!this.permitted({ kind: 'merge', source: this.selected, target: index })) return;
    } else if (this.selected === null) {
      if (!this.permitted({ kind: 'pick', index })) return;
    }
    this.cursor = index;
    this.washArmed = false;
    this.resetArmed = false;
    if (this.selected === null) {
      if (this.state.cells[index]) {
        this.selected = index;
        this.guide.picked(index);
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
    const note = this.state.cells[this.selected]?.family;
    const result = moveOrMergeCrystal(this.state, this.selected, index);
    this.selected = null;
    this.apply(result, note);
  }

  private shelveSelected(): void {
    if (!this.permitted({ kind: 'other' })) return;
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
    if (!this.permitted({ kind: 'other' })) return;
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

  private polishSelected(): void {
    if (!this.permitted({ kind: 'other' })) return;
    if (this.selected === null) {
      this.message = 'Select a crystal before using the polishing basin.';
      this.render();
      return;
    }
    const result = polishCrystal(this.state, this.selected);
    if (result.accepted) this.selected = null;
    this.apply(result);
  }

  private freshBoard(): void {
    if (!this.permitted({ kind: 'other' })) return;
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.message = 'Tap Fresh board again to clear pieces. Completed chapters stay saved.';
      this.render();
      return;
    }
    this.selected = null;
    this.apply({
      accepted: true,
      state: startFreshCrystalariumBoard(this.state),
      message: 'Fresh board ready. Your songbook progress is safe.',
    });
  }

  /** Soft-edged faceted work surfaces replace the prototype's hard rectangles. */
  private plate(
    holder: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: number,
    stroke: number,
  ): void {
    const graphic = this.scene.add.graphics();
    graphic.fillStyle(fill, 0.98);
    graphic.fillRoundedRect(x, y, width, height, radius);
    graphic.lineStyle(2, stroke, 0.92);
    graphic.strokeRoundedRect(x, y, width, height, radius);
    holder.add(graphic);
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
  ): Phaser.GameObjects.Rectangle {
    const lesson = this.guide.getPrompt()?.lessonStep;
    const shellAction = [
      'crystalarium-full-guide',
      'crystalarium-full-sound',
      'crystalarium-full-exit',
    ].includes(name);
    const allowed =
      !lesson ||
      shellAction ||
      (lesson === 'grow' && name === 'crystalarium-full-grow') ||
      (lesson === 'offer' && name === 'crystalarium-full-offer');
    const enabled = active && allowed;
    const spotlight = Boolean(lesson && enabled && !shellAction);
    const back = this.scene.add
      .rectangle(x + w / 2, y + 22, w, 44, enabled ? 0x335c87 : 0x2a3a54)
      .setStrokeStyle(spotlight ? 4 : 2, spotlight ? 0xffe5a0 : enabled ? 0x9adbea : 0x62788d)
      .setName(name)
      .setInteractive({ useHandCursor: enabled });
    // Retain named objects for diagnostics; disabled tutorial controls cannot fire.
    back.on('pointerdown', () => {
      if (enabled) action();
    });
    holder.add(back);
    this.addText(
      holder,
      x + w / 2,
      y + 22,
      label,
      15,
      enabled ? '#ffffff' : '#a5b4c4',
      w - 12,
    ).setOrigin(0.5);
    return back;
  }

  private render(): void {
    const presentation: CrystalariumPortraitPresentation = {
      state: this.state,
      selected: this.selected,
      message: this.message,
      quiet: this.quiet,
      globallyMuted: getBrowserAudioSettingsStore().load().muted,
      washArmed: this.washArmed,
      resetArmed: this.resetArmed,
      source: this.session.source,
      guide: this.guide.getPrompt(),
      celebration: this.celebration,
    };
    if (this.portraitQuery?.matches) this.portrait?.render(presentation);
    this.illustrated?.render(presentation);
    this.celebration = null;
    this.holder?.destroy(true);
    const holder = this.scene.add.container(0, 0).setDepth(20);
    this.holder = holder;
    holder.add(this.scene.add.rectangle(640, 360, 1280, 720, 0x142944));
    this.plate(holder, 43, 11, 1194, 694, 28, 0x243f63, 0x82badc);
    this.addText(holder, 93, 32, '✦ CRYSTALARIUM • RESONANCE GARDEN ✦', 30, '#e1f7ff');
    const savedLabel =
      this.session.source === 'just-games'
        ? 'Just Games: separate saved songbook'
        : 'Crystal Brook: adventure songbook';
    this.addText(holder, 94, 75, savedLabel, 16, '#bce8e5');
    this.button(
      holder,
      804,
      53,
      170,
      this.guide.getPrompt() ? 'Skip guide' : 'Show help',
      'crystalarium-full-guide',
      () => this.toggleGuide(),
    );
    const audioSettings = getBrowserAudioSettingsStore().load();
    this.button(
      holder,
      985,
      53,
      162,
      this.quiet ? 'Sound: Off' : audioSettings.muted ? 'Sound: Muted' : 'Sound: On',
      'crystalarium-full-sound',
      () => {
        this.quiet = !this.quiet;
        this.render();
      },
    );
    const chapter = activeResonancePattern(this.state);
    this.addText(
      holder,
      94,
      124,
      this.guide.getPrompt()?.instruction ??
        (chapter
          ? 'Drag matching crystals onto each other, then offer the pictured formation.'
          : 'The Symphony is complete! Keep creating your favourite crystals.'),
      15,
      '#effaff',
      520,
    );
    this.plate(holder, 158, 165, 464, 388, 20, 0x172d4d, 0x6da8c9);
    // One batched graphics object keeps the 42 socket outlines cheap to redraw.
    const sockets = this.scene.add.graphics();
    holder.add(sockets);
    for (let i = 0; i < FULL_CELL_COUNT; i += 1) {
      const piece = this.state.cells[i];
      const x = LEFT + (i % FULL_COLUMNS) * STEP + CELL / 2;
      const y = TOP + Math.floor(i / FULL_COLUMNS) * STEP + CELL / 2;
      const focused = this.cursor === i;
      const selected = this.selected === i;
      const bg = selected ? 0x547da0 : focused ? 0x395b86 : 0x233c5c;
      const guidePrompt = this.guide.getPrompt();
      const highlighted =
        (guidePrompt?.lessonStep === 'pick-up' && i === guidePrompt.sourceIndex) ||
        (guidePrompt?.lessonStep === 'merge' && i === guidePrompt.targetIndex);
      const rim = highlighted ? 0xffe5a0 : selected ? 0xffe5a0 : focused ? 0xcdf3ff : 0x54718d;
      sockets.fillStyle(0x0c233d, 0.66);
      sockets.fillRoundedRect(x - CELL / 2 + 2, y - CELL / 2 + 4, CELL, CELL, 12);
      sockets.fillStyle(bg, 0.98);
      sockets.fillRoundedRect(x - CELL / 2, y - CELL / 2, CELL, CELL, 11);
      sockets.lineStyle(highlighted || selected ? 4 : focused ? 3 : 2, rim, 0.93);
      sockets.strokeRoundedRect(x - CELL / 2, y - CELL / 2, CELL, CELL, 11);
      // Keep the original stable Phaser object and interactive hit rectangle for
      // keyboard, browser diagnostics, pointer drag and existing play tests.
      const cell = this.scene.add
        .rectangle(x, y, CELL, CELL, 0x000000, 0.001)
        .setName('crystalarium-full-cell:' + i)
        .setInteractive({ useHandCursor: true });
      cell.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (this.selected === null && this.state.cells[i]) {
          this.dragSource = i;
          this.dragSourceKind = 'cell';
          this.dragStart = { x: pointer.x, y: pointer.y };
        }
        this.pick(i);
      });
      holder.add(cell);
      if (piece) {
        const illustration = this.scene.add.graphics();
        paintCrystalArt(illustration, piece, x, y, 0.63);
        holder.add(illustration);
      }
    }
    this.addText(
      holder,
      173,
      579,
      this.guide.getPrompt()?.title ??
        'Drag matching crystals to merge • tap or arrows + Enter also work',
      15,
      '#d1e7f5',
      490,
    );
    this.button(holder, 160, 624, 162, '← Leave & save', 'crystalarium-full-exit', () =>
      this.leave(),
    );
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

    // C12B: distinct resonance altar, crystal nursery and tool/safe-shelf surfaces.
    // The canonical rule determines readiness; neither text nor selected cells do.
    const ready = canOfferPattern(this.state);
    if (ready) {
      const aura = this.scene.add.graphics();
      aura.fillStyle(0xffe5a0, 0.12);
      aura.fillRoundedRect(674, 126, 494, 235, 24);
      holder.add(aura);
    }
    this.plate(holder, 680, 132, 482, 223, 22, 0x2b365d, ready ? 0xffe5a0 : 0x9daddb);
    this.plate(holder, 680, 363, 482, 143, 20, 0x1e4059, 0x8acdd1);
    this.plate(holder, 680, 515, 482, 141, 20, 0x252f55, 0xa995d2);
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
      196,
      pattern ? pattern.title : 'All chapters restored',
      24,
      '#ffffff',
      440,
    );
    if (pattern) {
      pattern.goals.forEach((goal, index) => {
        const x = 742 + index * 138;
        const y = 271;
        this.plate(holder, x - 56, y - 45, 112, 76, 15, 0x2e5276, 0x93d0e9);
        const illustration = this.scene.add.graphics();
        paintCrystalArt(illustration, { family: goal.family, tier: goal.tier }, x, y - 17, 0.69);
        holder.add(illustration);
        const owned = [...this.state.cells, ...this.state.shelf].filter(
          (piece) => piece?.family === goal.family && piece.tier === goal.tier,
        ).length;
        this.addText(
          holder,
          x,
          y + 17,
          owned + ' / ' + goal.quantity,
          15,
          '#fff1bc',
          100,
        ).setOrigin(0.5);
      });
      if (this.guide.getPrompt()?.lessonStep === 'inspect') {
        const inspect = this.scene.add
          .rectangle(742, 271, 108, 76, 0xffe5a0, 0.1)
          .setStrokeStyle(4, 0xffe5a0)
          .setName('crystalarium-full-inspect')
          .setInteractive({ useHandCursor: true });
        inspect.on('pointerdown', () => this.inspectGoal());
        holder.add(inspect);
      }
      if (pattern.harmonies) {
        this.addText(
          holder,
          853,
          312,
          '♫ Harmony ' + this.state.harmonies + '/' + pattern.harmonies,
          14,
          '#f7e6ff',
          140,
        );
      }
    } else {
      this.addText(holder, 700, 248, 'Experiment freely!', 19, '#fff3cb', 425);
    }
    this.button(
      holder,
      698,
      303,
      pattern?.harmonies ? 147 : 444,
      ready ? '✦ Offer pattern ✓' : 'Offer pattern',
      'crystalarium-full-offer',
      () => this.run({ kind: 'offer' }, () => offerResonancePattern(this.state)),
      ready,
    );
    if (ready && pattern?.harmonies) {
      this.addText(holder, 1081, 309, '✦ READY', 14, '#ffe6a5', 72);
    }
    // Three permanent rooted wells are physically attached to the board
    // frame but not members of the 7x6 CrystalPiece grid. No save migration.
    const branch = this.scene.add.graphics();
    branch.lineStyle(3, 0xa4d9df, 0.9);
    branch.beginPath();
    branch.moveTo(621, 208);
    branch.lineTo(625, 208);
    branch.lineTo(625, 477);
    branch.strokePath();
    holder.add(branch);
    CRYSTAL_FAMILIES.forEach((family, index) => {
      const unlocked = unlockedCrystalFamilies(this.state).includes(family);
      const note = CRYSTAL_NOTE_PRESENTATION[family];
      const button = this.button(
        holder,
        627,
        210 + index * 108,
        49,
        unlocked ? note.symbol : '🔒',
        'crystalarium-full-producer:' + family,
        () => this.growFromWell(family),
      );
      button.setStrokeStyle(
        3,
        this.state.selectedFamily === family ? 0xffe5a0 : unlocked ? 0x9adbea : 0x878cae,
      );
      this.addText(
        holder,
        651,
        257 + index * 108,
        unlocked ? family : 'locked',
        11,
        '#ccebf1',
        65,
      ).setOrigin(0.5);
    });
    this.addText(holder, 699, 369, '✦ CRYSTAL GROWING', 17, '#b6f5df', 442);
    this.addText(
      holder,
      700,
      390,
      'Crystal veins • ' + this.state.selectedFamily + ' selected',
      16,
      '#a8e9f5',
    );
    this.addText(
      holder,
      698,
      412,
      'Tap a well on the board frame to grow a free shard, or use Grow below.',
      13,
      '#c3e9df',
      447,
    );
    const refinedTier = refinedSourceTier(this.state);
    if (refinedTier === null) {
      this.button(
        holder,
        699,
        455,
        203,
        'Grow ' + this.state.selectedFamily + ' shard',
        'crystalarium-full-grow',
        () => this.run({ kind: 'grow' }, () => spawnCrystal(this.state)),
      );
      // Fresh Board belongs to Tools below, not the growing bed.
    } else {
      this.button(holder, 698, 455, 133, 'Grow shard', 'crystalarium-full-grow', () =>
        this.run({ kind: 'grow' }, () => spawnCrystal(this.state)),
      );
      this.button(
        holder,
        836,
        455,
        133,
        refinedTier === 2 ? 'Grow crystal' : 'Grow polished',
        'crystalarium-full-grow-refined',
        () => this.run({ kind: 'other' }, () => spawnRefinedCrystal(this.state)),
      );
      // Tools always hold the same Fresh Board control.
    }
    this.addText(holder, 699, 523, '✧ CRYSTAL TOOLS • Safe shelf', 16, '#e1d1ff', 440);
    this.button(holder, 699, 546, 141, 'Harmony ♫', 'crystalarium-full-harmony', () =>
      this.run({ kind: 'other' }, () => createHarmony(this.state)),
    );
    this.button(holder, 846, 546, 141, 'Polish ✧', 'crystalarium-full-polish', () =>
      this.polishSelected(),
    );
    this.button(
      holder,
      994,
      546,
      149,
      this.resetArmed ? 'Confirm reset' : 'Fresh board',
      'crystalarium-full-fresh',
      () => this.freshBoard(),
    );
    for (let i = 0; i < 4; i += 1) {
      const piece = this.state.shelf[i];
      const shelfTarget = this.button(
        holder,
        698 + 105 * i,
        597,
        99,
        piece ? '' : 'Empty',
        'crystalarium-full-shelf:' + i,
        () => {},
      );
      shelfTarget.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (!this.state.shelf[i]) return;
        this.selected = null;
        this.dragSource = i;
        this.dragSourceKind = 'shelf';
        this.dragStart = { x: pointer.x, y: pointer.y };
      });
      if (piece) {
        const shelfArt = this.scene.add.graphics();
        paintCrystalArt(shelfArt, piece, 747 + 105 * i, 620, 0.42);
        holder.add(shelfArt);
      }
    }
    this.addText(holder, 698, 666, this.message, 13, '#fbe8ba', 450);
    this.addText(
      holder,
      173,
      681,
      'N Grow • 1–3 Wells • O Offer • H Harmony • P Polish • Esc Leave',
      12,
      '#bfd6ec',
      478,
    );
  }
}
