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

const CORE_NPC_IDS = new Set<CoreNpcId>(['nova', 'willow', 'pip', 'pebble', 'lumi', 'marigold']);

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

  public constructor(scene: Phaser.Scene, pointerInput: PointerTouchInputAdapter) {
    this.dimmer = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x241c33, 0.34)
      .setScrollFactor(0)
      .setDepth(125);

    this.panelShadow = createUiShadow(
      scene,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 164,
      1120,
      286,
      125,
      0.28,
    );
    this.panel = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 164, 1120, 286, UI_COLOURS.cream, 0.99)
      .setName('dialogue-production-panel')
      .setStrokeStyle(7, UI_COLOURS.ribbonStrong, 1)
      .setScrollFactor(0)
      .setDepth(126);

    this.speakerRibbon = scene.add
      .rectangle(420, GAME_HEIGHT - 286, 360, 52, UI_COLOURS.ribbon, 1)
      .setName('dialogue-production-speaker-ribbon')
      .setStrokeStyle(3, UI_COLOURS.ribbonStrong, 1)
      .setScrollFactor(0)
      .setDepth(127);

    this.portraitHalo = scene.add
      .circle(162, GAME_HEIGHT - 170, 83, UI_COLOURS.gold, 0.42)
      .setStrokeStyle(3, UI_COLOURS.goldStrong, 0.72)
      .setScrollFactor(0)
      .setDepth(127);
    this.portrait = scene.add
      .circle(162, GAME_HEIGHT - 170, 72, UI_COLOURS.blush, 1)
      .setName('dialogue-production-portrait-frame')
      .setStrokeStyle(6, UI_COLOURS.white, 0.96)
      .setScrollFactor(0)
      .setDepth(128);

    this.portraitLetter = scene.add
      .text(162, GAME_HEIGHT - 170, '?', {
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
      .text(265, GAME_HEIGHT - 286, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(129);

    this.modeHint = scene.add
      .text(GAME_WIDTH - 106, GAME_HEIGHT - 286, '', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setName('dialogue-production-mode-hint')
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(129);

    this.body = scene.add
      .text(265, GAME_HEIGHT - 235, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '24px',
        wordWrap: { width: 760 },
        lineSpacing: 7,
      })
      .setName('dialogue-production-body')
      .setScrollFactor(0)
      .setDepth(128);

    this.continueShadow = createUiShadow(
      scene,
      GAME_WIDTH - 200,
      GAME_HEIGHT - 70,
      210,
      58,
      128,
      0.16,
    );
    this.continueButton = scene.add
      .rectangle(GAME_WIDTH - 200, GAME_HEIGHT - 70, 210, 58, UI_COLOURS.lavender, 1)
      .setName('dialogue-production-continue')
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 1)
      .setScrollFactor(0)
      .setDepth(129)
      .setInteractive({ useHandCursor: true });

    this.continueLabel = scene.add
      .text(GAME_WIDTH - 216, GAME_HEIGHT - 70, 'Continue', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(130);

    this.advanceIndicator = scene.add
      .text(GAME_WIDTH - 126, GAME_HEIGHT - 70, '›', {
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
    this.continueButton.on('pointerup', () => pointerInput.setButton('INTERACT', false));
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
    this.updatePortrait(node.speakerId, speakerName);
    getVerticalSliceAudio().playNpcReaction(node.speakerId, 'talk');

    if (node.type === 'line') {
      this.body.setText(node.text);
      this.modeHint.setText('Enter / tap to continue');
      this.continueShadow.setVisible(true);
      this.continueButton.setVisible(true);
      this.continueLabel.setVisible(true);
      this.advanceIndicator.setVisible(true);
      this.animateBodyChange();
      this.startAdvanceMotion();
      return;
    }

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
        const isPip = coreNpcId === 'pip';
        this.portraitSprite = createCoreNpcSprite(
          this.panel.scene,
          coreNpcId,
          162,
          GAME_HEIGHT - 170,
          'portrait',
        )
          .setName(`dialogue-production-portrait-${coreNpcId}`)
          .setOrigin(0.5)
          .setDisplaySize(isPip ? 132 : 150, isPip ? 106 : 120)
          .setScrollFactor(0)
          .setDepth(129);
        this.portraitSpeakerId = speakerId;
      })
      .catch(() => {
        // The readable fallback portrait remains in place if optional production art cannot load.
      });
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
    this.advanceIndicator.setX(GAME_WIDTH - 126).setAlpha(1);
    if (isReducedMotionEnabled()) {
      return;
    }

    this.advanceTween = this.panel.scene.tweens.add({
      targets: this.advanceIndicator,
      x: GAME_WIDTH - 119,
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
    this.advanceIndicator.setX(GAME_WIDTH - 126).setAlpha(1);
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
