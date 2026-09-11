import type Phaser from 'phaser';
import type { DialogueChoice, DialogueNode } from '../../content/contentTypes';
import {
  getBrowserAccessibilitySettingsStore,
  isReducedMotionEnabled,
} from '../accessibility/AccessibilitySettings';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

type CoreNpcId = 'nova' | 'willow' | 'pip' | 'pebble' | 'lumi' | 'marigold';
type DialogueLayout = 'compact' | 'expanded';

const CORE_NPC_IDS = new Set<CoreNpcId>(['nova', 'willow', 'pip', 'pebble', 'lumi', 'marigold']);
const COMPACT_LINE_CHARACTER_LIMIT = 118;

const COMPACT_LAYOUT = {
  panel: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 112, width: 900, height: 190 },
  ribbon: { x: 445, y: GAME_HEIGHT - 194, width: 300, height: 48 },
  portrait: { x: 250, y: GAME_HEIGHT - 108, haloSize: 136, frameSize: 118 },
  speaker: { x: 330, y: GAME_HEIGHT - 194, fontSize: 24 },
  hint: { x: 1050, y: GAME_HEIGHT - 194, fontSize: 14 },
  body: { x: 330, y: GAME_HEIGHT - 158, width: 620, fontSize: 23 },
  action: { x: 985, y: GAME_HEIGHT - 62, width: 180, height: 52 },
  indicatorX: 1047,
} as const;

const EXPANDED_LAYOUT = {
  panel: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 164, width: 1120, height: 286 },
  ribbon: { x: 420, y: GAME_HEIGHT - 286, width: 360, height: 52 },
  portrait: { x: 162, y: GAME_HEIGHT - 170, haloSize: 166, frameSize: 144 },
  speaker: { x: 265, y: GAME_HEIGHT - 286, fontSize: 27 },
  hint: { x: GAME_WIDTH - 106, y: GAME_HEIGHT - 286, fontSize: 15 },
  body: { x: 265, y: GAME_HEIGHT - 235, width: 760, fontSize: 24 },
  action: { x: GAME_WIDTH - 200, y: GAME_HEIGHT - 70, width: 210, height: 58 },
  indicatorX: GAME_WIDTH - 126,
} as const;

function resolveCoreNpcId(speakerId: string): CoreNpcId | null {
  const separatorIndex = speakerId.lastIndexOf(':');
  const candidate = separatorIndex >= 0 ? speakerId.slice(separatorIndex + 1) : speakerId;
  return CORE_NPC_IDS.has(candidate as CoreNpcId) ? (candidate as CoreNpcId) : null;
}

export class DialogueCard {
  private readonly dimmer: Phaser.GameObjects.Rectangle;
  private readonly panelShadow: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly speakerRibbon: Phaser.GameObjects.Rectangle;
  private readonly portraitHalo: Phaser.GameObjects.Arc;
  private readonly portrait: Phaser.GameObjects.Arc;
  private readonly portraitLetter: Phaser.GameObjects.Text;
  private readonly speakerName: Phaser.GameObjects.Text;
  private readonly modeHint: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly continueShadow: Phaser.GameObjects.Rectangle;
  private readonly continueButton: Phaser.GameObjects.Rectangle;
  private readonly continueLabel: Phaser.GameObjects.Text;
  private readonly advanceIndicator: Phaser.GameObjects.Text;
  private readonly unsubscribeAccessibility: () => void;
  private portraitSprite: Phaser.GameObjects.Sprite | null = null;
  private portraitSpeakerId: string | null = null;
  private requestedPortraitSpeakerId: string | null = null;
  private portraitRequestId = 0;
  private bodyTween: Phaser.Tweens.Tween | null = null;
  private advanceTween: Phaser.Tweens.Tween | null = null;
  private choiceObjects: Phaser.GameObjects.GameObject[] = [];
  private layout: DialogueLayout = 'expanded';
  private advanceBaseX = EXPANDED_LAYOUT.indicatorX;

  public constructor(
    scene: Phaser.Scene,
    pointerInput: PointerTouchInputAdapter,
    onAdvance?: () => void,
  ) {
    this.dimmer = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x241c33, 0)
      .setScrollFactor(0)
      .setDepth(125);

