import Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore, type AccessibilitySettings } from '../accessibility/AccessibilitySettings';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { getBrowserMagicalWeatherService } from '../atmosphere/MagicalWeatherService';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  GAME_SETTING_KINDS,
  describeGameSetting,
  moveGameSettingSelection,
  type GameSettingKind,
} from '../settings/GameSettingsModel';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

interface SettingsSceneData {
  returnScene?: string;
}

type SettingsRowKind = GameSettingKind | 'time-of-day' | 'weather';

interface SettingRow {
  shadow: Phaser.GameObjects.Rectangle;
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  kind: SettingsRowKind;
  contentY: number;
}

const SETTINGS_ROW_KINDS: readonly SettingsRowKind[] = [
  ...GAME_SETTING_KINDS,
  'time-of-day',
  'weather',
];

const ROW_X = GAME_WIDTH / 2;
const ROW_WIDTH = 590;
const ROW_HEIGHT = 64;
const ROW_STEP = 84;
const VIEWPORT_TOP = 132;
const VIEWPORT_HEIGHT = 458;
const VIEWPORT_BOTTOM = VIEWPORT_TOP + VIEWPORT_HEIGHT;
const VIEWPORT_LEFT = ROW_X - ROW_WIDTH / 2 - 8;
const VIEWPORT_WIDTH = ROW_WIDTH + 16;
const SCROLLBAR_X = ROW_X + ROW_WIDTH / 2 + 27;
const SCROLLBAR_WIDTH = 8;
const SCROLLBAR_MIN_THUMB = 58;
const DRAG_THRESHOLD = 12;

export class SettingsScene extends Phaser.Scene {
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly audio = getVerticalSliceAudio();
  private readonly saveService = getBrowserSaveService();
  private readonly atmosphericTime = getBrowserAtmosphericTimeService(this.saveService);
  private readonly magicalWeather = getBrowserMagicalWeatherService(this.saveService);
  private returnScene = 'MoonflowerGladeScene';
  private rows: SettingRow[] = [];
  private doneButton: Phaser.GameObjects.Rectangle | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private scrollbarThumb: Phaser.GameObjects.Rectangle | null = null;
  private listMaskGraphics: Phaser.GameObjects.Graphics | null = null;
  private selectedIndex = 0;
  private scrollOffset = 0;
  private maxScroll = 0;
  private dragPointerId: number | null = null;
  private dragStartPointerY = 0;
  private dragStartScroll = 0;
  private dragDistance = 0;
  private closing = false;
  private unsubscribeAccessibility: (() => void) | null = null;
  private unsubscribeAtmosphericTime: (() => void) | null = null;
  private unsubscribeWeather: (() => void) | null = null;

  public constructor() {
    super('SettingsScene');
  }

