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
const PANEL_Y = 225;
const PANEL_WIDTH = 330;
const PANEL_HEIGHT = 270;

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
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.98)
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
      .setStrokeStyle(5, UI_COLOURS.lavenderStrong, 1)
      .setScrollFactor(0)
      .setDepth(132);
    const ribbon = scene.add
      .rectangle(PANEL_X, PANEL_Y - PANEL_HEIGHT / 2 + 32, 236, 48, UI_COLOURS.lavender, 1)
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 1)
      .setScrollFactor(0)
      .setDepth(133);
    const heading = scene.add
      .text(PANEL_X, PANEL_Y - PANEL_HEIGHT / 2 + 32, 'Sound & music ✨', {
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
      const rowY = PANEL_Y - 62 + index * 48;
      const rowButton = scene.add
        .rectangle(PANEL_X, rowY, 270, 38, UI_COLOURS.lavender, 1)
        .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 0.95)
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
      applyButtonHover(rowButton, UI_COLOURS.lavender, UI_COLOURS.gold);
      rowButton.on('pointerdown', () => this.toggleSetting(kind));
      this.rows.push({ button: rowButton, label: rowLabel, kind });
      this.panelObjects.push(rowButton, rowLabel);
    });

    const hint = scene.add
      .text(
        PANEL_X,
        PANEL_Y + PANEL_HEIGHT / 2 - 18,
        'Everything important is also shown on screen.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '12px',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(134);
    this.panelObjects.push(hint);
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
      if (row.kind === 'muted') {
        row.label.setText(`All sound: ${settings.muted ? 'Off' : 'On'}`);
      } else if (row.kind === 'music') {
        row.label.setText(`Music: ${settings.musicEnabled ? 'On' : 'Off'}`);
      } else if (row.kind === 'ambience') {
        row.label.setText(`Ambience: ${settings.ambienceEnabled ? 'On' : 'Off'}`);
      } else {
        row.label.setText(`Effects: ${settings.sfxEnabled ? 'On' : 'Off'}`);
      }
    }
  }

  private setPanelVisible(visible: boolean): void {
    for (const object of this.panelObjects) {
      object.setVisible(visible);
    }
  }
}
