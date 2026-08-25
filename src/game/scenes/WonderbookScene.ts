import Phaser from 'phaser';
import { discoveryRegistry } from '../../content/registries';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';
import {
  buildWonderbookEntries,
  paginateWonderbookEntries,
  type WonderbookEntry,
  type WonderbookSpread,
} from '../wonderbook/WonderbookModel';

interface WonderbookSceneData {
  returnScene?: string;
}

type WonderbookSection = 'all' | 'secrets';

export class WonderbookScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private returnScene = 'MoonflowerGladeScene';
  private closing = false;
  private allEntries: readonly WonderbookEntry[] = [];
  private activeSection: WonderbookSection = 'all';
  private spreads: readonly WonderbookSpread[] = [];
  private spreadIndex = 0;
  private pageContent: Phaser.GameObjects.Container | null = null;
  private leftPageNumber: Phaser.GameObjects.Text | null = null;
  private rightPageNumber: Phaser.GameObjects.Text | null = null;
  private previousButton: Phaser.GameObjects.Text | null = null;
  private nextButton: Phaser.GameObjects.Text | null = null;
  private allTab: Phaser.GameObjects.Text | null = null;
  private secretsTab: Phaser.GameObjects.Text | null = null;
  private horizontalInputLatched = false;

  public constructor() {
    super('WonderbookScene');
  }

  public create(data: WonderbookSceneData): void {
    this.returnScene = data.returnScene ?? 'MoonflowerGladeScene';
    this.closing = false;
    this.activeSection = 'all';
    this.spreadIndex = 0;
    this.horizontalInputLatched = false;
    this.cameras.main.setBackgroundColor('#5f4679');

    this.createBook();

    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    this.allEntries = buildWonderbookEntries(
      discoveryRegistry.values(),
      save.collections.discoveryIds,
    );
    this.spreads = paginateWonderbookEntries(this.entriesForSection());
    this.createSectionTabs();
    this.createPageControls();
    this.renderSpread();

    this.add
      .text(
        104,
        GAME_HEIGHT - 30,
        `${this.allEntries.filter(({ discovered }) => discovered).length} discoveries found`,
        {
          color: '#ead8f3',
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0, 0.5)
      .setName('wonderbook-discovery-count');

    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT - 38, 250, 54, 14, 0.24);
    const closeButton = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 38, 250, 54, UI_COLOURS.gold, 1)
      .setStrokeStyle(4, UI_COLOURS.goldStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setName('wonderbook-close-button')
      .setDepth(15);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 38, 'Close the book ✨', {
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
      this.pageContent = null;
      this.previousButton = null;
      this.nextButton = null;
      this.allTab = null;
      this.secretsTab = null;
      this.leftPageNumber = null;
      this.rightPageNumber = null;
      this.allEntries = [];
      this.spreads = [];
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
      return;
    }

    const horizontal = this.inputController?.getAxis('MOVE_X') ?? 0;
    if (Math.abs(horizontal) < 0.25) {
      this.horizontalInputLatched = false;
      return;
    }
    if (this.horizontalInputLatched) {
      return;
    }

    this.horizontalInputLatched = true;
    if (horizontal < 0) {
      this.turnSpread(-1);
    } else {
      this.turnSpread(1);
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
    book.fillRoundedRect(82, 66, 1116, 556, 34);
    book.fillStyle(0x8d5f86, 1);
    book.fillRoundedRect(72, 54, 1116, 556, 34);
    book.lineStyle(5, 0xc895b8, 1);
    book.strokeRoundedRect(72, 54, 1116, 556, 34);
    book.fillStyle(0xfff8e9, 1);
    book.fillRoundedRect(102, 76, 522, 508, 28);
    book.fillRoundedRect(636, 76, 522, 508, 28);
    book.lineStyle(3, 0xe8d8c4, 1);
    book.strokeRoundedRect(102, 76, 522, 508, 28);
    book.strokeRoundedRect(636, 76, 522, 508, 28);
    book.fillStyle(0x6f486d, 0.34);
    book.fillRoundedRect(618, 72, 24, 516, 12);
    book.fillStyle(0xffffff, 0.5);
    book.fillRoundedRect(626, 82, 5, 496, 3);

    book.lineStyle(2, 0xe9ddca, 0.7);
    for (const y of [340, 520]) {
      book.lineBetween(132, y, 592, y);
      book.lineBetween(668, y, 1128, y);
    }

    this.add
      .text(350, 112, 'My Wonderbook', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(900, 112, 'Discoveries ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '29px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.leftPageNumber = this.add
      .text(350, 560, '1', {
        color: '#a18c92',
        fontFamily: UI_FONT,
        fontSize: '14px',
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.rightPageNumber = this.add
      .text(900, 560, '2', {
        color: '#a18c92',
        fontFamily: UI_FONT,
        fontSize: '14px',
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  private createSectionTabs(): void {
    this.allTab = this.add
      .text(790, 154, '✦ All adventures', this.tabStyle(true))
      .setName('wonderbook-tab-all')
      .setOrigin(0.5)
      .setDepth(18)
      .setInteractive({ useHandCursor: true });
    this.secretsTab = this.add
      .text(1015, 154, '★ Secrets', this.tabStyle(false))
      .setName('wonderbook-tab-secrets')
      .setOrigin(0.5)
      .setDepth(18)
      .setInteractive({ useHandCursor: true });

    this.allTab.on('pointerdown', () => this.setSection('all'));
    this.secretsTab.on('pointerdown', () => this.setSection('secrets'));
  }

  private createPageControls(): void {
    this.previousButton = this.add
      .text(126, 608, '◀ Previous', {
        color: '#5f4679',
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#f5e7f1',
        padding: { x: 14, y: 12 },
      })
      .setName('wonderbook-previous-page')
      .setOrigin(0, 0.5)
      .setDepth(18)
      .setInteractive({ useHandCursor: true });
    this.nextButton = this.add
      .text(GAME_WIDTH - 126, 608, 'Next ▶', {
        color: '#5f4679',
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#f5e7f1',
        padding: { x: 14, y: 12 },
      })
      .setName('wonderbook-next-page')
      .setOrigin(1, 0.5)
      .setDepth(18)
      .setInteractive({ useHandCursor: true });

    this.previousButton.on('pointerdown', () => this.turnSpread(-1));
    this.nextButton.on('pointerdown', () => this.turnSpread(1));
  }

  private renderSpread(): void {
    this.pageContent?.destroy(true);
    const spread = this.spreads[this.spreadIndex];
    if (!spread) {
      return;
    }

    const objects: Phaser.GameObjects.GameObject[] = [];
    spread.left.forEach((entry, index) => {
      objects.push(...this.createEntry(entry, 144, 190 + index * 170));
    });
    spread.right.forEach((entry, index) => {
      objects.push(...this.createEntry(entry, 678, 190 + index * 170));
    });

    if (spread.left.length === 0) {
      objects.push(this.createEmptyPageMessage(350, 310));
    }
    if (spread.right.length === 0) {
      objects.push(this.createEmptyPageMessage(900, 310));
    }

    this.pageContent = this.add
      .container(0, 5, objects)
      .setName('wonderbook-page-content')
      .setAlpha(0)
      .setDepth(8);
    this.tweens.add({
      targets: this.pageContent,
      y: 0,
      alpha: 1,
      duration: 220,
      ease: 'Sine.Out',
    });
    this.leftPageNumber?.setText(String(spread.leftPageNumber));
    this.rightPageNumber?.setText(String(spread.rightPageNumber));

    const hasPrevious = this.spreadIndex > 0;
    const hasNext = this.spreadIndex < this.spreads.length - 1;
    this.previousButton?.setAlpha(hasPrevious ? 1 : 0.34).disableInteractive();
    this.nextButton?.setAlpha(hasNext ? 1 : 0.34).disableInteractive();
    if (hasPrevious) {
      this.previousButton?.setInteractive({ useHandCursor: true });
    }
    if (hasNext) {
      this.nextButton?.setInteractive({ useHandCursor: true });
    }
  }

  private createEntry(
    entry: WonderbookEntry,
    x: number,
    y: number,
  ): Phaser.GameObjects.GameObject[] {
    const sticker = this.add
      .circle(x + 42, y + 44, 37, entry.discovered ? 0xffe6a6 : 0xe9e0ea, 1)
      .setName(`wonderbook-sticker:${entry.id}`)
      .setStrokeStyle(4, entry.discovered ? 0xd6b35f : 0xc7b5ca, 1);
    const icon = this.add
      .text(x + 42, y + 44, entry.discovered ? (entry.icon ?? '✦') : '?', {
        color: entry.discovered ? '#8b653e' : '#927f97',
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const title = this.add.text(x + 95, y + 9, entry.discovered ? entry.name : 'A mystery...', {
      color: UI_COLOURS.ink,
      fontFamily: UI_FONT,
      fontSize: '21px',
      fontStyle: 'bold',
      wordWrap: { width: 340 },
    });
    const description = this.add.text(
      x + 95,
      y + 48,
      entry.discovered
        ? entry.description
        : (entry.undiscoveredHint ?? 'Keep exploring to fill this page.'),
      {
        color: entry.discovered ? UI_COLOURS.softInk : UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        wordWrap: { width: 340 },
        lineSpacing: 3,
        maxLines: 4,
      },
    );

    if (entry.discovered) {
      sticker.setScale(0.82);
      this.tweens.add({
        targets: sticker,
        scale: 1,
        duration: 280,
        ease: 'Back.Out',
        onComplete: () => {
          if (!sticker.active) {
            return;
          }
          this.tweens.add({
            targets: sticker,
            angle: { from: -2, to: 2 },
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
          });
        },
      });
    }

    return [sticker, icon, title, description];
  }

  private createEmptyPageMessage(x: number, y: number): Phaser.GameObjects.Text {
    const message =
      this.activeSection === 'secrets'
        ? 'Secret stickers appear here when you uncover them ✨'
        : 'More discoveries will appear here ✨';
    return this.add
      .text(x, y, message, {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 360 },
      })
      .setOrigin(0.5);
  }

  private setSection(section: WonderbookSection): void {
    if (this.activeSection === section) {
      return;
    }
    this.activeSection = section;
    this.spreadIndex = 0;
    this.spreads = paginateWonderbookEntries(this.entriesForSection());
    this.refreshSectionTabs();
    this.renderSpread();
  }

  private entriesForSection(): readonly WonderbookEntry[] {
    return this.activeSection === 'secrets'
      ? this.allEntries.filter(({ kind }) => kind === 'secret')
      : this.allEntries;
  }

  private refreshSectionTabs(): void {
    this.allTab?.setStyle(this.tabStyle(this.activeSection === 'all'));
    this.secretsTab?.setStyle(this.tabStyle(this.activeSection === 'secrets'));
  }

  private tabStyle(selected: boolean): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color: selected ? UI_COLOURS.ink : UI_COLOURS.softInk,
      fontFamily: UI_FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      backgroundColor: selected ? '#ffe6a6' : '#ead8f3',
      padding: { x: 16, y: 14 },
    };
  }

  private turnSpread(direction: -1 | 1): void {
    const nextIndex = Phaser.Math.Clamp(this.spreadIndex + direction, 0, this.spreads.length - 1);
    if (nextIndex === this.spreadIndex) {
      return;
    }
    this.spreadIndex = nextIndex;
    this.renderSpread();
  }

  private closeBook(): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.scene.stop();
    if (this.scene.isPaused(this.returnScene)) {
      this.scene.resume(this.returnScene);
    } else if (!this.scene.isActive(this.returnScene)) {
      this.scene.start(this.returnScene);
    }
  }
}
