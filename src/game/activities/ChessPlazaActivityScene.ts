import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';
import {
  applyChessLiteMove,
  chooseVillageChessMove,
  createChessLiteState,
  getChessLiteMovesForSquare,
  type ChessLiteColour,
  type ChessLiteMove,
  type ChessLitePiece,
  type ChessLiteSquare,
  type ChessLiteState,
} from './ChessLiteRules';

interface ChessPlazaSceneData {
  returnScene?: string;
}

const BOARD_LEFT = 108;
const BOARD_TOP = 112;
const SQUARE_SIZE = 62;
const BOARD_SIZE = SQUARE_SIZE * 8;

const PIECE_GLYPHS: Record<ChessLiteColour, Record<ChessLitePiece['type'], string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

function sameSquare(left: ChessLiteSquare | null, right: ChessLiteSquare): boolean {
  return left?.row === right.row && left.col === right.col;
}

export class ChessPlazaActivityScene extends Phaser.Scene {
  private returnScene = 'SunbeamVillageScene';
  private state: ChessLiteState = createChessLiteState();
  private selected: ChessLiteSquare | null = null;
  private boardContainer: Phaser.GameObjects.Container | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private opponentPending = false;

  public constructor() {
    super('ChessPlazaActivityScene');
  }

  public create(data: ChessPlazaSceneData = {}): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.state = createChessLiteState();
    this.selected = null;
    this.opponentPending = false;

    this.cameras.main.setBackgroundColor('#6e8063');
    this.createBackdrop();
    this.renderBoard();

