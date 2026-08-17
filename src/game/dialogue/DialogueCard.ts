import Phaser from 'phaser';
import type { DialogueChoice, DialogueNode } from '../../content/contentTypes';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

export class DialogueCard {
  private readonly dimmer: Phaser.GameObjects.Rectangle;
  private readonly panelShadow: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly portrait: Phaser.GameObjects.Arc;
  private readonly portraitLetter: Phaser.GameObjects.Text;
  private readonly speakerName: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly continueShadow: Phaser.GameObjects.Rectangle;
  private readonly continueButton: Phaser.GameObjects.Rectangle;
  private readonly continueLabel: Phaser.GameObjects.Text;
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
      .setStrokeStyle(7, UI_COLOURS.lavenderStrong, 1)
      .setScrollFactor(0)
      .setDepth(126);

    this.portrait = scene.add
      .circle(162, GAME_HEIGHT - 170, 72, UI_COLOURS.blush, 1)
      .setStrokeStyle(6, UI_COLOURS.white, 0.96)
      .setScrollFactor(0)
      .setDepth(127);

    this.portraitLetter = scene.add
      .text(162, GAME_HEIGHT - 170, '?', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '54px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(128);

    this.speakerName = scene.add
      .text(265, GAME_HEIGHT - 285, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '29px',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(128);

    this.body = scene.add
      .text(265, GAME_HEIGHT - 235, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '24px',
        wordWrap: { width: 760 },
        lineSpacing: 7,
      })
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
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 1)
      .setScrollFactor(0)
      .setDepth(129)
      .setInteractive({ useHandCursor: true });

    this.continueLabel = scene.add
      .text(GAME_WIDTH - 200, GAME_HEIGHT - 70, 'Continue ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(130);
    applyButtonHover(this.continueButton, UI_COLOURS.lavender, UI_COLOURS.gold);

    this.continueButton.on('pointerdown', () => pointerInput.setButton('INTERACT', true));
    this.continueButton.on('pointerup', () => pointerInput.setButton('INTERACT', false));
    this.continueButton.on('pointerout', () => pointerInput.setButton('INTERACT', false));

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
    this.portraitLetter.setText(speakerName.trim().charAt(0).toUpperCase() || '?');
    getVerticalSliceAudio().playSfx('dialogue');

    if (node.type === 'line') {
      this.body.setText(node.text);
      this.continueShadow.setVisible(true);
      this.continueButton.setVisible(true);
      this.continueLabel.setVisible(true);
      return;
    }

    this.body.setText(node.prompt);
    this.continueShadow.setVisible(false);
    this.continueButton.setVisible(false);
    this.continueLabel.setVisible(false);
    this.createChoices(node.choices, onChoice);
  }

  public hide(): void {
    this.clearChoices();
    this.setBaseVisible(false);
  }

  public destroy(): void {
    this.clearChoices();
    this.dimmer.destroy();
    this.panelShadow.destroy();
    this.panel.destroy();
    this.portrait.destroy();
    this.portraitLetter.destroy();
    this.speakerName.destroy();
    this.body.destroy();
    this.continueShadow.destroy();
    this.continueButton.destroy();
    this.continueLabel.destroy();
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
    this.portrait.setVisible(visible);
    this.portraitLetter.setVisible(visible);
    this.speakerName.setVisible(visible);
    this.body.setVisible(visible);
    this.continueShadow.setVisible(visible);
    this.continueButton.setVisible(visible);
    this.continueLabel.setVisible(visible);
  }
}
