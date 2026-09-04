import Phaser from 'phaser';
import {
  BEACHCOMBING_OUTCOMES,
  type BeachcombingTrail,
} from '../../content/r65RepeatableActivities';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';
import {
  getCoralBeachcombingProgress,
  getNextBeachcombingTrail,
  recordCoralBeachcombingTrail,
} from './CoralBeachcombingActivity';

interface CoralBeachcombingSceneData {
  returnScene?: string;
}

interface ObservationSpot {
  icon: string;
  label: string;
  note: string;
}

const OBSERVATIONS: Readonly<Record<BeachcombingTrail, readonly ObservationSpot[]>> = {
  'crab-tracks': [
    { icon: '🦀', label: 'Tiny tracks', note: 'Tiny footprints zig-zag across the damp sand.' },
    { icon: '🌊', label: 'Wave edge', note: 'A small wave smooths half the trail away.' },
    { icon: '🪨', label: 'Pebble shade', note: 'The tracks pause beside a cool pebble shadow.' },
    {
      icon: '👀',
      label: 'Quiet watch',
      note: 'You spot the little crab from far enough away not to bother it.',
    },
    { icon: '✏️', label: 'Sketch it', note: 'You copy the track shape into Coral’s notebook.' },
  ],
  'tidepool-star': [
    {
      icon: '💧',
      label: 'Clear pool',
      note: 'The tide pool is clear enough to see patterns below.',
    },
    { icon: '⭐', label: 'Star shape', note: 'A star-shaped pattern appears between the stones.' },
    { icon: '🌿', label: 'Sea ribbon', note: 'A ribbon of seaweed waves gently under the water.' },
    {
      icon: '🐚',
      label: 'Shell edge',
      note: 'An empty shell catches a bright reflection at the pool edge.',
    },
    {
      icon: '✏️',
      label: 'Sketch it',
      note: 'You draw the pool without touching anything living inside.',
    },
  ],
  'moon-shell': [
    { icon: '🌙', label: 'Moon gleam', note: 'Moonlit Point makes the damp sand look silver.' },
    {
      icon: '🐚',
      label: 'Pearly shapes',
      note: 'A few empty shells make a crescent pattern near the tideline.',
    },
    { icon: '✨', label: 'Shell shine', note: 'One shell flashes when the water slides back.' },
    {
      icon: '🌊',
      label: 'Tide line',
      note: 'The next wave moves the pattern without anyone needing to collect it.',
    },
    {
      icon: '✏️',
      label: 'Sketch it',
      note: 'You record the shapes and leave the beach exactly as you found it.',
    },
  ],
};

const REQUIRED_OBSERVATIONS = 4;

export class CoralBeachcombingActivityScene extends Phaser.Scene {
  private returnScene = 'StarlightBeachScene';
  private trail: BeachcombingTrail = 'crab-tracks';
  private observed = new Set<number>();
  private body: Phaser.GameObjects.Container | null = null;
  private noteText: Phaser.GameObjects.Text | null = null;
  private finished = false;

  public constructor() {
    super('CoralBeachcombingActivityScene');
  }

