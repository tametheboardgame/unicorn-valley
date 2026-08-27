import Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore } from '../accessibility/AccessibilitySettings';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_WIDTH } from '../config/gameConstants';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { UI_COLOURS, UI_FONT, applyButtonHover } from '../ui/uiTheme';
import {
  GAME_SETTING_KINDS,
  describeGameSetting,
  moveGameSettingSelection,
} from './GameSettingsModel';

const TITLE_SCENE_KEY = 'TitleScene';
const SYNC_INTERVAL_MS = 100;
const FULLSCREEN_Y = 548;
const DONE_Y = 610;

interface AttachedTitleSettings {
  scene: Phaser.Scene;
  fullscreenButton: Phaser.GameObjects.Rectangle;
  fullscreenLabel: Phaser.GameObjects.Text;
  focusMarker: Phaser.GameObjects.Text;
  selectedIndex: number;
  wasOpen: boolean;
}

function isVisible(object: Phaser.GameObjects.GameObject | null): boolean {
  return Boolean(object && 'visible' in object && object.visible);
}

export class TitleSettingsEnhancementManager {
  private readonly syncThrottle = new RefreshThrottle(SYNC_INTERVAL_MS);
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly audio = getVerticalSliceAudio();
  private attached: AttachedTitleSettings | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }

    const title = this.game.scene
      .getScenes(true)
      .find((scene) => scene.scene.key === TITLE_SCENE_KEY);
    if (!title) {
      return;
    }

    if (!this.attached || this.attached.scene !== title || !this.attached.fullscreenButton.scene) {
      this.attach(title);
    }
    this.sync();
  }

  private attach(scene: Phaser.Scene): void {
    this.detach();

    const fullscreenButton = scene.add
      .rectangle(GAME_WIDTH / 2, FULLSCREEN_Y, 470, 50, UI_COLOURS.lavender, 1)
      .setName('title-setting-fullscreen')
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.95)
      .setDepth(203);
    const fullscreenLabel = scene.add
      .text(GAME_WIDTH / 2, FULLSCREEN_Y, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setName('title-setting-fullscreen-label')
      .setOrigin(0.5)
      .setDepth(204);
    applyButtonHover(fullscreenButton, UI_COLOURS.lavender, UI_COLOURS.cream);

    const focusMarker = scene.add
      .text(GAME_WIDTH / 2 - 260, 190, '›', {
        color: '#b18440',
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setName('title-settings-keyboard-focus')
      .setOrigin(0.5)
      .setDepth(205);

    fullscreenButton.on('pointerdown', this.toggleFullscreen, this);
    fullscreenLabel.on('pointerdown', this.toggleFullscreen, this);
    scene.input.keyboard?.on('keydown-UP', this.selectPrevious, this);
    scene.input.keyboard?.on('keydown-DOWN', this.selectNext, this);
    scene.input.keyboard?.on('keydown-ENTER', this.activateSelected, this);
    scene.input.keyboard?.on('keydown-SPACE', this.activateSelected, this);
    scene.input.keyboard?.on('keydown-ESC', this.closeSettings, this);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);

    const doneButton = scene.children.getByName('title-settings-done');
    const doneLabel = scene.children.getByName('title-settings-done-label');
    if (doneButton instanceof Phaser.GameObjects.Rectangle) {
      doneButton.setY(DONE_Y);
    }
    if (doneLabel instanceof Phaser.GameObjects.Text) {
      doneLabel.setY(DONE_Y);
    }

    this.attached = {
      scene,
      fullscreenButton,
      fullscreenLabel,
      focusMarker,
      selectedIndex: 0,
      wasOpen: false,
    };
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.detach, this);
    this.sync();
  }

  private detach(): void {
    const attached = this.attached;
    if (!attached) {
      return;
    }
    attached.scene.input.keyboard?.off('keydown-UP', this.selectPrevious, this);
    attached.scene.input.keyboard?.off('keydown-DOWN', this.selectNext, this);
    attached.scene.input.keyboard?.off('keydown-ENTER', this.activateSelected, this);
    attached.scene.input.keyboard?.off('keydown-SPACE', this.activateSelected, this);
    attached.scene.input.keyboard?.off('keydown-ESC', this.closeSettings, this);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    attached.fullscreenButton.off('pointerdown', this.toggleFullscreen, this);
    attached.fullscreenLabel.off('pointerdown', this.toggleFullscreen, this);
    attached.fullscreenButton.destroy();
    attached.fullscreenLabel.destroy();
    attached.focusMarker.destroy();
    this.attached = null;
  }

  private sync(): void {
    const attached = this.attached;
    if (!attached) {
      return;
    }

    const panel = attached.scene.children.getByName('title-settings-panel');
    const open = isVisible(panel);
    if (open && !attached.wasOpen) {
      attached.selectedIndex = 0;
    }
    attached.wasOpen = open;

    attached.fullscreenButton.setVisible(open);
    attached.fullscreenLabel.setVisible(open);
    attached.focusMarker.setVisible(open);
    if (open) {
      attached.fullscreenButton.setInteractive({ useHandCursor: true });
      attached.fullscreenLabel.setInteractive({ useHandCursor: true });
    } else {
      attached.fullscreenButton.disableInteractive();
      attached.fullscreenLabel.disableInteractive();
    }

    const presentation = describeGameSetting('fullscreen', this.snapshot());
    attached.fullscreenLabel.setText(presentation.label);
    attached.fullscreenButton
      .setFillStyle(presentation.enabled ? UI_COLOURS.mint : UI_COLOURS.lavender, 1)
      .setStrokeStyle(
        3,
        presentation.enabled ? UI_COLOURS.mintStrong : UI_COLOURS.lavenderStrong,
        0.98,
      );

    const doneButton = attached.scene.children.getByName('title-settings-done');
    const doneLabel = attached.scene.children.getByName('title-settings-done-label');
    if (doneButton instanceof Phaser.GameObjects.Rectangle) {
      doneButton.setY(DONE_Y);
    }
    if (doneLabel instanceof Phaser.GameObjects.Text) {
      doneLabel.setY(DONE_Y);
    }

    this.positionFocusMarker();
  }

  private snapshot() {
    return {
      audio: this.audio.getSettings(),
      accessibility: this.accessibility.load(),
      fullscreenSupported: this.isFullscreenSupported(),
      fullscreenActive: Boolean(document.fullscreenElement),
    };
  }

  private isFullscreenSupported(): boolean {
    return Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
  }

  private selectPrevious(): void {
    if (!this.isOpen()) {
      return;
    }
    const attached = this.attached;
    if (!attached) {
      return;
    }
    attached.selectedIndex = moveGameSettingSelection(
      attached.selectedIndex,
      -1,
      GAME_SETTING_KINDS.length + 1,
    );
    this.positionFocusMarker();
  }

  private selectNext(): void {
    if (!this.isOpen()) {
      return;
    }
    const attached = this.attached;
    if (!attached) {
      return;
    }
    attached.selectedIndex = moveGameSettingSelection(
      attached.selectedIndex,
      1,
      GAME_SETTING_KINDS.length + 1,
    );
    this.positionFocusMarker();
  }

  private activateSelected(): void {
    if (!this.isOpen()) {
      return;
    }
    const attached = this.attached;
    if (!attached) {
      return;
    }

    if (attached.selectedIndex === GAME_SETTING_KINDS.length) {
      this.closeSettings();
      return;
    }

    const kind = GAME_SETTING_KINDS[attached.selectedIndex];
    const target = attached.scene.children.getByName(`title-setting-${kind}`);
    if (target && isVisible(target)) {
      target.emit('pointerdown');
    }
  }

  private closeSettings(): void {
    if (!this.isOpen()) {
      return;
    }
    const done = this.attached?.scene.children.getByName('title-settings-done');
    done?.emit('pointerdown');
  }

  private positionFocusMarker(): void {
    const attached = this.attached;
    if (!attached?.wasOpen) {
      return;
    }
    if (attached.selectedIndex === GAME_SETTING_KINDS.length) {
      attached.focusMarker.setPosition(GAME_WIDTH / 2 - 155, DONE_Y);
      return;
    }
    const kind = GAME_SETTING_KINDS[attached.selectedIndex];
    const target = attached.scene.children.getByName(`title-setting-${kind}`);
    if (target && 'y' in target && typeof target.y === 'number') {
      attached.focusMarker.setPosition(GAME_WIDTH / 2 - 260, target.y);
    }
  }

  private isOpen(): boolean {
    const attached = this.attached;
    return Boolean(
      attached && isVisible(attached.scene.children.getByName('title-settings-panel')),
    );
  }

  private toggleFullscreen(): void {
    void this.changeFullscreen();
  }

  private async changeFullscreen(): Promise<void> {
    if (!this.isFullscreenSupported()) {
      this.sync();
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
      // Fullscreen is optional. Browser refusal must not affect the title or saved preferences.
    }
    this.sync();
  }

  private handleFullscreenChange = (): void => {
    this.sync();
  };
}

let manager: TitleSettingsEnhancementManager | null = null;

export function getTitleSettingsEnhancementManager(
  game: Phaser.Game,
): TitleSettingsEnhancementManager {
  manager ??= new TitleSettingsEnhancementManager(game);
  return manager;
}
