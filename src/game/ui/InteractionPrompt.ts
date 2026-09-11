import type Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore } from '../accessibility/AccessibilitySettings';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldUsePortraitTouchControls } from '../input/TouchMovementPad';
import type { InteractionActionKind, InteractionTarget } from '../interaction/InteractionTarget';
import { getInteractionTargetPosition } from '../interaction/InteractionTargeting';
import {
  CONCEPT_UI,
  createFixedGraphics,
  drawConceptIcon,
  drawPanelShadow,
  drawRoundedPanel,
  type ConceptIcon,
} from './ConceptUi';
import { ExplorationShell } from './ExplorationShell';
import { UI_FONT } from './uiTheme';

interface PrimaryActionPresentation {
  label: string;
  icon: ConceptIcon;
}

const ACTION_PRESENTATION: Record<InteractionActionKind, PrimaryActionPresentation> = {
  talk: { label: 'Talk', icon: 'talk' },
  enter: { label: 'Enter', icon: 'enter' },
  start: { label: 'Start', icon: 'start' },
  inspect: { label: 'Inspect', icon: 'inspect' },
  buy: { label: 'Buy', icon: 'buy' },
  use: { label: 'Use', icon: 'use' },
  interact: { label: 'Interact', icon: 'interact' },
};

function isAutomaticInteraction(target: InteractionTarget): boolean {
  return target.activationMode === 'automatic';
}

function getPrimaryActionPresentation(target: InteractionTarget): PrimaryActionPresentation {
  return ACTION_PRESENTATION[target.actionKind ?? 'interact'];
}

