import type Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore } from '../accessibility/AccessibilitySettings';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldUsePortraitTouchControls } from '../input/TouchMovementPad';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { ExplorationShell } from './ExplorationShell';
import { browserUsesLandscapeTabletPresentation } from './LandscapeTabletPresentation';
import { UI_COLOURS, UI_FONT, createUiShadow } from './uiTheme';

type PromptShape = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc;

function isAutomaticInteraction(target: InteractionTarget): boolean {
  return target.id.includes('-gate') || target.id === 'interaction:meadow-race-entrance';
}

function formatInteractionLabel(target: InteractionTarget): string {
  const action = target.actionLabel.trim().replace(/:\s*$/, '');
  const normalisedAction = action.toLowerCase();
  if (normalisedAction === 'talk' || normalisedAction === 'talk to') {
    return `Talk to ${target.label}`;
  }
  if (normalisedAction === 'speak' || normalisedAction === 'speak to') {
    return `Speak to ${target.label}`;
  }
  return `${action}: ${target.label}`;
}

function shouldRenderPortraitDomPrompt(): boolean {
  if (typeof globalThis.document === 'undefined') {
    return false;
  }
  return shouldUsePortraitTouchControls(
    globalThis.innerWidth,
    globalThis.innerHeight,
    globalThis.navigator?.maxTouchPoints ?? 0,
    'ontouchstart' in globalThis,
  );
}

