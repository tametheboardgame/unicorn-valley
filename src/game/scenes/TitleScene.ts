import Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { resolveContinueDestination } from '../save/ContinueLocation';
import { getBrowserSaveService } from '../save/browserSaveService';
import { AudioSettingsPanel } from '../ui/AudioSettingsPanel';
import { UI_DESIGN_TOKENS } from '../ui/UiDesignSystem';
import {
  createUiActionHitTarget,
  drawUiPanel,
  drawUiPanelShadow,
} from '../ui/UiPrimitives';
import { UI_COLOURS, UI_FONT, setButtonEnabled } from '../ui/uiTheme';
import { resetMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';

const BUILD_LABEL = 'v0.1.0 • R6-WP6.11';
const MENU_X = 955;
const MENU_WIDTH = 430;
const MENU_BUTTON_WIDTH = 342;
const MENU_BUTTON_HEIGHT = 58;
const MENU_BUTTON_GAP = 14;
const MENU_BUTTON_STEP = MENU_BUTTON_HEIGHT + MENU_BUTTON_GAP;
const MENU_PANEL_BASE_HEIGHT = 270;
const MENU_PANEL_DEPTH = 13;
const MENU_SURFACE_DEPTH = 14;
const MENU_HIT_DEPTH = 15;
const MENU_LABEL_DEPTH = 16;

interface MenuButton {
  button: Phaser.GameObjects.Rectangle;
  surface: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  fill: number;
  currentFill: number;
  y: number;
  enabled: boolean;
  activate: () => void;
}

export class TitleScene extends Phaser.Scene {
  private readonly audio = getVerticalSliceAudio();
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private settingsPanel: AudioSettingsPanel | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private primaryButton: Phaser.GameObjects.Rectangle | null = null;
  private newGameMenuButton: MenuButton | null = null;
  private menuButtons: MenuButton[] = [];
  private selectedMenuIndex = 0;
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
    this.menuButtons = [];
    this.selectedMenuIndex = 0;

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
    this.settingsPanel = new AudioSettingsPanel(this, false);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.input.keyboard?.on('keydown-UP', this.selectPreviousMenuItem, this);
    this.input.keyboard?.on('keydown-DOWN', this.selectNextMenuItem, this);

    this.audio.enterScene(this.scene.key);
    this.input.once('pointerdown', () => void this.audio.unlock());
    this.input.keyboard?.once('keydown', () => void this.audio.unlock());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-UP', this.selectPreviousMenuItem, this);
      this.input.keyboard?.off('keydown-DOWN', this.selectNextMenuItem, this);
      this.audio.leaveScene(this.scene.key);
      this.settingsPanel?.destroy();
      this.settingsPanel = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.primaryButton = null;
      this.newGameMenuButton = null;
      this.statusText = null;
      this.menuButtons = [];
    });
  }

  public update(): void {
    this.inputController?.update();

    if (this.inputController?.justPressed('INTERACT')) {
      this.activateSelectedMenuItem();
    }
  }

  private createBuildInfo(): void {
    this.add
      .text(24, GAME_HEIGHT - 18, BUILD_LABEL, {
        color: '#f4eef8',
        fontFamily: UI_FONT,
        fontSize: '11px',
        backgroundColor: '#30254566',
        padding: { x: 7, y: 3 },
      })
      .setName('title-build-info')
      .setOrigin(0, 1)
      .setAlpha(0.82)
      .setDepth(20);
  }

  private createMenu(): void {
    const actionCount = this.getMenuActionCount();
    const panelHeight = MENU_PANEL_BASE_HEIGHT + (actionCount - 1) * MENU_BUTTON_STEP;
    const panelY = GAME_HEIGHT / 2;
    const panelTop = panelY - panelHeight / 2;

    const panel = this.add.graphics().setName('title-menu-panel').setDepth(MENU_PANEL_DEPTH);
    drawUiPanelShadow(panel, MENU_X, panelY, MENU_WIDTH, panelHeight, UI_DESIGN_TOKENS.radius.panelPx, {
      alpha: 0.24,
      offsetX: 8,
      offsetY: 10,
    });
    drawUiPanel(panel, MENU_X, panelY, MENU_WIDTH, panelHeight, {
      fill: UI_COLOURS.cream,
      stroke: UI_COLOURS.ribbonStrong,
      lineWidth: UI_DESIGN_TOKENS.border.strongPx,
      radius: UI_DESIGN_TOKENS.radius.panelPx,
      alpha: 0.97,
    });
    panel.fillStyle(UI_COLOURS.parchment, 0.42);
    panel.fillRoundedRect(
      MENU_X - MENU_WIDTH / 2 + 12,
      panelTop + 12,
      MENU_WIDTH - 24,
      88,
      22,
    );
    panel.fillStyle(UI_COLOURS.white, 0.2);
    panel.fillRoundedRect(
      MENU_X - MENU_WIDTH / 2 + 22,
      panelTop + 20,
      MENU_WIDTH - 44,
      11,
      6,
    );

    const heading = this.storageUnavailable || this.unsupportedSaveVersion
      ? 'Welcome'
      : this.hasCreatedUnicorn
        ? 'Welcome back!'
        : 'Welcome to Unicorn Valley';
    this.add
      .text(MENU_X, panelTop + 39, heading, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: this.hasCreatedUnicorn ? '28px' : '25px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setName('title-menu-heading')
      .setOrigin(0.5)
      .setDepth(MENU_SURFACE_DEPTH);

    const menuSubtitle = this.storageUnavailable
      ? 'Your adventure could not be opened just now.'
      : this.unsupportedSaveVersion
        ? 'Your save was made by a newer version.'
        : this.hasCreatedUnicorn
          ? 'Your valley is ready when you are.'
          : 'Make a unicorn and begin your adventure.';
    this.add
      .text(MENU_X, panelTop + 79, menuSubtitle, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '16px',
        align: 'center',
        wordWrap: { width: 350 },
      })
      .setName('title-menu-subtitle')
      .setOrigin(0.5)
      .setDepth(MENU_SURFACE_DEPTH);

    let nextY = panelTop + 150;
    if (this.storageUnavailable) {
      const retry = this.createMenuButton(nextY, 'Try Again', 'retry-save', UI_COLOURS.gold, () =>
        this.retryStorageAccess(),
      );
      this.primaryButton = retry.button;
      nextY += MENU_BUTTON_STEP;
    } else if (this.unsupportedSaveVersion) {
      const refresh = this.createMenuButton(
        nextY,
        'Refresh to Continue',
        'refresh',
        UI_COLOURS.gold,
        () => this.refreshForNewerSave(),
      );
      this.primaryButton = refresh.button;
      nextY += MENU_BUTTON_STEP;
    } else if (this.hasCreatedUnicorn) {
      const continueButton = this.createMenuButton(
        nextY,
        'Continue',
        'continue',
        UI_COLOURS.gold,
        () => this.continueGame(),
      );
      this.primaryButton = continueButton.button;
      nextY += MENU_BUTTON_STEP;
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
      nextY += MENU_BUTTON_STEP;

      if (this.hasCreatedUnicorn) {
        this.createMenuButton(nextY, 'My Unicorn', 'my-unicorn', UI_COLOURS.blush, () => {
          this.audio.playSfx('ui');
          this.scene.start('UnicornCreatorScene');
        });
        nextY += MENU_BUTTON_STEP;
      }
    }

    this.createMenuButton(nextY, 'Settings', 'settings', UI_COLOURS.mint, () => {
      void this.settingsPanel?.openSettings();
    });

    const status = this.storageUnavailable
      ? 'Your adventure is still safe. Check this browser, then try again.'
      : this.unsupportedSaveVersion
        ? 'Your save is safe. Refresh to load the newer game version.'
        : this.hasCreatedUnicorn
          ? this.continueStatus
          : 'First, make a unicorn that feels like yours.';
    const statusY = panelTop + 222 + (actionCount - 1) * MENU_BUTTON_STEP;
    const statusSurface = this.add
      .graphics()
      .setName('title-menu-status-surface')
      .setDepth(MENU_SURFACE_DEPTH);
    drawUiPanel(statusSurface, MENU_X, statusY, 356, 50, {
      fill: UI_COLOURS.parchment,
      stroke: UI_COLOURS.ribbon,
      lineWidth: 2,
      radius: UI_DESIGN_TOKENS.radius.controlPx,
      alpha: 0.74,
    });
    this.statusText = this.add
      .text(MENU_X, statusY, status, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        align: 'center',
        wordWrap: { width: 326 },
      })
      .setName('title-menu-status')
      .setOrigin(0.5)
      .setDepth(MENU_LABEL_DEPTH);

    const primaryIndex = this.menuButtons.findIndex((menuButton) => menuButton.button === this.primaryButton);
    this.selectMenuButton(primaryIndex >= 0 ? primaryIndex : 0);
  }

  private getMenuActionCount(): number {
    if (this.storageUnavailable || this.unsupportedSaveVersion || !this.hasCreatedUnicorn) {
      return 2;
    }
    return 4;
  }

  private createMenuButton(
    y: number,
    text: string,
    name: string,
    fill: number,
    onActivate: () => void,
  ): MenuButton {
    const surface = this.add.graphics().setDepth(MENU_SURFACE_DEPTH);
    const button = createUiActionHitTarget(
      this,
      MENU_X,
      y,
      MENU_BUTTON_WIDTH,
      MENU_BUTTON_HEIGHT,
      `title-menu-${name}`,
    ).setDepth(MENU_HIT_DEPTH);
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
      .setDepth(MENU_LABEL_DEPTH);

    const menuButton: MenuButton = {
      button,
      surface,
      label,
      fill,
      currentFill: fill,
      y,
      enabled: true,
      activate: onActivate,
    };
    const select = () => this.selectMenuButton(this.menuButtons.indexOf(menuButton));
    const press = () => {
      if (!menuButton.enabled) return;
      menuButton.surface.setAlpha(0.86);
      onActivate();
    };
    const release = () => menuButton.surface.setAlpha(menuButton.enabled ? 1 : 0.48);

    button.on('pointerover', select);
    label.on('pointerover', select);
    button.on('pointerdown', press);
    label.on('pointerdown', press);
    button.on('pointerup', release);
    label.on('pointerup', release);
    button.on('pointerout', release);
    label.on('pointerout', release);

    this.menuButtons.push(menuButton);
    this.renderMenuButton(menuButton);
    return menuButton;
  }

  private renderMenuButton(menuButton: MenuButton): void {
    const selected = this.menuButtons[this.selectedMenuIndex] === menuButton;
    const surface = menuButton.surface.clear();
    drawUiPanelShadow(
      surface,
      MENU_X,
      menuButton.y,
      MENU_BUTTON_WIDTH,
      MENU_BUTTON_HEIGHT,
      UI_DESIGN_TOKENS.radius.controlPx,
      {
        alpha: selected ? 0.23 : 0.15,
        offsetX: selected ? 6 : 5,
        offsetY: selected ? 7 : 5,
      },
    );
    drawUiPanel(surface, MENU_X, menuButton.y, MENU_BUTTON_WIDTH, MENU_BUTTON_HEIGHT, {
      fill: menuButton.currentFill,
      stroke: selected ? UI_COLOURS.focus : UI_COLOURS.lavenderStrong,
      lineWidth: selected ? 5 : 3,
      radius: UI_DESIGN_TOKENS.radius.controlPx,
      alpha: 0.99,
    });
    surface.fillStyle(UI_COLOURS.white, selected ? 0.28 : 0.2);
    surface.fillRoundedRect(
      MENU_X - MENU_BUTTON_WIDTH / 2 + 9,
      menuButton.y - MENU_BUTTON_HEIGHT / 2 + 7,
      MENU_BUTTON_WIDTH - 18,
      11,
      6,
    );
    surface.setAlpha(menuButton.enabled ? 1 : 0.48);
  }

  private selectMenuButton(index: number): void {
    if (index < 0 || index >= this.menuButtons.length) return;
    this.selectedMenuIndex = index;
    for (const menuButton of this.menuButtons) {
      this.renderMenuButton(menuButton);
    }
  }

  private selectPreviousMenuItem(): void {
    this.moveMenuSelection(-1);
  }

  private selectNextMenuItem(): void {
    this.moveMenuSelection(1);
  }

  private moveMenuSelection(direction: number): void {
    if (this.starting || this.menuButtons.length === 0) return;
    let index = this.selectedMenuIndex;
    for (let step = 0; step < this.menuButtons.length; step += 1) {
      index = (index + direction + this.menuButtons.length) % this.menuButtons.length;
      if (this.menuButtons[index]?.enabled) {
        this.selectMenuButton(index);
        return;
      }
    }
  }

  private activateSelectedMenuItem(): void {
    const selected = this.menuButtons[this.selectedMenuIndex];
    if (selected?.enabled) {
      selected.activate();
      return;
    }

    if (this.storageUnavailable) {
      this.retryStorageAccess();
    } else if (this.unsupportedSaveVersion) {
      this.refreshForNewerSave();
    } else if (this.hasCreatedUnicorn) {
      this.continueGame();
    } else {
      this.handleNewGame();
    }
  }

  private setMenuButtonFill(menuButton: MenuButton | null, fill: number): void {
    if (!menuButton) return;
    menuButton.currentFill = fill;
    this.renderMenuButton(menuButton);
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
      this.setMenuButtonFill(menuButton, UI_COLOURS.blush);
      this.statusText?.setText('This replaces your current adventure. Tap again to be sure.');
      this.time.delayedCall(4000, () => {
        if (!this.resetArmed || this.starting) {
          return;
        }
        this.resetArmed = false;
        menuButton.label.setText('New Game');
        this.setMenuButtonFill(menuButton, menuButton.fill);
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
      this.setMenuButtonFill(this.newGameMenuButton, this.newGameMenuButton?.fill ?? UI_COLOURS.gold);
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
    this.setMenuEnabled(false);
  }

  private setMenuEnabled(enabled: boolean): void {
    for (const menuButton of this.menuButtons) {
      menuButton.enabled = enabled;
      setButtonEnabled(menuButton.button, enabled);
      if (enabled) {
        menuButton.label.setAlpha(1).setInteractive({ useHandCursor: true });
      } else {
        menuButton.label.setAlpha(0.52).disableInteractive();
      }
      this.renderMenuButton(menuButton);
    }
  }
}
