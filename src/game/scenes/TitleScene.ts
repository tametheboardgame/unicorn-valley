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
import { SUNBEAM_VILLAGE_LOCATION_ID } from '../world/SunbeamVillageMap';

function resolveContinueScene(currentLocationId: string | undefined): string {
  if (currentLocationId === COTTAGE_INTERIOR_LOCATION_ID) {
    return 'CottageInteriorScene';
  }

  if (currentLocationId === SUNBEAM_VILLAGE_LOCATION_ID) {
    return 'SunbeamVillageScene';
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
  private resetArmed = false;
  private continueScene = 'MoonflowerGladeScene';

  public constructor() {
    super('TitleScene');
  }

  public create(): void {
    this.starting = false;
    this.resetArmed = false;
    const save = getBrowserSaveService().load();
    this.hasCreatedUnicorn = Boolean(save?.profile.name);
    this.continueScene = resolveContinueScene(save?.profile.currentLocationId);
    this.cameras.main.setBackgroundColor('#6f4ba8');

    this.add.circle(170, 130, 115, 0xffd7f4, 0.18);
    this.add.circle(1080, 170, 165, 0xcff7ff, 0.14);
    this.add.circle(1020, 610, 230, 0xffefb6, 0.1);

    const titleShadow = this.add
      .rectangle(GAME_WIDTH / 2 + 9, 360, 870, 500, UI_COLOURS.shadow, 0.17)
      .setDepth(0);
    const titlePanel = this.add
      .rectangle(GAME_WIDTH / 2, 351, 870, 500, 0x7253a0, 0.38)
      .setStrokeStyle(3, 0xd7b7ed, 0.34)
      .setDepth(1);
    titleShadow.setAlpha(0.2);
    titlePanel.setAlpha(0.7);

    const sparkle = this.add
      .image(GAME_WIDTH / 2, 145, 'valley-sparkle')
      .setDisplaySize(92, 92)
      .setDepth(2);
    sparkle.setAlpha(0.95);

    this.add
      .text(GAME_WIDTH / 2, 250, 'Unicorn Valley', {
        color: '#fff8ff',
        fontFamily: UI_FONT,
        fontSize: '76px',
        fontStyle: 'bold',
        stroke: '#4c3578',
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(GAME_WIDTH / 2, 338, 'A magical place to explore, discover and make your own', {
        color: '#f5eefe',
        fontFamily: UI_FONT,
        fontSize: '25px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2);

    createUiShadow(this, GAME_WIDTH / 2, 475, 390, 82, 2, 0.22);
    const button = this.add
      .rectangle(GAME_WIDTH / 2, 475, 390, 82, UI_COLOURS.cream, 0.99)
      .setStrokeStyle(5, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(3);
    this.enterButton = button;
    applyButtonHover(button, UI_COLOURS.cream, UI_COLOURS.gold);

    this.add
      .text(GAME_WIDTH / 2, 475, this.hasCreatedUnicorn ? 'Continue' : 'Create Your Unicorn', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.add
      .text(GAME_WIDTH / 2, 545, 'Press Enter or tap the button', {
        color: '#eadfff',
        fontFamily: UI_FONT,
        fontSize: '19px',
      })
      .setOrigin(0.5)
      .setDepth(2);

    if (this.hasCreatedUnicorn) {
      const edit = this.add
        .text(GAME_WIDTH / 2, 580, 'Change my unicorn', {
          color: '#f3e8ff',
          fontFamily: UI_FONT,
          fontSize: '19px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(2);
      edit.on('pointerdown', () => this.scene.start('UnicornCreatorScene'));

      const startOver = this.add
        .text(GAME_WIDTH / 2, 615, 'Start over', {
          color: '#decff0',
          fontFamily: UI_FONT,
          fontSize: '17px',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(2);
      startOver.on('pointerdown', () => this.requestStartOver(startOver));
    }

    this.statusText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 40,
        this.hasCreatedUnicorn
          ? resolveContinueStatus(this.continueScene)
          : 'First, make a unicorn that feels like yours.',
        {
          color: '#e9dcf8',
          fontFamily: UI_FONT,
          fontSize: '21px',
        },
      )
      .setOrigin(0.5);

    this.tweens.add({
      targets: [sparkle, button],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
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
        this.statusText?.setText('Your unicorn is waiting in Moonflower Glade.');
      });
      return;
    }

    this.starting = true;
    resetMoonflowerGladePlayerSpawn();
    const service = getBrowserSaveService();
    service.save(service.createNewGame());
    this.scene.start('UnicornCreatorScene');
  }

  private enterValley(): void {
    if (this.starting) {
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
