import Phaser from 'phaser';
import {
  getBrowserAccessibilitySettingsStore,
  type AccessibilitySettings,
} from '../accessibility/AccessibilitySettings';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  UI_COLOURS,
  UI_FONT,
  applyButtonHover,
  createUiShadow,
  setButtonEnabled,
} from '../ui/uiTheme';
import { COTTAGE_INTERIOR_LOCATION_ID } from '../world/CottageInteriorMap';
import { resetMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';
import { RAINBOW_MEADOW_LOCATION_ID } from '../world/RainbowMeadowMap';
import { SUNBEAM_VILLAGE_LOCATION_ID } from '../world/SunbeamVillageMap';

const BUILD_LABEL = 'v0.1.0 • R6-WP6.11';
const MENU_X = 955;
const MENU_WIDTH = 430;
const MENU_BUTTON_WIDTH = 330;
const MENU_BUTTON_HEIGHT = 58;

type TitleVisibleObject =
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Text
  | Phaser.GameObjects.Graphics;

interface MenuButton {
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface SettingRow {
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  kind: 'muted' | 'music' | 'ambience' | 'sfx' | 'reduced-motion' | 'high-visibility';
}

function resolveContinueScene(currentLocationId: string | undefined): string {
  if (currentLocationId === COTTAGE_INTERIOR_LOCATION_ID) {
    return 'CottageInteriorScene';
  }

  if (currentLocationId === SUNBEAM_VILLAGE_LOCATION_ID) {
    return 'SunbeamVillageScene';
  }

  if (currentLocationId === RAINBOW_MEADOW_LOCATION_ID) {
    return 'RainbowMeadowScene';
  }

  return 'MoonflowerGladeScene';
}

function resolveContinueStatus(sceneKey: string): string {
  if (sceneKey === 'CottageInteriorScene') {
    return 'Your unicorn is cosy inside Moonflower Cottage.';
  }

  if (sceneKey === 'SunbeamVillageScene') {
    return 'Your unicorn is waiting in Sunbeam Village.';
  }

  if (sceneKey === 'RainbowMeadowScene') {
    return 'Your unicorn is waiting in Rainbow Meadow.';
  }

  return 'Your unicorn is waiting in Moonflower Glade.';
}

export class TitleScene extends Phaser.Scene {
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly audio = getVerticalSliceAudio();
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private primaryButton: Phaser.GameObjects.Rectangle | null = null;
  private newGameMenuButton: MenuButton | null = null;
  private menuButtons: MenuButton[] = [];
  private settingsObjects: TitleVisibleObject[] = [];
  private settingsRows: SettingRow[] = [];
  private settingsOpen = false;
  private unsubscribeAccessibility: (() => void) | null = null;
  private ambientTargets: Phaser.GameObjects.GameObject[] = [];
  private starting = false;
  private hasCreatedUnicorn = false;
  private unsupportedSaveVersion = false;
  private resetArmed = false;
  private continueScene = 'MoonflowerGladeScene';

  public constructor() {
    super('TitleScene');
  }

  public create(): void {
    this.starting = false;
    this.resetArmed = false;
    this.settingsOpen = false;
    this.menuButtons = [];
    this.settingsObjects = [];
    this.settingsRows = [];
    this.ambientTargets = [];

    const saveService = getBrowserSaveService();
    const loadedSave = saveService.load();
    this.unsupportedSaveVersion = saveService.hasUnsupportedSaveVersion();
    const save = this.unsupportedSaveVersion ? null : loadedSave;
    this.hasCreatedUnicorn = Boolean(save?.profile.name);
    this.continueScene = resolveContinueScene(save?.profile.currentLocationId);

    this.cameras.main.setBackgroundColor('#7ac4df');
    this.createValleyArtwork();
    this.createTitleLockup();
    this.createMenu();
    this.createSettingsOverlay();

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);

    this.audio.enterScene(this.scene.key);
    this.input.once('pointerdown', () => void this.audio.unlock());
    this.input.keyboard?.once('keydown', () => void this.audio.unlock());

    this.unsubscribeAccessibility = this.accessibility.subscribe(() => {
      this.refreshSettingsRows();
      this.applyMotionPreference();
    });
    this.applyMotionPreference();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeAccessibility?.();
      this.unsubscribeAccessibility = null;
      this.audio.leaveScene(this.scene.key);
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.primaryButton = null;
      this.newGameMenuButton = null;
      this.statusText = null;
      this.menuButtons = [];
      this.settingsObjects = [];
      this.settingsRows = [];
      this.ambientTargets = [];
    });
  }

  public update(): void {
    this.inputController?.update();

    if (this.settingsOpen) {
      return;
    }

    if (this.inputController?.justPressed('INTERACT')) {
      this.activatePrimaryAction();
    }
  }

  private createValleyArtwork(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x79c7df, 1)
      .setName('title-art:sky');
    this.add
      .rectangle(GAME_WIDTH / 2, 190, GAME_WIDTH, 380, 0xb8e5ef, 0.58)
      .setName('title-art:sky-glow');

    const sunGlow = this.add
      .circle(180, 126, 88, 0xfff0ae, 0.24)
      .setName('title-art:sun-glow')
      .setDepth(1);
    const sun = this.add.circle(180, 126, 52, 0xfff3b7, 0.94).setName('title-art:sun').setDepth(2);
    this.ambientTargets.push(sunGlow, sun);

    const rainbow = this.add.graphics().setName('title-art:rainbow').setDepth(2);
    const rainbowBands = [
      { colour: 0xf4a9c7, radius: 190 },
      { colour: 0xf7cf8c, radius: 176 },
      { colour: 0xf3e8a0, radius: 162 },
      { colour: 0xaedcb4, radius: 148 },
      { colour: 0xaed7ed, radius: 134 },
      { colour: 0xc4b8e8, radius: 120 },
    ];
    for (const band of rainbowBands) {
      rainbow.lineStyle(12, band.colour, 0.72);
      rainbow.beginPath();
      rainbow.arc(500, 365, band.radius, Math.PI, Math.PI * 2, false);
      rainbow.strokePath();
    }

    const distant = this.add.graphics().setName('title-art:distant-hills').setDepth(3);
    distant.fillStyle(0x80b9a5, 1);
    distant.fillEllipse(300, 510, 620, 330);
    distant.fillEllipse(730, 500, 720, 350);
    distant.fillEllipse(1120, 525, 460, 250);
    distant.fillStyle(0xa0cfaa, 1);
    distant.fillEllipse(120, 570, 540, 300);
    distant.fillEllipse(560, 570, 760, 330);
    distant.fillEllipse(1010, 585, 700, 310);

    const meadow = this.add.graphics().setName('title-art:meadow').setDepth(4);
    meadow.fillStyle(0x77b982, 1);
    meadow.fillRect(0, 510, GAME_WIDTH, 210);
    meadow.fillStyle(0x92ca8d, 1);
    meadow.fillEllipse(430, 620, 950, 280);
    meadow.fillEllipse(1050, 635, 720, 250);

    const path = this.add.graphics().setName('title-art:path').setDepth(5);
    path.fillStyle(0xf4ddb0, 0.94);
    path.beginPath();
    path.moveTo(420, 720);
    path.lineTo(700, 720);
    path.lineTo(608, 505);
    path.lineTo(550, 505);
    path.closePath();
    path.fillPath();

    this.createCloud(340, 128, 0.9, 0.76, 0);
    this.createCloud(720, 105, 1.12, 0.68, 1);
    this.createCloud(1060, 195, 0.76, 0.62, 2);
    this.createCottage(575, 470);
    this.createFlowerCluster(92, 598, 0);
    this.createFlowerCluster(245, 640, 1);
    this.createFlowerCluster(735, 603, 2);
    this.createFlowerCluster(820, 665, 3);

    const sparklePositions = [
      [286, 246],
      [356, 314],
      [656, 232],
      [770, 304],
      [126, 330],
      [845, 186],
    ] as const;
    sparklePositions.forEach(([x, y], index) => {
      const sparkle = this.add
        .text(x, y, index % 2 === 0 ? '✦' : '✧', {
          color: index % 3 === 0 ? '#fff5bd' : '#fff7ff',
          fontFamily: UI_FONT,
          fontSize: index % 2 === 0 ? '24px' : '18px',
          stroke: '#8d6ab0',
          strokeThickness: 2,
        })
        .setName(`title-art:sparkle-${index}`)
        .setOrigin(0.5)
        .setDepth(7);
      this.ambientTargets.push(sparkle);
      this.tweens.add({
        targets: sparkle,
        alpha: 0.3,
        scale: 1.18,
        y: y - 7,
        duration: 1000 + index * 160,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

    this.tweens.add({
      targets: [sunGlow, sun],
      scale: 1.05,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createCloud(x: number, y: number, scale: number, alpha: number, index: number): void {
    const cloud = this.add.container(x, y).setName(`title-art:cloud-${index}`).setDepth(2);
    const pieces = [
      this.add.circle(-44, 10, 31, 0xffffff, alpha),
      this.add.circle(-8, -7, 42, 0xffffff, alpha),
      this.add.circle(34, 6, 34, 0xffffff, alpha),
      this.add.rectangle(0, 20, 120, 38, 0xffffff, alpha),
    ];
    cloud.add(pieces).setScale(scale);
    this.ambientTargets.push(cloud);
    this.tweens.add({
      targets: cloud,
      x: x + 18 + index * 4,
      duration: 5200 + index * 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createCottage(x: number, y: number): void {
    const cottage = this.add.graphics().setName('title-art:cottage').setDepth(6);
    cottage.fillStyle(0xf6e8cf, 1);
    cottage.fillRoundedRect(x - 62, y - 48, 124, 92, 18);
    cottage.lineStyle(4, 0x8b6b70, 0.78);
    cottage.strokeRoundedRect(x - 62, y - 48, 124, 92, 18);
    cottage.fillStyle(0xa86f8e, 1);
    cottage.beginPath();
    cottage.moveTo(x - 78, y - 43);
    cottage.lineTo(x, y - 105);
    cottage.lineTo(x + 78, y - 43);
    cottage.closePath();
    cottage.fillPath();
    cottage.fillStyle(0x7f5c70, 1);
    cottage.fillRoundedRect(x - 17, y - 5, 34, 49, 10);
    cottage.fillStyle(0xbce4e9, 1);
    cottage.fillRoundedRect(x - 49, y - 22, 26, 27, 7);
    cottage.fillRoundedRect(x + 23, y - 22, 26, 27, 7);
    cottage.lineStyle(3, 0xffffff, 0.75);
    cottage.lineBetween(x - 36, y - 20, x - 36, y + 3);
    cottage.lineBetween(x + 36, y - 20, x + 36, y + 3);
  }

  private createFlowerCluster(x: number, y: number, index: number): void {
    const colours = [0xffd2e5, 0xffefad, 0xdac9f5, 0xc8eff2];
    for (let offset = 0; offset < 4; offset += 1) {
      const flower = this.add
        .circle(
          x + offset * 18,
          y + (offset % 2) * 8,
          7,
          colours[(index + offset) % colours.length],
          1,
        )
        .setName(`title-art:flower-${index}-${offset}`)
        .setDepth(6);
      this.add.circle(flower.x, flower.y, 2.5, 0xfff7cd, 1).setDepth(7);
    }
  }

  private createTitleLockup(): void {
    const titleX = 380;
    const titleY = 210;
    createUiShadow(this, titleX, titleY + 14, 610, 178, 9, 0.2);
    this.add
      .rectangle(titleX, titleY, 610, 178, 0x664a8c, 0.66)
      .setName('title-lockup-panel')
      .setStrokeStyle(4, 0xf2dff5, 0.62)
      .setDepth(10);

    this.add
      .text(titleX, titleY - 22, 'Unicorn Valley', {
        color: '#fffaff',
        fontFamily: UI_FONT,
        fontSize: '68px',
        fontStyle: 'bold',
        stroke: '#4b356f',
        strokeThickness: 9,
        align: 'center',
      })
      .setName('title-lockup-name')
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(titleX, titleY + 50, 'A little valley. A lot of magic.', {
        color: '#fff0c6',
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setName('title-lockup-tagline')
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(34, GAME_HEIGHT - 24, BUILD_LABEL, {
        color: '#ecf8ed',
        fontFamily: UI_FONT,
        fontSize: '12px',
        backgroundColor: '#43675388',
        padding: { x: 8, y: 4 },
      })
      .setName('title-build-info')
      .setOrigin(0, 1)
      .setDepth(20);
  }

  private createMenu(): void {
    createUiShadow(this, MENU_X, 372, MENU_WIDTH, 520, 12, 0.25);
    this.add
      .rectangle(MENU_X, 364, MENU_WIDTH, 520, UI_COLOURS.cream, 0.96)
      .setName('title-menu-panel')
      .setStrokeStyle(5, UI_COLOURS.ribbonStrong, 0.92)
      .setDepth(13);

    this.add
      .text(MENU_X, 136, this.hasCreatedUnicorn ? 'Welcome back!' : 'Welcome!', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setName('title-menu-heading')
      .setOrigin(0.5)
      .setDepth(14);

    const menuSubtitle = this.unsupportedSaveVersion
      ? 'Your save was made by a newer version.'
      : this.hasCreatedUnicorn
        ? 'Your valley is ready when you are.'
        : 'Make a unicorn and begin your adventure.';
    this.add
      .text(MENU_X, 174, menuSubtitle, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '16px',
        align: 'center',
        wordWrap: { width: 350 },
      })
      .setName('title-menu-subtitle')
      .setOrigin(0.5)
      .setDepth(14);

    let nextY = 238;
    if (this.unsupportedSaveVersion) {
      const refresh = this.createMenuButton(
        nextY,
        'Refresh to Continue',
        'refresh',
        UI_COLOURS.gold,
        () => this.refreshForNewerSave(),
      );
      this.primaryButton = refresh.button;
      nextY += 76;
    } else if (this.hasCreatedUnicorn) {
      const continueButton = this.createMenuButton(
        nextY,
        'Continue',
        'continue',
        UI_COLOURS.gold,
        () => this.continueGame(),
      );
      this.primaryButton = continueButton.button;
      nextY += 76;
    }

    if (!this.unsupportedSaveVersion) {
      const newGame = this.createMenuButton(
        nextY,
        'New Game',
        'new-game',
        this.hasCreatedUnicorn ? UI_COLOURS.lavender : UI_COLOURS.gold,
        () => this.handleNewGame(),
      );
      this.newGameMenuButton = newGame;
      if (!this.hasCreatedUnicorn) {
        this.primaryButton = newGame.button;
      }
      nextY += 76;

      if (this.hasCreatedUnicorn) {
        this.createMenuButton(nextY, 'My Unicorn', 'my-unicorn', UI_COLOURS.blush, () => {
          this.audio.playSfx('ui');
          this.scene.start('UnicornCreatorScene');
        });
        nextY += 76;
      }
    }

    this.createMenuButton(nextY, 'Settings', 'settings', UI_COLOURS.mint, () => {
      this.audio.playSfx('ui');
      this.setSettingsVisible(true);
    });

    const status = this.unsupportedSaveVersion
      ? 'Your save is safe. Refresh to load the newer game version.'
      : this.hasCreatedUnicorn
        ? resolveContinueStatus(this.continueScene)
        : 'First, make a unicorn that feels like yours.';
    this.statusText = this.add
      .text(MENU_X, 606, status, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        align: 'center',
        wordWrap: { width: 355 },
      })
      .setName('title-menu-status')
      .setOrigin(0.5)
      .setDepth(14);

    this.add
      .text(MENU_X, 655, 'Enter chooses the main action • tap any button', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        align: 'center',
      })
      .setName('title-menu-input-hint')
      .setOrigin(0.5)
      .setDepth(14);
  }

  private createMenuButton(
    y: number,
    text: string,
    name: string,
    fill: number,
    onActivate: () => void,
  ): MenuButton {
    createUiShadow(this, MENU_X, y, MENU_BUTTON_WIDTH, MENU_BUTTON_HEIGHT, 14, 0.16);
    const button = this.add
      .rectangle(MENU_X, y, MENU_BUTTON_WIDTH, MENU_BUTTON_HEIGHT, fill, 1)
      .setName(`title-menu-${name}`)
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.98)
      .setInteractive({ useHandCursor: true })
      .setDepth(15);
    const label = this.add
      .text(MENU_X, y, text, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setName(`title-menu-${name}-label`)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(16);

    applyButtonHover(button, fill, UI_COLOURS.cream);
    button.on('pointerdown', onActivate);
    label.on('pointerdown', onActivate);
    this.menuButtons.push({ button, label });
    return { button, label };
  }

  private createSettingsOverlay(): void {
    const backdrop = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x302545, 0.72)
      .setName('title-settings-backdrop')
      .setDepth(200);
    const panelShadow = createUiShadow(this, GAME_WIDTH / 2, 362, 600, 590, 201, 0.28);
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, 354, 600, 590, UI_COLOURS.cream, 1)
      .setName('title-settings-panel')
      .setStrokeStyle(5, UI_COLOURS.ribbonStrong, 1)
      .setDepth(202);
    const heading = this.add
      .text(GAME_WIDTH / 2, 94, 'Settings', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setName('title-settings-heading')
      .setOrigin(0.5)
      .setDepth(203);
    const hint = this.add
      .text(GAME_WIDTH / 2, 132, 'Make the valley comfortable for you.', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '16px',
      })
      .setName('title-settings-hint')
      .setOrigin(0.5)
      .setDepth(203);

    this.settingsObjects.push(backdrop, panelShadow, panel, heading, hint);

    const settingKinds: SettingRow['kind'][] = [
      'muted',
      'music',
      'ambience',
      'sfx',
      'reduced-motion',
      'high-visibility',
    ];
    settingKinds.forEach((kind, index) => {
      const rowY = 190 + index * 60;
      const rowButton = this.add
        .rectangle(GAME_WIDTH / 2, rowY, 470, 50, UI_COLOURS.lavender, 1)
        .setName(`title-setting-${kind}`)
        .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.95)
        .setDepth(203);
      const rowLabel = this.add
        .text(GAME_WIDTH / 2, rowY, '', {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
        })
        .setName(`title-setting-${kind}-label`)
        .setOrigin(0.5)
        .setDepth(204);
      const toggle = () => this.toggleSetting(kind);
      rowButton.on('pointerdown', toggle);
      rowLabel.on('pointerdown', toggle);
      this.settingsRows.push({ button: rowButton, label: rowLabel, kind });
      this.settingsObjects.push(rowButton, rowLabel);
    });

    const doneButton = this.add
      .rectangle(GAME_WIDTH / 2, 574, 240, 54, UI_COLOURS.gold, 1)
      .setName('title-settings-done')
      .setStrokeStyle(4, UI_COLOURS.goldStrong, 1)
      .setDepth(203);
    const doneLabel = this.add
      .text(GAME_WIDTH / 2, 574, 'Done', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setName('title-settings-done-label')
      .setOrigin(0.5)
      .setDepth(204);
    const close = () => {
      this.audio.playSfx('ui-back');
      this.setSettingsVisible(false);
    };
    doneButton.on('pointerdown', close);
    doneLabel.on('pointerdown', close);
    this.settingsObjects.push(doneButton, doneLabel);

    this.refreshSettingsRows();
    this.setSettingsVisible(false);
  }

  private refreshSettingsRows(): void {
    const audioSettings = this.audio.getSettings();
    const accessibility = this.accessibility.load();
    for (const row of this.settingsRows) {
      let enabled = true;
      let text = '';
      switch (row.kind) {
        case 'muted':
          enabled = !audioSettings.muted;
          text = `All sound: ${enabled ? 'On' : 'Off'}`;
          break;
        case 'music':
          enabled = audioSettings.musicEnabled;
          text = `Music: ${enabled ? 'On' : 'Off'}`;
          break;
        case 'ambience':
          enabled = audioSettings.ambienceEnabled;
          text = `Ambience: ${enabled ? 'On' : 'Off'}`;
          break;
        case 'sfx':
          enabled = audioSettings.sfxEnabled;
          text = `Effects: ${enabled ? 'On' : 'Off'}`;
          break;
        case 'reduced-motion':
          enabled = accessibility.reducedMotion;
          text = `Reduced motion: ${enabled ? 'On' : 'Off'}`;
          break;
        case 'high-visibility':
          enabled = accessibility.highVisibilityInteractions;
          text = `High visibility: ${enabled ? 'On' : 'Off'}`;
          break;
      }
      row.label.setText(text);
      row.button
        .setFillStyle(enabled ? UI_COLOURS.mint : UI_COLOURS.lavender, 1)
        .setStrokeStyle(3, enabled ? UI_COLOURS.mintStrong : UI_COLOURS.lavenderStrong, 0.98);
    }
  }

  private toggleSetting(kind: SettingRow['kind']): void {
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
    } else {
      const settings = this.accessibility.load();
      const patch: Partial<AccessibilitySettings> =
        kind === 'reduced-motion'
          ? { reducedMotion: !settings.reducedMotion }
          : { highVisibilityInteractions: !settings.highVisibilityInteractions };
      this.accessibility.update(patch);
    }
    this.audio.playSfx('ui');
    this.refreshSettingsRows();
  }

  private setSettingsVisible(visible: boolean): void {
    this.settingsOpen = visible;
    for (const object of this.settingsObjects) {
      object.setVisible(visible);
    }

    const backdrop = this.children.getByName('title-settings-backdrop');
    if (backdrop instanceof Phaser.GameObjects.Rectangle) {
      if (visible) {
        backdrop.setInteractive();
      } else {
        backdrop.disableInteractive();
      }
    }

    for (const row of this.settingsRows) {
      if (visible) {
        row.button.setInteractive({ useHandCursor: true });
        row.label.setInteractive({ useHandCursor: true });
      } else {
        row.button.disableInteractive();
        row.label.disableInteractive();
      }
    }

    const doneButton = this.children.getByName('title-settings-done');
    const doneLabel = this.children.getByName('title-settings-done-label');
    if (doneButton instanceof Phaser.GameObjects.Rectangle) {
      visible
        ? doneButton.setInteractive({ useHandCursor: true })
        : doneButton.disableInteractive();
    }
    if (doneLabel instanceof Phaser.GameObjects.Text) {
      visible ? doneLabel.setInteractive({ useHandCursor: true }) : doneLabel.disableInteractive();
    }
  }

  private applyMotionPreference(): void {
    const reducedMotion = this.accessibility.load().reducedMotion;
    for (const target of this.ambientTargets) {
      for (const tween of this.tweens.getTweensOf(target)) {
        tween.timeScale = reducedMotion ? 0 : 1;
      }
    }
  }

  private activatePrimaryAction(): void {
    if (this.unsupportedSaveVersion) {
      this.refreshForNewerSave();
      return;
    }
    if (this.hasCreatedUnicorn) {
      this.continueGame();
      return;
    }
    this.handleNewGame();
  }

  private handleNewGame(): void {
    if (this.starting || this.unsupportedSaveVersion) {
      return;
    }

    if (this.hasCreatedUnicorn) {
      this.requestStartOver();
      return;
    }

    this.beginNewGame();
  }

  private requestStartOver(): void {
    const menuButton = this.newGameMenuButton;
    if (!menuButton || this.starting) {
      return;
    }

    if (!this.resetArmed) {
      this.resetArmed = true;
      menuButton.label.setText('Tap again to start over');
      menuButton.button.setFillStyle(UI_COLOURS.blush, 1);
      this.statusText?.setText('This replaces your current adventure. Tap again to be sure.');
      this.time.delayedCall(4000, () => {
        if (!this.resetArmed || this.starting) {
          return;
        }
        this.resetArmed = false;
        menuButton.label.setText('New Game');
        menuButton.button.setFillStyle(UI_COLOURS.lavender, 1);
        this.statusText?.setText(resolveContinueStatus(this.continueScene));
      });
      return;
    }

    this.beginNewGame();
  }

  private beginNewGame(): void {
    this.setStarting('Opening the unicorn maker…');
    const service = getBrowserSaveService();
    const result = service.resetToNewGameWithResult();
    if (result.status !== 'saved') {
      this.starting = false;
      this.resetArmed = false;
      this.newGameMenuButton?.label.setText('New Game');
      this.newGameMenuButton?.button.setFillStyle(
        this.hasCreatedUnicorn ? UI_COLOURS.lavender : UI_COLOURS.gold,
        1,
      );
      this.statusText?.setText(
        this.hasCreatedUnicorn
          ? 'The new adventure could not be saved. Your current adventure is still safe.'
          : 'The valley could not create a save. Please try New Game again.',
      );
      this.setMenuEnabled(true);
      return;
    }

    resetMoonflowerGladePlayerSpawn();
    this.time.delayedCall(120, () => this.scene.start('UnicornCreatorScene'));
  }

  private continueGame(): void {
    if (this.starting || !this.hasCreatedUnicorn || this.unsupportedSaveVersion) {
      return;
    }

    this.setStarting('Welcome back…');
    this.time.delayedCall(120, () => this.scene.start(this.continueScene));
  }

  private refreshForNewerSave(): void {
    if (this.starting) {
      return;
    }
    this.setStarting('Refreshing so your newer save stays safe…');
    globalThis.location.reload();
  }

  private setStarting(message: string): void {
    this.starting = true;
    this.resetArmed = false;
    this.statusText?.setText(message);
    this.primaryButton?.setStrokeStyle(6, UI_COLOURS.goldStrong, 1);
    this.setMenuEnabled(false);
  }

  private setMenuEnabled(enabled: boolean): void {
    for (const menuButton of this.menuButtons) {
      setButtonEnabled(menuButton.button, enabled);
      if (enabled) {
        menuButton.label.setAlpha(1).setInteractive({ useHandCursor: true });
      } else {
        menuButton.label.setAlpha(0.52).disableInteractive();
      }
    }
  }
}
