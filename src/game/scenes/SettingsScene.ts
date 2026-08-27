import Phaser from 'phaser';
import {
  getBrowserAccessibilitySettingsStore,
  type AccessibilitySettings,
} from '../accessibility/AccessibilitySettings';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
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

interface SettingRow {
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  kind: GameSettingKind;
}

const ROW_X = GAME_WIDTH / 2;
const ROW_WIDTH = 590;
const ROW_HEIGHT = 64;
const ROW_START_Y = 154;
const ROW_GAP = 66;

export class SettingsScene extends Phaser.Scene {
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly audio = getVerticalSliceAudio();
  private returnScene = 'MoonflowerGladeScene';
  private rows: SettingRow[] = [];
  private doneButton: Phaser.GameObjects.Rectangle | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private selectedIndex = 0;
  private closing = false;
  private unsubscribeAccessibility: (() => void) | null = null;

  public constructor() {
    super('SettingsScene');
  }

  public create(data: SettingsSceneData): void {
    this.returnScene = data.returnScene ?? 'MoonflowerGladeScene';
    this.rows = [];
    this.selectedIndex = 0;
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

    GAME_SETTING_KINDS.forEach((kind, index) => this.createRow(kind, index));

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 610, '↑ ↓ choose • Enter changes • Esc goes back', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
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
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);

    this.unsubscribeAccessibility = this.accessibility.subscribe(() => this.refresh());
    this.input.once('pointerdown', () => void this.audio.unlock());
    this.input.keyboard?.once('keydown', () => void this.audio.unlock());

    this.refresh();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-UP', this.selectPrevious, this);
      this.input.keyboard?.off('keydown-DOWN', this.selectNext, this);
      this.input.keyboard?.off('keydown-ENTER', this.activateSelected, this);
      this.input.keyboard?.off('keydown-SPACE', this.activateSelected, this);
      this.input.keyboard?.off('keydown-ESC', this.closeSettings, this);
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
      this.unsubscribeAccessibility?.();
      this.unsubscribeAccessibility = null;
      this.rows = [];
      this.doneButton = null;
      this.statusText = null;
    });
  }

  private createRow(kind: GameSettingKind, index: number): void {
    const y = ROW_START_Y + index * ROW_GAP;
    createUiShadow(this, ROW_X, y, ROW_WIDTH, ROW_HEIGHT, 4, 0.11);
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
    button.on('pointerdown', () => {
      this.selectedIndex = index;
      void this.toggleSetting(kind);
    });
    this.rows.push({ button, label, kind });
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
    const snapshot = this.snapshot();
    for (const row of this.rows) {
      const presentation = describeGameSetting(row.kind, snapshot);
      row.label.setText(presentation.label);
      row.button.setFillStyle(presentation.enabled ? UI_COLOURS.mint : UI_COLOURS.lavender, 1);
    }
    this.refreshFocus();
  }

  private refreshFocus(): void {
    const snapshot = this.snapshot();
    this.rows.forEach((row, index) => {
      const presentation = describeGameSetting(row.kind, snapshot);
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
    this.refreshFocus();
  }

  private selectNext(): void {
    this.selectedIndex = moveGameSettingSelection(this.selectedIndex, 1, this.rows.length + 1);
    this.refreshFocus();
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

  private async toggleSetting(kind: GameSettingKind): Promise<void> {
    void this.audio.unlock();
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
    this.scene.stop();
    if (this.scene.isPaused(this.returnScene)) {
      this.scene.resume(this.returnScene);
    }
  }
}
