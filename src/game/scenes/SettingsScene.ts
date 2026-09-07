import Phaser from 'phaser';
import {
  getBrowserAccessibilitySettingsStore,
  type AccessibilitySettings,
} from '../accessibility/AccessibilitySettings';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { getBrowserMagicalWeatherService } from '../atmosphere/MagicalWeatherService';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  describeGameSetting,
  moveGameSettingSelection,
  type GameSettingKind,
} from '../settings/GameSettingsModel';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';

interface SettingsSceneData {
  returnScene?: string;
}

type SettingsRowKind = GameSettingKind | 'time-of-day' | 'weather';

interface SettingsSectionDefinition {
  title: string;
  kinds: readonly SettingsRowKind[];
}

interface SettingRow {
  surface: Phaser.GameObjects.Graphics;
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  kind: SettingsRowKind;
  contentY: number;
  hovered: boolean;
}

interface SettingsSectionHeading {
  label: Phaser.GameObjects.Text;
  contentY: number;
}

const SETTINGS_SECTIONS: readonly SettingsSectionDefinition[] = [
  {
    title: 'Sound',
    kinds: ['muted', 'music', 'ambience', 'sfx'],
  },
  {
    title: 'Accessibility',
    kinds: ['reduced-motion', 'high-visibility'],
  },
  {
    title: 'Display & World',
    kinds: ['fullscreen', 'time-of-day', 'weather'],
  },
];

const PANEL_WIDTH = 760;
const PANEL_HEIGHT = 690;
const PANEL_TOP = (GAME_HEIGHT - PANEL_HEIGHT) / 2;
const PANEL_BOTTOM = PANEL_TOP + PANEL_HEIGHT;
const PANEL_RADIUS = 30;
const BACKDROP = 0x302545;

const ROW_X = GAME_WIDTH / 2;
const ROW_WIDTH = 590;
const ROW_HEIGHT = 58;
const ROW_RADIUS = 22;
const ROW_GAP = 14;
const ROW_SHADOW_X = 5;
const ROW_SHADOW_Y = 6;
const SECTION_HEADING_HEIGHT = 24;
const SECTION_HEADING_GAP = 10;
const SECTION_GAP = 24;
const CONTENT_PADDING = 8;

const VIEWPORT_TOP = 145;
const VIEWPORT_HEIGHT = 420;
const VIEWPORT_BOTTOM = VIEWPORT_TOP + VIEWPORT_HEIGHT;
const VIEWPORT_LEFT = ROW_X - ROW_WIDTH / 2 - 8;
const VIEWPORT_WIDTH = ROW_WIDTH + 16;
const SCROLLBAR_X = ROW_X + ROW_WIDTH / 2 + 27;
const SCROLLBAR_WIDTH = 8;
const SCROLLBAR_MIN_THUMB = 58;
const DRAG_THRESHOLD = 12;

const LIST_SURFACE_DEPTH = 5;
const LIST_CONTROL_DEPTH = 6;
const LIST_LABEL_DEPTH = 7;
const CLIP_GUARD_DEPTH = 20;
const FIXED_CHROME_DEPTH = 24;

export class SettingsScene extends Phaser.Scene {
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly audio = getVerticalSliceAudio();
  private readonly saveService = getBrowserSaveService();
  private readonly atmosphericTime = getBrowserAtmosphericTimeService(this.saveService);
  private readonly magicalWeather = getBrowserMagicalWeatherService(this.saveService);

  private returnScene = 'MoonflowerGladeScene';
  private rows: SettingRow[] = [];
  private sectionHeadings: SettingsSectionHeading[] = [];
  private contentHeight = 0;
  private doneButton: Phaser.GameObjects.Rectangle | null = null;
  private doneSurface: Phaser.GameObjects.Graphics | null = null;
  private doneHovered = false;
  private statusText: Phaser.GameObjects.Text | null = null;
  private scrollbarThumb: Phaser.GameObjects.Rectangle | null = null;
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
    this.sectionHeadings = [];
    this.contentHeight = 0;
    this.selectedIndex = 0;
    this.scrollOffset = 0;
    this.maxScroll = 0;
    this.dragPointerId = null;
    this.dragDistance = 0;
    this.doneHovered = false;
    this.closing = false;

