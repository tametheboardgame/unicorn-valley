import Phaser from 'phaser';
import { discoveryRegistry } from '../../content/registries';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserSaveService } from '../save/browserSaveService';
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
    this.cameras.main.setBackgroundColor('#71528d');

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1040, 650, 0xfffbef, 0.98)
      .setStrokeStyle(8, 0xe0b4db, 1);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 10, 610, 0xd7b4c9, 0.55);

    this.add
      .text(GAME_WIDTH / 2, 86, 'My Wonderbook', {
        color: '#5c3e68',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 132, 'Discoveries', {
        color: '#986d9f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

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
      const y = 235 + row * 205;

      this.add
        .circle(columnX - 170, y, 42, entry.discovered ? 0xffe57d : 0xe6dce8, 0.95)
        .setStrokeStyle(4, entry.discovered ? 0xd7a93c : 0xb9a9bd, 1);
      this.add
        .text(columnX - 170, y, entry.discovered ? '✦' : '?', {
          color: entry.discovered ? '#8a5c35' : '#8d7a91',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '34px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.add.text(columnX - 105, y - 31, entry.discovered ? entry.name : '???', {
        color: '#5c3e68',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
        wordWrap: { width: 330 },
      });
      this.add.text(
        columnX - 105,
        y + 7,
        entry.discovered ? entry.description : 'Keep exploring to discover this page.',
        {
          color: entry.discovered ? '#735d78' : '#9d8da0',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          wordWrap: { width: 330 },
          lineSpacing: 4,
        },
      );
    });

    if (entries.some((entry) => entry.discovered)) {
      const sticker = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 128, '✨ A new discovery is safely tucked inside! ✨', {
          color: '#8d5f4f',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '19px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: sticker,
        scale: 1.04,
        duration: 700,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.InOut',
      });
    }

    const closeButton = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 64, 270, 64, 0xf0d8f0, 1)
      .setStrokeStyle(5, 0xb67cba, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 64, 'Close Wonderbook', {
        color: '#5b3f68',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

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

  private closeBook(): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.scene.start(this.returnScene);
  }
}