  public create(data: SettingsSceneData): void {
    this.returnScene = data.returnScene ?? 'MoonflowerGladeScene';
    this.rows = [];
    this.selectedIndex = 0;
    this.scrollOffset = 0;
    this.maxScroll = 0;
    this.dragPointerId = null;
    this.dragDistance = 0;
    this.closing = false;

    this.cameras.main.setBackgroundColor('rgba(48, 37, 69, 0.96)');
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x302545, 0.94)
      .setName('settings-backdrop');
    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 760, 690, 2, 0.3);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 760, 690, UI_COLOURS.cream, 1)
      .setName('settings-panel')
      .setStrokeStyle(6, UI_COLOURS.ribbonStrong, 1)
      .setDepth(3);

    this.add
      .text(GAME_WIDTH / 2, 52, 'Settings', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setName('settings-heading')
      .setOrigin(0.5)
      .setDepth(4);
    this.add
      .text(GAME_WIDTH / 2, 91, 'Make the valley comfortable for you.', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '17px',
      })
      .setName('settings-hint')
      .setOrigin(0.5)
      .setDepth(4);

    this.createListMask();
    SETTINGS_ROW_KINDS.forEach((kind, index) => this.createRow(kind, index));
    this.maxScroll = Math.max(0, this.getContentHeight() - VIEWPORT_HEIGHT);
    this.createScrollbar();

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 612, 'Swipe or scroll for more  •  ↑ ↓ choose  •  Enter changes', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        align: 'center',
      })
      .setName('settings-status')
      .setOrigin(0.5)
      .setDepth(4);

    createUiShadow(this, GAME_WIDTH / 2, 666, 260, 64, 4, 0.16);
    this.doneButton = this.add
      .rectangle(GAME_WIDTH / 2, 666, 260, 64, UI_COLOURS.gold, 1)
      .setName('settings-done')
      .setStrokeStyle(4, UI_COLOURS.goldStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);
    this.add
      .text(GAME_WIDTH / 2, 666, 'Done', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setName('settings-done-label')
      .setOrigin(0.5)
      .setDepth(6);
    applyButtonHover(this.doneButton, UI_COLOURS.gold, UI_COLOURS.cream);
    this.doneButton.on('pointerdown', () => this.closeSettings());

    this.input.keyboard?.on('keydown-UP', this.selectPrevious, this);
    this.input.keyboard?.on('keydown-DOWN', this.selectNext, this);
    this.input.keyboard?.on('keydown-ENTER', this.activateSelected, this);
    this.input.keyboard?.on('keydown-SPACE', this.activateSelected, this);
    this.input.keyboard?.on('keydown-ESC', this.closeSettings, this);
    this.input.on('wheel', this.handleWheel, this);
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointerupoutside', this.handlePointerUp, this);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);

    this.unsubscribeAccessibility = this.accessibility.subscribe(() => this.refresh());
    this.unsubscribeAtmosphericTime = this.atmosphericTime.subscribe(() => this.refresh());
    this.unsubscribeWeather = this.magicalWeather.subscribe(() => this.refresh());
    this.input.once('pointerdown', () => void this.audio.unlock());
    this.input.keyboard?.once('keydown', () => void this.audio.unlock());

    this.setScrollOffset(0);
    this.refresh();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-UP', this.selectPrevious, this);
      this.input.keyboard?.off('keydown-DOWN', this.selectNext, this);
      this.input.keyboard?.off('keydown-ENTER', this.activateSelected, this);
      this.input.keyboard?.off('keydown-SPACE', this.activateSelected, this);
      this.input.keyboard?.off('keydown-ESC', this.closeSettings, this);
      this.input.off('wheel', this.handleWheel, this);
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.off('pointerup', this.handlePointerUp, this);
      this.input.off('pointerupoutside', this.handlePointerUp, this);
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
      this.unsubscribeAccessibility?.();
      this.unsubscribeAtmosphericTime?.();
      this.unsubscribeWeather?.();
      this.unsubscribeAccessibility = null;
      this.unsubscribeAtmosphericTime = null;
      this.unsubscribeWeather = null;
      this.listMaskGraphics?.destroy();
      this.listMaskGraphics = null;
      this.rows = [];
      this.doneButton = null;
      this.statusText = null;
      this.scrollbarThumb = null;
    });
  }

  private createListMask(): void {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(VIEWPORT_LEFT, VIEWPORT_TOP, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    this.listMaskGraphics = graphics;
  }

  private createRow(kind: SettingsRowKind, index: number): void {
    const contentY = ROW_HEIGHT / 2 + index * ROW_STEP;
    const y = VIEWPORT_TOP + contentY;
    const shadow = createUiShadow(this, ROW_X, y, ROW_WIDTH, ROW_HEIGHT, 4, 0.11);
    const button = this.add
      .rectangle(ROW_X, y, ROW_WIDTH, ROW_HEIGHT, UI_COLOURS.lavender, 1)
      .setName(`settings-row-${kind}`)
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.96)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);
    const label = this.add
      .text(ROW_X, y, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName(`settings-row-${kind}-label`)
      .setOrigin(0.5)
      .setDepth(6);

    if (this.listMaskGraphics) {
      const mask = this.listMaskGraphics.createGeometryMask();
      shadow.setMask(mask);
      button.setMask(mask);
      label.setMask(mask);
    }

    button.on('pointerup', () => {
      if (this.dragDistance >= DRAG_THRESHOLD) {
        return;
      }
      this.selectedIndex = index;
      this.ensureSelectedVisible();
      void this.toggleSetting(kind);
    });
    this.rows.push({ shadow, button, label, kind, contentY });
  }

  private createScrollbar(): void {
    this.add
      .rectangle(
        SCROLLBAR_X,
        VIEWPORT_TOP + VIEWPORT_HEIGHT / 2,
        SCROLLBAR_WIDTH,
        VIEWPORT_HEIGHT,
        UI_COLOURS.lavenderStrong,
        0.22,
      )
      .setName('settings-scrollbar-track')
      .setDepth(5);

    this.scrollbarThumb = this.add
      .rectangle(
        SCROLLBAR_X,
        VIEWPORT_TOP + SCROLLBAR_MIN_THUMB / 2,
        12,
        SCROLLBAR_MIN_THUMB,
        UI_COLOURS.ribbonStrong,
        0.9,
      )
      .setName('settings-scrollbar-thumb')
      .setDepth(6);
  }

  private getContentHeight(): number {
    if (SETTINGS_ROW_KINDS.length === 0) {
      return 0;
    }
    return ROW_HEIGHT + (SETTINGS_ROW_KINDS.length - 1) * ROW_STEP;
  }

  private getRowPresentation(kind: SettingsRowKind) {
    if (kind === 'time-of-day') {
      const definition = this.atmosphericTime.getDefinition();
      const mode = this.atmosphericTime.getMode() === 'auto' ? 'Auto' : 'Manual';
      return {
        label: `Time of day: ${definition.icon} ${definition.label} · ${mode}`,
        enabled: false,
      };
    }
    if (kind === 'weather') {
      const definition = this.magicalWeather.getDefinition();
      const mode = this.magicalWeather.getMode() === 'auto' ? 'Auto' : 'Manual';
      return {
        label: `Weather: ${definition.icon} ${definition.label} · ${mode}`,
        enabled: false,
      };
    }
    return describeGameSetting(kind, this.snapshot());
  }

  private snapshot() {
    return {
      audio: this.audio.getSettings(),
      accessibility: this.accessibility.load(),
      fullscreenSupported: this.isFullscreenSupported(),
      fullscreenActive: Boolean(document.fullscreenElement),
    };
  }

  private refresh(): void {
    for (const row of this.rows) {
      const presentation = this.getRowPresentation(row.kind);
      row.label.setText(presentation.label);
      row.button.setFillStyle(presentation.enabled ? UI_COLOURS.mint : UI_COLOURS.lavender, 1);
    }
    this.refreshFocus();
  }

  private refreshFocus(): void {
    this.rows.forEach((row, index) => {
      const presentation = this.getRowPresentation(row.kind);
      const selected = index === this.selectedIndex;
      row.button.setStrokeStyle(
        selected ? 6 : 4,
        selected
          ? UI_COLOURS.goldStrong
          : presentation.enabled
            ? UI_COLOURS.mintStrong
            : UI_COLOURS.lavenderStrong,
        1,
      );
    });
    this.doneButton?.setStrokeStyle(
      this.selectedIndex === this.rows.length ? 6 : 4,
      UI_COLOURS.goldStrong,
      1,
    );
  }

  private selectPrevious(): void {
    this.selectedIndex = moveGameSettingSelection(this.selectedIndex, -1, this.rows.length + 1);
    this.ensureSelectedVisible();
    this.refreshFocus();
  }

  private selectNext(): void {
    this.selectedIndex = moveGameSettingSelection(this.selectedIndex, 1, this.rows.length + 1);
    this.ensureSelectedVisible();
    this.refreshFocus();
  }

  private ensureSelectedVisible(): void {
    if (this.selectedIndex >= this.rows.length) {
      return;
    }
    const row = this.rows[this.selectedIndex];
    if (!row) {
      return;
    }
    const rowTop = row.contentY - ROW_HEIGHT / 2;
    const rowBottom = row.contentY + ROW_HEIGHT / 2;
    if (rowTop < this.scrollOffset) {
      this.setScrollOffset(rowTop);
    } else if (rowBottom > this.scrollOffset + VIEWPORT_HEIGHT) {
      this.setScrollOffset(rowBottom - VIEWPORT_HEIGHT);
    }
  }

  private setScrollOffset(value: number): void {
    this.scrollOffset = Phaser.Math.Clamp(value, 0, this.maxScroll);
    for (const row of this.rows) {
      const y = VIEWPORT_TOP + row.contentY - this.scrollOffset;
      row.shadow.setY(y + 4);
      row.button.setY(y);
      row.label.setY(y);
      if (row.button.input) {
        row.button.input.enabled =
          y - ROW_HEIGHT / 2 >= VIEWPORT_TOP && y + ROW_HEIGHT / 2 <= VIEWPORT_BOTTOM;
      }
    }
    this.updateScrollbar();
  }

  private updateScrollbar(): void {
    if (!this.scrollbarThumb) {
      return;
    }
    const contentHeight = this.getContentHeight();
    const thumbHeight = Math.max(
      SCROLLBAR_MIN_THUMB,
      VIEWPORT_HEIGHT * (VIEWPORT_HEIGHT / Math.max(VIEWPORT_HEIGHT, contentHeight)),
    );
    const travel = VIEWPORT_HEIGHT - thumbHeight;
    const ratio = this.maxScroll > 0 ? this.scrollOffset / this.maxScroll : 0;
    this.scrollbarThumb.setDisplaySize(12, thumbHeight);
    this.scrollbarThumb.setY(VIEWPORT_TOP + thumbHeight / 2 + travel * ratio);
    this.scrollbarThumb.setVisible(this.maxScroll > 0);
  }

  private pointerInsideViewport(pointer: Phaser.Input.Pointer): boolean {
    return (
      pointer.x >= VIEWPORT_LEFT &&
      pointer.x <= VIEWPORT_LEFT + VIEWPORT_WIDTH &&
      pointer.y >= VIEWPORT_TOP &&
      pointer.y <= VIEWPORT_BOTTOM
    );
  }

  private handleWheel(
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    if (!this.pointerInsideViewport(pointer)) {
      return;
    }
    this.setScrollOffset(this.scrollOffset + deltaY * 0.65);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.pointerInsideViewport(pointer)) {
      return;
    }
    this.dragPointerId = pointer.id;
    this.dragStartPointerY = pointer.y;
    this.dragStartScroll = this.scrollOffset;
    this.dragDistance = 0;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.dragPointerId !== pointer.id || !pointer.isDown) {
      return;
    }
    const delta = pointer.y - this.dragStartPointerY;
    this.dragDistance = Math.max(this.dragDistance, Math.abs(delta));
    this.setScrollOffset(this.dragStartScroll - delta);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.dragPointerId === pointer.id) {
      this.dragPointerId = null;
    }
  }

  private activateSelected(): void {
    if (this.selectedIndex === this.rows.length) {
      this.closeSettings();
      return;
    }
    const row = this.rows[this.selectedIndex];
    if (row) {
      void this.toggleSetting(row.kind);
    }
  }

  private async toggleSetting(kind: SettingsRowKind): Promise<void> {
    void this.audio.unlock();
    if (kind === 'time-of-day') {
      this.atmosphericTime.cycleMode();
      this.magicalWeather.refreshAutomatic();
      this.audio.playSfx('ui');
      this.refresh();
      return;
    }
    if (kind === 'weather') {
      this.magicalWeather.cycleMode();
      this.audio.playSfx('ui');
      this.refresh();
      return;
    }

    const audioSettings = this.audio.getSettings();
    if (kind === 'muted') {
      this.audio.updateSettings({ muted: !audioSettings.muted });
    } else if (kind === 'music') {
      this.audio.updateSettings({ musicEnabled: !audioSettings.musicEnabled });
    } else if (kind === 'ambience') {
      this.audio.updateSettings({ ambienceEnabled: !audioSettings.ambienceEnabled });
    } else if (kind === 'sfx') {
      this.audio.updateSettings({ sfxEnabled: !audioSettings.sfxEnabled });
    } else if (kind === 'fullscreen') {
      await this.toggleFullscreen();
      return;
    } else {
      const settings = this.accessibility.load();
      const patch: Partial<AccessibilitySettings> =
        kind === 'reduced-motion'
          ? { reducedMotion: !settings.reducedMotion }
          : { highVisibilityInteractions: !settings.highVisibilityInteractions };
      this.accessibility.update(patch);
    }

    this.audio.playSfx('ui');
    this.refresh();
  }

  private isFullscreenSupported(): boolean {
    return Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
  }

  private async toggleFullscreen(): Promise<void> {
    if (!this.isFullscreenSupported()) {
      this.statusText?.setText('Fullscreen is not available in this browser.');
      this.refresh();
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const target = document.getElementById('game-shell') ?? document.documentElement;
        await target.requestFullscreen();
      }
      this.audio.playSfx('ui');
    } catch {
      this.statusText?.setText(
        'Fullscreen could not be changed. The game can still be played here.',
      );
    }
    this.refresh();
  }

  private handleFullscreenChange = (): void => {
    this.refresh();
  };

  private closeSettings(): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.audio.playSfx('ui-back');
    if (this.scene.isPaused(this.returnScene)) {
      this.scene.resume(this.returnScene);
    }
    this.scene.stop();
  }
}
