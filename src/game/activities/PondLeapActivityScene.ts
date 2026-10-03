import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';
import { returnFromMiniGame } from '../minigames/MiniGameLauncher';
import { readMiniGameSession, type MiniGameSession } from '../minigames/MiniGameSession';

interface PondLeapActivitySceneData {
  returnScene?: string;
  discoveredReflection?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const PADS: readonly Point[] = [
  { x: 190, y: 395 },
  { x: 360, y: 300 },
  { x: 545, y: 410 },
  { x: 725, y: 285 },
  { x: 910, y: 390 },
  { x: 1080, y: 295 },
];

const TARGET_CENTRES = [0.34, 0.62, 0.48, 0.7, 0.42] as const;
const TARGET_TOLERANCES = [0.18, 0.16, 0.14, 0.13, 0.12] as const;
const TIMING_LEFT = 355;
const TIMING_WIDTH = 570;
const TIMING_Y = 590;

export class PondLeapActivityScene extends Phaser.Scene {
  private miniGameSession: MiniGameSession | null = null;
  private returnScene = 'RainbowMeadowScene';
  private discoveredReflection = false;
  private hopIndex = 0;
  private misses = 0;
  private actionLocked = false;
  private completed = false;
  private timingPhase = 0;
  private timingValue = 0.5;
  private frog: Phaser.GameObjects.Container | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private progressText: Phaser.GameObjects.Text | null = null;
  private timingMarker: Phaser.GameObjects.Rectangle | null = null;
  private timingZone: Phaser.GameObjects.Rectangle | null = null;
  private completionLayer: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('PondLeapActivityScene');
  }