    this.input.keyboard?.on('keydown-ESC', this.leaveActivity, this);
    this.input.keyboard?.on('keydown-R', this.restartGame, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.leaveActivity, this);
      this.input.keyboard?.off('keydown-R', this.restartGame, this);
      this.boardContainer?.destroy(true);
      this.boardContainer = null;
      this.statusText = null;
      this.opponentPending = false;
    });
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x6e8063, 1);
    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1180, 650, 1, 0.28);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1180, 650, 0xfff7e5, 1)
      .setStrokeStyle(8, 0xc8a66f, 1);

    this.add
      .text(GAME_WIDTH / 2, 46, '♟ Sunbeam Chess', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(850, 136, 'Friendly village rules', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        850,
        212,
        'Move the familiar pieces and capture the other crown.\n\nFor this first version there is no check, castling or en-passant. Pawns promote automatically. The village opponent plays simple legal moves.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '17px',
          lineSpacing: 8,
          align: 'center',
          wordWrap: { width: 390 },
        },
      )
      .setOrigin(0.5);

    this.statusText = this.add
      .text(850, 388, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 390 },
        backgroundColor: '#f2e4c8',
        padding: { x: 18, y: 14 },
      })
      .setOrigin(0.5);

    this.createButton(790, 540, 210, '↻ Restart', () => this.restartGame());
    this.createButton(1010, 540, 210, '← Back to Village', () => this.leaveActivity());

    this.add
      .text(900, 596, 'Tip: click one of your white pieces, then a highlighted square.', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        align: 'center',
        wordWrap: { width: 420 },
      })
      .setOrigin(0.5);
  }

  private renderBoard(): void {
    this.boardContainer?.destroy(true);
    this.boardContainer = this.add.container(0, 0).setDepth(10);

    const selectedMoves = this.selected
      ? getChessLiteMovesForSquare(this.state, this.selected)
      : [];

    this.boardContainer.add(
      this.add
        .rectangle(
          BOARD_LEFT + BOARD_SIZE / 2,
          BOARD_TOP + BOARD_SIZE / 2,
          BOARD_SIZE + 20,
          BOARD_SIZE + 20,
          0x6f503d,
          1,
        )
        .setStrokeStyle(4, 0x4d382f, 1),
    );

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const x = BOARD_LEFT + col * SQUARE_SIZE + SQUARE_SIZE / 2;
        const y = BOARD_TOP + row * SQUARE_SIZE + SQUARE_SIZE / 2;
        const square = { row, col };
        const selected = sameSquare(this.selected, square);
        const destination = selectedMoves.some((move) => sameSquare(move.to, square));
        const baseColour = (row + col) % 2 === 0 ? 0xf5dfb7 : 0x92705a;
        const squareColour = selected ? 0xf3cf6a : destination ? 0xa9d59e : baseColour;

        const tile = this.add
          .rectangle(x, y, SQUARE_SIZE - 1, SQUARE_SIZE - 1, squareColour, 1)
          .setInteractive({ useHandCursor: true })
          .setName(`sunbeam-chess:square:${row}:${col}`);
        tile.on('pointerdown', () => this.handleSquarePress(square));
        this.boardContainer.add(tile);

        if (destination) {
          this.boardContainer.add(this.add.circle(x, y, 8, 0x4f8658, 0.82));
        }

        const piece = this.state.board[row][col];
        if (piece) {
          const glyph = this.add
            .text(x, y - 2, PIECE_GLYPHS[piece.colour][piece.type], {
              color: piece.colour === 'white' ? '#fff9e9' : '#493a35',
              fontFamily: 'Georgia, serif',
              fontSize: '43px',
              fontStyle: 'bold',
              stroke: piece.colour === 'white' ? '#5b4a42' : '#f5e6c7',
              strokeThickness: 2,
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setName(`sunbeam-chess:piece:${piece.colour}:${piece.type}:${row}:${col}`);
          glyph.on('pointerdown', () => this.handleSquarePress(square));
          this.boardContainer.add(glyph);
        }
      }
    }

    for (let index = 0; index < 8; index += 1) {
      this.boardContainer.add([
        this.add
          .text(
            BOARD_LEFT - 18,
            BOARD_TOP + index * SQUARE_SIZE + SQUARE_SIZE / 2,
            String(8 - index),
            {
              color: UI_COLOURS.softInk,
              fontFamily: UI_FONT,
              fontSize: '13px',
              fontStyle: 'bold',
            },
          )
          .setOrigin(0.5),
        this.add
          .text(
            BOARD_LEFT + index * SQUARE_SIZE + SQUARE_SIZE / 2,
            BOARD_TOP + BOARD_SIZE + 18,
            String.fromCharCode(65 + index),
            {
              color: UI_COLOURS.softInk,
              fontFamily: UI_FONT,
              fontSize: '13px',
              fontStyle: 'bold',
            },
          )
          .setOrigin(0.5),
      ]);
    }

    this.updateStatus();
  }

  private handleSquarePress(square: ChessLiteSquare): void {
    if (this.opponentPending || this.state.winner || this.state.turn !== 'white') {
      return;
    }

    const piece = this.state.board[square.row][square.col];
    if (!this.selected) {
      if (piece?.colour === 'white') {
        this.selected = square;
        this.renderBoard();
      }
      return;
    }

    if (piece?.colour === 'white') {
      this.selected = square;
      this.renderBoard();
      return;
    }

    const move: ChessLiteMove = { from: this.selected, to: square };
    const next = applyChessLiteMove(this.state, move);
    if (!next) {
      this.selected = null;
      this.renderBoard();
      return;
    }

    this.state = next;
    this.selected = null;
    this.renderBoard();

    if (!this.state.winner) {
      this.opponentPending = true;
      this.updateStatus();
      this.time.delayedCall(480, () => this.makeOpponentMove());
    }
  }

  private makeOpponentMove(): void {
    if (this.state.winner || this.state.turn !== 'black') {
      this.opponentPending = false;
      this.renderBoard();
      return;
    }

    const move = chooseVillageChessMove(this.state);
    if (move) {
      this.state = applyChessLiteMove(this.state, move) ?? this.state;
    }
    this.opponentPending = false;
    this.renderBoard();
  }

  private updateStatus(): void {
    if (!this.statusText) {
      return;
    }

    if (this.state.winner === 'white') {
      this.statusText.setText('✨ You captured the dark crown!\nSunbeam victory.');
      return;
    }
    if (this.state.winner === 'black') {
      this.statusText.setText(
        'The village player captured your crown.\nPress Restart for another game.',
      );
      return;
    }
    if (this.state.winner === 'draw') {
      this.statusText.setText(
        'That was a long game — friendly draw.\nPress Restart to play again.',
      );
      return;
    }
    if (this.opponentPending || this.state.turn === 'black') {
      this.statusText.setText('The village player is thinking…');
      return;
    }
    if (this.selected) {
      this.statusText.setText('Choose one of the highlighted squares.');
      return;
    }
    this.statusText.setText('Your move — you are the white pieces.');
  }

  private restartGame(): void {
    this.state = createChessLiteState();
    this.selected = null;
    this.opponentPending = false;
    this.renderBoard();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    labelText: string,
    onPress: () => void,
  ): void {
    const button = this.add
      .rectangle(x, y, width, 58, UI_COLOURS.mint, 1)
      .setStrokeStyle(3, 0x6aa996, 1)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    applyButtonHover(button, UI_COLOURS.mint, UI_COLOURS.blush);
    button.on('pointerdown', onPress);
    label.on('pointerdown', onPress);
  }

  private leaveActivity(): void {
    this.scene.stop();
    if (this.game.scene.isPaused(this.returnScene)) {
      this.game.scene.resume(this.returnScene);
    } else if (!this.game.scene.isActive(this.returnScene)) {
      this.game.scene.start(this.returnScene);
    }
  }
}
