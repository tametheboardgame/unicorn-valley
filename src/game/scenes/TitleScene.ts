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
import { resolveContinueDestination } from '../save/ContinueLocation';
import {
  UI_COLOURS,
  UI_FONT,
  applyButtonHover,
  createUiShadow,
  setButtonEnabled,
} from '../ui/uiTheme';
import { resetMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';

const BUILD_LABEL = 'v0.1.0 • R6-WP6.11';
const MENU_X = 955;
const MENU_WIDTH = 430;
const MENU_BUTTON_WIDTH = 330;
const MENU_BUTTON_HEIGHT = 58;

type TitleVisibleObject = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text;

interface MenuButton {
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface SettingRow {
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  kind: 'muted' | 'music' | 'ambience' | 'sfx' | 'reduced-motion' | 'high-visibility';
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
  private starting = false;
  private hasCreatedUnicorn = false;
  private unsupportedSaveVersion = false;
  private storageUnavailable = false;
  private resetArmed = false;
  private continueScene = 'MoonflowerGladeScene';
  private continueStatus = 'Your unicorn is waiting in Moonflower Glade.';

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

    const saveService = getBrowserSaveService();
    const loadResult = saveService.loadWithResult();
    this.unsupportedSaveVersion = loadResult.status === 'blocked-newer-version';
    this.storageUnavailable = loadResult.status === 'storage-failed';
    const save = loadResult.status === 'loaded' ? loadResult.save : null;
    this.hasCreatedUnicorn = Boolean(save?.profile.name);
    const continueDestination = resolveContinueDestination(save?.profile.currentLocationId);
    this.continueScene = continueDestination.sceneKey;
    this.continueStatus = continueDestination.status;

    this.cameras.main.setBackgroundColor('#49376f');
    this.createBuildInfo();
    this.createMenu();
    this.createSettingsOverlay();

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);

    this.audio.enterScene(this.scene.key);
    this.input.once('pointerdown', () => void this.audio.unlock());
    this.input.keyboard?.once('keydown', () => void this.audio.unlock());

    this.unsubscribeAccessibility = this.accessibility.subscribe(() => {
      this.refreshSettingsRows();
    });

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

  private createBuildInfo(): void {
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

    const menuSubtitle = this.storageUnavailable
      ? 'Your adventure could not be opened just now.'
      : this.unsupportedSaveVersion
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
    if (this.storageUnavailable) {
      const retry = this.createMenuButton(nextY, 'Try Again', 'retry-save', UI_COLOURS.gold, () =>
        this.retryStorageAccess(),
      );
      this.primaryButton = retry.button;
      nextY += 76;
    } else if (this.unsupportedSaveVersion) {
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

    if (!this.unsupportedSaveVersion && !this.storageUnavailable) {
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

    const status = this.storageUnavailable
      ? 'Your adventure is still safe. Check this browser, then try again.'
      : this.unsupportedSaveVersion
        ? 'Your save is safe. Refresh to load the newer game version.'
        : this.hasCreatedUnicorn
          ? this.continueStatus
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

  private activatePrimaryAction(): void {
    if (this.storageUnavailable) {
      this.retryStorageAccess();
      return;
    }
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
        this.statusText?.setText(this.continueStatus);
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

  private retryStorageAccess(): void {
    if (this.starting) {
      return;
    }
    this.setStarting('Trying to open your adventure again…');
    this.scene.restart();
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
