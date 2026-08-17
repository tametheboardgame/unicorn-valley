import Phaser from 'phaser';
import { discoveryRegistry } from '../../content/registries';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';
import { buildWonderbookEntries } from '../wonderbook/WonderbookModel';

interface WonderbookSceneData {
  returnScene?: string;
}

export class WonderbookScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private returnScene = 'MoonflowerGladeScene';
  private closing = false;

  public constructor() {
    super('WonderbookScene');
  }

  public create(data: WonderbookSceneData): void {
    this.returnScene = data.returnScene ?? 'MoonflowerGladeScene';
    this.closing = false;
    this.cameras.main.setBackgroundColor('#5f4679');

    this.createBook();

    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const entries = buildWonderbookEntries(
      discoveryRegistry.values(),
      save.collections.discoveryIds,
    );

    entries.forEach((entry, index) => {
      const leftPage = index % 2 === 0;
      const columnX = leftPage ? 365 : 915;
      const row = Math.floor(index / 2);
      const y = 245 + row * 185;

      const sticker = this.add
        .circle(columnX - 170, y, 43, entry.discovered ? 0xffe6a6 : 0xe9e0ea, 1)
        .setStrokeStyle(4, entry.discovered ? 0xd6b35f : 0xc7b5ca, 1)
        .setDepth(8);
      this.add
        .text(columnX - 170, y, entry.discovered ? '✦' : '?', {
          color: entry.discovered ? '#8b653e' : '#927f97',
          fontFamily: UI_FONT,
          fontSize: '34px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(9);

      if (entry.discovered) {
        this.tweens.add({
          targets: sticker,
          angle: { from: -3, to: 3 },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }

      this.add
        .text(columnX - 105, y - 32, entry.discovered ? entry.name : 'A mystery...', {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '23px',
          fontStyle: 'bold',
          wordWrap: { width: 315 },
        })
        .setDepth(8);
      this.add
        .text(
          columnX - 105,
          y + 7,
          entry.discovered ? entry.description : 'Keep exploring to fill this page.',
          {
            color: entry.discovered ? UI_COLOURS.softInk : UI_COLOURS.mutedInk,
            fontFamily: UI_FONT,
            fontSize: '17px',
            wordWrap: { width: 315 },
            lineSpacing: 4,
          },
        )
        .setDepth(8);
    });

    if (entries.some((entry) => entry.discovered)) {
      const note = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 128, '✨ Your discoveries are safe in your book ✨', {
          color: '#825f4b',
          fontFamily: UI_FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          backgroundColor: '#fff2bdcc',
          padding: { x: 14, y: 7 },
        })
        .setOrigin(0.5)
        .setDepth(10)
        .setAngle(-1.5);
      this.tweens.add({
        targets: note,
        scale: 1.025,
        duration: 760,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.InOut',
      });
    }

    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT - 48, 250, 58, 14, 0.24);
    const closeButton = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 48, 250, 58, UI_COLOURS.gold, 1)
      .setStrokeStyle(4, UI_COLOURS.goldStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(15);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 48, 'Close the book ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(16);
    applyButtonHover(closeButton, UI_COLOURS.gold, 0xfff2bd);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    closeButton.on('pointerdown', () => this.pointerInput?.setButton('INTERACT', true));
    closeButton.on('pointerup', () => this.pointerInput?.setButton('INTERACT', false));
    closeButton.on('pointerout', () => this.pointerInput?.setButton('INTERACT', false));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
    });
  }

  public update(): void {
    this.inputController?.update();
    if (
      this.inputController?.justPressed('INTERACT') ||
      this.inputController?.justPressed('BACK') ||
      this.inputController?.justPressed('OPEN_WONDERBOOK')
    ) {
      this.closeBook();
    }
  }

  private createBook(): void {
    this.add.circle(135, 110, 58, 0xffe6a6, 0.08);
    this.add.circle(1145, 585, 86, 0xead8f3, 0.08);
    this.add
      .text(95, 54, '✦', {
        color: '#f9e7a9',
        fontFamily: UI_FONT,
        fontSize: '28px',
      })
      .setAlpha(0.6);
    this.add
      .text(1160, 82, '✦', {
        color: '#ead8f3',
        fontFamily: UI_FONT,
        fontSize: '24px',
      })
      .setAlpha(0.65);

    const book = this.add.graphics().setDepth(2);
    book.fillStyle(0x3f2f4d, 0.28);
    book.fillRoundedRect(82, 66, 1116, 568, 34);

    book.fillStyle(0x8d5f86, 1);
    book.fillRoundedRect(72, 54, 1116, 568, 34);
    book.lineStyle(5, 0xc895b8, 1);
    book.strokeRoundedRect(72, 54, 1116, 568, 34);

    book.fillStyle(0xfff8e9, 1);
    book.fillRoundedRect(102, 76, 522, 522, 28);
    book.fillRoundedRect(636, 76, 522, 522, 28);
    book.lineStyle(3, 0xe8d8c4, 1);
    book.strokeRoundedRect(102, 76, 522, 522, 28);
    book.strokeRoundedRect(636, 76, 522, 522, 28);

    book.fillStyle(0x6f486d, 0.34);
    book.fillRoundedRect(618, 72, 24, 530, 12);
    book.fillStyle(0xffffff, 0.5);
    book.fillRoundedRect(626, 82, 5, 510, 3);

    book.lineStyle(2, 0xe9ddca, 0.7);
    for (const y of [182, 366, 550]) {
      book.lineBetween(132, y, 592, y);
      book.lineBetween(668, y, 1128, y);
    }

    this.add.triangle(1116, 76, 0, 0, 42, 0, 42, 42, 0xeadcc7, 1).setAngle(90).setDepth(4);
    this.add.triangle(626, 598, 0, 0, 30, 0, 15, 48, 0xc95f82, 1).setOrigin(0.5, 0).setDepth(5);

    this.add
      .text(350, 112, 'My Wonderbook', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(350, 148, 'Things I have found', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.add
      .text(900, 112, 'Discoveries ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(350, 574, '1', {
        color: '#a18c92',
        fontFamily: UI_FONT,
        fontSize: '14px',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(900, 574, '2', {
        color: '#a18c92',
        fontFamily: UI_FONT,
        fontSize: '14px',
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  private closeBook(): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.scene.start(this.returnScene);
  }
}
