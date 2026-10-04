import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { returnFromMiniGame } from '../minigames/MiniGameLauncher';
import { readMiniGameSession, type MiniGameSession } from '../minigames/MiniGameSession';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';
import {
  SUNBEAM_CHESS_ACADEMY_MODE_DEFINITIONS,
  type SunbeamChessAcademyMode,
} from './SunbeamChessAcademy';
import {
  SUNBEAM_CHESS_LESSONS,
  getSunbeamChessLesson,
  type SunbeamChessLessonDefinition,
  type SunbeamChessLessonId,
} from './SunbeamChessLessons';
import {
  chooseTeachingMove,
  chooseVillageChessMove,
  describeChessPosition,
  describeTeachingMove,
} from './SunbeamChessRules';

interface ChessPlazaSceneData {
  returnScene?: string;
}

type ChessAcademyView = 'home' | 'lesson-list' | 'lesson' | 'friendly-match';

const BOARD_LEFT = 86;
const BOARD_TOP = 128;
const SQUARE_SIZE = 58;
const BOARD_SIZE = SQUARE_SIZE * 8;
const FILES = 'abcdefgh';

const PIECE_GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

function squareFor(row: number, col: number): Square {
  return `${FILES[col]}${8 - row}` as Square;
}

function lessonHintText(lesson: SunbeamChessLessonDefinition, stage: number): string {
  if (stage <= 0) {
    return lesson.hints.notice;
  }
  if (stage === 1) {
    return lesson.hints.question;
  }
  if (stage === 2) {
    return lesson.hints.nudge;
  }
  return lesson.hints.show;
}

export class ChessPlazaActivityScene extends Phaser.Scene {
  private miniGameSession: MiniGameSession | null = null;
  private returnScene = 'SunbeamVillageScene';
  private chess = new Chess();
  private view: ChessAcademyView = 'home';
  private selected: Square | null = null;
  private hintMove: Move | null = null;
  private boardContainer: Phaser.GameObjects.Container | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private lessonText: Phaser.GameObjects.Text | null = null;
  private moveLogText: Phaser.GameObjects.Text | null = null;
  private homeMessageText: Phaser.GameObjects.Text | null = null;
  private currentLesson: SunbeamChessLessonDefinition | null = null;
  private lessonHintStage = 0;
  private lessonComplete = false;
  private lessonResetPending = false;
  private opponentPending = false;

  public constructor() {
    super('ChessPlazaActivityScene');
  }

