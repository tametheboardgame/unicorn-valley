import type Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore } from '../accessibility/AccessibilitySettings';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { ExplorationShell } from './ExplorationShell';
import { UI_COLOURS, UI_FONT, createUiShadow } from './uiTheme';

function isAutomaticInteraction(target: InteractionTarget): boolean {
  return target.id.includes('-gate') || target.id === 'interaction:meadow-race-entrance';
}

export class InteractionPrompt {
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly panelShadow: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly shell: ExplorationShell;
  private readonly unsubscribeAccessibility: () => void;
  private currentTarget: InteractionTarget | null = null;

  public constructor(scene: Phaser.Scene, pointerInput: PointerTouchInputAdapter) {
    this.panelShadow = createUiShadow(scene, GAME_WIDTH / 2, GAME_HEIGHT - 72, 470, 74, 119, 0.2);
    this.panel = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 72, 470, 74, UI_COLOURS.cream, 0.98)
      .setName('exploration-interaction-prompt')
      .setStrokeStyle(5, UI_COLOURS.lavenderStrong, 0.98)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });

    this.label = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 72, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setName('exploration-interaction-prompt-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

    this.shell = ExplorationShell.ensure(scene, pointerInput);

    this.panel.on('pointerdown', () => pointerInput.setButton('INTERACT', true));
    this.panel.on('pointerup', () => pointerInput.setButton('INTERACT', false));
    this.panel.on('pointerout', () => pointerInput.setButton('INTERACT', false));
    this.unsubscribeAccessibility = this.accessibility.subscribe(() => this.refreshPresentation());

    this.setTarget(null);
  }

  public setTarget(target: InteractionTarget | null): void {
    this.currentTarget = target;
    const visible = target !== null && !isAutomaticInteraction(target);
    this.panelShadow.setVisible(visible);
    this.panel.setVisible(visible);
    this.label.setVisible(visible);
    this.shell.refresh();

    if (target && visible) {
      this.label.setText(`${target.actionLabel}: ${target.label}   ✨`);
    }
    this.refreshPresentation();
  }

  public destroy(): void {
    this.unsubscribeAccessibility();
    this.panelShadow.destroy();
    this.panel.destroy();
    this.label.destroy();
  }

  private refreshPresentation(): void {
    const highVisibility = this.accessibility.load().highVisibilityInteractions;
    this.panel.setFillStyle(
      highVisibility ? 0xffef9f : UI_COLOURS.cream,
      highVisibility ? 1 : 0.98,
    );
    this.panel.setStrokeStyle(
      highVisibility ? 8 : 5,
      highVisibility ? 0x513161 : UI_COLOURS.lavenderStrong,
      1,
    );
    this.label.setColor(highVisibility ? '#321d3b' : UI_COLOURS.ink);
    this.label.setFontSize(highVisibility ? 24 : 22);

    if (this.currentTarget && this.panel.visible) {
      this.label.setText(
        `${highVisibility ? '★ ' : ''}${this.currentTarget.actionLabel}: ${this.currentTarget.label}${highVisibility ? ' ★' : '   ✨'}`,
      );
    }
  }
}