  public create(data: PondLeapActivitySceneData = {}): void {
    this.miniGameSession = readMiniGameSession(data);
    this.returnScene = this.miniGameSession?.returnTarget.sceneKey ?? data.returnScene ?? 'RainbowMeadowScene';
    this.discoveredReflection = data.discoveredReflection === true;
    this.restartRun();

    this.cameras.main.setBackgroundColor('#5d8f76');
    this.createBackdrop();
    this.createPondCourse();
    this.createControls();
    this.syncRunPresentation();

    this.input.keyboard?.on('keydown-SPACE', this.tryLeap, this);
    this.input.keyboard?.on('keydown-ENTER', this.tryLeap, this);
    this.input.keyboard?.on('keydown-ESC', this.leaveActivity, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-SPACE', this.tryLeap, this);
      this.input.keyboard?.off('keydown-ENTER', this.tryLeap, this);
      this.input.keyboard?.off('keydown-ESC', this.leaveActivity, this);
      this.frog?.destroy(true);
      this.frog = null;
      this.statusText = null;
      this.progressText = null;
      this.timingMarker = null;
      this.timingZone = null;
      this.completionLayer?.destroy(true);
      this.completionLayer = null;
    });
  }

  public update(_time: number, delta: number): void {
    if (this.actionLocked || this.completed) {
      return;
    }

    this.timingPhase += delta * (0.0042 + this.hopIndex * 0.00035);
    this.timingValue = (Math.sin(this.timingPhase) + 1) / 2;
    this.timingMarker?.setX(TIMING_LEFT + this.timingValue * TIMING_WIDTH);
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x5d8f76, 1);
    const shell = this.add.graphics();
    shell.fillStyle(0xfff9e9, 1);
    shell.fillRoundedRect(35, 30, 1210, 654, 30);
    shell.lineStyle(6, 0xc99cdb, 1);
    shell.strokeRoundedRect(35, 30, 1210, 654, 30);

    this.add
      .text(GAME_WIDTH / 2, 66, '🐸  Lily Pad Leap', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        105,
        'Help the pond frog cross five lily pads. Leap while the marker is inside the green water!',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '16px',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    const pond = this.add.graphics();
    pond.fillStyle(0x75cade, 1);
    pond.fillRoundedRect(88, 145, 1104, 360, 90);
    pond.lineStyle(6, 0x8dc9a0, 0.72);
    pond.strokeRoundedRect(88, 145, 1104, 360, 90);
    pond.fillStyle(0xc9f1f1, 0.24);
    pond.fillEllipse(640, 305, 820, 210);

    if (this.discoveredReflection) {
      const rainbow = this.add.graphics().setName('pond-leap:rainbow-reflection');
      const colours = [0xe78aa8, 0xf1ad61, 0xf3d66f, 0x89bf72, 0x72bfd2, 0xa38bd2] as const;
      colours.forEach((colour, index) => {
        rainbow.lineStyle(5, colour, 0.38);
        rainbow.strokeEllipse(640, 315, 610 - index * 28, 145 - index * 7);
      });
    }

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 530, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 850 },
      })
      .setOrigin(0.5);

    this.progressText = this.add
      .text(110, 530, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
  }

  private createPondCourse(): void {
    PADS.forEach((pad, index) => {
      const scale = 1 - index * 0.035;
      const lily = this.add
        .ellipse(pad.x, pad.y, 112 * scale, 52 * scale, 0x659b61, 1)
        .setStrokeStyle(3, 0x4f7d50, 0.8)
        .setName(`pond-leap:pad:${index}`);
      this.add.ellipse(pad.x - 12, pad.y - 7, 65 * scale, 24 * scale, 0x7fb476, 0.72);

      if (index % 2 === 1) {
        this.add
          .circle(pad.x + 18, pad.y - 10, 9 * scale, index % 4 === 1 ? 0xffd0e8 : 0xffed9d, 1)
          .setStrokeStyle(2, 0xffffff, 0.45);
      }

      lily.setDepth(4);
    });

    this.frog = this.createFrog(PADS[0]?.x ?? 190, (PADS[0]?.y ?? 395) - 22);
  }

  private createFrog(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 16, 42, 14, 0x35694c, 0.2);
    const body = this.add.ellipse(0, 3, 42, 28, 0x7ec56f, 1).setStrokeStyle(2, 0x4c8350, 0.9);
    const head = this.add.ellipse(0, -10, 36, 27, 0x8bd276, 1).setStrokeStyle(2, 0x4c8350, 0.9);
    const leftEye = this.add.circle(-10, -22, 7, 0xeef8dd, 1);
    const rightEye = this.add.circle(10, -22, 7, 0xeef8dd, 1);
    const leftPupil = this.add.circle(-10, -22, 3, 0x443f49, 1);
    const rightPupil = this.add.circle(10, -22, 3, 0x443f49, 1);
    const smile = this.add.arc(0, -6, 8, 12, 168, false, 0, 0).setStrokeStyle(2, 0x497151, 0.9);

    return this.add
      .container(x, y, [shadow, body, head, leftEye, rightEye, leftPupil, rightPupil, smile])
      .setName('pond-leap:frog')
      .setDepth(8);
  }

  private createControls(): void {
    const track = this.add.graphics();
    track.fillStyle(0xdcebd7, 1);
    track.fillRoundedRect(TIMING_LEFT, TIMING_Y - 13, TIMING_WIDTH, 26, 13);
    track.lineStyle(3, 0x9eb89a, 0.9);
    track.strokeRoundedRect(TIMING_LEFT, TIMING_Y - 13, TIMING_WIDTH, 26, 13);

    this.timingZone = this.add
      .rectangle(TIMING_LEFT, TIMING_Y, 100, 18, 0x7bcf8c, 0.88)
      .setOrigin(0.5);
    this.timingMarker = this.add
      .rectangle(TIMING_LEFT + TIMING_WIDTH / 2, TIMING_Y, 8, 38, 0x6b4d78, 1)
      .setStrokeStyle(2, 0xffffff, 0.9);

    this.createRoundedButton(1040, 590, 180, 'LEAP!', () => this.tryLeap(), 'leap', true);
    this.createRoundedButton(1060, 80, 130, 'Back', () => this.leaveActivity(), 'back');
    this.createRoundedButton(205, 590, 170, 'Restart', () => this.restartRun(), 'restart');

    this.add
      .text(640, 635, 'SPACE / ENTER or tap LEAP!', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private syncRunPresentation(): void {
    const targetCentre = TARGET_CENTRES[this.hopIndex] ?? 0.5;
    const tolerance = TARGET_TOLERANCES[this.hopIndex] ?? 0.12;
    const zoneWidth = TIMING_WIDTH * tolerance * 2;
    this.timingZone
      ?.setPosition(TIMING_LEFT + targetCentre * TIMING_WIDTH, TIMING_Y)
      .setDisplaySize(zoneWidth, 18);

    this.progressText?.setText(
      this.completed ? '5 / 5 pads crossed' : `Pad ${this.hopIndex + 1} of 5`,
    );

    if (this.completed) {
      this.statusText?.setText('');
      this.showCompletionScreen();
      return;
    }

    this.statusText?.setText(
      this.discoveredReflection && this.hopIndex === 0
        ? 'A rainbow reflection shimmers between the pads. Time the first leap!'
        : 'Watch the marker and leap when it reaches the green water.',
    );
  }

  private showCompletionScreen(): void {
    if (this.completionLayer) {
      return;
    }

    const perfect = this.misses === 0;
    const layer = this.add.container(0, 0).setName('pond-leap:completion').setDepth(40);

    const panel = this.add.graphics().setName('pond-leap:completion-panel');
    panel.fillStyle(0xfff9e9, 1);
    panel.fillRoundedRect(115, 165, 1050, 455, 32);
    panel.lineStyle(6, 0xc99cdb, 1);
    panel.strokeRoundedRect(115, 165, 1050, 455, 32);

    const blocker = this.add
      .rectangle(640, 392, 1050, 455, 0xffffff, 0.001)
      .setName('pond-leap:completion-blocker')
      .setInteractive();

    const celebration = this.add
      .text(640, 225, perfect ? '✨  PERFECT CROSSING!  ✨' : '🌟  POND CROSSED!  🌟', {
        color: '#65446f',
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const frog = this.add
      .text(640, 305, '🐸', {
        fontFamily: UI_FONT,
        fontSize: '68px',
      })
      .setOrigin(0.5);

    const headline = this.add
      .text(640, 375, perfect ? 'Not a single splash!' : 'You made it across all five lily pads!', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    const summary = this.add
      .text(
        640,
        420,
        perfect
          ? 'Five leaps. Five clean landings. The pond frogs are impressed.'
          : `${this.misses} splash${this.misses === 1 ? '' : 'es'}, five successful leaps, and one very determined frog.`,
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '17px',
          align: 'center',
          wordWrap: { width: 760 },
        },
      )
      .setOrigin(0.5);

    const padRow = this.add
      .text(640, 468, '●   ●   ●   ●   ●', {
        color: '#6fa76c',
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    layer.add([panel, blocker, celebration, frog, headline, summary, padRow]);
    this.createRoundedButton(
      505,
      550,
      220,
      'Play Again',
      () => this.restartRun(),
      'play-again',
      true,
      layer,
    );
    this.createRoundedButton(
      775,
      550,
      220,
      'Back to Meadow',
      () => this.leaveActivity(),
      'back-to-meadow',
      false,
      layer,
    );

    this.tweens.add({
      targets: celebration,
      scale: { from: 0.94, to: 1.04 },
      duration: 520,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.InOut',
    });

    this.completionLayer = layer;
  }

  private tryLeap(): void {
    if (this.actionLocked || this.completed || !this.frog) {
      return;
    }

    const targetCentre = TARGET_CENTRES[this.hopIndex] ?? 0.5;
    const tolerance = TARGET_TOLERANCES[this.hopIndex] ?? 0.12;
    const success = Math.abs(this.timingValue - targetCentre) <= tolerance;

    this.actionLocked = true;
    if (!success) {
      this.handleMiss();
      return;
    }

    const from = PADS[this.hopIndex];
    const to = PADS[this.hopIndex + 1];
    if (!from || !to) {
      this.actionLocked = false;
      return;
    }

    const flight = { progress: 0 };
    this.statusText?.setText('Boing!');
    this.tweens.add({
      targets: flight,
      progress: 1,
      duration: 520,
      ease: 'Sine.InOut',
      onUpdate: () => {
        if (!this.frog) return;
        const progress = flight.progress;
        this.frog.setPosition(
          Phaser.Math.Linear(from.x, to.x, progress),
          Phaser.Math.Linear(from.y - 22, to.y - 22, progress) - Math.sin(Math.PI * progress) * 72,
        );
      },
      onComplete: () => {
        this.hopIndex += 1;
        this.actionLocked = false;
        if (this.hopIndex >= PADS.length - 1) {
          this.completed = true;
          this.cameras.main.flash(120, 225, 255, 208, false);
        }
        this.syncRunPresentation();
      },
    });
  }

  private handleMiss(): void {
    this.misses += 1;
    const next = PADS[this.hopIndex + 1] ?? PADS[this.hopIndex] ?? { x: 640, y: 350 };
    const splash = this.add.graphics().setPosition(next.x, next.y).setDepth(7);
    splash.lineStyle(4, 0xe0fbff, 0.9);
    splash.strokeEllipse(0, 8, 38, 14);
    splash.strokeEllipse(0, 8, 70, 24);
    this.tweens.add({
      targets: splash,
      alpha: 0,
      scaleX: 1.45,
      scaleY: 1.45,
      duration: 420,
      onComplete: () => splash.destroy(),
    });

    this.statusText?.setText('Splash! Same pad, try that leap again.');
    this.cameras.main.shake(80, 0.0015);
    this.time.delayedCall(430, () => {
      this.actionLocked = false;
      this.syncRunPresentation();
    });
  }

  private restartRun(): void {
    this.completionLayer?.destroy(true);
    this.completionLayer = null;
    this.hopIndex = 0;
    this.misses = 0;
    this.actionLocked = false;
    this.completed = false;
    this.timingPhase = 0;
    this.timingValue = 0.5;

    const start = PADS[0] ?? { x: 190, y: 395 };
    this.frog?.setPosition(start.x, start.y - 22);
    this.syncRunPresentation();
  }

  private createRoundedButton(
    x: number,
    y: number,
    width: number,
    labelText: string,
    onPress: () => void,
    name: string,
    prominent = false,
    parent: Phaser.GameObjects.Container | null = null,
  ): void {
    const visual = this.add.graphics().setName(`pond-leap:${name}-visual`);
    const draw = (hovered: boolean): void => {
      visual.clear();
      visual.fillStyle(
        prominent ? (hovered ? 0xa9e09a : 0x8fd27d) : hovered ? 0xf3df9c : 0xfff4cc,
        1,
      );
      visual.lineStyle(3, prominent ? 0x5b9b64 : 0xc6a85e, 1);
      visual.fillRoundedRect(x - width / 2, y - 27, width, 54, 18);
      visual.strokeRoundedRect(x - width / 2, y - 27, width, 54, 18);
    };
    draw(false);

    const hit = this.add
      .rectangle(x, y, width, 54, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
      .setName(`pond-leap:${name}`);
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: prominent ? '18px' : '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    for (const target of [hit, label]) {
      target.on('pointerover', () => draw(true));
      target.on('pointerout', () => draw(false));
      target.on('pointerdown', onPress);
    }

    parent?.add([visual, hit, label]);
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
