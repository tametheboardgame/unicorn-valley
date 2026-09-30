import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { UI_COLOURS, UI_FONT, createUiShadow } from '../ui/uiTheme';
import type { SunbeamNotice, SunbeamNoticeTone } from './SunbeamNoticeBoardModel';

interface VillageNoticeBoardSceneData {
  returnScene?: string;
  notices?: SunbeamNotice[];
  initialNoticeId?: string;
}

const TONE_COLOURS: Record<
  SunbeamNoticeTone,
  { paper: number; edge: number; pin: number; accent: string }
> = {
  parchment: { paper: 0xfff1ca, edge: 0xd7b979, pin: 0xce7a63, accent: '#8a654b' },
  blush: { paper: 0xffe4e2, edge: 0xdca4a0, pin: 0xd87882, accent: '#8d5861' },
  mint: { paper: 0xe1f3df, edge: 0x9fc59e, pin: 0x69a77a, accent: '#52745c' },
  lavender: { paper: 0xeee6ff, edge: 0xb9a7d6, pin: 0x8b72b5, accent: '#665485' },
  gold: { paper: 0xffedb8, edge: 0xd5ad55, pin: 0xc88443, accent: '#85602f' },
};

export class VillageNoticeBoardScene extends Phaser.Scene {
  private returnScene = 'SunbeamVillageScene';
  private notices: SunbeamNotice[] = [];
  private selectedNoticeId = '';
  private noteContainer: Phaser.GameObjects.Container | null = null;
  private detailEyebrow: Phaser.GameObjects.Text | null = null;
  private detailIcon: Phaser.GameObjects.Text | null = null;
  private detailTitle: Phaser.GameObjects.Text | null = null;
  private detailBody: Phaser.GameObjects.Text | null = null;
  private detailFooter: Phaser.GameObjects.Text | null = null;
  private detailPaper: Phaser.GameObjects.Graphics | null = null;

  public constructor() {
    super('VillageNoticeBoardScene');
  }

  public create(data: VillageNoticeBoardSceneData = {}): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.notices = data.notices ?? [];
    this.selectedNoticeId =
      data.initialNoticeId && this.notices.some(({ id }) => id === data.initialNoticeId)
        ? data.initialNoticeId
        : (this.notices[0]?.id ?? '');

    this.cameras.main.setBackgroundColor('#5f735d');
    this.createBoardShell();
    this.createDetailPanel();
    this.renderNoticeCards();
    this.updateDetail();

