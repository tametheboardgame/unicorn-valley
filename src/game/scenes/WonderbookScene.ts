import Phaser from 'phaser';
import { characterRegistry, discoveryRegistry } from '../../content/registries';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { RelationshipService } from '../relationships/RelationshipService';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  PortraitModalCompanion,
  type PortraitModalActionGroup,
} from '../ui/PortraitModalCompanion';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';
import {
  buildWonderbookCharacterEntries,
  type WonderbookCharacterEntry,
} from '../wonderbook/WonderbookCharacterModel';
import { buildWonderbookEntries, type WonderbookEntry } from '../wonderbook/WonderbookModel';
import {
  buildWonderbookGoalEntries,
  buildWonderbookRaceEntries,
  buildWonderbookRegionEntries,
  paginateWonderbookProgress,
  type WonderbookGoalEntry,
  type WonderbookProgressSpread,
  type WonderbookRaceEntry,
  type WonderbookRegionEntry,
} from '../wonderbook/WonderbookProgressModel';

interface WonderbookSceneData {
  returnScene?: string;
}

type WonderbookSection = 'discoveries' | 'friends' | 'places' | 'races' | 'goals';
type DiscoveryFilter = 'all' | 'secrets';

interface WonderbookCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  known: boolean;
  celebrate: boolean;
  badge?: string;
  kind?: WonderbookEntry['kind'];
}

const SECTION_LABELS: readonly {
  id: WonderbookSection;
  label: string;
  heading: string;
}[] = [
  { id: 'discoveries', label: '✨ Finds', heading: 'Discoveries ✨' },
  { id: 'friends', label: '🦄 Friends', heading: 'Friends 💛' },
  { id: 'places', label: '🗺 Places', heading: 'Places 🗺️' },
  { id: 'races', label: '🎀 Races', heading: 'Races & Ribbons 🎀' },
  { id: 'goals', label: '🌟 Goals', heading: 'Long-term Goals 🌟' },
];