    this.panelShadow = createUiShadow(
      scene,
      EXPANDED_LAYOUT.panel.x,
      EXPANDED_LAYOUT.panel.y,
      EXPANDED_LAYOUT.panel.width,
      EXPANDED_LAYOUT.panel.height,
      125,
      0.28,
    );
    this.panel = scene.add
      .rectangle(
        EXPANDED_LAYOUT.panel.x,
        EXPANDED_LAYOUT.panel.y,
        EXPANDED_LAYOUT.panel.width,
        EXPANDED_LAYOUT.panel.height,
        UI_COLOURS.cream,
        0.99,
      )
      .setName('dialogue-production-panel')
      .setStrokeStyle(7, UI_COLOURS.ribbonStrong, 1)
      .setScrollFactor(0)
      .setDepth(126);

    this.speakerRibbon = scene.add
      .rectangle(
        EXPANDED_LAYOUT.ribbon.x,
        EXPANDED_LAYOUT.ribbon.y,
        EXPANDED_LAYOUT.ribbon.width,
        EXPANDED_LAYOUT.ribbon.height,
        UI_COLOURS.ribbon,
        1,
      )
      .setName('dialogue-production-speaker-ribbon')
      .setStrokeStyle(3, UI_COLOURS.ribbonStrong, 1)
      .setScrollFactor(0)
      .setDepth(127);

    this.portraitHalo = scene.add
      .circle(
        EXPANDED_LAYOUT.portrait.x,
        EXPANDED_LAYOUT.portrait.y,
        EXPANDED_LAYOUT.portrait.haloSize / 2,
        UI_COLOURS.gold,
        0.42,
      )
      .setStrokeStyle(3, UI_COLOURS.goldStrong, 0.72)
      .setScrollFactor(0)
      .setDepth(127);
    this.portrait = scene.add
      .circle(
        EXPANDED_LAYOUT.portrait.x,
        EXPANDED_LAYOUT.portrait.y,
        EXPANDED_LAYOUT.portrait.frameSize / 2,
        UI_COLOURS.blush,
        1,
      )
      .setName('dialogue-production-portrait-frame')
      .setStrokeStyle(6, UI_COLOURS.white, 0.96)
      .setScrollFactor(0)
      .setDepth(128);