    this.cameras.main.setBackgroundColor('rgba(48, 37, 69, 0.96)');
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, BACKDROP, 0.94)
      .setName('settings-backdrop');
    this.createPanel();

    this.createSectionedRows();
    this.maxScroll = Math.max(0, this.contentHeight - VIEWPORT_HEIGHT);
    this.createScrollbar();
    this.createViewportGuards();
    this.createFixedChrome();

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
      this.rows = [];
      this.sectionHeadings = [];
      this.doneButton = null;
      this.doneSurface = null;
      this.statusText = null;
      this.scrollbarThumb = null;
    });
  }

  private createPanel(): void {
    const panel = this.add.graphics().setName('settings-panel').setDepth(2);
    panel.fillStyle(UI_COLOURS.shadow, 0.28);
    panel.fillRoundedRect(
      GAME_WIDTH / 2 - PANEL_WIDTH / 2 + 8,
      PANEL_TOP + 9,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      PANEL_RADIUS,
    );
    panel.fillStyle(UI_COLOURS.cream, 1);
    panel.fillRoundedRect(
      GAME_WIDTH / 2 - PANEL_WIDTH / 2,
      PANEL_TOP,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      PANEL_RADIUS,
    );
    panel.lineStyle(6, UI_COLOURS.ribbonStrong, 1);
    panel.strokeRoundedRect(
      GAME_WIDTH / 2 - PANEL_WIDTH / 2,
      PANEL_TOP,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      PANEL_RADIUS,
    );
  }

  private createSectionedRows(): void {
    let cursor = CONTENT_PADDING;

    SETTINGS_SECTIONS.forEach((section, sectionIndex) => {
      if (sectionIndex > 0) {
        cursor += SECTION_GAP;
      }

      const headingY = cursor + SECTION_HEADING_HEIGHT / 2;
      this.createSectionHeading(section.title, headingY);
      cursor += SECTION_HEADING_HEIGHT + SECTION_HEADING_GAP;

      for (const kind of section.kinds) {
        const contentY = cursor + ROW_HEIGHT / 2;
        this.createRow(kind, this.rows.length, contentY);
        cursor += ROW_HEIGHT + ROW_GAP;
      }
      cursor -= ROW_GAP;
    });

    this.contentHeight = cursor + CONTENT_PADDING;
  }

  private createSectionHeading(title: string, contentY: number): void {
    const label = this.add
      .text(VIEWPORT_LEFT + 12, VIEWPORT_TOP + contentY, title, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setName(`settings-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
      .setOrigin(0, 0.5)
      .setDepth(LIST_LABEL_DEPTH);
    this.sectionHeadings.push({ label, contentY });
  }

  private createRow(kind: SettingsRowKind, index: number, contentY: number): void {
    const y = VIEWPORT_TOP + contentY;
    const surface = this.add
      .graphics()
      .setName(`settings-row-surface-${kind}`)
      .setPosition(ROW_X, y)
      .setDepth(LIST_SURFACE_DEPTH);
    const button = this.add
      .rectangle(ROW_X, y, ROW_WIDTH, ROW_HEIGHT, UI_COLOURS.white, 0.001)
      .setName(`settings-row-${kind}`)
      .setInteractive({ useHandCursor: true })
      .setDepth(LIST_CONTROL_DEPTH);
    const label = this.add
      .text(ROW_X, y, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName(`settings-row-${kind}-label`)
      .setOrigin(0.5)
      .setDepth(LIST_LABEL_DEPTH);

    const row: SettingRow = { surface, button, label, kind, contentY, hovered: false };
    button.on('pointerover', () => {
      row.hovered = true;
      this.redrawRow(row);
    });
    button.on('pointerout', () => {
      row.hovered = false;
      this.redrawRow(row);
    });
    button.on('pointerup', () => {
      if (this.dragDistance >= DRAG_THRESHOLD) {
        return;
      }
      this.selectedIndex = index;
      this.ensureSelectedVisible();
      void this.toggleSetting(kind);
    });
    this.rows.push(row);
  }

  private redrawRow(row: SettingRow): void {
    const presentation = this.getRowPresentation(row.kind);
    const selected = this.rows[this.selectedIndex] === row;
    const fill = row.hovered
      ? UI_COLOURS.cream
      : presentation.enabled
        ? UI_COLOURS.mint
        : UI_COLOURS.lavender;
    const stroke = selected
      ? UI_COLOURS.goldStrong
      : presentation.enabled
        ? UI_COLOURS.mintStrong
        : UI_COLOURS.lavenderStrong;
    const lineWidth = selected ? 5 : 3;

    row.surface.clear();
    row.surface.fillStyle(UI_COLOURS.shadow, 0.11);
    row.surface.fillRoundedRect(
      -ROW_WIDTH / 2 + ROW_SHADOW_X,
      -ROW_HEIGHT / 2 + ROW_SHADOW_Y,
      ROW_WIDTH,
      ROW_HEIGHT,
      ROW_RADIUS,
    );
    row.surface.fillStyle(fill, 1);
    row.surface.fillRoundedRect(-ROW_WIDTH / 2, -ROW_HEIGHT / 2, ROW_WIDTH, ROW_HEIGHT, ROW_RADIUS);
    row.surface.lineStyle(lineWidth, stroke, 1);
    row.surface.strokeRoundedRect(
      -ROW_WIDTH / 2,
      -ROW_HEIGHT / 2,
      ROW_WIDTH,
      ROW_HEIGHT,
      ROW_RADIUS,
    );
    row.surface.fillStyle(UI_COLOURS.white, 0.18);
    row.surface.fillRoundedRect(-ROW_WIDTH / 2 + 6, -ROW_HEIGHT / 2 + 6, ROW_WIDTH - 12, 18, 14);
  }

  private createScrollbar(): void {
    this.add
      .rectangle(
        SCROLLBAR_X,
        VIEWPORT_TOP + VIEWPORT_HEIGHT / 2,
        SCROLLBAR_WIDTH,
        VIEWPORT_HEIGHT,
        UI_COLOURS.lavenderStrong,
        0.2,
      )
      .setName('settings-scrollbar-track')
      .setDepth(FIXED_CHROME_DEPTH + 1);

    this.scrollbarThumb = this.add
      .rectangle(
        SCROLLBAR_X,
        VIEWPORT_TOP + SCROLLBAR_MIN_THUMB / 2,
        12,
        SCROLLBAR_MIN_THUMB,
        UI_COLOURS.ribbonStrong,
        0.92,
      )
      .setName('settings-scrollbar-thumb')
      .setDepth(FIXED_CHROME_DEPTH + 2);
  }

  private createViewportGuards(): void {
    const innerWidth = PANEL_WIDTH - 12;
    const topGuardHeight = VIEWPORT_TOP - PANEL_TOP;
    const bottomGuardHeight = PANEL_BOTTOM - VIEWPORT_BOTTOM;

    this.add
      .rectangle(
        GAME_WIDTH / 2,
        PANEL_TOP + topGuardHeight / 2,
        innerWidth,
        topGuardHeight,
        UI_COLOURS.cream,
        1,
      )
      .setName('settings-viewport-top-guard')
      .setDepth(CLIP_GUARD_DEPTH);
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        VIEWPORT_BOTTOM + bottomGuardHeight / 2,
        innerWidth,
        bottomGuardHeight,
        UI_COLOURS.cream,
        1,
      )
      .setName('settings-viewport-bottom-guard')
      .setDepth(CLIP_GUARD_DEPTH);

    if (PANEL_TOP > 0) {
      this.add
        .rectangle(GAME_WIDTH / 2, PANEL_TOP / 2, GAME_WIDTH, PANEL_TOP, BACKDROP, 1)
        .setName('settings-viewport-outer-top-guard')
        .setDepth(CLIP_GUARD_DEPTH + 1);
    }
    if (PANEL_BOTTOM < GAME_HEIGHT) {
      const height = GAME_HEIGHT - PANEL_BOTTOM;
      this.add
        .rectangle(GAME_WIDTH / 2, PANEL_BOTTOM + height / 2, GAME_WIDTH, height, BACKDROP, 1)
        .setName('settings-viewport-outer-bottom-guard')
        .setDepth(CLIP_GUARD_DEPTH + 1);
    }

    const frame = this.add
      .graphics()
      .setName('settings-panel-frame')
      .setDepth(FIXED_CHROME_DEPTH + 4);
    frame.lineStyle(6, UI_COLOURS.ribbonStrong, 1);
    frame.strokeRoundedRect(
      GAME_WIDTH / 2 - PANEL_WIDTH / 2,
      PANEL_TOP,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      PANEL_RADIUS,
    );
  }

  private createFixedChrome(): void {
    this.add
      .text(GAME_WIDTH / 2, 52, 'Settings', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setName('settings-heading')
      .setOrigin(0.5)
      .setDepth(FIXED_CHROME_DEPTH + 5);
    this.add
      .text(GAME_WIDTH / 2, 91, 'Make the valley comfortable for you.', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '17px',
      })
      .setName('settings-hint')
      .setOrigin(0.5)
      .setDepth(FIXED_CHROME_DEPTH + 5);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 600, 'Swipe or scroll for more  •  ↑ ↓ choose  •  Enter changes', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        align: 'center',
      })
      .setName('settings-status')
      .setOrigin(0.5)
      .setDepth(FIXED_CHROME_DEPTH + 5);

    this.doneSurface = this.add
      .graphics()
      .setName('settings-done-surface')
      .setDepth(FIXED_CHROME_DEPTH + 5);
    this.doneButton = this.add
      .rectangle(GAME_WIDTH / 2, 656, 260, 64, UI_COLOURS.white, 0.001)
      .setName('settings-done')
      .setInteractive({ useHandCursor: true })
      .setDepth(FIXED_CHROME_DEPTH + 6);
    this.add
      .text(GAME_WIDTH / 2, 656, 'Done', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setName('settings-done-label')
      .setOrigin(0.5)
      .setDepth(FIXED_CHROME_DEPTH + 7);

    this.doneButton.on('pointerover', () => {
      this.doneHovered = true;
      this.redrawDone();
    });
    this.doneButton.on('pointerout', () => {
      this.doneHovered = false;
      this.redrawDone();
    });
    this.doneButton.on('pointerdown', () => this.closeSettings());
    this.redrawDone();
  }

  private redrawDone(): void {
    if (!this.doneSurface) {
      return;
    }
    const selected = this.selectedIndex === this.rows.length;
    const fill = this.doneHovered ? UI_COLOURS.cream : UI_COLOURS.gold;
    const lineWidth = selected ? 6 : 4;

    this.doneSurface.clear();
    this.doneSurface.fillStyle(UI_COLOURS.shadow, 0.16);
    this.doneSurface.fillRoundedRect(GAME_WIDTH / 2 - 130 + 6, 656 - 32 + 7, 260, 64, 22);
    this.doneSurface.fillStyle(fill, 1);
    this.doneSurface.fillRoundedRect(GAME_WIDTH / 2 - 130, 656 - 32, 260, 64, 22);
    this.doneSurface.lineStyle(lineWidth, UI_COLOURS.goldStrong, 1);
    this.doneSurface.strokeRoundedRect(GAME_WIDTH / 2 - 130, 656 - 32, 260, 64, 22);
    this.doneSurface.fillStyle(UI_COLOURS.white, 0.22);
    this.doneSurface.fillRoundedRect(GAME_WIDTH / 2 - 122, 656 - 25, 244, 18, 14);
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
      this.redrawRow(row);
    }
    this.refreshFocus();
  }

  private refreshFocus(): void {
    for (const row of this.rows) {
      this.redrawRow(row);
    }
    this.redrawDone();
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
    const rowTop = row.contentY - ROW_HEIGHT / 2 - 8;
    const rowBottom = row.contentY + ROW_HEIGHT / 2 + 8;
    if (rowTop < this.scrollOffset) {
      this.setScrollOffset(rowTop);
    } else if (rowBottom > this.scrollOffset + VIEWPORT_HEIGHT) {
      this.setScrollOffset(rowBottom - VIEWPORT_HEIGHT);
    }
  }

  private setScrollOffset(value: number): void {
    this.scrollOffset = Phaser.Math.Clamp(value, 0, this.maxScroll);

    for (const heading of this.sectionHeadings) {
      const y = VIEWPORT_TOP + heading.contentY - this.scrollOffset;
      heading.label.setY(y);
      heading.label.setVisible(
        y + SECTION_HEADING_HEIGHT / 2 > VIEWPORT_TOP &&
          y - SECTION_HEADING_HEIGHT / 2 < VIEWPORT_BOTTOM,
      );
    }

    for (const row of this.rows) {
      const y = VIEWPORT_TOP + row.contentY - this.scrollOffset;
      const top = y - ROW_HEIGHT / 2;
      const bottom = y + ROW_HEIGHT / 2 + ROW_SHADOW_Y;
      const intersectsViewport = bottom > VIEWPORT_TOP && top < VIEWPORT_BOTTOM;
      const fullyInsideViewport = top >= VIEWPORT_TOP && bottom <= VIEWPORT_BOTTOM;

      row.surface.setY(y).setVisible(intersectsViewport);
      row.button.setY(y).setVisible(intersectsViewport);
      row.label.setY(y).setVisible(intersectsViewport);
      if (row.button.input) {
        row.button.input.enabled = fullyInsideViewport;
      }
    }

    this.updateScrollbar();
  }

  private updateScrollbar(): void {
    if (!this.scrollbarThumb) {
      return;
    }
    const thumbHeight = Math.max(
      SCROLLBAR_MIN_THUMB,
      VIEWPORT_HEIGHT * (VIEWPORT_HEIGHT / Math.max(VIEWPORT_HEIGHT, this.contentHeight)),
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
