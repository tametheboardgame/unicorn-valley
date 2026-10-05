import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { returnFromMiniGame } from '../minigames/MiniGameLauncher';
import { readMiniGameSession, type MiniGameSession } from '../minigames/MiniGameSession';
import { UI_FONT } from '../ui/uiTheme';
import { createCoreNpcSprite } from '../visual/CoreNpcProductionArt';
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
  SUNBEAM_CHESS_PUZZLES,
  getSunbeamChessPuzzle,
  type SunbeamChessPuzzleDefinition,
  type SunbeamChessPuzzleId,
} from './SunbeamChessPuzzles';
import {
  chooseTeachingMove,
  chooseVillageChessMove,
  describeChessPosition,
  describeTeachingMove,
} from './SunbeamChessRules';
import {
  getSunbeamChessCoachHint,
  reviewSunbeamChessCoachMove,
  type SunbeamChessCoachConcern,
} from './SunbeamChessCoach';

interface ChessPlazaSceneData {
  returnScene?: string;
}

type ChessAcademyView =
  | 'home'
  | 'lesson-list'
  | 'lesson'
  | 'puzzle-list'
  | 'puzzle'
  | 'coach-match'
  | 'friendly-match';

const BOARD_LEFT = 86;
const BOARD_TOP = 128;
const SQUARE_SIZE = 58;
const BOARD_SIZE = SQUARE_SIZE * 8;
const FILES = 'abcdefgh';
const MOVE_HISTORY_VISIBLE_ROWS = 4;
const COACH_MOVE_FEEDBACK_HOLD_MS = 2400;

const CHESS_ACADEMY_PALETTE = {
  backdrop: 0x281643,
  shell: 0xf6f0ff,
  shellBorder: 0xf2c75c,
  header: 0x5d2f8d,
  headerAccent: 0x7748aa,
  ink: '#35204f',
  softInk: '#66557a',
  berry: 0xc95d9c,
  berrySoft: 0xffe8f5,
  lavender: 0x7d5bc8,
  lavenderSoft: 0xeee6ff,
  mint: 0x78d7c4,
  mintHover: 0x9de7d9,
  mintSoft: 0xe3faf5,
  turquoise: 0x3da996,
  gold: 0xf2c75c,
  goldSoft: 0xfff3c9,
  disabled: 0xe5e0ec,
  disabledBorder: 0xb7acc4,
  panel: 0xf0e9fb,
  panelBright: 0xffffff,
} as const;

const PIECE_GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

function squareFor(row: number, col: number): Square {
  return `${FILES[col]}${8 - row}` as Square;
}

function layeredHintText(
  hints: { notice: string; question: string; nudge: string; show: string },
  stage: number,
): string {
  if (stage <= 0) {
    return hints.notice;
  }
  if (stage === 1) {
    return hints.question;
  }
  if (stage === 2) {
    return hints.nudge;
  }
  return hints.show;
}