    this.input.keyboard?.on('keydown-ESC', this.leaveBoard, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.leaveBoard, this);
      this.noteContainer?.destroy(true);
      this.noteContainer = null;
      this.detailEyebrow = null;
      this.detailIcon = null;
      this.detailTitle = null;
      this.detailBody = null;
      this.detailFooter = null;
      this.detailPaper = null;
    });
  }

  private createBoardShell(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x5f735d, 1);
    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 1200, 650, 1, 0.3);

    const shell = this.add.graphics();
    shell.fillStyle(0x754f3b, 1);
    shell.fillRoundedRect(38, 28, 1204, 654, 30);
    shell.lineStyle(7, 0x523a2e, 1);
    shell.strokeRoundedRect(38, 28, 1204, 654, 30);

    shell.fillStyle(0xb77f52, 1);
    shell.fillRoundedRect(58, 48, 704, 614, 18);
    shell.lineStyle(4, 0xd2a06f, 0.88);
    shell.strokeRoundedRect(58, 48, 704, 614, 18);

    shell.fillStyle(0xb9855f, 1);
    shell.fillRoundedRect(77, 108, 666, 532, 12);
    shell.lineStyle(3, 0x926243, 0.88);
    shell.strokeRoundedRect(77, 108, 666, 532, 12);

    for (const [x, y, radius] of [
      [109, 139, 4],
      [724, 159, 5],
      [392, 298, 4],
      [198, 610, 5],
      [694, 602, 4],
      [526, 132, 3],
    ] as const) {
      shell.fillStyle(0x8d634c, 0.35);
      shell.fillCircle(x, y, radius);
    }

    this.add
      .text(410, 76, 'SUNBEAM VILLAGE  ·  NOTICE BOARD', {
        color: '#fff2cf',
        fontFamily: UI_FONT,
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(410, 101, 'Tap a pinned note to read it', {
        color: '#edd9ba',
        fontFamily: UI_FONT,
        fontSize: '13px',
      })
      .setOrigin(0.5);
  }

  private createDetailPanel(): void {
    const panel = this.add.graphics();
    panel.fillStyle(0xf6ead7, 1);
    panel.fillRoundedRect(790, 48, 428, 592, 22);
    panel.lineStyle(4, 0xd1b78f, 1);
    panel.strokeRoundedRect(790, 48, 428, 592, 22);

    this.add
      .text(1004, 81, 'READING PIN', {
        color: '#8a6d56',
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.detailPaper = this.add.graphics();

    this.detailEyebrow = this.add
      .text(1004, 157, '', {
        color: '#80614d',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.detailIcon = this.add
      .text(1004, 202, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
      })
      .setOrigin(0.5);

    this.detailTitle = this.add
      .text(1004, 254, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 330 },
      })
      .setOrigin(0.5);

    this.detailBody = this.add
      .text(1004, 375, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '16px',
        lineSpacing: 7,
        align: 'center',
        wordWrap: { width: 326 },
      })
      .setOrigin(0.5);

    this.detailFooter = this.add
      .text(1004, 522, '', {
        color: '#846b58',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: 310 },
      })
      .setOrigin(0.5);

    this.createRoundedButton(1004, 594, 250, '← Back to Village', () => this.leaveBoard());
  }

  private renderNoticeCards(): void {
    this.noteContainer?.destroy(true);
    this.noteContainer = this.add.container(0, 0);

    const columns = [246, 574] as const;
    const rows = [190, 356, 522] as const;

    this.notices.slice(0, 6).forEach((notice, index) => {
      const x = columns[index % 2];
      const y = rows[Math.floor(index / 2)];
      const selected = notice.id === this.selectedNoticeId;
      this.noteContainer?.add(this.createNoticeCard(notice, x, y, selected));
    });
  }

  private createNoticeCard(
    notice: SunbeamNotice,
    x: number,
    y: number,
    selected: boolean,
  ): Phaser.GameObjects.Container {
    const tone = TONE_COLOURS[notice.tone];
    const width = 286;
    const height = 136;
    const card = this.add.container(x, y);
    const paper = this.add.graphics();

    paper.fillStyle(0x50382e, 0.14);
    paper.fillRoundedRect(-width / 2 + 5, -height / 2 + 7, width, height, 12);
    paper.fillStyle(tone.paper, 1);
    paper.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    paper.lineStyle(selected ? 5 : 2, selected ? 0xfff0a8 : tone.edge, 1);
    paper.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    paper
      .setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
      .on('pointerdown', () => this.selectNotice(notice.id));

    const pin = this.add
      .circle(0, -height / 2 + 12, 8, tone.pin, 1)
      .setStrokeStyle(2, 0x754c3c, 0.45);
    const icon = this.add
      .text(-112, -37, notice.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
      })
      .setOrigin(0.5);
    const eyebrow = this.add
      .text(-86, -44, notice.eyebrow, {
        color: tone.accent,
        fontFamily: UI_FONT,
        fontSize: '10px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    const title = this.add
      .text(-116, -13, notice.title, {
        color: '#59463d',
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        wordWrap: { width: 232 },
      })
      .setOrigin(0, 0.5);
    const summary = this.add
      .text(-116, 32, notice.summary, {
        color: '#725e52',
        fontFamily: UI_FONT,
        fontSize: '12px',
        lineSpacing: 2,
        wordWrap: { width: 232 },
      })
      .setOrigin(0, 0.5);

    for (const item of [icon, eyebrow, title, summary]) {
      item
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectNotice(notice.id));
    }
    if (paper.input) {
      paper.input.cursor = 'pointer';
    }

    card.add([paper, pin, icon, eyebrow, title, summary]);
    card.setRotation(indexedTilt(notice.id));
    return card;
  }

  private selectNotice(id: string): void {
    if (id === this.selectedNoticeId) {
      return;
    }
    this.selectedNoticeId = id;
    this.renderNoticeCards();
    this.updateDetail();
  }

  private updateDetail(): void {
    const notice = this.notices.find(({ id }) => id === this.selectedNoticeId);
    if (!notice || !this.detailPaper) {
      return;
    }

    const tone = TONE_COLOURS[notice.tone];
    this.detailPaper.clear();
    this.detailPaper.fillStyle(tone.paper, 1);
    this.detailPaper.fillRoundedRect(826, 112, 356, 444, 20);
    this.detailPaper.lineStyle(3, tone.edge, 1);
    this.detailPaper.strokeRoundedRect(826, 112, 356, 444, 20);
    this.detailPaper.fillStyle(tone.pin, 1);
    this.detailPaper.fillCircle(1004, 125, 8);

    this.detailEyebrow?.setText(notice.eyebrow).setColor(tone.accent);
    this.detailIcon?.setText(notice.icon);
    this.detailTitle?.setText(notice.title);
    this.detailBody?.setText(notice.body);
    this.detailFooter?.setText(notice.footer);
  }

  private createRoundedButton(
    x: number,
    y: number,
    width: number,
    labelText: string,
    onPress: () => void,
  ): void {
    const height = 52;
    const button = this.add.graphics().setPosition(x, y);
    const draw = (fill: number): void => {
      button.clear();
      button.fillStyle(fill, 1);
      button.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
      button.lineStyle(3, 0x6aa996, 1);
      button.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
    };
    draw(UI_COLOURS.mint);

    button
      .setInteractive(
        new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains,
      )
      .on('pointerover', () => draw(UI_COLOURS.blush))
      .on('pointerout', () => draw(UI_COLOURS.mint))
      .on('pointerdown', onPress);

    this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private leaveBoard(): void {
    this.scene.stop();
    if (this.game.scene.isPaused(this.returnScene)) {
      this.game.scene.resume(this.returnScene);
    } else if (!this.game.scene.isActive(this.returnScene)) {
      this.game.scene.start(this.returnScene);
    }
  }
}

function indexedTilt(id: string): number {
  const tilts: Record<string, number> = {
    'map-corner': -0.012,
    mitten: -0.012,
    today: 0.008,
    fountain: -0.006,
    'story-house': 0.01,
    chess: -0.008,
  };
  return tilts[id] ?? 0;
}