function formatInteractionLabel(target: InteractionTarget): string {
  const action = getPrimaryActionPresentation(target).label;
  return target.actionKind === 'talk'
    ? `${action} to ${target.label}`
    : `${action}: ${target.label}`;
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

/** One semantic contextual action presentation for every exploration layout. */
export class InteractionPrompt {
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly panelShadow: Phaser.GameObjects.Arc;
  private readonly panel: Phaser.GameObjects.Arc;
  private readonly label: Phaser.GameObjects.Text;
  private readonly actionHalo: Phaser.GameObjects.Arc;
  private readonly actionIcon: Phaser.GameObjects.Graphics;
  private readonly hintPanel: Phaser.GameObjects.Rectangle;
  private readonly hintSurface: Phaser.GameObjects.Graphics;
  private readonly hintIcon: Phaser.GameObjects.Graphics;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly directTargetZone: Phaser.GameObjects.Zone;
  private readonly shell: ExplorationShell;
  private readonly unsubscribeAccessibility: () => void;
  private domRoot: HTMLElement | null = null;
  private domButton: HTMLButtonElement | null = null;
  private domHint: HTMLElement | null = null;
  private currentTarget: InteractionTarget | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly pointerInput: PointerTouchInputAdapter,
    private readonly onDirectTarget?: (targetId: string) => void,
  ) {
    const promptX = 1040;
    const promptY = 578;
    this.panelShadow = scene.add
      .circle(promptX + 7, promptY + 9, 88, CONCEPT_UI.shadow, 0.25)
      .setScrollFactor(0)
      .setDepth(118);
    this.actionHalo = scene.add
      .circle(promptX, promptY, 88, CONCEPT_UI.creamHighlight, 0.92)
      .setStrokeStyle(4, CONCEPT_UI.purpleStrong, 0.74)
      .setScrollFactor(0)
      .setDepth(119);
    this.panel = scene.add
      .circle(promptX, promptY, 82, CONCEPT_UI.purple, 1)
      .setName('exploration-interaction-prompt')
      .setStrokeStyle(6, CONCEPT_UI.purpleStrong, 1)
      .setScrollFactor(0)
      .setDepth(120);
    this.actionIcon = createFixedGraphics(scene, 'exploration-interaction-icon', 122);
    this.label = scene.add
      .text(promptX, promptY + 31, '', {
        color: '#fffaf1',
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 136 },
      })
      .setName('exploration-interaction-prompt-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(123);

    const hintX = GAME_WIDTH / 2;
    const hintY = GAME_HEIGHT - 35;
    const hintWidth = 420;
    const hintHeight = 50;
    this.hintSurface = createFixedGraphics(scene, 'exploration-tablet-hint-surface', 118);
    drawPanelShadow(this.hintSurface, hintX, hintY, hintWidth, hintHeight, 24, 5, 6, 0.17);
    drawRoundedPanel(
      this.hintSurface,
      hintX,
      hintY,
      hintWidth,
      hintHeight,
      24,
      CONCEPT_UI.cream,
      CONCEPT_UI.lavenderLine,
      4,
    );
    this.hintPanel = scene.add
      .rectangle(hintX, hintY, hintWidth, hintHeight, CONCEPT_UI.white, 0.001)
      .setName('exploration-tablet-hint-panel')
      .setScrollFactor(0)
      .setDepth(119);
    this.hintIcon = createFixedGraphics(scene, 'exploration-tablet-hint-icon', 121);
    drawConceptIcon(
      this.hintIcon,
      'hint',
      hintX - hintWidth / 2 + 31,
      hintY,
      0.72,
      CONCEPT_UI.goldStrong,
    );
    this.hintText = scene.add
      .text(hintX + 10, hintY, '', {
        color: '#60436e',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 340 },
      })
      .setName('exploration-tablet-hint')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    this.directTargetZone = scene.add
      .zone(0, 0, 126, 126)
      .setName('exploration-direct-interaction-target')
      .setDepth(116);
    this.bindDirectTargetZone();

    this.shell = ExplorationShell.ensure(scene, pointerInput);
    this.panel.on('pointerdown', this.pressCurrentTarget);
    this.panel.on('pointerup', this.releaseInteraction);
    this.panel.on('pointerout', this.releaseInteraction);
    this.panel.on('pointerupoutside', this.releaseInteraction);

    if (typeof globalThis.document !== 'undefined') {
      this.createResponsiveDomPrompt();
    }

    scene.events.on('pause', this.releaseInteraction, this);
    globalThis.addEventListener?.('blur', this.releaseInteraction);
    globalThis.addEventListener?.('resize', this.handleViewportChange);
    globalThis.addEventListener?.('orientationchange', this.handleViewportChange);
    globalThis.document?.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.unsubscribeAccessibility = this.accessibility.subscribe(() => this.refreshPresentation());
    this.setTarget(null);
  }

  public setTarget(target: InteractionTarget | null): void {
    this.currentTarget = target;
    const visible = target !== null && !isAutomaticInteraction(target);
    if (target && visible) {
      const fullActionLabel = formatInteractionLabel(target);
      const primaryAction = getPrimaryActionPresentation(target);
      this.label.setText(primaryAction.label);
      drawConceptIcon(this.actionIcon, primaryAction.icon, 1040, 548, 1.05, CONCEPT_UI.white);
      this.hintText.setText(target.label);
      this.domButton?.setAttribute('aria-label', fullActionLabel);
      if (this.domButton) {
        this.domButton.textContent = fullActionLabel;
      }
      if (this.domHint) {
        this.domHint.textContent = target.label;
      }
      const position = getInteractionTargetPosition(target);
      this.directTargetZone.setPosition(position.x, position.y);
    } else {
      this.hintText.setText('');
      if (this.domHint) {
        this.domHint.textContent = '';
      }
    }
    this.refreshPresentation();
    this.shell.refresh();
  }

  public destroy(): void {
    this.unsubscribeAccessibility();
    this.scene.events.off('pause', this.releaseInteraction, this);
    globalThis.removeEventListener?.('blur', this.releaseInteraction);
    globalThis.removeEventListener?.('resize', this.handleViewportChange);
    globalThis.removeEventListener?.('orientationchange', this.handleViewportChange);
    globalThis.document?.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.releaseInteraction();
    this.domRoot?.remove();
    this.domRoot = null;
    this.domButton = null;
    this.domHint = null;
    this.directTargetZone.destroy();
    this.actionHalo.destroy();
    this.actionIcon.destroy();
    this.hintPanel.destroy();
    this.hintSurface.destroy();
    this.hintIcon.destroy();
    this.hintText.destroy();
    this.panelShadow.destroy();
    this.panel.destroy();
    this.label.destroy();
  }

  private readonly pressCurrentTarget = (): void => {
    if (this.currentTarget) {
      this.onDirectTarget?.(this.currentTarget.id);
    }
    this.pointerInput.setButton('INTERACT', true);
  };

  private readonly releaseInteraction = (): void => {
    this.pointerInput.setButton('INTERACT', false);
  };

  private readonly handleViewportChange = (): void => {
    this.releaseInteraction();
    this.refreshPresentation();
  };

  private readonly handleVisibilityChange = (): void => {
    if (globalThis.document?.hidden) {
      this.releaseInteraction();
    }
  };

  private bindDirectTargetZone(): void {
    this.directTargetZone.on('pointerdown', this.pressCurrentTarget);
    this.directTargetZone.on('pointerup', this.releaseInteraction);
    this.directTargetZone.on('pointerout', this.releaseInteraction);
    this.directTargetZone.on('pointerupoutside', this.releaseInteraction);
    this.directTargetZone.disableInteractive();
  }

  private createResponsiveDomPrompt(): void {
    const root = globalThis.document.createElement('div');
    root.className = 'mobile-interaction-prompt';
    root.dataset.mobileInteractionPrompt = 'true';
    root.hidden = true;

    const hint = globalThis.document.createElement('p');
    hint.className = 'mobile-interaction-hint';
    hint.textContent = '';

    const button = globalThis.document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-interaction-button';
    button.textContent = 'Interact';

    const press = (event: PointerEvent): void => {
      event.preventDefault();
      button.classList.add('is-active');
      this.pressCurrentTarget();
    };
    const release = (event: PointerEvent): void => {
      event.preventDefault();
      button.classList.remove('is-active');
      this.releaseInteraction();
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
    const portrait = shouldRenderPortraitDomPrompt();
    const targetVisible =
      this.currentTarget !== null && !isAutomaticInteraction(this.currentTarget);
    const canvasActionVisible = targetVisible && !portrait;
    const canvasHintVisible = targetVisible && !portrait;
    const highVisibility = this.accessibility.load().highVisibilityInteractions;

    this.panelShadow.setVisible(canvasActionVisible);
    this.actionHalo.setVisible(canvasActionVisible);
    this.panel.setVisible(canvasActionVisible);
    this.label.setVisible(canvasActionVisible);
    this.actionIcon.setVisible(canvasActionVisible);
    this.hintPanel.setVisible(canvasHintVisible);
    this.hintSurface.setVisible(canvasHintVisible);
    this.hintIcon.setVisible(canvasHintVisible);
    this.hintText.setVisible(canvasHintVisible);

    if (canvasActionVisible) {
      if (this.panel.input?.enabled !== true) {
        this.panel.setInteractive({ useHandCursor: true });
      }
    } else {
      this.panel.disableInteractive();
      this.releaseInteraction();
    }

    if (this.currentTarget && canvasActionVisible) {
      const position = getInteractionTargetPosition(this.currentTarget);
      this.directTargetZone.setPosition(position.x, position.y);
      if (this.directTargetZone.input?.enabled !== true) {
        this.directTargetZone.setInteractive({ useHandCursor: true });
      }
    } else {
      this.directTargetZone.disableInteractive();
    }

    if (this.domRoot) {
      this.domRoot.hidden = !(targetVisible && portrait);
      this.domRoot.classList.toggle('is-high-visibility', highVisibility);
    }

    this.panel.setFillStyle(highVisibility ? 0xffef9f : CONCEPT_UI.purple, 1);
    this.panel.setStrokeStyle(
      highVisibility ? 8 : 6,
      highVisibility ? 0x513161 : CONCEPT_UI.purpleStrong,
      1,
    );
    this.label.setColor(highVisibility ? '#321d3b' : '#fffaf1');
    this.label.setFontSize(highVisibility ? 24 : 22);

    if (this.currentTarget && targetVisible) {
      const primaryAction = getPrimaryActionPresentation(this.currentTarget);
      this.label.setText(primaryAction.label);
      const actionLabel = formatInteractionLabel(this.currentTarget);
      if (this.domButton) {
        this.domButton.textContent = `${highVisibility ? '★ ' : ''}${actionLabel}${highVisibility ? ' ★' : ''}`;
      }
    }
  }
}