  public create(data: ChessPlazaSceneData = {}): void {
    this.miniGameSession = readMiniGameSession(data);
    this.returnScene =
      this.miniGameSession?.returnTarget.sceneKey ?? data.returnScene ?? 'SunbeamVillageScene';
    this.resetRuntimeState();
    this.showAcademyHome();

    this.input.keyboard?.on('keydown-ESC', this.handleEscape, this);
    this.input.keyboard?.on('keydown-R', this.restartCurrentActivity, this);
    this.input.keyboard?.on('keydown-H', this.showHint, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.handleEscape, this);
      this.input.keyboard?.off('keydown-R', this.restartCurrentActivity, this);
      this.input.keyboard?.off('keydown-H', this.showHint, this);
      this.clearView();
      this.resetRuntimeState();
    });
  }

  private resetRuntimeState(): void {
    this.chess = new Chess();
    this.view = 'home';
    this.selected = null;
    this.hintMove = null;
    this.currentLesson = null;
    this.lessonHintStage = 0;
    this.lessonComplete = false;
    this.lessonResetPending = false;
    this.opponentPending = false;
  }

  private clearView(): void {
    this.children.removeAll(true);
    this.boardContainer = null;
    this.statusText = null;
    this.lessonText = null;
    this.moveLogText = null;
    this.homeMessageText = null;
  }

  private showAcademyHome(): void {
    this.clearView();
    this.view = 'home';
    this.currentLesson = null;
    this.selected = null;
    this.hintMove = null;
    this.lessonComplete = false;
    this.lessonResetPending = false;
    this.opponentPending = false;

    this.drawAcademyShell('Sunbeam Chess Academy', 'Learn, practise and play real chess at your own pace.');
    this.drawTeacherPortrait(166, 203, 1.05);

    this.add
      .text(265, 148, 'Your Sunbeam Chess Coach', {
        color: '#5d4569',
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.homeMessageText = this.add
      .text(
        265,
        191,
        'We can learn one little idea, try a puzzle, or play a whole game. You choose.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '17px',
          lineSpacing: 5,
          wordWrap: { width: 820 },
        },
      )
      .setOrigin(0, 0);

    const positions = [
      { x: 350, y: 366 },
      { x: 870, y: 366 },
      { x: 350, y: 548 },
      { x: 870, y: 548 },
    ] as const;

    SUNBEAM_CHESS_ACADEMY_MODE_DEFINITIONS.forEach((mode, index) => {
      const position = positions[index];
      this.createModeCard(position.x, position.y, 446, 150, mode.id);
    });

    this.createRoundedButton(1090, 656, 210, this.exitLabel(), () => this.leaveActivity());
  }

  private createModeCard(
    x: number,
    y: number,
    width: number,
    height: number,
    modeId: SunbeamChessAcademyMode,
  ): void {
    const mode = SUNBEAM_CHESS_ACADEMY_MODE_DEFINITIONS.find(
      (definition) => definition.id === modeId,
    );
    if (!mode) {
      return;
    }

    const panel = this.add.graphics().setPosition(x, y).setName(`sunbeam-chess:mode:${mode.id}`);
    const available = mode.availability === 'available';
    const draw = (hovered: boolean): void => {
      panel.clear();
      panel.fillStyle(
        available ? (hovered ? 0xffedf2 : 0xfffbf1) : 0xeee8dd,
        available ? 1 : 0.86,
      );
      panel.fillRoundedRect(-width / 2, -height / 2, width, height, 22);
      panel.lineStyle(available ? 3 : 2, available ? 0xc99bb2 : 0xc8beb1, 0.95);
      panel.strokeRoundedRect(-width / 2, -height / 2, width, height, 22);
    };
    draw(false);

    if (available) {
      panel
        .setInteractive(
          new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
          Phaser.Geom.Rectangle.Contains,
        )
        .on('pointerover', () => draw(true))
        .on('pointerout', () => draw(false))
        .on('pointerdown', () => this.openAcademyMode(mode.id));
    }

    this.add
      .text(x - width / 2 + 26, y - 37, `${mode.icon}  ${mode.title}`, {
        color: available ? UI_COLOURS.ink : '#8d857c',
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x - width / 2 + 26, y + 1, mode.description, {
        color: available ? UI_COLOURS.softInk : '#9d958c',
        fontFamily: UI_FONT,
        fontSize: '15px',
        lineSpacing: 4,
        wordWrap: { width: width - 52 },
      })
      .setOrigin(0, 0);

    if (!available) {
      this.add
        .text(x + width / 2 - 24, y - 48, 'COMING SOON', {
          color: '#8c7568',
          fontFamily: UI_FONT,
          fontSize: '11px',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);
    }
  }

  private openAcademyMode(modeId: SunbeamChessAcademyMode): void {
    if (modeId === 'lessons') {
      this.showLessonList();
      return;
    }
    if (modeId === 'friendly-match') {
      this.startFriendlyMatch();
      return;
    }

    this.homeMessageText?.setText(
      modeId === 'puzzle-garden'
        ? 'The Puzzle Garden is being planted. Lessons and Friendly Match are ready now.'
        : 'Coach Match is still learning when to help and when to stay quiet. Lessons and Friendly Match are ready now.',
    );
  }

  private showLessonList(): void {
    this.clearView();
    this.view = 'lesson-list';
    this.drawAcademyShell('Chess Lessons', 'Tiny challenges. One chess idea at a time.');
    this.drawTeacherPortrait(166, 190, 0.94);

    this.add
      .text(264, 154, 'Start anywhere', {
        color: '#5d4569',
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(264, 187, 'Nothing is locked. Pick the piece you want to practise.', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '16px',
      })
      .setOrigin(0, 0.5);

    const positions = [
      { x: 350, y: 360 },
      { x: 870, y: 360 },
      { x: 350, y: 535 },
      { x: 870, y: 535 },
    ] as const;

    SUNBEAM_CHESS_LESSONS.forEach((lesson, index) => {
      const position = positions[index];
      this.createLessonCard(position.x, position.y, 446, 138, lesson);
    });

    this.createRoundedButton(1100, 656, 190, '← Academy', () => this.showAcademyHome());
  }

  private createLessonCard(
    x: number,
    y: number,
    width: number,
    height: number,
    lesson: SunbeamChessLessonDefinition,
  ): void {
    const panel = this.add
      .graphics()
      .setPosition(x, y)
      .setName(`sunbeam-chess:lesson-card:${lesson.id}`);
    const draw = (hovered: boolean): void => {
      panel.clear();
      panel.fillStyle(hovered ? 0xf0f8e8 : 0xfffbf1, 1);
      panel.fillRoundedRect(-width / 2, -height / 2, width, height, 20);
      panel.lineStyle(3, hovered ? 0x7dae79 : 0xd6bc91, 0.95);
      panel.strokeRoundedRect(-width / 2, -height / 2, width, height, 20);
    };
    draw(false);
    panel
      .setInteractive(
        new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains,
      )
      .on('pointerover', () => draw(true))
      .on('pointerout', () => draw(false))
      .on('pointerdown', () => this.startLesson(lesson.id));

    this.add
      .text(x - width / 2 + 24, y - 34, `${lesson.order / 10}.  ${lesson.title}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(x - width / 2 + 24, y + 4, lesson.subtitle, {
        color: '#80654f',
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(x - width / 2 + 24, y + 32, lesson.objective, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
      })
      .setOrigin(0, 0.5);
  }

  private startLesson(id: SunbeamChessLessonId): void {
    const lesson = getSunbeamChessLesson(id);
    this.clearView();
    this.view = 'lesson';
    this.currentLesson = lesson;
    this.chess = new Chess(lesson.fen);
    this.selected = null;
    this.hintMove = null;
    this.lessonHintStage = 0;
    this.lessonComplete = false;
    this.lessonResetPending = false;
    this.opponentPending = false;

    this.createLessonBackdrop(lesson);
    this.lessonText?.setText(lesson.intro);
    this.renderBoard();
  }

  private createLessonBackdrop(lesson: SunbeamChessLessonDefinition): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x63765f, 1);
    const shell = this.add.graphics();
    shell.fillStyle(0xfff8e8, 1);
    shell.fillRoundedRect(35, 30, 1210, 654, 30);
    shell.lineStyle(7, 0xcaa66e, 1);
    shell.strokeRoundedRect(35, 30, 1210, 654, 30);

    this.add
      .text(GAME_WIDTH / 2, 66, `✦  ${lesson.title}`, {
        color: '#5d4569',
        fontFamily: UI_FONT,
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.drawBoardFrame();

    const coach = this.add.graphics();
    coach.fillStyle(0xf4ead8, 1);
    coach.fillRoundedRect(600, 116, 600, 458, 24);
    coach.lineStyle(3, 0xd6bc91, 0.95);
    coach.strokeRoundedRect(600, 116, 600, 458, 24);

    this.drawTeacherPortrait(700, 202, 0.78);

    this.add
      .text(780, 153, 'Your Chess Coach', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.statusText = this.add
      .text(780, 192, lesson.objective, {
        color: '#5d4569',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        wordWrap: { width: 365 },
      })
      .setOrigin(0, 0)
      .setName('sunbeam-chess:lesson-status');

    const lessonPanel = this.add.graphics();
    lessonPanel.fillStyle(0xfffbf1, 1);
    lessonPanel.fillRoundedRect(638, 286, 524, 160, 18);
    lessonPanel.lineStyle(2, 0xddc9a8, 0.9);
    lessonPanel.strokeRoundedRect(638, 286, 524, 160, 18);

    this.lessonText = this.add
      .text(900, 366, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '17px',
        lineSpacing: 6,
        align: 'center',
        wordWrap: { width: 470 },
      })
      .setOrigin(0.5)
      .setName('sunbeam-chess:teacher-message');

    this.add
      .text(900, 486, 'The glowing star is your goal. Green dots show legal moves.', {
        color: '#80654f',
        fontFamily: UI_FONT,
        fontSize: '14px',
        align: 'center',
      })
      .setOrigin(0.5);

    this.createRoundedButton(710, 638, 160, '💡 Hint', () => this.showHint());
    this.createRoundedButton(890, 638, 160, '↻ Reset', () => this.resetLesson());
    this.createRoundedButton(1080, 638, 190, '← Lessons', () => this.showLessonList());
  }

  private resetLesson(): void {
    if (!this.currentLesson) {
      return;
    }
    this.chess = new Chess(this.currentLesson.fen);
    this.selected = null;
    this.hintMove = null;
    this.lessonHintStage = 0;
    this.lessonComplete = false;
    this.lessonResetPending = false;
    this.lessonText?.setText(this.currentLesson.intro);
    this.renderBoard();
  }

  private startFriendlyMatch(): void {
    this.clearView();
    this.view = 'friendly-match';
    this.currentLesson = null;
    this.chess = new Chess();
    this.selected = null;
    this.hintMove = null;
    this.opponentPending = false;
    this.createFriendlyBackdrop();
    this.lessonText?.setText(describeChessPosition(this.chess));
    this.renderBoard();
  }

  private createFriendlyBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x63765f, 1);
    const shell = this.add.graphics();
    shell.fillStyle(0xfff8e8, 1);
    shell.fillRoundedRect(35, 30, 1210, 654, 30);
    shell.lineStyle(7, 0xcaa66e, 1);
    shell.strokeRoundedRect(35, 30, 1210, 654, 30);

    this.add
      .text(GAME_WIDTH / 2, 66, '♟  Friendly Match', {
        color: '#5d4569',
        fontFamily: UI_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.drawBoardFrame();

    const coach = this.add.graphics();
    coach.fillStyle(0xf4ead8, 1);
    coach.fillRoundedRect(600, 116, 600, 458, 24);
    coach.lineStyle(3, 0xd6bc91, 0.95);
    coach.strokeRoundedRect(600, 116, 600, 458, 24);

    this.add
      .text(900, 148, 'Friendly Chess', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const statusPanel = this.add.graphics();
    statusPanel.fillStyle(0xe4d7c2, 1);
    statusPanel.fillRoundedRect(638, 178, 524, 86, 18);

    this.statusText = this.add
      .text(900, 221, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 478 },
      })
      .setOrigin(0.5);

    this.add
      .text(654, 291, 'WHAT TO NOTICE', {
        color: '#80654f',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    const lessonPanel = this.add.graphics();
    lessonPanel.fillStyle(0xfffbf1, 1);
    lessonPanel.fillRoundedRect(638, 310, 524, 112, 18);
    lessonPanel.lineStyle(2, 0xddc9a8, 0.9);
    lessonPanel.strokeRoundedRect(638, 310, 524, 112, 18);

    this.lessonText = this.add
      .text(900, 366, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '16px',
        lineSpacing: 5,
        align: 'center',
        wordWrap: { width: 478 },
      })
      .setOrigin(0.5);

    this.add
      .text(654, 448, 'MOVES', {
        color: '#80654f',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    const historyPanel = this.add.graphics();
    historyPanel.fillStyle(0xeee2cf, 1);
    historyPanel.fillRoundedRect(638, 467, 524, 78, 16);

    this.moveLogText = this.add
      .text(660, 484, 'No moves yet.', {
        color: UI_COLOURS.softInk,
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        lineSpacing: 4,
        wordWrap: { width: 480 },
      })
      .setOrigin(0, 0);

    this.add
      .text(900, 594, 'Full legal chess · Friendly opponent tuning arrives later in the Academy.', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        align: 'center',
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5);

    this.createRoundedButton(710, 638, 168, '💡 Hint', () => this.showHint());
    this.createRoundedButton(900, 638, 168, '↻ Restart', () => this.restartFriendlyMatch());
    this.createRoundedButton(1090, 638, 188, '← Academy', () => this.showAcademyHome());
  }

  private drawAcademyShell(title: string, subtitle: string): void {
    this.cameras.main.setBackgroundColor('#63765f');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x63765f, 1);
    const shell = this.add.graphics();
    shell.fillStyle(0xfff8e8, 1);
    shell.fillRoundedRect(35, 30, 1210, 654, 30);
    shell.lineStyle(7, 0xcaa66e, 1);
    shell.strokeRoundedRect(35, 30, 1210, 654, 30);

    this.add
      .text(GAME_WIDTH / 2, 66, `♟  ${title}`, {
        color: '#5d4569',
        fontFamily: UI_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 101, subtitle, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
      })
      .setOrigin(0.5);
  }

  private drawTeacherPortrait(x: number, y: number, scale: number): void {
    const portrait = this.add
      .graphics()
      .setPosition(x, y)
      .setScale(scale)
      .setName('sunbeam-chess:teacher');

    portrait.fillStyle(0xfff4d8, 1);
    portrait.fillCircle(0, 0, 62);
    portrait.lineStyle(5, 0xcaa66e, 1);
    portrait.strokeCircle(0, 0, 62);

    portrait.fillStyle(0xd9b5e8, 1);
    portrait.fillEllipse(-8, 7, 86, 66);
    portrait.lineStyle(4, 0x6c4c74, 0.95);
    portrait.strokeEllipse(-8, 7, 86, 66);

    portrait.fillStyle(0x76548a, 1);
    portrait.fillCircle(-43, -12, 20);
    portrait.fillCircle(-39, 8, 18);
    portrait.fillCircle(-34, 27, 15);

    portrait.fillStyle(0xe9d8f1, 1);
    portrait.fillTriangle(-30, -37, -20, -69, -8, -34);
    portrait.lineStyle(3, 0x6c4c74, 0.95);
    portrait.strokeTriangle(-30, -37, -20, -69, -8, -34);

    portrait.fillStyle(0xffd56f, 1);
    portrait.fillTriangle(13, -35, 28, -72, 34, -30);
    portrait.lineStyle(3, 0x8a6b39, 0.9);
    portrait.strokeTriangle(13, -35, 28, -72, 34, -30);

    portrait.fillStyle(0x4f3c5a, 1);
    portrait.fillCircle(18, -2, 5);
    portrait.fillStyle(0xffffff, 0.9);
    portrait.fillCircle(20, -4, 1.8);
    portrait.fillStyle(0xf2a7b8, 0.5);
    portrait.fillCircle(31, 13, 7);
    portrait.lineStyle(2.5, 0x4f3c5a, 0.9);
    portrait.lineBetween(18, 20, 28, 24);
    portrait.lineBetween(28, 24, 37, 18);

    portrait.fillStyle(0x78b8a1, 1);
    portrait.fillRoundedRect(-16, 35, 46, 11, 5);
    portrait.fillStyle(0xffe28a, 1);
    portrait.fillCircle(8, 41, 6);
  }

  private drawBoardFrame(): void {
    const boardFrame = this.add.graphics();
    boardFrame.fillStyle(0x6c4b3b, 1);
    boardFrame.fillRoundedRect(
      BOARD_LEFT - 18,
      BOARD_TOP - 18,
      BOARD_SIZE + 36,
      BOARD_SIZE + 36,
      18,
    );
    boardFrame.lineStyle(4, 0x49362f, 1);
    boardFrame.strokeRoundedRect(
      BOARD_LEFT - 18,
      BOARD_TOP - 18,
      BOARD_SIZE + 36,
      BOARD_SIZE + 36,
      18,
    );
  }

  private renderBoard(): void {
    this.boardContainer?.destroy(true);
    this.boardContainer = this.add.container(0, 0).setDepth(10);

    const selectedMoves = this.selected
      ? this.chess.moves({ square: this.selected, verbose: true })
      : [];
    const goalSquare = this.view === 'lesson' ? this.currentLesson?.goalSquare : undefined;

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const x = BOARD_LEFT + col * SQUARE_SIZE + SQUARE_SIZE / 2;
        const y = BOARD_TOP + row * SQUARE_SIZE + SQUARE_SIZE / 2;
        const square = squareFor(row, col);
        const selected = this.selected === square;
        const legalDestination = selectedMoves.some((move) => move.to === square);
        const hintFrom = this.hintMove?.from === square;
        const hintTo = this.hintMove?.to === square;
        const isGoal = goalSquare === square;
        const baseColour = (row + col) % 2 === 0 ? 0xf4deb0 : 0x94705a;
        const squareColour =
          selected || hintFrom
            ? 0xf2ce6d
            : hintTo
              ? 0x8fc89a
              : isGoal
                ? 0xf5e6a0
                : legalDestination
                  ? 0xb7d9aa
                  : baseColour;

        const tile = this.add
          .rectangle(x, y, SQUARE_SIZE - 1, SQUARE_SIZE - 1, squareColour, 1)
          .setInteractive({ useHandCursor: true })
          .setName(`sunbeam-chess:square:${square}`);
        tile.on('pointerdown', () => this.handleSquarePress(square));
        this.boardContainer.add(tile);

        if (legalDestination && !hintTo) {
          this.boardContainer.add(this.add.circle(x, y, 7, 0x4f8658, 0.72));
        }

        if (isGoal) {
          this.boardContainer.add(
            this.add
              .text(x, y, '✦', {
                color: '#8a6429',
                fontFamily: UI_FONT,
                fontSize: '25px',
                fontStyle: 'bold',
              })
              .setOrigin(0.5)
              .setAlpha(this.lessonComplete ? 0.35 : 0.9),
          );
        }

        if (hintTo) {
          this.boardContainer.add(
            this.add.circle(x, y, 18, 0x397a4f, 0.16).setStrokeStyle(4, 0x397a4f, 0.9),
          );
        }

        const piece = this.chess.get(square);
        if (piece) {
          const glyph = this.add
            .text(x, y - 2, PIECE_GLYPHS[piece.color][piece.type], {
              color: piece.color === 'w' ? '#fff9e7' : '#493a35',
              fontFamily: 'Georgia, serif',
              fontSize: '42px',
              fontStyle: 'bold',
              stroke: piece.color === 'w' ? '#5b4a42' : '#f5e6c7',
              strokeThickness: 2,
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setName(`sunbeam-chess:piece:${piece.color}:${piece.type}:${square}`);
          glyph.on('pointerdown', () => this.handleSquarePress(square));
          this.boardContainer.add(glyph);
        }
      }
    }

    for (let index = 0; index < 8; index += 1) {
      this.boardContainer.add([
        this.add
          .text(
            BOARD_LEFT - 13,
            BOARD_TOP + index * SQUARE_SIZE + SQUARE_SIZE / 2,
            String(8 - index),
            {
              color: '#f6e6c8',
              fontFamily: UI_FONT,
              fontSize: '12px',
              fontStyle: 'bold',
            },
          )
          .setOrigin(0.5),
        this.add
          .text(
            BOARD_LEFT + index * SQUARE_SIZE + SQUARE_SIZE / 2,
            BOARD_TOP + BOARD_SIZE + 13,
            FILES[index].toUpperCase(),
            {
              color: '#f6e6c8',
              fontFamily: UI_FONT,
              fontSize: '12px',
              fontStyle: 'bold',
            },
          )
          .setOrigin(0.5),
      ]);
    }

    if (this.view === 'friendly-match') {
      this.updateFriendlyCoach();
    }
  }

  private handleSquarePress(square: Square): void {
    if (this.view === 'lesson') {
      this.handleLessonSquarePress(square);
      return;
    }
    if (this.view === 'friendly-match') {
      this.handleFriendlySquarePress(square);
    }
  }

  private handleLessonSquarePress(square: Square): void {
    const lesson = this.currentLesson;
    if (!lesson || this.lessonComplete || this.lessonResetPending) {
      return;
    }

    const piece = this.chess.get(square);
    if (!this.selected) {
      if (square !== lesson.pieceSquare) {
        if (piece?.color === 'w') {
          this.lessonText?.setText(
            `For this little challenge, use the ${lesson.pieceName}. Find it on ${lesson.pieceSquare.toUpperCase()}.`,
          );
        }
        return;
      }
      this.selected = square;
      this.hintMove = null;
      this.lessonText?.setText(
        `Great. The green dots show every legal ${lesson.pieceName} move. Which one reaches the star?`,
      );
      this.renderBoard();
      return;
    }

    if (square === this.selected) {
      this.selected = null;
      this.renderBoard();
      return;
    }

    const legalMoves = this.chess.moves({ square: this.selected, verbose: true });
    const chosen =
      legalMoves.find((move) => move.to === square && move.promotion === 'q') ??
      legalMoves.find((move) => move.to === square);

    if (!chosen) {
      this.lessonText?.setText(
        `That square is not a legal ${lesson.pieceName} move. Try one of the green dots.`,
      );
      return;
    }

    this.chess.move({
      from: chosen.from,
      to: chosen.to,
      promotion: chosen.promotion,
    });
    this.selected = null;
    this.hintMove = null;

    if (chosen.to === lesson.goalSquare) {
      this.lessonComplete = true;
      this.statusText?.setText('Lesson complete ✦');
      this.lessonText?.setText(lesson.success);
      this.renderBoard();
      return;
    }

    this.lessonResetPending = true;
    this.lessonText?.setText(
      `That is a legal ${lesson.pieceName} move. Nice! The star is somewhere else, so we will pop the piece back and try again.`,
    );
    this.renderBoard();
    this.time.delayedCall(800, () => {
      if (this.view === 'lesson' && this.currentLesson?.id === lesson.id) {
        this.chess = new Chess(lesson.fen);
        this.selected = null;
        this.hintMove = null;
        this.lessonResetPending = false;
        this.renderBoard();
      }
    });
  }

  private handleFriendlySquarePress(square: Square): void {
    if (this.opponentPending || this.chess.isGameOver() || this.chess.turn() !== 'w') {
      return;
    }

    const piece = this.chess.get(square);
    if (!this.selected) {
      if (piece?.color === 'w') {
        this.selectFriendlyPiece(square);
      }
      return;
    }

    if (piece?.color === 'w') {
      this.selectFriendlyPiece(square);
      return;
    }

    const legalMoves = this.chess.moves({ square: this.selected, verbose: true });
    const chosen =
      legalMoves.find((move) => move.to === square && move.promotion === 'q') ??
      legalMoves.find((move) => move.to === square);

    if (!chosen) {
      this.hintMove = null;
      this.lessonText?.setText(
        'That move is not legal in this position. A legal move can never leave your own king in check.',
      );
      this.updateFriendlyCoach();
      return;
    }

    const applied = this.chess.move({
      from: chosen.from,
      to: chosen.to,
      promotion: chosen.promotion,
    });
    this.selected = null;
    this.hintMove = null;
    this.lessonText?.setText(describeTeachingMove(applied));
    this.renderBoard();

    if (!this.chess.isGameOver()) {
      this.opponentPending = true;
      this.updateFriendlyCoach();
      this.time.delayedCall(520, () => this.makeOpponentMove());
    }
  }

  private selectFriendlyPiece(square: Square): void {
    const legalMoves = this.chess.moves({ square, verbose: true });
    this.selected = square;
    this.hintMove = null;

    if (legalMoves.length === 0) {
      this.lessonText?.setText(
        'That piece has no legal moves right now. Try another piece or deal with the threat to your king.',
      );
    } else {
      const piece = this.chess.get(square);
      this.lessonText?.setText(
        `That ${piece ? this.pieceName(piece.type) : 'piece'} has ${legalMoves.length} legal move${legalMoves.length === 1 ? '' : 's'}. Green squares are legal destinations.`,
      );
    }
    this.renderBoard();
  }

  private makeOpponentMove(): void {
    if (this.view !== 'friendly-match') {
      this.opponentPending = false;
      return;
    }
    if (this.chess.isGameOver() || this.chess.turn() !== 'b') {
      this.opponentPending = false;
      this.renderBoard();
      return;
    }

    const chosen = chooseVillageChessMove(this.chess);
    if (chosen) {
      const applied = this.chess.move({
        from: chosen.from,
        to: chosen.to,
        promotion: chosen.promotion,
      });
      this.lessonText?.setText(`Village move: ${describeTeachingMove(applied)}`);
    }

    this.opponentPending = false;
    this.renderBoard();
  }

  private showHint(): void {
    if (this.view === 'lesson') {
      this.showLessonHint();
      return;
    }

    if (
      this.view !== 'friendly-match' ||
      this.opponentPending ||
      this.chess.isGameOver() ||
      this.chess.turn() !== 'w'
    ) {
      return;
    }

    const hint = chooseTeachingMove(this.chess);
    if (!hint) {
      return;
    }

    this.hintMove = hint;
    this.selected = hint.from;
    this.lessonText?.setText(`Hint: ${describeTeachingMove(hint)}`);
    this.renderBoard();
  }

  private showLessonHint(): void {
    const lesson = this.currentLesson;
    if (!lesson || this.lessonComplete || this.lessonResetPending) {
      return;
    }

    const stage = Math.min(this.lessonHintStage, 3);
    this.lessonText?.setText(lessonHintText(lesson, stage));

    if (stage >= 2) {
      this.selected = lesson.pieceSquare;
    }
    if (stage >= 3) {
      this.hintMove =
        this.chess
          .moves({ square: lesson.pieceSquare, verbose: true })
          .find((move) => move.to === lesson.goalSquare) ?? null;
    }

    this.lessonHintStage = Math.min(3, stage + 1);
    this.renderBoard();
  }

  private updateFriendlyCoach(): void {
    if (!this.statusText || !this.moveLogText) {
      return;
    }

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
      this.statusText.setText(`CHECKMATE · ${winner} wins`);
      this.lessonText?.setText(describeChessPosition(this.chess));
    } else if (this.chess.isGameOver()) {
      this.statusText.setText('GAME DRAWN');
      this.lessonText?.setText(describeChessPosition(this.chess));
    } else if (this.opponentPending || this.chess.turn() === 'b') {
      this.statusText.setText(
        this.chess.isCheck() ? 'CHECK · Village must respond' : 'Village is thinking…',
      );
    } else if (this.chess.isCheck()) {
      this.statusText.setText('CHECK · Protect your king');
      if (!this.selected) {
        this.lessonText?.setText(describeChessPosition(this.chess));
      }
    } else if (this.selected) {
      this.statusText.setText('Choose a highlighted legal square');
    } else {
      this.statusText.setText('Your move · White');
    }

    const history = this.chess.history();
    if (history.length === 0) {
      this.moveLogText.setText('No moves yet.');
      return;
    }

    const rows: string[] = [];
    for (let index = 0; index < history.length; index += 2) {
      rows.push(`${index / 2 + 1}.  ${history[index] ?? ''}    ${history[index + 1] ?? ''}`);
    }
    this.moveLogText.setText(rows.slice(-3).join('\n'));
  }

  private pieceName(piece: PieceSymbol): string {
    return {
      p: 'pawn',
      n: 'knight',
      b: 'bishop',
      r: 'rook',
      q: 'queen',
      k: 'king',
    }[piece];
  }

  private restartCurrentActivity(): void {
    if (this.view === 'lesson') {
      this.resetLesson();
    } else if (this.view === 'friendly-match') {
      this.restartFriendlyMatch();
    }
  }

  private restartFriendlyMatch(): void {
    this.chess.reset();
    this.selected = null;
    this.hintMove = null;
    this.opponentPending = false;
    this.lessonText?.setText(describeChessPosition(this.chess));
    this.renderBoard();
  }

  private handleEscape(): void {
    if (this.view === 'lesson') {
      this.showLessonList();
      return;
    }
    if (this.view === 'lesson-list' || this.view === 'friendly-match') {
      this.showAcademyHome();
      return;
    }
    this.leaveActivity();
  }

  private createRoundedButton(
    x: number,
    y: number,
    width: number,
    labelText: string,
    onPress: () => void,
  ): void {
    const height = 54;
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

  private exitLabel(): string {
    return this.miniGameSession?.source === 'just-games' ? '← Back to Games' : '← Back to Village';
  }

  private leaveActivity(): void {
    if (this.miniGameSession) {
      returnFromMiniGame(this, this.miniGameSession);
      return;
    }

    this.scene.stop();
    if (this.game.scene.isPaused(this.returnScene)) {
      this.game.scene.resume(this.returnScene);
    } else if (!this.game.scene.isActive(this.returnScene)) {
      this.game.scene.start(this.returnScene);
    }
  }
}