  public create(data: CoralBeachcombingSceneData = {}): void {
    this.returnScene = data.returnScene ?? 'StarlightBeachScene';
    this.trail = getNextBeachcombingTrail(getBrowserSaveService());
    this.observed.clear();
    this.finished = false;

    this.cameras.main.setBackgroundColor('#527f94');
    this.createBackdrop();
    this.renderRun();

    this.input.keyboard?.on('keydown-ESC', this.leaveActivity, this);
    for (let index = 0; index < 5; index += 1) {
      this.input.keyboard?.on(`keydown-${index + 1}`, () => this.observe(index));
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.leaveActivity, this);
      for (let index = 0; index < 5; index += 1) {
        this.input.keyboard?.removeAllListeners(`keydown-${index + 1}`);
      }
      this.body?.destroy(true);
      this.body = null;
      this.noteText = null;
    });
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x49778d, 1);
    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1100, 650, 1, 0.26);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1100, 650, 0xeaf8f7, 1)
      .setStrokeStyle(8, 0x71b7c4, 1)
      .setName('wp14-beachcombing-panel');
    this.add
      .text(GAME_WIDTH / 2, 54, '🔎 Coral’s Beachcombing Notebook', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(
        GAME_WIDTH / 2,
        96,
        'Look closely at four things. Living creatures stay exactly where they belong. There is no timer and nothing to fail.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '16px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 900 },
        },
      )
      .setOrigin(0.5);
    this.createButton(155, GAME_HEIGHT - 48, 240, '← Back to Beach', () => this.leaveActivity());
  }

  private renderRun(): void {
    this.body?.destroy(true);
    this.body = this.add.container(0, 0).setDepth(10);

    if (this.finished) {
      this.renderResult();
      return;
    }

    const outcome = BEACHCOMBING_OUTCOMES.find(({ trail }) => trail === this.trail);
    const heading = this.add
      .text(GAME_WIDTH / 2, 148, `${outcome?.icon ?? '🔎'} Follow today’s little clue`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName(`wp14-beachcombing-trail:${this.trail}`);
    this.body.add(heading);

    const spots = OBSERVATIONS[this.trail];
    spots.forEach((spot, index) => {
      const x = 220 + index * 210;
      const selected = this.observed.has(index);
      const card = this.add
        .rectangle(x, 330, 180, 180, selected ? 0xd9f0dd : 0xfffbef, 1)
        .setStrokeStyle(4, selected ? 0x79ad82 : 0x78b8c5, 0.95)
        .setInteractive({ useHandCursor: true })
        .setName(`wp14-beachcombing-spot:${index + 1}`);
      const icon = this.add
        .text(x, 295, spot.icon, { fontFamily: UI_FONT, fontSize: '44px' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, 360, `${index + 1}. ${spot.label}${selected ? ' ✓' : ''}`, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '15px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 155 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      applyButtonHover(card, selected ? 0xd9f0dd : 0xfffbef, 0xdff4f2);
      const inspect = () => this.observe(index);
      card.on('pointerdown', inspect);
      icon.on('pointerdown', inspect);
      label.on('pointerdown', inspect);
      this.body?.add([card, icon, label]);
    });

    this.noteText = this.add
      .text(
        GAME_WIDTH / 2,
        505,
        `${this.observed.size}/${REQUIRED_OBSERVATIONS} observations recorded. Pick any four.`,
        {
          color: '#4e6571',
          fontFamily: UI_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#ffffffd8',
          padding: { x: 16, y: 10 },
          wordWrap: { width: 820 },
        },
      )
      .setOrigin(0.5);
    this.body.add(this.noteText);
  }

  private observe(index: number): void {
    if (this.finished) {
      return;
    }
    const spot = OBSERVATIONS[this.trail][index];
    if (!spot) {
      return;
    }
    this.observed.add(index);
    if (this.observed.size >= REQUIRED_OBSERVATIONS) {
      recordCoralBeachcombingTrail(getBrowserSaveService(), this.trail);
      this.finished = true;
      this.cameras.main.flash(110, 195, 237, 231, false);
      this.renderRun();
      return;
    }
    this.renderRun();
    this.noteText?.setText(
      `${spot.icon} ${spot.note}\n${this.observed.size}/${REQUIRED_OBSERVATIONS} observations recorded.`,
    );
  }

  private renderResult(): void {
    const progress = getCoralBeachcombingProgress(getBrowserSaveService());
    const outcome = BEACHCOMBING_OUTCOMES.find(({ trail }) => trail === this.trail);
    if (!outcome) {
      return;
    }
    const title = this.add
      .text(GAME_WIDTH / 2, 190, `${outcome.icon} ${outcome.name}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('wp14-beachcombing-result');
    const summary = this.add
      .text(
        GAME_WIDTH / 2,
        285,
        `Coral adds your careful observations to the notebook. Nothing living was taken from the beach.\n\nNotebook: ${progress.completedOutcomeCount}/${progress.totalOutcomeCount} pages discovered.`,
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 780 },
          backgroundColor: '#ffffffd8',
          padding: { x: 20, y: 14 },
        },
      )
      .setOrigin(0.5);
    this.body?.add([title, summary]);
    this.createButton(500, 465, 260, '🔎 Beachcomb again', () => this.restartRun(), this.body);
    this.createButton(780, 465, 260, '✓ Back to Beach', () => this.leaveActivity(), this.body);
  }

  private restartRun(): void {
    this.trail = getNextBeachcombingTrail(getBrowserSaveService());
    this.observed.clear();
    this.finished = false;
    this.renderRun();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    labelText: string,
    onPress: () => void,
    parent: Phaser.GameObjects.Container | null = null,
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
    parent?.add([button, label]);
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