export class InteractionPrompt {
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly tabletMode = browserUsesLandscapeTabletPresentation();
  private readonly panelShadow: PromptShape;
  private readonly panel: PromptShape;
  private readonly label: Phaser.GameObjects.Text;
  private readonly tabletHintPanel: Phaser.GameObjects.Rectangle | null;
  private readonly tabletHintText: Phaser.GameObjects.Text | null;
  private readonly directTargetZone: Phaser.GameObjects.Zone | null;
  private readonly shell: ExplorationShell;
  private readonly unsubscribeAccessibility: () => void;
  private domRoot: HTMLElement | null = null;
  private domButton: HTMLButtonElement | null = null;
  private domHint: HTMLElement | null = null;
  private currentTarget: InteractionTarget | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly pointerInput: PointerTouchInputAdapter,
  ) {
    const promptX = this.tabletMode ? 1120 : GAME_WIDTH / 2;
    const promptY = this.tabletMode ? 578 : GAME_HEIGHT - 74;

    if (this.tabletMode) {
      this.panelShadow = scene.add
        .circle(promptX + 6, promptY + 8, 92, 0x352840, 0.22)
        .setScrollFactor(0)
        .setDepth(119);
      this.panel = scene.add
        .circle(promptX, promptY, 88, UI_COLOURS.lavender, 0.97)
        .setName('exploration-interaction-prompt')
        .setStrokeStyle(6, UI_COLOURS.lavenderStrong, 1)
        .setScrollFactor(0)
        .setDepth(120);
      this.label = scene.add
        .text(promptX, promptY, '', {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '20px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 148 },
        })
        .setName('exploration-interaction-prompt-label')
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(121);

      this.tabletHintPanel = scene.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 28, 500, 42, UI_COLOURS.cream, 0.9)
        .setName('exploration-tablet-hint-panel')
        .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.72)
        .setScrollFactor(0)
        .setDepth(119);
      this.tabletHintText = scene.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '', {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '15px',
          fontStyle: 'bold',
          align: 'center',
        })
        .setName('exploration-tablet-hint')
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(120);
      this.directTargetZone = scene.add
        .zone(0, 0, 126, 126)
        .setName('exploration-direct-interaction-target')
        .setDepth(116);
      this.bindDirectTargetZone();
    } else {
      this.panelShadow = createUiShadow(scene, GAME_WIDTH / 2, GAME_HEIGHT - 74, 500, 82, 119, 0.2);
      this.panel = scene.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 74, 500, 82, UI_COLOURS.cream, 0.98)
        .setName('exploration-interaction-prompt')
        .setStrokeStyle(5, UI_COLOURS.lavenderStrong, 0.98)
        .setScrollFactor(0)
        .setDepth(120);
      this.label = scene.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 74, '', {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '25px',
          fontStyle: 'bold',
          align: 'center',
        })
        .setName('exploration-interaction-prompt-label')
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(121);
      this.tabletHintPanel = null;
      this.tabletHintText = null;
      this.directTargetZone = null;
    }

    this.shell = ExplorationShell.ensure(scene, pointerInput);

    this.panel.on('pointerdown', () => pointerInput.setButton('INTERACT', true));
    this.panel.on('pointerup', () => pointerInput.setButton('INTERACT', false));
    this.panel.on('pointerout', () => pointerInput.setButton('INTERACT', false));
    this.panel.on('pointerupoutside', () => pointerInput.setButton('INTERACT', false));

    if (shouldRenderPortraitDomPrompt()) {
      this.createPortraitDomPrompt(pointerInput);
    }

    scene.events.on('pause', this.releaseInteraction, this);
    globalThis.addEventListener?.('blur', this.releaseInteraction);
    globalThis.document?.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.unsubscribeAccessibility = this.accessibility.subscribe(() => this.refreshPresentation());
    this.setTarget(null);
  }

  public setTarget(target: InteractionTarget | null): void {
    this.currentTarget = target;
    const visible = target !== null && !isAutomaticInteraction(target);
    this.panelShadow.setVisible(visible);
    this.panel.setVisible(visible);
    this.label.setVisible(visible);
    if (visible) {
      if (this.panel.input?.enabled !== true) {
        this.panel.setInteractive({ useHandCursor: true });
      }
    } else {
      this.panel.disableInteractive();
      this.pointerInput.setButton('INTERACT', false);
    }

    if (this.domRoot) {
      this.domRoot.hidden = !visible;
    }
    this.shell.refresh();

    if (target && visible) {
      const actionLabel = formatInteractionLabel(target);
      this.label.setText(`${actionLabel}   ✨`);
      if (this.domButton) {
        this.domButton.textContent = actionLabel;
        this.domButton.setAttribute('aria-label', actionLabel);
      }
      if (this.domHint) {
        this.domHint.textContent = 'Tap the big action button when it appears.';
      }
      this.tabletHintText?.setText(`Tap ${target.label} or use the big action button`);
      if (this.directTargetZone) {
        this.directTargetZone.setPosition(target.position.x, target.position.y);
        if (this.directTargetZone.input?.enabled !== true) {
          this.directTargetZone.setInteractive({ useHandCursor: true });
        }
      }
    } else {
      this.tabletHintText?.setText('Tap the ground to move  •  Move close to friends and places');
      this.directTargetZone?.disableInteractive();
    }
    this.refreshPresentation();
  }

  public destroy(): void {
    this.unsubscribeAccessibility();
    this.scene.events.off('pause', this.releaseInteraction, this);
    globalThis.removeEventListener?.('blur', this.releaseInteraction);
    globalThis.document?.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.releaseInteraction();
    this.domRoot?.remove();
    this.domRoot = null;
    this.domButton = null;
    this.domHint = null;
    this.directTargetZone?.destroy();
    this.tabletHintPanel?.destroy();
    this.tabletHintText?.destroy();
    this.panelShadow.destroy();
    this.panel.destroy();
    this.label.destroy();
  }

  private readonly releaseInteraction = (): void => {
    this.pointerInput.setButton('INTERACT', false);
  };

  private readonly handleVisibilityChange = (): void => {
    if (globalThis.document?.hidden) {
      this.releaseInteraction();
    }
  };

  private bindDirectTargetZone(): void {
    if (!this.directTargetZone) {
      return;
    }
    this.directTargetZone.on('pointerdown', () => this.pointerInput.setButton('INTERACT', true));
    this.directTargetZone.on('pointerup', this.releaseInteraction);
    this.directTargetZone.on('pointerout', this.releaseInteraction);
    this.directTargetZone.on('pointerupoutside', this.releaseInteraction);
    this.directTargetZone.disableInteractive();
  }

  private createPortraitDomPrompt(pointerInput: PointerTouchInputAdapter): void {
    const root = globalThis.document.createElement('div');
    root.className = 'mobile-interaction-prompt';
    root.dataset.mobileInteractionPrompt = 'true';
    root.hidden = true;

    const hint = globalThis.document.createElement('p');
    hint.className = 'mobile-interaction-hint';
    hint.textContent = 'Move close to something to see what you can do.';

    const button = globalThis.document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-interaction-button';
    button.textContent = 'Interact';

    const press = (event: PointerEvent): void => {
      event.preventDefault();
      button.classList.add('is-active');
      pointerInput.setButton('INTERACT', true);
    };
    const release = (event: PointerEvent): void => {
      event.preventDefault();
      button.classList.remove('is-active');
      pointerInput.setButton('INTERACT', false);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);

    root.append(hint, button);
    (globalThis.document.querySelector('#game-shell') ?? globalThis.document.body).append(root);
    this.domRoot = root;
    this.domButton = button;
    this.domHint = hint;
  }

  private refreshPresentation(): void {
    const highVisibility = this.accessibility.load().highVisibilityInteractions;
    this.panel.setFillStyle(
      highVisibility ? 0xffef9f : this.tabletMode ? UI_COLOURS.lavender : UI_COLOURS.cream,
      highVisibility ? 1 : this.tabletMode ? 0.97 : 0.98,
    );
    this.panel.setStrokeStyle(
      highVisibility ? 8 : this.tabletMode ? 6 : 5,
      highVisibility ? 0x513161 : UI_COLOURS.lavenderStrong,
      1,
    );
    this.label.setColor(highVisibility ? '#321d3b' : UI_COLOURS.ink);
    this.label.setFontSize(
      highVisibility ? (this.tabletMode ? 22 : 27) : this.tabletMode ? 20 : 25,
    );
    this.domRoot?.classList.toggle('is-high-visibility', highVisibility);

    if (this.currentTarget && this.panel.visible) {
      const actionLabel = formatInteractionLabel(this.currentTarget);
      this.label.setText(
        `${highVisibility ? '★ ' : ''}${actionLabel}${highVisibility ? ' ★' : '   ✨'}`,
      );
      if (this.domButton) {
        this.domButton.textContent = `${highVisibility ? '★ ' : ''}${actionLabel}${highVisibility ? ' ★' : ''}`;
      }
    }
  }
}
