import type Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore } from '../accessibility/AccessibilitySettings';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldUsePortraitTouchControls } from '../input/TouchMovementPad';
import type { InteractionTarget } from '../interaction/InteractionTarget';
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

function getPrimaryActionPresentation(target: InteractionTarget): PrimaryActionPresentation {
  const action = target.actionLabel.trim().replace(/:\s*$/, '').toLowerCase();
  if (action.includes('talk') || action.includes('speak')) {
    return { label: 'Talk', icon: 'talk' };
  }
  if (action.includes('enter') || action.includes('go inside') || action.includes('visit')) {
    return { label: 'Enter', icon: 'enter' };
  }
  if (
    action.includes('start') ||
    action.includes('race') ||
    action.includes('play') ||
    action.includes('begin')
  ) {
    return { label: 'Start', icon: 'start' };
  }
  if (
    action.includes('inspect') ||
    action.includes('look') ||
    action.includes('read') ||
    action.includes('check')
  ) {
    return { label: 'Inspect', icon: 'inspect' };
  }
  if (action.includes('buy') || action.includes('shop')) {
    return { label: 'Buy', icon: 'buy' };
  }
  if (action.includes('use') || action.includes('place') || action.includes('choose')) {
    return { label: 'Use', icon: 'use' };
  }
  return { label: 'Interact', icon: 'interact' };
}

function formatConceptHint(target: InteractionTarget, action: PrimaryActionPresentation): string {
  switch (action.label) {
    case 'Talk':
      return `Tap Talk to chat with ${target.label}`;
    case 'Enter':
      return `Tap Enter to go into ${target.label}`;
    case 'Start':
      return `Tap Start for ${target.label}`;
    case 'Inspect':
      return `Tap Inspect to look at ${target.label}`;
    case 'Buy':
      return `Tap Buy to shop with ${target.label}`;
    case 'Use':
      return `Tap Use for ${target.label}`;
    default:
      return `Tap Interact for ${target.label}`;
  }
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

/**
 * One interaction presentation for every canvas layout.
 *
 * The retired rectangular "E / Enter / tap" prompt has been removed. Desktop, tablet and phone
 * landscape use the concept circular action + hint. Portrait phone hides those canvas controls and
 * exposes the equivalent DOM action beneath the gameplay window. The DOM control is created once so
 * rotating the same page can switch presentation without recreating the scene.
 */
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
    const hintWidth = 520;
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
        wordWrap: { width: 440 },
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

    this.panel.on('pointerdown', () => pointerInput.setButton('INTERACT', true));
    this.panel.on('pointerup', () => pointerInput.setButton('INTERACT', false));
    this.panel.on('pointerout', () => pointerInput.setButton('INTERACT', false));
    this.panel.on('pointerupoutside', () => pointerInput.setButton('INTERACT', false));

    if (typeof globalThis.document !== 'undefined') {
      this.createResponsiveDomPrompt(pointerInput);
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
      this.hintText.setText(formatConceptHint(target, primaryAction));
      this.domButton?.setAttribute('aria-label', fullActionLabel);
      if (this.domButton) {
        this.domButton.textContent = fullActionLabel;
      }
      if (this.domHint) {
        this.domHint.textContent = 'Tap the big action button when it appears.';
      }
      this.directTargetZone.setPosition(target.position.x, target.position.y);
    } else {
      this.hintText.setText('Tap the path to move  •  Move close to friends and places');
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
    this.directTargetZone.on('pointerdown', () => this.pointerInput.setButton('INTERACT', true));
    this.directTargetZone.on('pointerup', this.releaseInteraction);
    this.directTargetZone.on('pointerout', this.releaseInteraction);
    this.directTargetZone.on('pointerupoutside', this.releaseInteraction);
    this.directTargetZone.disableInteractive();
  }

  private createResponsiveDomPrompt(pointerInput: PointerTouchInputAdapter): void {
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
    const portrait = shouldRenderPortraitDomPrompt();
    const targetVisible = this.currentTarget !== null && !isAutomaticInteraction(this.currentTarget);
    const canvasActionVisible = targetVisible && !portrait;
    const canvasHintVisible = !portrait;
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
      this.directTargetZone.setPosition(this.currentTarget.position.x, this.currentTarget.position.y);
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
