import Phaser from 'phaser';
import { isReducedMotionEnabled } from '../accessibility/AccessibilitySettings';
import { getVerticalSliceAudio, type VerticalSliceSfx } from '../audio/VerticalSliceAudio';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';

const CREATOR_SCENE_KEY = 'UnicornCreatorScene';
const CREATOR_AUDIO_PROFILE_SCENE = 'TitleScene';
const ANCHOR_NAME = 'creator-delight:anchor';
const PREVIEW_HALO_NAME = 'creator-delight:preview-halo';

interface MoteSpec {
  x: number;
  y: number;
  glyph: string;
  alpha: number;
  size: number;
  duration: number;
}

const MOTES: readonly MoteSpec[] = [
  { x: 68, y: 258, glyph: '✦', alpha: 0.5, size: 18, duration: 1700 },
  { x: 586, y: 268, glyph: '✧', alpha: 0.42, size: 15, duration: 2100 },
  { x: 84, y: 475, glyph: '✧', alpha: 0.4, size: 16, duration: 1950 },
  { x: 570, y: 492, glyph: '✦', alpha: 0.46, size: 19, duration: 2300 },
  { x: 608, y: 664, glyph: '✦', alpha: 0.38, size: 14, duration: 1850 },
];

function isFeedbackControl(name: string): boolean {
  return (
    name.startsWith('creator-bodyColour-') ||
    name.startsWith('creator-eyeColour-') ||
    name.startsWith('creator-maneColour-') ||
    name.startsWith('creator-tailColour-') ||
    name.endsWith('-previous') ||
    name.endsWith('-next') ||
    name.startsWith('creator-action-')
  );
}

function feedbackSound(name: string): VerticalSliceSfx {
  if (name === 'creator-action-surprise') {
    return 'discovery';
  }
  if (name === 'creator-action-cancel' || name === 'creator-action-restore-saved') {
    return 'ui-back';
  }
  return 'ui';
}

export class CreatorDelightPresentationManager {
  private readonly syncThrottle = new RefreshThrottle(120);

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.sync, this);
  }

  private readonly sync = (): void => {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }

    const creator = this.game.scene
      .getScenes(true)
      .find((scene) => scene.scene.key === CREATOR_SCENE_KEY);
    if (!creator || creator.children.getByName(ANCHOR_NAME)) {
      return;
    }

    this.decorateCreator(creator);
  };

  private decorateCreator(scene: Phaser.Scene): void {
    scene.add.zone(-64, -64, 2, 2).setName(ANCHOR_NAME).setVisible(false);

    const reducedMotion = isReducedMotionEnabled();
    const audio = getVerticalSliceAudio();
    audio.enterScene(CREATOR_AUDIO_PROFILE_SCENE);
    scene.input.once('pointerdown', () => void audio.unlock());
    scene.input.keyboard?.once('keydown', () => void audio.unlock());

    const backgroundRibbon = scene.add
      .graphics()
      .setName('creator-delight:background-ribbon')
      .setDepth(1);
    backgroundRibbon.lineStyle(12, UI_COLOURS.ribbon, 0.08);
    backgroundRibbon.beginPath();
    backgroundRibbon.arc(322, 405, 238, -2.65, 0.45, false);
    backgroundRibbon.strokePath();
    backgroundRibbon.lineStyle(5, UI_COLOURS.gold, 0.12);
    backgroundRibbon.beginPath();
    backgroundRibbon.arc(322, 405, 255, -2.62, 0.47, false);
    backgroundRibbon.strokePath();

    const previewHalo = scene.add
      .ellipse(325, 407, 402, 304, UI_COLOURS.gold, 0.055)
      .setName(PREVIEW_HALO_NAME)
      .setStrokeStyle(3, UI_COLOURS.goldStrong, 0.28)
      .setDepth(4);

    for (const [index, spec] of MOTES.entries()) {
      const mote = scene.add
        .text(spec.x, spec.y, spec.glyph, {
          color: index % 2 === 0 ? '#fff2ba' : '#f9eaff',
          fontFamily: UI_FONT,
          fontSize: `${spec.size}px`,
          stroke: '#694b87',
          strokeThickness: 2,
        })
        .setName(`creator-delight:mote-${index}`)
        .setOrigin(0.5)
        .setAlpha(spec.alpha)
        .setDepth(2);

      if (!reducedMotion) {
        scene.tweens.add({
          targets: mote,
          y: spec.y - 12,
          alpha: Math.min(0.82, spec.alpha + 0.22),
          scale: 1.08,
          duration: spec.duration,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
    }

    if (!reducedMotion) {
      this.startHaloAmbience(scene, previewHalo);
    }

    this.attachFeedback(scene, previewHalo, reducedMotion);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      audio.leaveScene(CREATOR_AUDIO_PROFILE_SCENE);
    });
  }

  private attachFeedback(
    scene: Phaser.Scene,
    previewHalo: Phaser.GameObjects.Ellipse,
    reducedMotion: boolean,
  ): void {
    const audio = getVerticalSliceAudio();
    for (const object of scene.children.list) {
      const name = object.name;
      if (!name || !isFeedbackControl(name)) {
        continue;
      }

      object.on('pointerdown', () => {
        audio.playSfx(feedbackSound(name));
        if (reducedMotion || !previewHalo.active || !scene.scene.isActive()) {
          return;
        }

        scene.tweens.killTweensOf(previewHalo);
        previewHalo.setScale(1).setAlpha(0.12);
        scene.tweens.add({
          targets: previewHalo,
          scale: 1.045,
          alpha: 0.2,
          duration: 115,
          yoyo: true,
          ease: 'Quad.Out',
          onComplete: () => {
            if (!previewHalo.active || !scene.scene.isActive()) {
              return;
            }
            previewHalo.setScale(1).setAlpha(0.055);
            this.startHaloAmbience(scene, previewHalo);
          },
        });
      });
    }
  }

  private startHaloAmbience(scene: Phaser.Scene, previewHalo: Phaser.GameObjects.Ellipse): void {
    scene.tweens.add({
      targets: previewHalo,
      alpha: { from: 0.055, to: 0.11 },
      scale: { from: 0.99, to: 1.015 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }
}

let browserCreatorDelightPresentationManager: CreatorDelightPresentationManager | null = null;

export function getCreatorDelightPresentationManager(
  game: Phaser.Game,
): CreatorDelightPresentationManager {
  browserCreatorDelightPresentationManager ??= new CreatorDelightPresentationManager(game);
  return browserCreatorDelightPresentationManager;
}