    this.portraitLetter = scene.add
      .text(EXPANDED_LAYOUT.portrait.x, EXPANDED_LAYOUT.portrait.y, '?', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '54px',
        fontStyle: 'bold',
      })
      .setName('dialogue-production-portrait-fallback')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(129);

    this.speakerName = scene.add
      .text(EXPANDED_LAYOUT.speaker.x, EXPANDED_LAYOUT.speaker.y, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: `${EXPANDED_LAYOUT.speaker.fontSize}px`,
        fontStyle: 'bold',
      })
      .setName('dialogue-production-speaker-name')
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(129);

    this.modeHint = scene.add
      .text(EXPANDED_LAYOUT.hint.x, EXPANDED_LAYOUT.hint.y, '', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: `${EXPANDED_LAYOUT.hint.fontSize}px`,
        fontStyle: 'bold',
      })
      .setName('dialogue-production-mode-hint')
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(129);

    this.body = scene.add
      .text(EXPANDED_LAYOUT.body.x, EXPANDED_LAYOUT.body.y, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: `${EXPANDED_LAYOUT.body.fontSize}px`,
        wordWrap: { width: EXPANDED_LAYOUT.body.width },
        lineSpacing: 7,
      })
      .setName('dialogue-production-body')
      .setScrollFactor(0)
      .setDepth(128);

    this.continueShadow = createUiShadow(
      scene,
      EXPANDED_LAYOUT.action.x,
      EXPANDED_LAYOUT.action.y,
      EXPANDED_LAYOUT.action.width,
      EXPANDED_LAYOUT.action.height,
      128,
      0.16,
    );
    this.continueButton = scene.add
      .rectangle(
        EXPANDED_LAYOUT.action.x,
        EXPANDED_LAYOUT.action.y,
        EXPANDED_LAYOUT.action.width,
        EXPANDED_LAYOUT.action.height,
        UI_COLOURS.lavender,
        1,
      )
      .setName('dialogue-production-continue')
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 1)
      .setScrollFactor(0)
      .setDepth(129)
      .setInteractive({ useHandCursor: true });

    this.continueLabel = scene.add
      .text(EXPANDED_LAYOUT.action.x - 16, EXPANDED_LAYOUT.action.y, 'Continue', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setName('dialogue-production-continue-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(130);

    this.advanceIndicator = scene.add
      .text(EXPANDED_LAYOUT.indicatorX, EXPANDED_LAYOUT.action.y, '›', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setName('dialogue-production-advance-indicator')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(130);

    applyButtonHover(this.continueButton, UI_COLOURS.lavender, UI_COLOURS.gold);

    this.continueButton.on('pointerdown', () => pointerInput.setButton('INTERACT', true));
    this.continueButton.on('pointerup', () => {
      pointerInput.setButton('INTERACT', false);
      onAdvance?.();
    });
    this.continueButton.on('pointerout', () => pointerInput.setButton('INTERACT', false));

    this.unsubscribeAccessibility = getBrowserAccessibilitySettingsStore().subscribe(
      ({ reducedMotion }) => {
        if (!reducedMotion) {
          return;
        }
        this.stopAdvanceMotion();
        this.bodyTween?.stop();
        this.bodyTween = null;
        this.body.setAlpha(1);
      },
    );

    this.hide();
  }

  public show(
    node: DialogueNode,
    speakerName: string,
    onChoice: (choice: DialogueChoice) => void,
  ): void {
    this.clearChoices();
    this.setBaseVisible(true);
    this.speakerName.setText(speakerName);
    getVerticalSliceAudio().playNpcReaction(node.speakerId, 'talk');

    if (node.type === 'line') {
      this.applyLayout(node.text.length <= COMPACT_LINE_CHARACTER_LIMIT ? 'compact' : 'expanded');
      this.updatePortrait(node.speakerId, speakerName);
      this.body.setText(node.text);
      const finalLine = node.nextNodeId === undefined;
      this.modeHint.setText(finalLine ? 'Enter / tap when done' : 'Enter / tap to continue');
      this.continueLabel.setText(finalLine ? 'Done' : 'Continue');
      this.continueShadow.setVisible(true);
      this.continueButton.setVisible(true);
      this.continueLabel.setVisible(true);
      this.advanceIndicator.setVisible(true);
      this.animateBodyChange();
      this.startAdvanceMotion();
      return;
    }

    this.applyLayout('expanded');
    this.updatePortrait(node.speakerId, speakerName);
    this.stopAdvanceMotion();
    this.body.setText(node.prompt);
    this.modeHint.setText('Choose an answer • Enter selects the first choice');
    this.continueShadow.setVisible(false);
    this.continueButton.setVisible(false);
    this.continueLabel.setVisible(false);
    this.advanceIndicator.setVisible(false);
    this.animateBodyChange();
    this.createChoices(node.choices, onChoice);
  }

  public hide(): void {
    this.portraitRequestId += 1;
    this.requestedPortraitSpeakerId = null;
    this.stopAdvanceMotion();
    this.bodyTween?.stop();
    this.bodyTween = null;
    this.clearChoices();
    this.setBaseVisible(false);
  }

  public destroy(): void {
    this.unsubscribeAccessibility();
    this.portraitRequestId += 1;
    this.requestedPortraitSpeakerId = null;
    this.stopAdvanceMotion();
    this.bodyTween?.stop();
    this.bodyTween = null;
    this.clearChoices();
    this.portraitSprite?.destroy();
    this.portraitSprite = null;
    this.dimmer.destroy();
    this.panelShadow.destroy();
    this.panel.destroy();
    this.speakerRibbon.destroy();
    this.portraitHalo.destroy();
    this.portrait.destroy();
    this.portraitLetter.destroy();
    this.speakerName.destroy();
    this.modeHint.destroy();
    this.body.destroy();
    this.continueShadow.destroy();
    this.continueButton.destroy();
    this.continueLabel.destroy();
    this.advanceIndicator.destroy();
  }

  private applyLayout(layout: DialogueLayout): void {
    this.layout = layout;
    const spec = layout === 'compact' ? COMPACT_LAYOUT : EXPANDED_LAYOUT;
    this.advanceBaseX = spec.indicatorX;

    this.panelShadow
      .setPosition(spec.panel.x, spec.panel.y)
      .setDisplaySize(spec.panel.width, spec.panel.height);
    this.panel
      .setPosition(spec.panel.x, spec.panel.y)
      .setDisplaySize(spec.panel.width, spec.panel.height);
    this.speakerRibbon
      .setPosition(spec.ribbon.x, spec.ribbon.y)
      .setDisplaySize(spec.ribbon.width, spec.ribbon.height);

    this.portraitHalo
      .setPosition(spec.portrait.x, spec.portrait.y)
      .setDisplaySize(spec.portrait.haloSize, spec.portrait.haloSize);
    this.portrait
      .setPosition(spec.portrait.x, spec.portrait.y)
      .setDisplaySize(spec.portrait.frameSize, spec.portrait.frameSize);
    this.portraitLetter
      .setPosition(spec.portrait.x, spec.portrait.y)
      .setFontSize(layout === 'compact' ? 44 : 54);

    this.speakerName.setPosition(spec.speaker.x, spec.speaker.y).setFontSize(spec.speaker.fontSize);
    this.modeHint.setPosition(spec.hint.x, spec.hint.y).setFontSize(spec.hint.fontSize);
    this.body
      .setPosition(spec.body.x, spec.body.y)
      .setFontSize(spec.body.fontSize)
      .setWordWrapWidth(spec.body.width, true);

    this.continueShadow
      .setPosition(spec.action.x, spec.action.y)
      .setDisplaySize(spec.action.width, spec.action.height);
    this.continueButton
      .setPosition(spec.action.x, spec.action.y)
      .setDisplaySize(spec.action.width, spec.action.height);
    this.continueLabel.setPosition(spec.action.x - 16, spec.action.y);
    this.advanceIndicator.setPosition(spec.indicatorX, spec.action.y);
    this.layoutPortraitSprite();
  }

  private updatePortrait(speakerId: string, speakerName: string): void {
    const coreNpcId = resolveCoreNpcId(speakerId);
    this.requestedPortraitSpeakerId = speakerId;
    const requestId = ++this.portraitRequestId;

    if (!coreNpcId) {
      this.portraitSpeakerId = null;
      this.requestedPortraitSpeakerId = null;
      this.showFallbackPortrait(speakerName);
      return;
    }

    if (this.portraitSpeakerId === speakerId && this.portraitSprite?.active) {
      this.portraitLetter.setVisible(false);
      this.layoutPortraitSprite(coreNpcId);
      this.portraitSprite.setVisible(true);
      return;
    }

    this.portraitSpeakerId = null;
    this.showFallbackPortrait(speakerName);

    void import('../visual/CoreNpcProductionArt')
      .then(({ CORE_NPC_VISUALS, createCoreNpcSprite }) => {
        if (
          requestId !== this.portraitRequestId ||
          this.requestedPortraitSpeakerId !== speakerId ||
          !this.panel.active ||
          !this.panel.visible
        ) {
          return;
        }

        const spec = CORE_NPC_VISUALS[coreNpcId];
        this.portraitHalo.setFillStyle(spec.accent, 0.24).setStrokeStyle(3, spec.outline, 0.66);
        this.portrait.setFillStyle(spec.frame, 1).setStrokeStyle(6, UI_COLOURS.white, 0.96);
        this.portraitLetter.setVisible(false);
        this.portraitSprite?.destroy();
        this.portraitSprite = createCoreNpcSprite(this.panel.scene, coreNpcId, 0, 0, 'portrait')
          .setName(`dialogue-production-portrait-${coreNpcId}`)
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(129);
        this.portraitSpeakerId = speakerId;
        this.layoutPortraitSprite(coreNpcId);
      })
      .catch(() => {
        // The readable fallback portrait remains in place if optional production art cannot load.
      });
  }

  private layoutPortraitSprite(coreNpcId?: CoreNpcId): void {
    if (!this.portraitSprite) {
      return;
    }
    const layoutSpec = this.layout === 'compact' ? COMPACT_LAYOUT : EXPANDED_LAYOUT;
    const resolvedId = coreNpcId ?? resolveCoreNpcId(this.portraitSpeakerId ?? '');
    const isPip = resolvedId === 'pip';
    const compact = this.layout === 'compact';
    this.portraitSprite
      .setPosition(layoutSpec.portrait.x, layoutSpec.portrait.y)
      .setDisplaySize(
        compact ? (isPip ? 100 : 112) : isPip ? 132 : 150,
        compact ? (isPip ? 80 : 90) : isPip ? 106 : 120,
      );
  }

  private showFallbackPortrait(speakerName: string): void {
    this.portraitSprite?.destroy();
    this.portraitSprite = null;
    this.portraitHalo
      .setFillStyle(UI_COLOURS.gold, 0.42)
      .setStrokeStyle(3, UI_COLOURS.goldStrong, 0.72);
    this.portrait.setFillStyle(UI_COLOURS.blush, 1).setStrokeStyle(6, UI_COLOURS.white, 0.96);
    this.portraitLetter.setText(speakerName.trim().charAt(0).toUpperCase() || '?').setVisible(true);
  }

  private animateBodyChange(): void {
    this.bodyTween?.stop();
    this.bodyTween = null;
    this.body.setAlpha(1);
    if (isReducedMotionEnabled()) {
      return;
    }

    this.body.setAlpha(0.58);
    this.bodyTween = this.panel.scene.tweens.add({
      targets: this.body,
      alpha: 1,
      duration: 135,
      ease: 'Quad.Out',
    });
  }

  private startAdvanceMotion(): void {
    this.stopAdvanceMotion();
    this.advanceIndicator.setX(this.advanceBaseX).setAlpha(1);
    if (isReducedMotionEnabled()) {
      return;
    }

    this.advanceTween = this.panel.scene.tweens.add({
      targets: this.advanceIndicator,
      x: this.advanceBaseX + 7,
      alpha: 0.68,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private stopAdvanceMotion(): void {
    this.advanceTween?.stop();
    this.advanceTween = null;
    this.advanceIndicator.setX(this.advanceBaseX).setAlpha(1);
  }

  private createChoices(
    choices: readonly DialogueChoice[],
    onChoice: (choice: DialogueChoice) => void,
  ): void {
    const scene = this.panel.scene;
    const totalWidth = 760;
    const buttonWidth = Math.min(
      330,
      (totalWidth - Math.max(0, choices.length - 1) * 22) / choices.length,
    );
    const startX = 265 + buttonWidth / 2;

    choices.forEach((choice, index) => {
      const x = startX + index * (buttonWidth + 22);
      const shadow = createUiShadow(scene, x, GAME_HEIGHT - 82, buttonWidth, 64, 128, 0.14);
      const button = scene.add
        .rectangle(x, GAME_HEIGHT - 82, buttonWidth, 64, UI_COLOURS.lavender, 1)
        .setName(`dialogue-production-choice-${index + 1}`)
        .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 1)
        .setScrollFactor(0)
        .setDepth(129)
        .setInteractive({ useHandCursor: true });
      const label = scene.add
        .text(x, GAME_HEIGHT - 82, choice.label, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: buttonWidth - 24 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(130);

      applyButtonHover(button, UI_COLOURS.lavender, UI_COLOURS.gold);
      button.on('pointerdown', () => onChoice(choice));
      this.choiceObjects.push(shadow, button, label);
    });
  }

  private clearChoices(): void {
    for (const object of this.choiceObjects) {
      object.destroy();
    }
    this.choiceObjects = [];
  }

  private setBaseVisible(visible: boolean): void {
    this.dimmer.setVisible(visible);
    this.panelShadow.setVisible(visible);
    this.panel.setVisible(visible);
    this.speakerRibbon.setVisible(visible);
    this.portraitHalo.setVisible(visible);
    this.portrait.setVisible(visible);
    this.portraitLetter.setVisible(visible);
    this.portraitSprite?.setVisible(visible);
    this.speakerName.setVisible(visible);
    this.modeHint.setVisible(visible);
    this.body.setVisible(visible);
    this.continueShadow.setVisible(visible);
    this.continueButton.setVisible(visible);
    this.continueLabel.setVisible(visible);
    this.advanceIndicator.setVisible(visible);
  }
}
