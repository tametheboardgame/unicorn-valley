import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserSaveService } from '../save/browserSaveService';
import { AudioSettingsPanel } from '../ui/AudioSettingsPanel';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';
import { COTTAGE_INTERIOR_LOCATION_ID } from '../world/CottageInteriorMap';
import { resetMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';
import { RAINBOW_MEADOW_LOCATION_ID } from '../world/RainbowMeadowMap';
import { SUNBEAM_VILLAGE_LOCATION_ID } from '../world/SunbeamVillageMap';

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
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private enterButton: Phaser.GameObjects.Rectangle | null = null;
  private audioSettingsPanel: AudioSettingsPanel | null = null;
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
    const saveService = getBrowserSaveService();
    const loadedSave = saveService.load();
    this.unsupportedSaveVersion = saveService.hasUnsupportedSaveVersion();
    const save = this.unsupportedSaveVersion ? null : loadedSave;
    this.hasCreatedUnicorn = Boolean(save?.profile.name);
    this.continueScene = resolveContinueScene(save?.profile.currentLocationId);
    this.cameras.main.setBackgroundColor('#6f4ba8');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x6f4ba8, 1);
    this.add.circle(150, 130, 115, 0xffd7f4, 0.16);
    this.add.circle(1110, 155, 165, 0xcff7ff, 0.12);
    this.add.circle(1070, 640, 235, 0xffefb6, 0.09);
    this.add.circle(260, 650, 180, 0xc8f1dc, 0.06);

    const glow = this.add.circle(GAME_WIDTH / 2, 120, 56, 0xffefaa, 0.14).setDepth(1);
    const halo = this.add
      .circle(GAME_WIDTH / 2, 120, 34, 0xfff8d6, 0.1)
      .setStrokeStyle(3, 0xfff0a9, 0.45)
      .setDepth(2);
    const sparkle = this.add
      .text(GAME_WIDTH / 2, 118, '✦', {
        color: '#fff2a6',
        fontFamily: UI_FONT,
        fontSize: '68px',
        fontStyle: 'bold',
        stroke: '#d79bdc',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(3);
    const smallSparkles = [
      this.add.text(GAME_WIDTH / 2 - 72, 102, '✧', {
        color: '#ffd9f5',
        fontFamily: UI_FONT,
        fontSize: '27px',
      }),
      this.add.text(GAME_WIDTH / 2 + 70, 137, '✦', {
        color: '#d7f5ff',
        fontFamily: UI_FONT,
        fontSize: '22px',
      }),
      this.add.text(GAME_WIDTH / 2 - 48, 157, '·', {
        color: '#fff7cb',
        fontFamily: UI_FONT,
        fontSize: '34px',
      }),
    ].map((item) => item.setOrigin(0.5).setDepth(2));

    createUiShadow(this, GAME_WIDTH / 2, 367, 760, 380, 0, 0.17);
    this.add
      .rectangle(GAME_WIDTH / 2, 359, 760, 380, 0x7456a0, 0.34)
      .setStrokeStyle(3, 0xe0c9ed, 0.23)
      .setDepth(1);

    this.add
      .text(GAME_WIDTH / 2, 232, 'Unicorn Valley', {
        color: '#fff8ff',
        fontFamily: UI_FONT,
        fontSize: '74px',
        fontStyle: 'bold',
        stroke: '#4c3578',
        strokeThickness: 9,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(GAME_WIDTH / 2, 315, 'Explore • make friends • discover magic • make it yours', {
        color: '#f5eefe',
        fontFamily: UI_FONT,
        fontSize: '23px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2);

    createUiShadow(this, GAME_WIDTH / 2, 447, 390, 78, 2, 0.22);
    const button = this.add
      .rectangle(GAME_WIDTH / 2, 447, 390, 78, UI_COLOURS.cream, 0.99)
      .setStrokeStyle(5, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(3);
    this.enterButton = button;
    applyButtonHover(button, UI_COLOURS.cream, UI_COLOURS.gold);

    const enterLabel = this.unsupportedSaveVersion
      ? 'Refresh to Continue'
      : this.hasCreatedUnicorn
        ? 'Continue'
        : 'Create Your Unicorn';
    this.add
      .text(GAME_WIDTH / 2, 447, enterLabel, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.add
      .text(
        GAME_WIDTH / 2,
        507,
        this.unsupportedSaveVersion
          ? 'Your save is safe. Refresh to load the newer game version.'
          : 'Press Enter or tap the button',
        {
          color: '#eadfff',
          fontFamily: UI_FONT,
          fontSize: '17px',
        },
      )
      .setOrigin(0.5)
      .setDepth(2);

    if (this.hasCreatedUnicorn && !this.unsupportedSaveVersion) {
      const edit = this.add
        .text(GAME_WIDTH / 2, 548, 'Change my unicorn', {
          color: '#fff5ff',
          fontFamily: UI_FONT,
          fontSize: '19px',
          fontStyle: 'bold',
          backgroundColor: '#5f4388aa',
          padding: { x: 13, y: 7 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(3);
      edit.on('pointerdown', () => this.scene.start('UnicornCreatorScene'));

      const startOver = this.add
        .text(GAME_WIDTH / 2, 593, 'Start over', {
          color: '#decff0',
          fontFamily: UI_FONT,
          fontSize: '16px',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(2);
      startOver.on('pointerdown', () => this.requestStartOver(startOver));
    }

    const status = this.unsupportedSaveVersion
      ? 'A newer Unicorn Valley save is here. Refresh to keep your progress safe.'
      : this.hasCreatedUnicorn
        ? resolveContinueStatus(this.continueScene)
        : 'First, make a unicorn that feels like yours.';
    this.statusText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 38, status, {
        color: '#f0e7fb',
        fontFamily: UI_FONT,
        fontSize: '20px',
        backgroundColor: '#563d7ccc',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.tweens.add({
      targets: [glow, halo],
      scale: 1.13,
      alpha: 0.25,
      duration: 1350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    this.tweens.add({
      targets: sparkle,
      angle: 8,
      scale: 1.06,
      duration: 1250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    smallSparkles.forEach((item, index) => {
      this.tweens.add({
        targets: item,
        alpha: 0.35,
        y: item.y - 8,
        duration: 900 + index * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.audioSettingsPanel = new AudioSettingsPanel(this);

    button.on('pointerdown', () => this.pointerInput?.setButton('INTERACT', true));
    button.on('pointerup', () => this.pointerInput?.setButton('INTERACT', false));
    button.on('pointerout', () => this.pointerInput?.setButton('INTERACT', false));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioSettingsPanel?.destroy();
      this.audioSettingsPanel = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.enterButton = null;
      this.statusText = null;
    });
  }

  public update(): void {
    this.inputController?.update();

    if (this.inputController?.justPressed('INTERACT')) {
      this.enterValley();
    }
  }

  private requestStartOver(label: Phaser.GameObjects.Text): void {
    if (this.starting) {
      return;
    }

    if (!this.resetArmed) {
      this.resetArmed = true;
      label.setText('Tap again to start over');
      this.statusText?.setText('This will make a brand-new unicorn. Tap again to be sure.');
      this.time.delayedCall(3500, () => {
        if (!this.resetArmed || this.starting) {
          return;
        }
        this.resetArmed = false;
        label.setText('Start over');
        this.statusText?.setText(resolveContinueStatus(this.continueScene));
      });
      return;
    }

    this.starting = true;
    resetMoonflowerGladePlayerSpawn();
    const service = getBrowserSaveService();
    service.clear();
    const result = service.saveWithResult(service.createNewGame());
    if (result.status !== 'saved') {
      this.starting = false;
      this.scene.restart();
      return;
    }
    this.scene.start('UnicornCreatorScene');
  }

  private enterValley(): void {
    if (this.starting) {
      return;
    }

    if (this.unsupportedSaveVersion) {
      this.statusText?.setText('Refreshing so your newer save stays safe…');
      globalThis.location.reload();
      return;
    }

    this.starting = true;
    this.statusText?.setText(
      this.hasCreatedUnicorn ? 'Welcome back…' : 'Time to make your unicorn…',
    );
    this.enterButton?.setStrokeStyle(7, UI_COLOURS.gold, 1);

    this.time.delayedCall(140, () => {
      this.scene.start(this.hasCreatedUnicorn ? this.continueScene : 'UnicornCreatorScene');
    });
  }
}