export class WonderbookScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private returnScene = 'MoonflowerGladeScene';
  private closing = false;
  private allEntries: readonly WonderbookEntry[] = [];
  private characterEntries: readonly WonderbookCharacterEntry[] = [];
  private regionEntries: readonly WonderbookRegionEntry[] = [];
  private raceEntries: readonly WonderbookRaceEntry[] = [];
  private goalEntries: readonly WonderbookGoalEntry[] = [];
  private activeSection: WonderbookSection = 'discoveries';
  private discoveryFilter: DiscoveryFilter = 'all';
  private spreads: readonly WonderbookProgressSpread<WonderbookCard>[] = [];
  private spreadIndex = 0;
  private pageContent: Phaser.GameObjects.Container | null = null;
  private leftPageNumber: Phaser.GameObjects.Text | null = null;
  private rightPageNumber: Phaser.GameObjects.Text | null = null;
  private previousButton: Phaser.GameObjects.Text | null = null;
  private nextButton: Phaser.GameObjects.Text | null = null;
  private allTab: Phaser.GameObjects.Rectangle | null = null;
  private secretsTab: Phaser.GameObjects.Rectangle | null = null;
  private allTabLabel: Phaser.GameObjects.Text | null = null;
  private secretsTabLabel: Phaser.GameObjects.Text | null = null;
  private sectionTabs = new Map<WonderbookSection, Phaser.GameObjects.Text>();
  private sectionHeading: Phaser.GameObjects.Text | null = null;
  private summaryText: Phaser.GameObjects.Text | null = null;
  private horizontalInputLatched = false;
  private portraitCompanion: PortraitModalCompanion | null = null;

  public constructor() {
    super('WonderbookScene');
  }

  public create(data: WonderbookSceneData): void {
    this.returnScene = data.returnScene ?? 'MoonflowerGladeScene';
    this.closing = false;
    this.activeSection = 'discoveries';
    this.discoveryFilter = 'all';
    this.spreadIndex = 0;
    this.horizontalInputLatched = false;
    this.sectionTabs.clear();
    this.cameras.main.setBackgroundColor('#503960');

    this.createBook();

    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const relationships = new RelationshipService(saveService);
    this.allEntries = buildWonderbookEntries(
      discoveryRegistry.values(),
      save.collections.discoveryIds,
    );
    this.characterEntries = buildWonderbookCharacterEntries(
      characterRegistry.values(),
      relationships,
    );
    this.regionEntries = buildWonderbookRegionEntries(save);
    this.raceEntries = buildWonderbookRaceEntries(save);
    this.goalEntries = buildWonderbookGoalEntries(save, {
      knownFriends: this.characterEntries.filter(({ known }) => known).length,
      totalFriends: this.characterEntries.length,
      regions: this.regionEntries,
      races: this.raceEntries,
    });
    this.portraitCompanion = PortraitModalCompanion.create('wonderbook', 'My Wonderbook');
    this.rebuildSpreads();
    this.createSectionTabs();
    this.createDiscoveryFilters();
    this.createPageControls();
    this.createSummary();
    this.refreshSectionChrome();
    this.renderSpread();

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
      this.portraitCompanion?.destroy();
      this.portraitCompanion = null;
      this.pageContent = null;
      this.previousButton = null;
      this.nextButton = null;
      this.allTab = null;
      this.secretsTab = null;
      this.leftPageNumber = null;
      this.rightPageNumber = null;
      this.sectionHeading = null;
      this.summaryText = null;
      this.sectionTabs.clear();
      this.allEntries = [];
      this.characterEntries = [];
      this.regionEntries = [];
      this.raceEntries = [];
      this.goalEntries = [];
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
    this.add.circle(105, 92, 70, 0xffdd91, 0.08);
    this.add.circle(1188, 575, 104, 0xe9c9f4, 0.08);
    for (const [x, y, size] of [
      [92, 55, 26],
      [1180, 78, 22],
      [1210, 246, 16],
      [54, 492, 18],
    ] as const) {
      this.add
        .text(x, y, '✦', {
          color: '#f6df9f',
          fontFamily: UI_FONT,
          fontSize: `${size}px`,
        })
        .setOrigin(0.5)
        .setAlpha(0.55);
    }

    const book = this.add.graphics().setDepth(2).setName('wonderbook-themed-book');
    book.fillStyle(0x241a2a, 0.34);
    book.fillRoundedRect(78, 68, 1124, 548, 38);

    book.fillStyle(0x704766, 1);
    book.fillRoundedRect(62, 48, 1156, 556, 38);
    book.lineStyle(6, 0xb97a9f, 1);
    book.strokeRoundedRect(62, 48, 1156, 556, 38);
    book.lineStyle(2, 0xe2b2c6, 0.72);
    book.strokeRoundedRect(74, 60, 1132, 532, 30);

    book.fillStyle(0x9c6a82, 1);
    book.fillRoundedRect(91, 69, 533, 515, 29);
    book.fillRoundedRect(636, 69, 533, 515, 29);
    book.fillStyle(0xe8d1a6, 1);
    book.fillRoundedRect(97, 74, 527, 508, 27);
    book.fillRoundedRect(636, 74, 527, 508, 27);

    book.fillStyle(0xfff7df, 1);
    book.fillRoundedRect(104, 78, 516, 500, 24);
    book.fillStyle(0xfff3d9, 1);
    book.fillRoundedRect(640, 78, 516, 500, 24);
    book.lineStyle(2, 0xd7c29f, 0.9);
    book.strokeRoundedRect(104, 78, 516, 500, 24);
    book.strokeRoundedRect(640, 78, 516, 500, 24);

    book.fillStyle(0xdabf91, 0.34);
    for (const y of [88, 96, 568]) {
      book.fillRoundedRect(116, y, 492, 3, 2);
      book.fillRoundedRect(652, y, 492, 3, 2);
    }

    book.fillStyle(0x5a3659, 0.42);
    book.fillRoundedRect(615, 66, 30, 522, 13);
    book.fillStyle(0x8d6684, 0.5);
    book.fillRoundedRect(621, 74, 18, 506, 9);
    book.fillStyle(0xffffff, 0.38);
    book.fillRoundedRect(626, 84, 5, 486, 3);

    book.fillStyle(0x7f4f70, 1);
    book.fillTriangle(360, 48, 403, 48, 382, 84);
    book.fillTriangle(856, 48, 899, 48, 878, 84);
    book.fillStyle(0xe5b84f, 0.88);
    book.fillCircle(382, 62, 8);
    book.fillCircle(878, 62, 8);

    book.lineStyle(2, 0xd5bd99, 0.7);
    for (const y of [354, 510]) {
      book.lineBetween(136, y, 592, y);
      book.lineBetween(668, y, 1124, y);
    }

    book.lineStyle(2, 0xb17698, 0.58);
    for (let x = 116; x < 602; x += 25) {
      book.lineBetween(x, 566, Math.min(x + 11, 604), 566);
    }
    for (let x = 654; x < 1142; x += 25) {
      book.lineBetween(x, 566, Math.min(x + 11, 1144), 566);
    }

    book.fillStyle(0x6c4665, 0.48);
    book.fillRoundedRect(1148, 130, 30, 352, 10);

    this.add
      .text(350, 112, '✦ My Wonderbook ✦', {
        color: '#5d3f58',
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.sectionHeading = this.add
      .text(875, 112, 'Discoveries ✨', {
        color: '#5d3f58',
        fontFamily: UI_FONT,
        fontSize: '26px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.leftPageNumber = this.add
      .text(350, 558, '1', {
        color: '#947c75',
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.rightPageNumber = this.add
      .text(900, 558, '2', {
        color: '#947c75',
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  private createSectionTabs(): void {
    const tabX = 1154;
    const startY = 158;
    const gap = 70;
    SECTION_LABELS.forEach((section, index) => {
      const y = startY + index * gap;
      this.add
        .rectangle(tabX + 7, y + 4, 112, 48, 0x2f1d43, 0.14)
        .setOrigin(0, 0.5)
        .setDepth(16)
        .setName(`wonderbook-section-shadow:${section.id}`);
      const tab = this.add
        .text(tabX, y, section.label, this.tabStyle(section.id === 'discoveries'))
        .setName(`wonderbook-section-${section.id}`)
        .setOrigin(0, 0.5)
        .setDepth(18)
        .setInteractive({ useHandCursor: true });
      tab.on('pointerdown', () => this.setSection(section.id));
      this.sectionTabs.set(section.id, tab);
    });
  }

  private createDiscoveryFilters(): void {
    this.allTabLabel = this.add
      .text(790, 178, '✦ All adventures', this.filterStyle(true))
      .setName('wonderbook-tab-all-label')
      .setOrigin(0.5)
      .setDepth(18);
    this.secretsTabLabel = this.add
      .text(1015, 178, '★ Secrets', this.filterStyle(false))
      .setName('wonderbook-tab-secrets-label')
      .setOrigin(0.5)
      .setDepth(18);

    // The page-edge labels keep their accepted visual geometry while these
    // transparent controls provide the real child-sized pointer targets.
    this.allTab = this.add
      .rectangle(790, 178, 190, 52, 0xffffff, 0.001)
      .setName('wonderbook-tab-all')
      .setDepth(19)
      .setInteractive({ useHandCursor: true });
    this.secretsTab = this.add
      .rectangle(1015, 178, 150, 52, 0xffffff, 0.001)
      .setName('wonderbook-tab-secrets')
      .setDepth(19)
      .setInteractive({ useHandCursor: true });

    this.allTab.on('pointerdown', () => this.setDiscoveryFilter('all'));
    this.secretsTab.on('pointerdown', () => this.setDiscoveryFilter('secrets'));
  }

  private createPageControls(): void {
    this.previousButton = this.add
      .text(126, 608, '◀ Previous', {
        color: '#fff6df',
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#79536f',
        padding: { x: 15, y: 12 },
      })
      .setName('wonderbook-previous-page')
      .setOrigin(0, 0.5)
      .setDepth(18)
      .setInteractive({ useHandCursor: true });
    this.nextButton = this.add
      .text(GAME_WIDTH - 126, 608, 'Next ▶', {
        color: '#fff6df',
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#79536f',
        padding: { x: 15, y: 12 },
      })
      .setName('wonderbook-next-page')
      .setOrigin(1, 0.5)
      .setDepth(18)
      .setInteractive({ useHandCursor: true });

    this.previousButton.on('pointerdown', () => this.turnSpread(-1));
    this.nextButton.on('pointerdown', () => this.turnSpread(1));
  }

  private createSummary(): void {
    this.summaryText = this.add
      .text(104, GAME_HEIGHT - 30, '', {
        color: '#f2dcef',
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: '#432f50b8',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0, 0.5)
      .setName('wonderbook-discovery-count');
  }

  private renderSpread(horizontalOffset = 0): void {
    this.pageContent?.destroy(true);
    const spread = this.spreads[this.spreadIndex];
    if (!spread) {
      return;
    }

    const yStart = this.activeSection === 'discoveries' ? 218 : 202;
    const rowGap = this.activeSection === 'discoveries' ? 148 : 156;
    const objects: Phaser.GameObjects.GameObject[] = [];
    spread.left.forEach((entry, index) => {
      objects.push(...this.createCard(entry, 144, yStart + index * rowGap));
    });
    spread.right.forEach((entry, index) => {
      objects.push(...this.createCard(entry, 678, yStart + index * rowGap));
    });

    if (spread.left.length === 0) {
      objects.push(this.createEmptyPageMessage(350, 330));
    }
    if (spread.right.length === 0) {
      objects.push(this.createEmptyPageMessage(900, 330));
    }

    this.pageContent = this.add
      .container(horizontalOffset, 5, objects)
      .setName('wonderbook-page-content')
      .setAlpha(0)
      .setDepth(8);
    this.tweens.add({
      targets: this.pageContent,
      x: 0,
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
    this.refreshPortraitCompanion();
  }

  private refreshPortraitCompanion(): void {
    if (!this.portraitCompanion) {
      return;
    }

    const spread = this.spreads[this.spreadIndex];
    if (!spread) {
      return;
    }
    const section = SECTION_LABELS.find(({ id }) => id === this.activeSection);
    const cards = [...spread.left, ...spread.right];
    const pageLabel = `Pages ${spread.leftPageNumber}–${spread.rightPageNumber}`;
    this.portraitCompanion.setHeader(
      `📖 ${section?.heading ?? 'My Wonderbook'}`,
      `${this.summaryForSection()} · ${pageLabel}. Scroll this panel to read every card comfortably.`,
    );
    this.portraitCompanion.setCards(
      cards.map((card) => ({
        id: card.id,
        icon: card.known ? card.icon : '❔',
        title: card.title,
        description: card.description,
        badge: card.badge,
      })),
    );

    const groups: PortraitModalActionGroup[] = [
      {
        id: 'sections',
        label: 'Book section',
        actions: SECTION_LABELS.map((entry) => ({
          id: `section-${entry.id}`,
          label: entry.label,
          selected: this.activeSection === entry.id,
          onPress: () => this.setSection(entry.id),
        })),
      },
    ];

    if (this.activeSection === 'discoveries') {
      groups.push({
        id: 'discovery-filter',
        label: 'Discovery pages',
        actions: [
          {
            id: 'filter-all',
            label: '✦ All adventures',
            selected: this.discoveryFilter === 'all',
            onPress: () => this.setDiscoveryFilter('all'),
          },
          {
            id: 'filter-secrets',
            label: '★ Secrets',
            selected: this.discoveryFilter === 'secrets',
            onPress: () => this.setDiscoveryFilter('secrets'),
          },
        ],
      });
    }

    groups.push(
      {
        id: 'pages',
        label: 'Turn pages',
        actions: [
          {
            id: 'previous',
            label: '◀ Previous',
            disabled: this.spreadIndex === 0,
            onPress: () => this.turnSpread(-1),
          },
          {
            id: 'next',
            label: 'Next ▶',
            disabled: this.spreadIndex >= this.spreads.length - 1,
            onPress: () => this.turnSpread(1),
          },
        ],
      },
      {
        id: 'close',
        actions: [{ id: 'close', label: '✓ Close the book', onPress: () => this.closeBook() }],
      },
    );
    this.portraitCompanion.setActionGroups(groups);
  }

  private createCard(entry: WonderbookCard, x: number, y: number): Phaser.GameObjects.GameObject[] {
    const paper = this.add.graphics().setName(`wonderbook-card:${entry.id}`);
    paper.fillStyle(0x8d6a75, 0.09);
    paper.fillRoundedRect(x + 3, y + 4, 438, 132, 15);
    paper.fillStyle(entry.known ? 0xfff9e8 : 0xf2eadf, 0.88);
    paper.fillRoundedRect(x, y, 438, 132, 15);
    paper.lineStyle(2, entry.celebrate ? 0xd2aa58 : 0xd5c3a7, 0.82);
    paper.strokeRoundedRect(x, y, 438, 132, 15);
    paper.fillStyle(entry.celebrate ? 0xffd976 : 0xc999b2, entry.known ? 0.24 : 0.13);
    paper.fillRoundedRect(x + 8, y + 8, 7, 116, 4);

    const stickerColour = entry.celebrate ? 0xffe6a6 : entry.known ? 0xead8f3 : 0xe9e0ea;
    const stickerStroke = entry.celebrate ? 0xd6b35f : entry.known ? 0xb97b9e : 0xbcaabf;
    const stickerShadow = this.add.circle(x + 45, y + 46, 37, 0x5b4254, 0.12);
    const sticker = this.add
      .circle(x + 42, y + 42, 36, stickerColour, 1)
      .setName(`wonderbook-sticker:${entry.id}`)
      .setStrokeStyle(4, stickerStroke, 1);
    const icon = this.add
      .text(x + 42, y + 42, entry.known ? entry.icon : '?', {
        color: entry.known ? '#7b5a72' : '#927f97',
        fontFamily: UI_FONT,
        fontSize: '29px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const title = this.add.text(x + 94, y + 9, entry.title, {
      color: UI_COLOURS.ink,
      fontFamily: UI_FONT,
      fontSize: '19px',
      fontStyle: 'bold',
      wordWrap: { width: 326 },
      maxLines: 2,
    });
    const description = this.add.text(x + 94, y + 46, entry.description, {
      color: entry.known ? UI_COLOURS.softInk : UI_COLOURS.mutedInk,
      fontFamily: UI_FONT,
      fontSize: '14px',
      wordWrap: { width: 326 },
      lineSpacing: 2,
      maxLines: 3,
    });
    const objects: Phaser.GameObjects.GameObject[] = [
      paper,
      stickerShadow,
      sticker,
      icon,
      title,
      description,
    ];

    if (entry.badge) {
      objects.push(
        this.add.text(x + 94, y + 107, entry.badge, {
          color: entry.celebrate ? '#835f34' : '#765e75',
          fontFamily: UI_FONT,
          fontSize: '12px',
          fontStyle: 'bold',
          backgroundColor: entry.celebrate ? '#fff0bd' : '#efe1eb',
          padding: { x: 6, y: 3 },
          wordWrap: { width: 326 },
          maxLines: 1,
        }),
      );
    }

    if (entry.celebrate) {
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

    return objects;
  }

  private createEmptyPageMessage(x: number, y: number): Phaser.GameObjects.Text {
    let message = 'More pages will fill as you explore ✨';
    if (this.activeSection === 'discoveries' && this.discoveryFilter === 'secrets') {
      message = 'Secret stickers appear here when you uncover them ✨';
    } else if (this.activeSection === 'friends') {
      message = 'New friends will appear here as you meet them 💛';
    } else if (this.activeSection === 'places') {
      message = 'Every part of the valley can leave a memory 🗺️';
    } else if (this.activeSection === 'races') {
      message = 'Race only when a speedy adventure sounds fun 🎀';
    } else if (this.activeSection === 'goals') {
      message = 'These are ideas for later, never chores 🌟';
    }
    return this.add
      .text(x, y, `✦ ${message} ✦`, {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#f5ead8',
        padding: { x: 16, y: 12 },
        wordWrap: { width: 360 },
      })
      .setOrigin(0.5);
  }

  private setSection(section: WonderbookSection): void {
    if (this.activeSection === section) {
      return;
    }
    const currentIndex = SECTION_LABELS.findIndex(({ id }) => id === this.activeSection);
    const nextIndex = SECTION_LABELS.findIndex(({ id }) => id === section);
    this.activeSection = section;
    this.spreadIndex = 0;
    this.rebuildSpreads();
    this.refreshSectionChrome();
    this.renderSpread(nextIndex >= currentIndex ? 22 : -22);
  }

  private setDiscoveryFilter(filter: DiscoveryFilter): void {
    if (this.discoveryFilter === filter || this.activeSection !== 'discoveries') {
      return;
    }
    this.discoveryFilter = filter;
    this.spreadIndex = 0;
    this.rebuildSpreads();
    this.refreshSectionChrome();
    this.renderSpread();
  }

  private rebuildSpreads(): void {
    this.spreads = paginateWonderbookProgress(this.cardsForSection());
  }

  private cardsForSection(): readonly WonderbookCard[] {
    switch (this.activeSection) {
      case 'discoveries':
        return this.discoveryCards();
      case 'friends':
        return this.characterEntries.map((entry) => this.friendCard(entry));
      case 'places':
        return this.regionEntries.map((entry) => this.regionCard(entry));
      case 'races':
        return this.raceEntries.map((entry) => this.raceCard(entry));
      case 'goals':
        return this.goalEntries.map((entry) => this.goalCard(entry));
    }
  }

  private discoveryCards(): readonly WonderbookCard[] {
    const entries =
      this.discoveryFilter === 'secrets'
        ? this.allEntries.filter(({ kind }) => kind === 'secret')
        : this.allEntries;
    return entries.map((entry) => ({
      id: entry.id,
      title: entry.discovered ? entry.name : 'A mystery...',
      description: entry.discovered
        ? entry.description
        : (entry.undiscoveredHint ?? 'Keep exploring to fill this page.'),
      icon: entry.icon ?? '✦',
      known: entry.discovered,
      celebrate: entry.discovered,
      kind: entry.kind,
      badge: entry.kind === 'secret' && entry.discovered ? 'Secret found ★' : undefined,
    }));
  }

  private friendCard(entry: WonderbookCharacterEntry): WonderbookCard {
    return {
      id: entry.id,
      title: entry.known ? entry.name : 'Someone to meet...',
      description: entry.known
        ? `${entry.role}. Friendship can keep growing through stories and return visits.`
        : 'A new friend is somewhere in the valley. You will meet them through ordinary exploring.',
      icon: '🦄',
      known: entry.known,
      celebrate: entry.known,
      badge: entry.known ? entry.friendshipLabel : 'No rush · keep exploring',
    };
  }

  private regionCard(entry: WonderbookRegionEntry): WonderbookCard {
    const badgeParts = entry.revealed ? [`${entry.discoveredCount} wonders remembered`] : [];
    if (entry.collectionLine) {
      badgeParts.push(entry.collectionLine);
    }
    return {
      id: entry.id,
      title: entry.revealed ? entry.name : entry.hiddenName,
      description: entry.revealed ? entry.description : entry.hint,
      icon: entry.icon,
      known: entry.revealed,
      celebrate: entry.discoveredCount > 0,
      badge: badgeParts.length > 0 ? badgeParts.join(' · ') : 'A page is waiting',
    };
  }

  private raceCard(entry: WonderbookRaceEntry): WonderbookCard {
    return {
      id: entry.id,
      title: entry.name,
      description: entry.finished ? entry.progressText : entry.hint,
      icon: entry.icon,
      known: true,
      celebrate: entry.finished,
      badge: entry.finished ? 'Course finished ✨' : 'Optional · every finish counts',
    };
  }

  private goalCard(entry: WonderbookGoalEntry): WonderbookCard {
    return {
      id: entry.id,
      title: entry.name,
      description: `${entry.description} ${entry.hint}`,
      icon: entry.icon,
      known: true,
      celebrate: entry.complete,
      badge: `${entry.progressText}${entry.complete ? ' · Lovely!' : ''}`,
    };
  }

  private refreshSectionChrome(): void {
    for (const section of SECTION_LABELS) {
      this.sectionTabs.get(section.id)?.setStyle(this.tabStyle(this.activeSection === section.id));
    }
    const discoveriesActive = this.activeSection === 'discoveries';
    this.allTab?.setVisible(discoveriesActive);
    this.secretsTab?.setVisible(discoveriesActive);
    this.allTabLabel?.setVisible(discoveriesActive);
    this.secretsTabLabel?.setVisible(discoveriesActive);
    if (discoveriesActive) {
      this.allTabLabel?.setStyle(this.filterStyle(this.discoveryFilter === 'all'));
      this.secretsTabLabel?.setStyle(this.filterStyle(this.discoveryFilter === 'secrets'));
      this.allTab?.setInteractive({ useHandCursor: true });
      this.secretsTab?.setInteractive({ useHandCursor: true });
    } else {
      this.allTab?.disableInteractive();
      this.secretsTab?.disableInteractive();
    }

    this.sectionHeading?.setText(
      SECTION_LABELS.find(({ id }) => id === this.activeSection)?.heading ?? 'My Wonderbook',
    );
    this.summaryText?.setText(this.summaryForSection());
  }

  private summaryForSection(): string {
    switch (this.activeSection) {
      case 'discoveries':
        return `${this.allEntries.filter(({ discovered }) => discovered).length} discoveries found`;
      case 'friends': {
        const known = this.characterEntries.filter(({ known }) => known).length;
        return `${known} friend${known === 1 ? '' : 's'} met`;
      }
      case 'places': {
        const known = this.regionEntries.filter(({ revealed }) => revealed).length;
        return `${known} of ${this.regionEntries.length} big places remembered`;
      }
      case 'races': {
        const finished = this.raceEntries.filter(({ finished }) => finished).length;
        return `${finished} of ${this.raceEntries.length} regular courses finished`;
      }
      case 'goals': {
        const complete = this.goalEntries.filter(({ complete }) => complete).length;
        return `${complete} long-term idea${complete === 1 ? '' : 's'} glowing · never chores`;
      }
    }
  }

  private tabStyle(selected: boolean): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color: selected ? '#5e422e' : '#fff6e8',
      fontFamily: UI_FONT,
      fontSize: '15px',
      fontStyle: 'bold',
      backgroundColor: selected ? '#f2c86f' : '#8d5d7c',
      padding: { x: 13, y: 11 },
    };
  }

  private filterStyle(selected: boolean): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color: selected ? '#5e422e' : UI_COLOURS.softInk,
      fontFamily: UI_FONT,
      fontSize: '14px',
      fontStyle: 'bold',
      backgroundColor: selected ? '#f4d58d' : '#eee0e9',
      padding: { x: 12, y: 8 },
    };
  }

  private turnSpread(direction: -1 | 1): void {
    const nextIndex = Phaser.Math.Clamp(this.spreadIndex + direction, 0, this.spreads.length - 1);
    if (nextIndex === this.spreadIndex) {
      return;
    }
    this.spreadIndex = nextIndex;
    this.renderSpread(direction * 14);
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
