import Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_WIDTH } from '../config/gameConstants';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from './uiTheme';

interface SettingRow {
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  kind: 'muted' | 'music' | 'ambience' | 'sfx';
}

type VisiblePanelObject = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text;

const PANEL_X = GAME_WIDTH - 190;
const PANEL_Y = 235;
const PANEL_WIDTH = 330;
const PANEL_HEIGHT = 390;

export class AudioSettingsPanel {
  private readonly audio = getVerticalSliceAudio();
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly panelObjects: VisiblePanelObject[] = [];
  private readonly rows: SettingRow[] = [];
  private readonly button: Phaser.GameObjects.Rectangle;
  private readonly buttonLabel: Phaser.GameObjects.Text;
  private isOpen = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly manageSceneAudio = true,
  ) {
    const buttonX = GAME_WIDTH - 250;
    const buttonY = 58;
    const buttonShadow = createUiShadow(scene, buttonX, buttonY, 142, 64, 119, 0.16);
    this.button = scene.add
      .rectangle(buttonX, buttonY, 142, 64, UI_COLOURS.cream, 0.98)
      .setName('exploration-shell-sound-button')
      .setStrokeStyle(4, UI_COLOURS.ribbonStrong, 0.98)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });
    this.buttonLabel = scene.add
      .text(buttonX, buttonY, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName('exploration-shell-sound-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    applyButtonHover(this.button, UI_COLOURS.cream, UI_COLOURS.gold);
    this.objects.push(buttonShadow, this.button, this.buttonLabel);

    const panelShadow = createUiShadow(
      scene,
      PANEL_X,
      PANEL_Y,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      131,
      0.22,
    );
    const panel = scene.add
      .rectangle(PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, UI_COLOURS.cream, 0.99)
      .setName('exploration-shell-sound-panel')
      .setStrokeStyle(5, UI_COLOURS.ribbonStrong, 1)
      .setScrollFactor(0)
      .setDepth(132);
    const ribbon = scene.add
      .rectangle(PANEL_X, PANEL_Y - PANEL_HEIGHT / 2 + 34, 250, 50, UI_COLOURS.ribbon, 1)
      .setStrokeStyle(3, UI_COLOURS.ribbonStrong, 1)
      .setScrollFactor(0)
      .setDepth(133);
    const heading = scene.add
      .text(PANEL_X, PANEL_Y - PANEL_HEIGHT / 2 + 34, 'Sound & music ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(134);
    this.panelObjects.push(panelShadow, panel, ribbon, heading);

    const rowKinds: SettingRow['kind'][] = ['muted', 'music', 'ambience', 'sfx'];
    rowKinds.forEach((kind, index) => {
      const rowY = PANEL_Y - 68 + index * 52;
      const rowButton = scene.add
        .rectangle(PANEL_X, rowY, 270, 48, UI_COLOURS.lavender, 1)
        .setName(`audio-setting-${kind}`)
        .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.95)
        .setScrollFactor(0)
        .setDepth(133)
        .setInteractive({ useHandCursor: true });
      const rowLabel = scene.add
        .text(PANEL_X, rowY, '', {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '16px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(134);
      rowButton.on('pointerover', () => rowButton.setAlpha(0.82));
      rowButton.on('pointerout', () => {
        rowButton.setAlpha(1);
        this.refresh();
      });
      rowButton.on('pointerdown', () => this.toggleSetting(kind));
      this.rows.push({ button: rowButton, label: rowLabel, kind });
      this.panelObjects.push(rowButton, rowLabel);
    });

    const fullSettingsButton = scene.add
      .rectangle(PANEL_X, 390, 270, 64, UI_COLOURS.gold, 1)
      .setName('exploration-shell-settings-button')
      .setStrokeStyle(3, UI_COLOURS.goldStrong, 1)
      .setScrollFactor(0)
      .setDepth(133)
      .setInteractive({ useHandCursor: true });
    const fullSettingsLabel = scene.add
      .text(PANEL_X, 390, 'More settings ⚙️', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setName('exploration-shell-settings-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(134);
    applyButtonHover(fullSettingsButton, UI_COLOURS.gold, UI_COLOURS.cream);
    fullSettingsButton.on('pointerdown', () => this.openFullSettings());
    fullSettingsLabel.setInteractive({ useHandCursor: true });
    fullSettingsLabel.on('pointerdown', () => this.openFullSettings());
    this.panelObjects.push(fullSettingsButton, fullSettingsLabel);
    this.objects.push(...this.panelObjects);

    this.button.on('pointerdown', () => {
      void this.audio.unlock();
      this.audio.playSfx('ui');
      this.isOpen = !this.isOpen;
      this.setPanelVisible(this.isOpen);
    });

    if (this.manageSceneAudio) {
      this.audio.enterScene(scene.scene.key);
    }
    scene.input.once('pointerdown', () => void this.audio.unlock());
    scene.input.keyboard?.once('keydown', () => void this.audio.unlock());

    this.refresh();
    this.setPanelVisible(false);
  }

  public destroy(): void {
    if (this.manageSceneAudio) {
      this.audio.leaveScene(this.scene.scene.key);
    }
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
    this.panelObjects.length = 0;
    this.rows.length = 0;
  }

  private openFullSettings(): void {
    if (!this.scene.scene.isActive() || this.scene.scene.isActive('SettingsScene')) {
      return;
    }
    void this.audio.unlock();
    this.audio.playSfx('ui');
    this.isOpen = false;
    this.setPanelVisible(false);
    const returnScene = this.scene.scene.key;
    this.scene.scene.launch('SettingsScene', { returnScene });
    this.scene.scene.pause();
  }

  private toggleSetting(kind: SettingRow['kind']): void {
    const settings = this.audio.getSettings();
    if (kind === 'muted') {
      this.audio.updateSettings({ muted: !settings.muted });
    } else if (kind === 'music') {
      this.audio.updateSettings({ musicEnabled: !settings.musicEnabled });
    } else if (kind === 'ambience') {
      this.audio.updateSettings({ ambienceEnabled: !settings.ambienceEnabled });
    } else {
      this.audio.updateSettings({ sfxEnabled: !settings.sfxEnabled });
    }

    this.audio.playSfx('ui');
    this.refresh();
  }

  private refresh(): void {
    const settings = this.audio.getSettings();
    this.buttonLabel.setText(settings.muted ? 'Sound 🔇' : 'Sound 🔊');

    for (const row of this.rows) {
      let enabled = true;
      if (row.kind === 'muted') {
        enabled = !settings.muted;
        row.label.setText(`All sound: ${enabled ? 'On' : 'Off'}`);
      } else if (row.kind === 'music') {
        enabled = settings.musicEnabled;
        row.label.setText(`Music: ${enabled ? 'On' : 'Off'}`);
      } else if (row.kind === 'ambience') {
        enabled = settings.ambienceEnabled;
        row.label.setText(`Ambience: ${enabled ? 'On' : 'Off'}`);
      } else {
        enabled = settings.sfxEnabled;
        row.label.setText(`Effects: ${enabled ? 'On' : 'Off'}`);
      }
      row.button
        .setFillStyle(enabled ? UI_COLOURS.mint : UI_COLOURS.blush, 1)
        .setStrokeStyle(3, enabled ? UI_COLOURS.mintStrong : UI_COLOURS.blushStrong, 1);
    }
  }

  private setPanelVisible(visible: boolean): void {
    for (const object of this.panelObjects) {
      object.setVisible(visible);
    }
  }
}
