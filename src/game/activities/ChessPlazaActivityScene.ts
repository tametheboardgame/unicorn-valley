import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';
import { returnFromMiniGame } from '../minigames/MiniGameLauncher';
import { readMiniGameSession, type MiniGameSession } from '../minigames/MiniGameSession';
import {
  chooseTeachingMove,
  chooseVillageChessMove,
  describeChessPosition,
  describeTeachingMove,
} from './SunbeamChessRules';

interface ChessPlazaSceneData {
  returnScene?: string;
}

const BOARD_LEFT = 86;
const BOARD_TOP = 128;
const SQUARE_SIZE = 58;
const BOARD_SIZE = SQUARE_SIZE * 8;
const FILES = 'abcdefgh';

const PIECE_GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  },
};

function squareFor(row: number, col: number): Square {
  return `${FILES[col]}${8 - row}` as Square;
}

export class ChessPlazaActivityScene extends Phaser.Scene {
  private miniGameSession: MiniGameSession | null = null;
  private returnScene = 'SunbeamVillageScene';
  private chess = new Chess();
  private selected: Square | null = null;
  private hintMove: Move | null = null;
  private boardContainer: Phaser.GameObjects.Container | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private lessonText: Phaser.GameObjects.Text | null = null;
  private moveLogText: Phaser.GameObjects.Text | null = null;
  private opponentPending = false;

  public constructor() {
    super('ChessPlazaActivityScene');
  }

  public create(data: ChessPlazaSceneData = {}): void {
    this.miniGameSession = readMiniGameSession(data);
    this.returnScene =
      this.miniGameSession?.returnTarget.sceneKey ?? data.returnScene ?? 'SunbeamVillageScene';
    this.chess = new Chess();
    this.selected = null;
    this.hintMove = null;
    this.opponentPending = false;

    this.cameras.main.setBackgroundColor('#63765f');
    this.createBackdrop();
    this.lessonText?.setText(describeChessPosition(this.chess));
    this.renderBoard();

    this.input.keyboard?.on('keydown-ESC', this.leaveActivity, this);
    this.input.keyboard?.on('keydown-R', this.restartGame, this);
    this.input.keyboard?.on('keydown-H', this.showHint, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.leaveActivity, this);
      this.input.keyboard?.off('keydown-R', this.restartGame, this);
      this.input.keyboard?.off('keydown-H', this.showHint, this);
      this.boardContainer?.destroy(true);
      this.boardContainer = null;
      this.statusText = null;
      this.lessonText = null;
      this.moveLogText = null;
      this.opponentPending = false;
    });
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x63765f, 1);
    const shell = this.add.graphics();
    shell.fillStyle(0xfff8e8, 1);
    shell.fillRoundedRect(35, 30, 1210, 654, 30);
    shell.lineStyle(7, 0xcaa66e, 1);
    shell.strokeRoundedRect(35, 30, 1210, 654, 30);

    this.add
      .text(GAME_WIDTH / 2, 66, '♟  Sunbeam Chess', {
        color: '#5d4569',
        fontFamily: UI_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

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

    const coach = this.add.graphics();
    coach.fillStyle(0xf4ead8, 1);
    coach.fillRoundedRect(600, 116, 600, 458, 24);
    coach.lineStyle(3, 0xd6bc91, 0.95);
    coach.strokeRoundedRect(600, 116, 600, 458, 24);

    this.add
      .text(900, 148, 'Chess Coach', {
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
      .text(
        900,
        594,
        'Full rules are on: check, checkmate, castling, en-passant, promotion and draws.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '13px',
          align: 'center',
          wordWrap: { width: 560 },
        },
      )
      .setOrigin(0.5);

    this.createRoundedButton(710, 638, 168, '💡 Hint', () => this.showHint());
    this.createRoundedButton(900, 638, 168, '↻ Restart', () => this.restartGame());
    this.createRoundedButton(1090, 638, 188, this.backLabel(), () => this.leaveActivity());
  }

  private backLabel(): string {
    return this.miniGameSession?.source === 'just-games' ? '← Back to Games' : '← Back to Village';
  }

  private renderBoard(): void {
    this.boardContainer?.destroy(true);
    this.boardContainer = this.add.container(0, 0).setDepth(10);

    const selectedMoves = this.selected
      ? this.chess.moves({ square: this.selected, verbose: true })
      : [];

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const x = BOARD_LEFT + col * SQUARE_SIZE + SQUARE_SIZE / 2;
        const y = BOARD_TOP + row * SQUARE_SIZE + SQUARE_SIZE / 2;
        const square = squareFor(row, col);
        const selected = this.selected === square;
        const legalDestination = selectedMoves.some((move) => move.to === square);
        const hintFrom = this.hintMove?.from === square;
        const hintTo = this.hintMove?.to === square;
        const baseColour = (row + col) % 2 === 0 ? 0xf4deb0 : 0x94705a;
        const squareColour =
          selected || hintFrom
            ? 0xf2ce6d
            : hintTo
              ? 0x8fc89a
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

    this.updateCoach();
  }

  private handleSquarePress(square: Square): void {
    if (this.opponentPending || this.chess.isGameOver() || this.chess.turn() !== 'w') {
      return;
    }

    const piece = this.chess.get(square);
    if (!this.selected) {
      if (piece?.color === 'w') {
        this.selectPiece(square);
      }
      return;
    }

    if (piece?.color === 'w') {
      this.selectPiece(square);
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
      this.updateCoach();
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
      this.updateCoach();
      this.time.delayedCall(520, () => this.makeOpponentMove());
    }
  }

  private selectPiece(square: Square): void {
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
        `That ${piece ? this.pieceName(piece.type) : 'piece'} has ${legalMoves.length} legal move${legalMoves.length === 1 ? '' : 's'}. Green squares are safe legal destinations.`,
      );
    }
    this.renderBoard();
  }

  private makeOpponentMove(): void {
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
    if (this.opponentPending || this.chess.isGameOver() || this.chess.turn() !== 'w') {
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

  private updateCoach(): void {
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

  private restartGame(): void {
    this.chess.reset();
    this.selected = null;
    this.hintMove = null;
    this.opponentPending = false;
    this.lessonText?.setText(describeChessPosition(this.chess));
    this.renderBoard();
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