export class ChessPlazaActivityScene extends Phaser.Scene {
  private miniGameSession: MiniGameSession | null = null;
  private returnScene = 'SunbeamVillageScene';
  private chess = new Chess();
  private view: ChessAcademyView = 'home';
  private selected: Square | null = null;
  private hintMove: Move | null = null;
  private boardContainer: Phaser.GameObjects.Container | null = null;
  private completionContainer: Phaser.GameObjects.Container | null = null;
  private coachWarningContainer: Phaser.GameObjects.Container | null = null;
  private coachPendingMove: Move | null = null;
  private coachHintStage = 0;
  private coachUndoPlies = 0;
  private friendlyResultShown = false;
  private statusText: Phaser.GameObjects.Text | null = null;
  private lessonText: Phaser.GameObjects.Text | null = null;
  private moveLogText: Phaser.GameObjects.Text | null = null;
  private moveHistoryRangeText: Phaser.GameObjects.Text | null = null;
  private moveHistoryStart = -1;
  private coachHoldingFeedback = false;
  private coachLastPlayerFeedback: string | null = null;
  private homeMessageText: Phaser.GameObjects.Text | null = null;
  private currentLesson: SunbeamChessLessonDefinition | null = null;
  private lessonHintStage = 0;
  private lessonComplete = false;
  private lessonResetPending = false;
  private currentPuzzle: SunbeamChessPuzzleDefinition | null = null;
  private puzzleHintStage = 0;
  private puzzleComplete = false;
  private puzzleResetPending = false;
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
    this.currentPuzzle = null;
    this.puzzleHintStage = 0;
    this.puzzleComplete = false;
    this.puzzleResetPending = false;
    this.coachPendingMove = null;
    this.coachHintStage = 0;
    this.coachUndoPlies = 0;
    this.coachHoldingFeedback = false;
    this.coachLastPlayerFeedback = null;
    this.moveHistoryStart = -1;
    this.friendlyResultShown = false;
    this.opponentPending = false;
  }

  private clearView(): void {
    this.children.removeAll(true);
    this.boardContainer = null;
    this.completionContainer = null;
    this.coachWarningContainer = null;
    this.coachPendingMove = null;
    this.statusText = null;
    this.lessonText = null;
    this.moveLogText = null;
    this.moveHistoryRangeText = null;
    this.moveHistoryStart = -1;
    this.coachHoldingFeedback = false;
    this.coachLastPlayerFeedback = null;
    this.homeMessageText = null;
  }

  private showAcademyHome(): void {
    this.clearView();
    this.view = 'home';
    this.currentLesson = null;
    this.currentPuzzle = null;
    this.selected = null;
    this.hintMove = null;
    this.lessonComplete = false;
    this.lessonResetPending = false;
    this.puzzleComplete = false;
    this.puzzleResetPending = false;
    this.opponentPending = false;

    this.drawAcademyShell(
      'Sunbeam Chess Academy',
      'Learn, practise and play real chess at your own pace.',
    );
    this.drawTeacherPortrait(154, 181, 0.9);

    this.add
      .text(242, 151, 'Your Sunbeam Chess Coach', {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.homeMessageText = this.add
      .text(
        242,
        187,
        'We can learn one little idea, try a puzzle, or play a whole game. You choose.',
        {
          color: CHESS_ACADEMY_PALETTE.softInk,
          fontFamily: UI_FONT,
          fontSize: '17px',
          lineSpacing: 5,
          wordWrap: { width: 850 },
        },
      )
      .setOrigin(0, 0);

    const positions = [
      { x: 350, y: 338 },
      { x: 870, y: 338 },
      { x: 350, y: 506 },
      { x: 870, y: 506 },
    ] as const;

    SUNBEAM_CHESS_ACADEMY_MODE_DEFINITIONS.forEach((mode, index) => {
      const position = positions[index];
      this.createModeCard(position.x, position.y, 446, 132, mode.id);
    });

    this.createRoundedButton(1082, 638, 210, this.exitLabel(), () => this.leaveActivity());
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
    const accent =
      mode.id === 'lessons'
        ? { fill: CHESS_ACADEMY_PALETTE.berrySoft, border: CHESS_ACADEMY_PALETTE.berry }
        : mode.id === 'puzzle-garden'
          ? { fill: CHESS_ACADEMY_PALETTE.mintSoft, border: CHESS_ACADEMY_PALETTE.turquoise }
          : mode.id === 'coach-match'
            ? { fill: CHESS_ACADEMY_PALETTE.goldSoft, border: CHESS_ACADEMY_PALETTE.gold }
            : mode.id === 'friendly-match'
              ? { fill: CHESS_ACADEMY_PALETTE.lavenderSoft, border: CHESS_ACADEMY_PALETTE.lavender }
              : {
                  fill: CHESS_ACADEMY_PALETTE.disabled,
                  border: CHESS_ACADEMY_PALETTE.disabledBorder,
                };
    const draw = (hovered: boolean): void => {
      panel.clear();
      const fill = available && hovered ? CHESS_ACADEMY_PALETTE.panelBright : accent.fill;
      panel.fillStyle(fill, available ? 1 : 0.9);
      panel.fillRoundedRect(-width / 2, -height / 2, width, height, 22);
      panel.lineStyle(available ? 3 : 2, accent.border, 1);
      panel.strokeRoundedRect(-width / 2, -height / 2, width, height, 22);
      panel.fillStyle(accent.border, available ? 0.95 : 0.55);
      panel.fillRoundedRect(-width / 2 + 10, -height / 2 + 12, 8, height - 24, 4);
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
      .text(x - width / 2 + 34, y - 27, `${mode.icon}  ${mode.title}`, {
        color: available ? CHESS_ACADEMY_PALETTE.ink : '#84798f',
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x - width / 2 + 34, y + 7, mode.description, {
        color: available ? CHESS_ACADEMY_PALETTE.softInk : '#978da1',
        fontFamily: UI_FONT,
        fontSize: '15px',
        lineSpacing: 4,
        wordWrap: { width: width - 70 },
      })
      .setOrigin(0, 0);

    if (!available) {
      this.add
        .text(x + width / 2 - 24, y - 42, 'COMING SOON', {
          color: '#786b86',
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
    if (modeId === 'puzzle-garden') {
      this.showPuzzleList();
      return;
    }
    if (modeId === 'coach-match') {
      this.startCoachMatch();
      return;
    }
    if (modeId === 'friendly-match') {
      this.startFriendlyMatch();
      return;
    }
  }

  private showLessonList(): void {
    this.clearView();
    this.view = 'lesson-list';
    this.drawAcademyShell('Chess Lessons', 'Tiny challenges. One chess idea at a time.');
    this.drawTeacherPortrait(154, 177, 0.82);

    this.add
      .text(238, 151, 'Start anywhere', {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(238, 184, 'Nothing is locked. Pick the piece you want to practise.', {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '16px',
      })
      .setOrigin(0, 0.5);

    const positions = [
      { x: 350, y: 296 },
      { x: 870, y: 296 },
      { x: 350, y: 374 },
      { x: 870, y: 374 },
      { x: 350, y: 452 },
      { x: 870, y: 452 },
      { x: 350, y: 530 },
      { x: 870, y: 530 },
    ] as const;

    SUNBEAM_CHESS_LESSONS.forEach((lesson, index) => {
      const position = positions[index];
      this.createLessonCard(position.x, position.y, 446, 70, lesson);
    });

    this.createRoundedButton(1088, 638, 190, '← Academy', () => this.showAcademyHome());
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
      panel.fillStyle(
        hovered ? CHESS_ACADEMY_PALETTE.panelBright : CHESS_ACADEMY_PALETTE.lavenderSoft,
        1,
      );
      panel.fillRoundedRect(-width / 2, -height / 2, width, height, 20);
      panel.lineStyle(
        3,
        hovered ? CHESS_ACADEMY_PALETTE.berry : CHESS_ACADEMY_PALETTE.lavender,
        0.95,
      );
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
      .text(x - width / 2 + 22, y - 13, `${lesson.order / 10}.  ${lesson.title}`, {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(x - width / 2 + 22, y + 14, lesson.subtitle, {
        color: '#76568f',
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
  }

  private startLesson(id: SunbeamChessLessonId): void {
    const lesson = getSunbeamChessLesson(id);
    this.clearView();
    this.view = 'lesson';
    this.currentLesson = lesson;
    this.currentPuzzle = null;
    this.chess = new Chess(lesson.fen);
    this.selected = null;
    this.hintMove = null;
    this.lessonHintStage = 0;
    this.lessonComplete = false;
    this.lessonResetPending = false;
    this.clearCompletionCard();
    this.opponentPending = false;

    this.createLessonBackdrop(lesson);
    this.lessonText?.setText(lesson.intro);
    this.renderBoard();
  }

  private createLessonBackdrop(lesson: SunbeamChessLessonDefinition): void {
    this.drawActivityShell(`✦  ${lesson.title}`);
    this.drawBoardFrame();

    const coach = this.add.graphics();
    coach.fillStyle(CHESS_ACADEMY_PALETTE.panel, 1);
    coach.fillRoundedRect(600, 116, 600, 458, 24);
    coach.lineStyle(3, CHESS_ACADEMY_PALETTE.lavender, 0.95);
    coach.strokeRoundedRect(600, 116, 600, 458, 24);

    this.drawTeacherPortrait(700, 202, 0.78);

    this.add
      .text(780, 153, 'Your Chess Coach', {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.statusText = this.add
      .text(780, 192, lesson.objective, {
        color: '#6b3f96',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        wordWrap: { width: 365 },
      })
      .setOrigin(0, 0)
      .setName('sunbeam-chess:lesson-status');

    const lessonPanel = this.add.graphics();
    lessonPanel.fillStyle(CHESS_ACADEMY_PALETTE.panelBright, 1);
    lessonPanel.fillRoundedRect(638, 286, 524, 160, 18);
    lessonPanel.lineStyle(2, CHESS_ACADEMY_PALETTE.berry, 0.65);
    lessonPanel.strokeRoundedRect(638, 286, 524, 160, 18);

    this.lessonText = this.add
      .text(900, 366, '', {
        color: CHESS_ACADEMY_PALETTE.softInk,
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
        color: '#477d74',
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
    this.clearCompletionCard();
    this.statusText?.setText(this.currentLesson.objective);
    this.lessonText?.setText(this.currentLesson.intro);
    this.renderBoard();
  }

  private showPuzzleList(): void {
    this.clearView();
    this.view = 'puzzle-list';
    this.currentLesson = null;
    this.currentPuzzle = null;
    this.drawAcademyShell('Puzzle Garden', 'Little positions with one useful idea to discover.');
    this.drawTeacherPortrait(154, 177, 0.82);

    this.add
      .text(238, 151, 'Look, think, try', {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(
        238,
        184,
        'Every puzzle uses a real legal chess position. Hints grow only when you ask.',
        {
          color: CHESS_ACADEMY_PALETTE.softInk,
          fontFamily: UI_FONT,
          fontSize: '16px',
        },
      )
      .setOrigin(0, 0.5);

    const positions = [
      { x: 350, y: 338 },
      { x: 870, y: 338 },
      { x: 350, y: 498 },
      { x: 870, y: 498 },
    ] as const;

    SUNBEAM_CHESS_PUZZLES.forEach((puzzle, index) => {
      const position = positions[index];
      this.createPuzzleCard(position.x, position.y, 446, 124, puzzle);
    });

    this.createRoundedButton(1088, 638, 190, '← Academy', () => this.showAcademyHome());
  }

  private createPuzzleCard(
    x: number,
    y: number,
    width: number,
    height: number,
    puzzle: SunbeamChessPuzzleDefinition,
  ): void {
    const panel = this.add
      .graphics()
      .setPosition(x, y)
      .setName(`sunbeam-chess:puzzle-card:${puzzle.id}`);
    const draw = (hovered: boolean): void => {
      panel.clear();
      panel.fillStyle(
        hovered ? CHESS_ACADEMY_PALETTE.panelBright : CHESS_ACADEMY_PALETTE.mintSoft,
        1,
      );
      panel.fillRoundedRect(-width / 2, -height / 2, width, height, 20);
      panel.lineStyle(
        3,
        hovered ? CHESS_ACADEMY_PALETTE.berry : CHESS_ACADEMY_PALETTE.turquoise,
        0.95,
      );
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
      .on('pointerdown', () => this.startPuzzle(puzzle.id));

    this.add
      .text(x - width / 2 + 24, y - 34, `${puzzle.order / 10}.  ${puzzle.title}`, {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(x - width / 2 + 24, y + 4, puzzle.subtitle, {
        color: '#477d74',
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(x - width / 2 + 24, y + 32, puzzle.objective, {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
      })
      .setOrigin(0, 0.5);
  }

  private startPuzzle(id: SunbeamChessPuzzleId): void {
    const puzzle = getSunbeamChessPuzzle(id);
    this.clearView();
    this.view = 'puzzle';
    this.currentLesson = null;
    this.currentPuzzle = puzzle;
    this.chess = new Chess(puzzle.fen);
    this.selected = null;
    this.hintMove = null;
    this.puzzleHintStage = 0;
    this.puzzleComplete = false;
    this.puzzleResetPending = false;
    this.clearCompletionCard();
    this.opponentPending = false;

    this.createPuzzleBackdrop(puzzle);
    this.lessonText?.setText(puzzle.intro);
    this.renderBoard();
  }

  private createPuzzleBackdrop(puzzle: SunbeamChessPuzzleDefinition): void {
    this.drawActivityShell(`🌱  ${puzzle.title}`);
    this.drawBoardFrame();

    const coach = this.add.graphics();
    coach.fillStyle(CHESS_ACADEMY_PALETTE.mintSoft, 1);
    coach.fillRoundedRect(600, 116, 600, 458, 24);
    coach.lineStyle(3, CHESS_ACADEMY_PALETTE.turquoise, 0.95);
    coach.strokeRoundedRect(600, 116, 600, 458, 24);

    this.drawTeacherPortrait(700, 202, 0.78);

    this.add
      .text(780, 153, 'Puzzle Garden', {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.statusText = this.add
      .text(780, 192, puzzle.objective, {
        color: '#3f8075',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        wordWrap: { width: 365 },
      })
      .setOrigin(0, 0)
      .setName('sunbeam-chess:puzzle-status');

    const lessonPanel = this.add.graphics();
    lessonPanel.fillStyle(CHESS_ACADEMY_PALETTE.panelBright, 1);
    lessonPanel.fillRoundedRect(638, 286, 524, 160, 18);
    lessonPanel.lineStyle(2, CHESS_ACADEMY_PALETTE.turquoise, 0.65);
    lessonPanel.strokeRoundedRect(638, 286, 524, 160, 18);

    this.lessonText = this.add
      .text(900, 366, '', {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '17px',
        lineSpacing: 6,
        align: 'center',
        wordWrap: { width: 470 },
      })
      .setOrigin(0.5)
      .setName('sunbeam-chess:puzzle-message');

    this.add
      .text(900, 486, 'Try any legal move. The coach only reveals the answer if you ask.', {
        color: '#6b3f96',
        fontFamily: UI_FONT,
        fontSize: '14px',
        align: 'center',
      })
      .setOrigin(0.5);

    this.createRoundedButton(710, 638, 160, '💡 Hint', () => this.showHint());
    this.createRoundedButton(890, 638, 160, '↻ Reset', () => this.resetPuzzle());
    this.createRoundedButton(1080, 638, 190, '← Puzzles', () => this.showPuzzleList());
  }

  private resetPuzzle(): void {
    if (!this.currentPuzzle) {
      return;
    }
    this.chess = new Chess(this.currentPuzzle.fen);
    this.selected = null;
    this.hintMove = null;
    this.puzzleHintStage = 0;
    this.puzzleComplete = false;
    this.puzzleResetPending = false;
    this.clearCompletionCard();
    this.statusText?.setText(this.currentPuzzle.objective);
    this.lessonText?.setText(this.currentPuzzle.intro);
    this.renderBoard();
  }

  private handlePuzzleSquarePress(square: Square): void {
    const puzzle = this.currentPuzzle;
    if (!puzzle || this.puzzleComplete || this.puzzleResetPending) {
      return;
    }

    const piece = this.chess.get(square);
    if (!this.selected) {
      if (piece?.color === 'w') {
        this.selected = square;
        this.hintMove = null;
        const legalMoves = this.chess.moves({ square, verbose: true });
        this.lessonText?.setText(
          legalMoves.length > 0
            ? `Good. That ${this.pieceName(piece.type)} has ${legalMoves.length} legal move${legalMoves.length === 1 ? '' : 's'}. What helps solve the puzzle?`
            : 'That piece cannot move in this position. Try another one.',
        );
        this.renderBoard();
      }
      return;
    }

    if (piece?.color === 'w') {
      this.selected = square;
      this.hintMove = null;
      this.renderBoard();
      return;
    }

    const legalMoves = this.chess.moves({ square: this.selected, verbose: true });
    const chosen =
      legalMoves.find((move) => move.to === square && move.promotion === puzzle.promotion) ??
      legalMoves.find((move) => move.to === square);

    if (!chosen) {
      this.lessonText?.setText('That is not a legal move here. Try one of the green destinations.');
      return;
    }

    const isSolution =
      chosen.from === puzzle.from &&
      chosen.to === puzzle.to &&
      (puzzle.promotion === undefined || chosen.promotion === puzzle.promotion);

    this.chess.move({
      from: chosen.from,
      to: chosen.to,
      promotion: puzzle.promotion ?? chosen.promotion,
    });
    this.selected = null;
    this.hintMove = null;

    if (isSolution) {
      this.puzzleComplete = true;
      this.statusText?.setText('Puzzle solved ✦');
      this.lessonText?.setText(puzzle.success);
      this.renderBoard();
      this.showPuzzleCompletion(puzzle);
      return;
    }

    this.puzzleResetPending = true;
    this.lessonText?.setText(
      'That is a real legal move. Nice try. There is a move that fits this puzzle even better, so let’s restore the position and look again.',
    );
    this.renderBoard();
    this.time.delayedCall(900, () => {
      if (this.view === 'puzzle' && this.currentPuzzle?.id === puzzle.id) {
        this.chess = new Chess(puzzle.fen);
        this.selected = null;
        this.hintMove = null;
        this.puzzleResetPending = false;
        this.renderBoard();
      }
    });
  }

  private showPuzzleHint(): void {
    const puzzle = this.currentPuzzle;
    if (!puzzle || this.puzzleComplete || this.puzzleResetPending) {
      return;
    }

    const stage = Math.min(this.puzzleHintStage, 3);
    this.lessonText?.setText(layeredHintText(puzzle.hints, stage));

    if (stage >= 2) {
      this.selected = puzzle.from;
    }
    if (stage >= 3) {
      this.hintMove =
        this.chess
          .moves({ square: puzzle.from, verbose: true })
          .find(
            (move) =>
              move.to === puzzle.to &&
              (puzzle.promotion === undefined || move.promotion === puzzle.promotion),
          ) ?? null;
    }

    this.puzzleHintStage = Math.min(3, stage + 1);
    this.renderBoard();
  }

  private startCoachMatch(): void {
    this.clearView();
    this.view = 'coach-match';
    this.currentLesson = null;
    this.currentPuzzle = null;
    this.chess = new Chess();
    this.selected = null;
    this.hintMove = null;
    this.coachPendingMove = null;
    this.coachHintStage = 0;
    this.coachUndoPlies = 0;
    this.coachHoldingFeedback = false;
    this.coachLastPlayerFeedback = null;
    this.moveHistoryStart = -1;
    this.friendlyResultShown = false;
    this.clearCompletionCard();
    this.clearCoachWarning();
    this.opponentPending = false;
    this.createCoachMatchBackdrop();
    this.lessonText?.setText(
      'Play your game normally. I will only interrupt for a clear beginner idea worth noticing.',
    );
    this.renderBoard();
  }

  private createCoachMatchBackdrop(): void {
    this.drawActivityShell('🦄  Coach Match');
    this.drawBoardFrame();

    const coachArea = this.add.graphics();
    coachArea.fillStyle(CHESS_ACADEMY_PALETTE.mintSoft, 1);
    coachArea.fillRoundedRect(600, 116, 600, 458, 24);
    coachArea.lineStyle(3, CHESS_ACADEMY_PALETTE.turquoise, 0.95);
    coachArea.strokeRoundedRect(600, 116, 600, 458, 24);

    this.drawTeacherPortrait(690, 216, 0.72);

    this.add
      .text(775, 144, 'Coach Match', {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    const speech = this.add.graphics().setName('sunbeam-chess:coach-speech-bubble');
    speech.fillStyle(CHESS_ACADEMY_PALETTE.panelBright, 1);
    speech.fillRoundedRect(778, 166, 382, 218, 22);
    speech.fillTriangle(780, 226, 744, 244, 780, 266);
    speech.lineStyle(3, CHESS_ACADEMY_PALETTE.turquoise, 0.82);
    speech.strokeRoundedRect(778, 166, 382, 218, 22);

    this.statusText = this.add
      .text(969, 202, '', {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 330 },
      })
      .setOrigin(0.5)
      .setName('sunbeam-chess:coach-status');

    this.lessonText = this.add
      .text(969, 292, '', {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        lineSpacing: 5,
        align: 'center',
        wordWrap: { width: 332 },
      })
      .setOrigin(0.5)
      .setName('sunbeam-chess:coach-message');

    this.add
      .text(654, 408, 'MOVE HISTORY', {
        color: '#6b3f96',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.moveHistoryRangeText = this.add
      .text(1098, 408, '0 moves', {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)
      .setName('sunbeam-chess:move-history-range');

    const historyPanel = this.add.graphics();
    historyPanel.fillStyle(CHESS_ACADEMY_PALETTE.lavenderSoft, 1);
    historyPanel.fillRoundedRect(638, 426, 524, 130, 16);
    historyPanel.lineStyle(2, CHESS_ACADEMY_PALETTE.lavender, 0.55);
    historyPanel.strokeRoundedRect(638, 426, 524, 130, 16);

    this.add
      .text(690, 443, 'WHITE', {
        color: '#6b3f96',
        fontFamily: UI_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(825, 443, 'VILLAGE', {
        color: '#6b3f96',
        fontFamily: UI_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.moveLogText = this.add
      .text(660, 459, 'No moves yet.', {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        lineSpacing: 5,
        wordWrap: { width: 420 },
      })
      .setOrigin(0, 0);

    this.createMoveHistoryScrollButton(
      1126,
      458,
      '▲',
      'sunbeam-chess:move-history-up',
      -1,
    );
    this.createMoveHistoryScrollButton(
      1126,
      522,
      '▼',
      'sunbeam-chess:move-history-down',
      1,
    );

    this.add
      .text(900, 588, 'Hints get more specific only when you keep asking.', {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        align: 'center',
      })
      .setOrigin(0.5);

    this.createRoundedButton(
      700,
      638,
      160,
      '💡 Hint',
      () => this.showHint(),
      'sunbeam-chess:coach-hint',
    );
    this.createRoundedButton(
      880,
      638,
      160,
      '↶ Undo',
      () => this.undoCoachMove(),
      'sunbeam-chess:coach-undo',
    );
    this.createRoundedButton(
      1080,
      638,
      190,
      '← Academy',
      () => this.showAcademyHome(),
      'sunbeam-chess:coach-back',
    );
  }

  private startFriendlyMatch(): void {
    this.clearView();
    this.view = 'friendly-match';
    this.currentLesson = null;
    this.currentPuzzle = null;
    this.chess = new Chess();
    this.selected = null;
    this.hintMove = null;
    this.moveHistoryStart = -1;
    this.friendlyResultShown = false;
    this.clearCompletionCard();
    this.opponentPending = false;
    this.createFriendlyBackdrop();
    this.lessonText?.setText(describeChessPosition(this.chess));
    this.renderBoard();
  }

  private createFriendlyBackdrop(): void {
    this.drawActivityShell('♟  Friendly Match');
    this.drawBoardFrame();

    const panel = this.add.graphics();
    panel.fillStyle(CHESS_ACADEMY_PALETTE.lavenderSoft, 1);
    panel.fillRoundedRect(600, 116, 600, 458, 24);
    panel.lineStyle(3, CHESS_ACADEMY_PALETTE.lavender, 0.95);
    panel.strokeRoundedRect(600, 116, 600, 458, 24);

    this.add
      .text(900, 148, 'Friendly Chess', {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const statusPanel = this.add.graphics();
    statusPanel.fillStyle(CHESS_ACADEMY_PALETTE.goldSoft, 1);
    statusPanel.fillRoundedRect(638, 178, 524, 76, 18);

    this.statusText = this.add
      .text(900, 216, '', {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 478 },
      })
      .setOrigin(0.5);

    this.add
      .text(654, 278, 'WHAT TO NOTICE', {
        color: '#6b3f96',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    const lessonPanel = this.add.graphics();
    lessonPanel.fillStyle(CHESS_ACADEMY_PALETTE.panelBright, 1);
    lessonPanel.fillRoundedRect(638, 296, 524, 104, 18);
    lessonPanel.lineStyle(2, CHESS_ACADEMY_PALETTE.berry, 0.65);
    lessonPanel.strokeRoundedRect(638, 296, 524, 104, 18);

    this.lessonText = this.add
      .text(900, 348, '', {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        lineSpacing: 5,
        align: 'center',
        wordWrap: { width: 478 },
      })
      .setOrigin(0.5);

    this.add
      .text(654, 424, 'MOVE HISTORY', {
        color: '#477d74',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.moveHistoryRangeText = this.add
      .text(1098, 424, '0 moves', {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)
      .setName('sunbeam-chess:move-history-range');

    const historyPanel = this.add.graphics();
    historyPanel.fillStyle(CHESS_ACADEMY_PALETTE.mintSoft, 1);
    historyPanel.fillRoundedRect(638, 442, 524, 112, 16);
    historyPanel.lineStyle(2, CHESS_ACADEMY_PALETTE.turquoise, 0.45);
    historyPanel.strokeRoundedRect(638, 442, 524, 112, 16);

    this.add
      .text(690, 458, 'WHITE', {
        color: '#477d74',
        fontFamily: UI_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(825, 458, 'VILLAGE', {
        color: '#477d74',
        fontFamily: UI_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.moveLogText = this.add
      .text(660, 474, 'No moves yet.', {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        lineSpacing: 4,
        wordWrap: { width: 420 },
      })
      .setOrigin(0, 0);

    this.createMoveHistoryScrollButton(
      1126,
      470,
      '▲',
      'sunbeam-chess:move-history-up',
      -1,
    );
    this.createMoveHistoryScrollButton(
      1126,
      524,
      '▼',
      'sunbeam-chess:move-history-down',
      1,
    );

    this.add
      .text(900, 588, 'Full legal chess · Friendly opponent tuning arrives later in the Academy.', {
        color: CHESS_ACADEMY_PALETTE.softInk,
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

  private drawActivityShell(title: string): void {
    this.cameras.main.setBackgroundColor('#281643');
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      CHESS_ACADEMY_PALETTE.backdrop,
      1,
    );

    const shell = this.add.graphics();
    shell.fillStyle(CHESS_ACADEMY_PALETTE.shell, 1);
    shell.fillRoundedRect(30, 22, 1220, 674, 32);
    shell.lineStyle(7, CHESS_ACADEMY_PALETTE.shellBorder, 1);
    shell.strokeRoundedRect(30, 22, 1220, 674, 32);

    const header = this.add.graphics();
    header.fillStyle(CHESS_ACADEMY_PALETTE.header, 1);
    header.fillRoundedRect(50, 42, 1180, 62, 22);
    header.fillStyle(CHESS_ACADEMY_PALETTE.headerAccent, 0.55);
    header.fillRoundedRect(50, 82, 1180, 22, 10);

    this.add
      .text(GAME_WIDTH / 2, 70, title, {
        color: '#fff9ff',
        fontFamily: UI_FONT,
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private drawAcademyShell(title: string, subtitle: string): void {
    this.cameras.main.setBackgroundColor('#281643');
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      CHESS_ACADEMY_PALETTE.backdrop,
      1,
    );

    const shell = this.add.graphics();
    shell.fillStyle(CHESS_ACADEMY_PALETTE.shell, 1);
    shell.fillRoundedRect(30, 22, 1220, 674, 32);
    shell.lineStyle(7, CHESS_ACADEMY_PALETTE.shellBorder, 1);
    shell.strokeRoundedRect(30, 22, 1220, 674, 32);

    const header = this.add.graphics();
    header.fillStyle(CHESS_ACADEMY_PALETTE.header, 1);
    header.fillRoundedRect(50, 42, 1180, 76, 24);
    header.fillStyle(CHESS_ACADEMY_PALETTE.headerAccent, 0.65);
    header.fillRoundedRect(50, 90, 1180, 28, 12);

    this.add
      .text(GAME_WIDTH / 2, 67, `♟  ${title}`, {
        color: '#fff9ff',
        fontFamily: UI_FONT,
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 99, subtitle, {
        color: '#eee2ff',
        fontFamily: UI_FONT,
        fontSize: '15px',
      })
      .setOrigin(0.5);
  }

  private drawTeacherPortrait(x: number, y: number, scale: number): void {
    const badge = this.add.graphics().setPosition(x, y);
    badge.fillStyle(CHESS_ACADEMY_PALETTE.header, 1);
    badge.fillRoundedRect(-62, -54, 124, 108, 24);
    badge.lineStyle(5, CHESS_ACADEMY_PALETTE.gold, 1);
    badge.strokeRoundedRect(-62, -54, 124, 108, 24);

    badge.fillStyle(CHESS_ACADEMY_PALETTE.lavender, 0.55);
    badge.fillCircle(-45, -34, 7);
    badge.fillStyle(CHESS_ACADEMY_PALETTE.mint, 0.72);
    badge.fillCircle(46, -36, 6);
    badge.fillStyle(CHESS_ACADEMY_PALETTE.gold, 0.9);
    badge.fillCircle(48, 35, 5);

    createCoreNpcSprite(this, 'lumi', x, y + 34, 'portrait', 'happy')
      .setScale(0.56 * scale)
      .setName('sunbeam-chess:teacher');

    const medal = this.add.graphics().setPosition(x + 38, y + 34);
    medal.fillStyle(CHESS_ACADEMY_PALETTE.gold, 1);
    medal.fillCircle(0, 0, 10);
    medal.lineStyle(2, 0x7b5a24, 0.95);
    medal.strokeCircle(0, 0, 10);
    medal.fillStyle(CHESS_ACADEMY_PALETTE.header, 1);
    medal.fillCircle(0, 0, 4);
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

    if (this.view === 'coach-match') {
      this.updateCoachMatchStatus();
    } else if (this.view === 'friendly-match') {
      this.updateFriendlyCoach();
    }
  }

  private handleSquarePress(square: Square): void {
    if (this.view === 'lesson') {
      this.handleLessonSquarePress(square);
      return;
    }
    if (this.view === 'puzzle') {
      this.handlePuzzleSquarePress(square);
      return;
    }
    if (this.view === 'coach-match') {
      this.handleCoachSquarePress(square);
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
      this.showLessonCompletion(lesson);
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

  private clearCoachWarning(): void {
    this.coachWarningContainer?.destroy(true);
    this.coachWarningContainer = null;
    this.coachPendingMove = null;
  }

  private showCoachWarning(concern: SunbeamChessCoachConcern, move: Move): void {
    this.clearCoachWarning();
    this.coachPendingMove = move;

    const container = this.add.container(0, 0).setDepth(44);
    const scrim = this.add.graphics().setName('sunbeam-chess:coach-warning-scrim');
    scrim.fillStyle(CHESS_ACADEMY_PALETTE.backdrop, 0.48);
    scrim.fillRoundedRect(50, 116, 1180, 558, 26);
    scrim.setInteractive(
      new Phaser.Geom.Rectangle(50, 116, 1180, 558),
      Phaser.Geom.Rectangle.Contains,
    );

    const panel = this.add.graphics().setName('sunbeam-chess:coach-warning');
    panel.fillStyle(CHESS_ACADEMY_PALETTE.panelBright, 1);
    panel.fillRoundedRect(260, 210, 760, 300, 28);
    panel.lineStyle(5, CHESS_ACADEMY_PALETTE.gold, 1);
    panel.strokeRoundedRect(260, 210, 760, 300, 28);
    panel.fillStyle(CHESS_ACADEMY_PALETTE.gold, 0.16);
    panel.fillRoundedRect(286, 232, 708, 74, 20);

    const title = this.add
      .text(640, 269, concern.title, {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    const message = this.add
      .text(640, 351, concern.message, {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: 650 },
      })
      .setOrigin(0.5);

    const question = this.add
      .text(640, 405, concern.question, {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '16px',
        align: 'center',
        wordWrap: { width: 650 },
      })
      .setOrigin(0.5);

    container.add([scrim, panel, title, message, question]);

    this.addCompletionButton(
      container,
      515,
      467,
      238,
      'Have another look',
      'sunbeam-chess:coach-look-again',
      () => {
        const pending = this.coachPendingMove;
        this.clearCoachWarning();
        this.selected = pending?.from ?? null;
        this.hintMove = null;
        this.lessonText?.setText(concern.question);
        this.renderBoard();
      },
    );

    this.addCompletionButton(
      container,
      765,
      467,
      238,
      'Play it anyway',
      'sunbeam-chess:coach-play-anyway',
      () => {
        const pending = this.coachPendingMove;
        this.clearCoachWarning();
        if (pending) {
          this.applyCoachPlayerMove(pending);
        }
      },
    );

    this.coachWarningContainer = container;
  }

  private handleCoachSquarePress(square: Square): void {
    if (
      this.coachWarningContainer ||
      this.opponentPending ||
      this.chess.isGameOver() ||
      this.chess.turn() !== 'w'
    ) {
      return;
    }

    const piece = this.chess.get(square);
    if (!this.selected) {
      if (piece?.color === 'w') {
        this.selectCoachPiece(square);
      }
      return;
    }

    if (piece?.color === 'w') {
      this.selectCoachPiece(square);
      return;
    }

    const legalMoves = this.chess.moves({ square: this.selected, verbose: true });
    const chosen =
      legalMoves.find((move) => move.to === square && move.promotion === 'q') ??
      legalMoves.find((move) => move.to === square);

    if (!chosen) {
      this.hintMove = null;
      this.lessonText?.setText(
        'That move is not legal here. Green destinations are the moves that keep your king safe.',
      );
      this.updateCoachMatchStatus();
      return;
    }

    const concern = reviewSunbeamChessCoachMove(this.chess, chosen);
    if (concern) {
      this.showCoachWarning(concern, chosen);
      return;
    }

    this.applyCoachPlayerMove(chosen);
  }

  private selectCoachPiece(square: Square): void {
    const legalMoves = this.chess.moves({ square, verbose: true });
    this.selected = square;
    this.hintMove = null;

    if (legalMoves.length === 0) {
      this.lessonText?.setText(
        'That piece has no legal moves right now. Try another piece or look at what is happening to your king.',
      );
    } else {
      const piece = this.chess.get(square);
      this.lessonText?.setText(
        `That ${piece ? this.pieceName(piece.type) : 'piece'} has ${legalMoves.length} legal move${legalMoves.length === 1 ? '' : 's'}. Take your time.`,
      );
    }

    this.renderBoard();
  }

  private applyCoachPlayerMove(move: Move): void {
    const applied = this.chess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });

    this.selected = null;
    this.hintMove = null;
    this.coachHintStage = 0;
    this.coachUndoPlies = 1;
    this.coachLastPlayerFeedback = describeTeachingMove(applied);
    this.coachHoldingFeedback = !this.chess.isGameOver();
    this.moveHistoryStart = -1;
    this.lessonText?.setText(this.coachLastPlayerFeedback);

    this.opponentPending = !this.chess.isGameOver();
    this.renderBoard();

    if (this.opponentPending) {
      this.time.delayedCall(COACH_MOVE_FEEDBACK_HOLD_MS, () => {
        if (this.view !== 'coach-match' || !this.opponentPending || this.chess.turn() !== 'b') {
          return;
        }
        this.coachHoldingFeedback = false;
        this.renderBoard();
        this.time.delayedCall(260, () => this.makeOpponentMove());
      });
    }
  }

  private undoCoachMove(): void {
    if (this.view !== 'coach-match' || this.opponentPending) {
      return;
    }

    if (this.coachWarningContainer) {
      this.clearCoachWarning();
      this.lessonText?.setText('No problem. Have another look at the board.');
      this.renderBoard();
      return;
    }

    if (this.coachUndoPlies <= 0) {
      this.lessonText?.setText('There is nothing to undo yet. Make a move when you are ready.');
      return;
    }

    this.clearCompletionCard();
    this.friendlyResultShown = false;

    for (let index = 0; index < this.coachUndoPlies; index += 1) {
      if (!this.chess.undo()) {
        break;
      }
    }

    this.coachUndoPlies = 0;
    this.coachHintStage = 0;
    this.coachHoldingFeedback = false;
    this.coachLastPlayerFeedback = null;
    this.moveHistoryStart = -1;
    this.selected = null;
    this.hintMove = null;
    this.lessonText?.setText(
      'Undone. Try a different idea — there is no penalty for experimenting.',
    );
    this.renderBoard();
  }

  private showCoachHint(): void {
    if (
      this.view !== 'coach-match' ||
      this.coachWarningContainer ||
      this.opponentPending ||
      this.chess.isGameOver() ||
      this.chess.turn() !== 'w'
    ) {
      return;
    }

    const hint = getSunbeamChessCoachHint(this.chess, this.coachHintStage);
    if (!hint) {
      return;
    }

    this.lessonText?.setText(hint.text);
    this.selected = hint.from ?? null;
    this.hintMove =
      hint.from && hint.to
        ? (this.chess
            .moves({ square: hint.from, verbose: true })
            .find((move) => move.to === hint.to) ?? null)
        : null;
    this.coachHintStage = Math.min(3, this.coachHintStage + 1);
    this.renderBoard();
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
    if (this.view !== 'friendly-match' && this.view !== 'coach-match') {
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
      const villageFeedback = `Village reply: ${describeTeachingMove(applied)}`;
      if (this.view === 'coach-match' && this.coachLastPlayerFeedback) {
        this.lessonText?.setText(`${this.coachLastPlayerFeedback}\n\n${villageFeedback}`);
      } else {
        this.lessonText?.setText(villageFeedback);
      }
      this.moveHistoryStart = -1;
    }

    if (this.view === 'coach-match') {
      this.coachUndoPlies = 2;
      this.coachHintStage = 0;
      this.coachHoldingFeedback = false;
    }

    this.opponentPending = false;
    this.renderBoard();
  }

  private showHint(): void {
    if (this.view === 'lesson') {
      this.showLessonHint();
      return;
    }
    if (this.view === 'puzzle') {
      this.showPuzzleHint();
      return;
    }
    if (this.view === 'coach-match') {
      this.showCoachHint();
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
    this.lessonText?.setText(layeredHintText(lesson.hints, stage));

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

  private clearCompletionCard(): void {
    this.completionContainer?.destroy(true);
    this.completionContainer = null;
  }

  private getNextLesson(
    current: SunbeamChessLessonDefinition,
  ): SunbeamChessLessonDefinition | null {
    const index = SUNBEAM_CHESS_LESSONS.findIndex((lesson) => lesson.id === current.id);
    return index >= 0 ? (SUNBEAM_CHESS_LESSONS[index + 1] ?? null) : null;
  }

  private getNextPuzzle(
    current: SunbeamChessPuzzleDefinition,
  ): SunbeamChessPuzzleDefinition | null {
    const index = SUNBEAM_CHESS_PUZZLES.findIndex((puzzle) => puzzle.id === current.id);
    return index >= 0 ? (SUNBEAM_CHESS_PUZZLES[index + 1] ?? null) : null;
  }

  private addCompletionButton(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    label: string,
    name: string,
    onPress: () => void,
  ): void {
    const height = 50;
    const button = this.add.graphics().setPosition(x, y).setName(name);
    const draw = (fill: number): void => {
      button.clear();
      button.fillStyle(fill, 1);
      button.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
      button.lineStyle(3, CHESS_ACADEMY_PALETTE.header, 1);
      button.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
    };
    draw(CHESS_ACADEMY_PALETTE.mint);

    button
      .setInteractive(
        new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains,
      )
      .on('pointerover', () => draw(CHESS_ACADEMY_PALETTE.mintHover))
      .on('pointerout', () => draw(CHESS_ACADEMY_PALETTE.mint))
      .on('pointerdown', onPress);

    const text = this.add
      .text(x, y, label, {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    container.add([button, text]);
  }

  private showCompletionCard(options: {
    title: string;
    message: string;
    accent: number;
    nextLabel?: string;
    onNext?: () => void;
    backLabel: string;
    onBack: () => void;
  }): void {
    this.clearCompletionCard();

    const container = this.add.container(0, 0).setDepth(45);

    // Keep the completed board/position visible for context, but clearly move the
    // player into an end-state. The scrim also swallows pointer input so the
    // board and bottom action row cannot be interacted with behind the modal.
    const scrim = this.add.graphics().setName('sunbeam-chess:completion-scrim');
    scrim.fillStyle(CHESS_ACADEMY_PALETTE.backdrop, 0.72);
    scrim.fillRoundedRect(50, 116, 1180, 558, 26);
    scrim.setInteractive(
      new Phaser.Geom.Rectangle(50, 116, 1180, 558),
      Phaser.Geom.Rectangle.Contains,
    );
    scrim.on('pointerdown', () => undefined);

    // Roughly 80% of the activity content area: this deliberately spans both the
    // board and teaching panel so completion feels like a proper result state
    // rather than another side-card.
    const panel = this.add.graphics().setName('sunbeam-chess:completion-card');
    panel.fillStyle(CHESS_ACADEMY_PALETTE.panelBright, 1);
    panel.fillRoundedRect(140, 136, 1000, 500, 30);
    panel.lineStyle(6, options.accent, 1);
    panel.strokeRoundedRect(140, 136, 1000, 500, 30);

    panel.fillStyle(options.accent, 0.14);
    panel.fillRoundedRect(170, 170, 940, 108, 22);

    const stars = this.add
      .text(640, 194, '✦   ✦   ✦', {
        color: '#b68620',
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const title = this.add
      .text(640, 242, options.title, {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    const message = this.add
      .text(640, 365, options.message, {
        color: CHESS_ACADEMY_PALETTE.softInk,
        fontFamily: UI_FONT,
        fontSize: '21px',
        align: 'center',
        lineSpacing: 7,
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5);

    container.add([scrim, panel, stars, title, message]);

    if (options.nextLabel && options.onNext) {
      this.addCompletionButton(
        container,
        515,
        548,
        240,
        options.nextLabel,
        'sunbeam-chess:completion-next',
        options.onNext,
      );
      this.addCompletionButton(
        container,
        765,
        548,
        240,
        options.backLabel,
        'sunbeam-chess:completion-back',
        options.onBack,
      );
    } else {
      this.addCompletionButton(
        container,
        640,
        548,
        260,
        options.backLabel,
        'sunbeam-chess:completion-back',
        options.onBack,
      );
    }

    this.completionContainer = container;
  }

  private showLessonCompletion(lesson: SunbeamChessLessonDefinition): void {
    const next = this.getNextLesson(lesson);
    this.showCompletionCard({
      title: 'LESSON COMPLETE!',
      message: lesson.success,
      accent: CHESS_ACADEMY_PALETTE.berry,
      nextLabel: next ? 'Next lesson →' : undefined,
      onNext: next ? () => this.startLesson(next.id) : undefined,
      backLabel: next ? 'Lesson list' : 'All lessons ✓',
      onBack: () => this.showLessonList(),
    });
  }

  private showPuzzleCompletion(puzzle: SunbeamChessPuzzleDefinition): void {
    const next = this.getNextPuzzle(puzzle);
    this.showCompletionCard({
      title: 'PUZZLE SOLVED!',
      message: puzzle.success,
      accent: CHESS_ACADEMY_PALETTE.turquoise,
      nextLabel: next ? 'Next puzzle →' : undefined,
      onNext: next ? () => this.startPuzzle(next.id) : undefined,
      backLabel: next ? 'Puzzle list' : 'Puzzle Garden ✓',
      onBack: () => this.showPuzzleList(),
    });
  }

  private showMatchResult(result: 'win' | 'loss' | 'draw'): void {
    if (this.friendlyResultShown) {
      return;
    }
    this.friendlyResultShown = true;

    const title = result === 'win' ? 'YOU WON! ✦' : result === 'loss' ? 'GOOD GAME!' : 'GAME DRAWN';
    const isCoachMatch = this.view === 'coach-match';
    const message =
      result === 'win'
        ? isCoachMatch
          ? 'Checkmate! You found the finish. Want to try another coached game?'
          : 'Checkmate! You finished the match. Want another game?'
        : result === 'loss'
          ? 'The village side found checkmate this time. Every game teaches you something new.'
          : 'Neither side could force a win. That is a real chess result too.';

    this.showCompletionCard({
      title,
      message,
      accent: result === 'win' ? CHESS_ACADEMY_PALETTE.gold : CHESS_ACADEMY_PALETTE.lavender,
      nextLabel: '↻ Play again',
      onNext: () => (isCoachMatch ? this.startCoachMatch() : this.restartFriendlyMatch()),
      backLabel: '← Academy',
      onBack: () => this.showAcademyHome(),
    });
  }

  private getMoveHistoryRows(): string[] {
    const history = this.chess.history();
    const rows: string[] = [];
    for (let index = 0; index < history.length; index += 2) {
      const moveNumber = String(index / 2 + 1).padStart(2, ' ');
      const whiteMove = (history[index] ?? '').padEnd(12, ' ');
      rows.push(`${moveNumber}. ${whiteMove}${history[index + 1] ?? ''}`);
    }
    return rows;
  }

  private renderMoveHistory(): void {
    if (!this.moveLogText) {
      return;
    }

    const rows = this.getMoveHistoryRows();
    if (rows.length === 0) {
      this.moveLogText.setText('No moves yet.');
      this.moveHistoryRangeText?.setText('0 moves');
      return;
    }

    const maxStart = Math.max(0, rows.length - MOVE_HISTORY_VISIBLE_ROWS);
    const start =
      this.moveHistoryStart < 0
        ? maxStart
        : Phaser.Math.Clamp(this.moveHistoryStart, 0, maxStart);
    const end = Math.min(rows.length, start + MOVE_HISTORY_VISIBLE_ROWS);

    this.moveLogText.setText(rows.slice(start, end).join('\n'));
    this.moveHistoryRangeText?.setText(`${start + 1}–${end} of ${rows.length}`);
  }

  private scrollMoveHistory(direction: -1 | 1): void {
    const rows = this.getMoveHistoryRows();
    if (rows.length <= MOVE_HISTORY_VISIBLE_ROWS) {
      this.moveHistoryStart = -1;
      this.renderMoveHistory();
      return;
    }

    const maxStart = Math.max(0, rows.length - MOVE_HISTORY_VISIBLE_ROWS);
    const current =
      this.moveHistoryStart < 0
        ? maxStart
        : Phaser.Math.Clamp(this.moveHistoryStart, 0, maxStart);
    const next = Phaser.Math.Clamp(current + direction, 0, maxStart);
    this.moveHistoryStart = next === maxStart ? -1 : next;
    this.renderMoveHistory();
  }

  private createMoveHistoryScrollButton(
    x: number,
    y: number,
    label: string,
    name: string,
    direction: -1 | 1,
  ): void {
    const button = this.add.graphics().setPosition(x, y).setName(name);
    const draw = (fill: number): void => {
      button.clear();
      button.fillStyle(fill, 1);
      button.fillRoundedRect(-22, -20, 44, 40, 12);
      button.lineStyle(2, CHESS_ACADEMY_PALETTE.header, 1);
      button.strokeRoundedRect(-22, -20, 44, 40, 12);
    };
    draw(CHESS_ACADEMY_PALETTE.mint);

    button
      .setInteractive(
        new Phaser.Geom.Rectangle(-22, -20, 44, 40),
        Phaser.Geom.Rectangle.Contains,
      )
      .on('pointerover', () => draw(CHESS_ACADEMY_PALETTE.mintHover))
      .on('pointerout', () => draw(CHESS_ACADEMY_PALETTE.mint))
      .on('pointerdown', () => this.scrollMoveHistory(direction));

    this.add
      .text(x, y - 1, label, {
        color: CHESS_ACADEMY_PALETTE.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private updateCoachMatchStatus(): void {
    if (!this.statusText || !this.moveLogText) {
      return;
    }

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
      this.statusText.setText(`CHECKMATE · ${winner} wins`);
      this.lessonText?.setText(describeChessPosition(this.chess));
      this.showMatchResult(winner === 'White' ? 'win' : 'loss');
    } else if (this.chess.isGameOver()) {
      this.statusText.setText('GAME DRAWN');
      this.lessonText?.setText(describeChessPosition(this.chess));
      this.showMatchResult('draw');
    } else if (this.coachHoldingFeedback) {
      this.statusText.setText('Coach note · take a moment to read');
    } else if (this.opponentPending || this.chess.turn() === 'b') {
      this.statusText.setText(
        this.chess.isCheck() ? 'CHECK · Village must respond' : 'Village is thinking…',
      );
    } else if (this.chess.isCheck()) {
      this.statusText.setText('CHECK · Protect your king');
      if (!this.selected) {
        this.lessonText?.setText(
          'Your king is in check. Find a legal move that makes the king safe.',
        );
      }
    } else if (this.coachWarningContainer) {
      this.statusText.setText('Coach question · Your choice');
    } else if (this.selected) {
      this.statusText.setText('Choose a highlighted legal square');
    } else {
      this.statusText.setText('Your move · White · Coach is watching');
    }

    this.renderMoveHistory();
  }

  private updateFriendlyCoach(): void {
    if (!this.statusText || !this.moveLogText) {
      return;
    }

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
      this.statusText.setText(`CHECKMATE · ${winner} wins`);
      this.lessonText?.setText(describeChessPosition(this.chess));
      this.showMatchResult(winner === 'White' ? 'win' : 'loss');
    } else if (this.chess.isGameOver()) {
      this.statusText.setText('GAME DRAWN');
      this.lessonText?.setText(describeChessPosition(this.chess));
      this.showMatchResult('draw');
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

    this.renderMoveHistory();
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
    } else if (this.view === 'puzzle') {
      this.resetPuzzle();
    } else if (this.view === 'coach-match') {
      this.startCoachMatch();
    } else if (this.view === 'friendly-match') {
      this.restartFriendlyMatch();
    }
  }

  private restartFriendlyMatch(): void {
    this.chess.reset();
    this.selected = null;
    this.hintMove = null;
    this.opponentPending = false;
    this.moveHistoryStart = -1;
    this.friendlyResultShown = false;
    this.clearCompletionCard();
    this.lessonText?.setText(describeChessPosition(this.chess));
    this.renderBoard();
  }

  private handleEscape(): void {
    if (this.view === 'lesson') {
      this.showLessonList();
      return;
    }
    if (this.view === 'puzzle') {
      this.showPuzzleList();
      return;
    }
    if (
      this.view === 'lesson-list' ||
      this.view === 'puzzle-list' ||
      this.view === 'coach-match' ||
      this.view === 'friendly-match'
    ) {
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
    name?: string,
  ): void {
    const height = 52;
    const button = this.add.graphics().setPosition(x, y);
    if (name) {
      button.setName(name);
    }
    const draw = (fill: number): void => {
      button.clear();
      button.fillStyle(fill, 1);
      button.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
      button.lineStyle(3, CHESS_ACADEMY_PALETTE.header, 1);
      button.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
    };
    draw(CHESS_ACADEMY_PALETTE.mint);

    button
      .setInteractive(
        new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains,
      )
      .on('pointerover', () => draw(CHESS_ACADEMY_PALETTE.mintHover))
      .on('pointerout', () => draw(CHESS_ACADEMY_PALETTE.mint))
      .on('pointerdown', onPress);

    this.add
      .text(x, y, labelText, {
        color: CHESS_ACADEMY_PALETTE.ink,
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
