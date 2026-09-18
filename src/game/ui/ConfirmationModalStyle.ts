import Phaser from 'phaser';
import { CONCEPT_UI, createFixedGraphics, drawPanelShadow, drawRoundedPanel } from './ConceptUi';
import { UI_DESIGN_TOKENS } from './UiDesignSystem';
import { createUiActionHitTarget } from './UiPrimitives';

/**
 * Canonical lightweight confirmation presentation.
 *
 * Confirmation prompts should use this rounded concept treatment rather than drawing raw
 * rectangular panels/buttons in individual scenes. This keeps world confirmations consistent
 * with the production menus while retaining generous invisible touch targets.
 */
export const CONFIRMATION_MODAL_STANDARD = {
  panelRadius: UI_DESIGN_TOKENS.radius.panelPx,
  buttonRadius: UI_DESIGN_TOKENS.radius.controlPx,
  panelBorderPx: UI_DESIGN_TOKENS.border.strongPx,
  buttonBorderPx: UI_DESIGN_TOKENS.border.controlPx,
} as const;

export interface ConfirmationPanelOptions {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  accent?: number;
}

export interface ConfirmationButtonOptions {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  label: string;
  variant: 'primary' | 'secondary';
  onActivate: () => void;
}

export interface ConfirmationButtonPresentation {
  objects: Phaser.GameObjects.GameObject[];
  hitTarget: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export function createConfirmationPanel(
  scene: Phaser.Scene,
  options: ConfirmationPanelOptions,
): Phaser.GameObjects.GameObject[] {
  const accent = options.accent ?? CONCEPT_UI.blueStrong;
  const shadow = createFixedGraphics(scene, `${options.name}-shadow`, options.depth);
  drawPanelShadow(
    shadow,
    options.x,
    options.y,
    options.width,
    options.height,
    CONFIRMATION_MODAL_STANDARD.panelRadius,
    7,
    9,
    0.24,
  );

  const surface = createFixedGraphics(scene, options.name, options.depth + 1);
  drawRoundedPanel(
    surface,
    options.x,
    options.y,
    options.width,
    options.height,
    CONFIRMATION_MODAL_STANDARD.panelRadius,
    CONCEPT_UI.cream,
    accent,
    CONFIRMATION_MODAL_STANDARD.panelBorderPx,
    0.995,
  );
  surface.fillStyle(CONCEPT_UI.white, 0.22);
  surface.fillRoundedRect(
    options.x - options.width / 2 + 10,
    options.y - options.height / 2 + 10,
    options.width - 20,
    50,
    Math.max(12, CONFIRMATION_MODAL_STANDARD.panelRadius - 10),
  );

  return [shadow, surface];
}

export function createConfirmationButton(
  scene: Phaser.Scene,
  options: ConfirmationButtonOptions,
): ConfirmationButtonPresentation {
  const shadow = createFixedGraphics(scene, `${options.name}-shadow`, options.depth);
  const surface = createFixedGraphics(scene, `${options.name}-surface`, options.depth + 1);
  const hitTarget = createUiActionHitTarget(
    scene,
    options.x,
    options.y,
    options.width,
    options.height,
    options.name,
  )
    .setScrollFactor(0)
    .setDepth(options.depth + 2);
  const label = scene.add
    .text(options.x, options.y, options.label, {
      color: options.variant === 'primary' ? '#244f5c' : '#5c2d82',
      fontFamily: UI_DESIGN_TOKENS.typography.family,
      fontSize: '19px',
      fontStyle: 'bold',
      align: 'center',
    })
    .setName(`${options.name}-label`)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(options.depth + 3);

  const redraw = (state: 'normal' | 'hover' | 'pressed'): void => {
    const primary = options.variant === 'primary';
    const fill = primary
      ? state === 'pressed'
        ? CONCEPT_UI.blueStrong
        : state === 'hover'
          ? CONCEPT_UI.blueLight
          : CONCEPT_UI.blue
      : state === 'pressed'
        ? CONCEPT_UI.lavenderLine
        : state === 'hover'
          ? CONCEPT_UI.purpleLight
          : CONCEPT_UI.cream;
    const stroke = primary ? CONCEPT_UI.blueStrong : CONCEPT_UI.purpleStrong;

    shadow.clear();
    drawPanelShadow(
      shadow,
      options.x,
      options.y,
      options.width,
      options.height,
      CONFIRMATION_MODAL_STANDARD.buttonRadius,
      4,
      state === 'pressed' ? 3 : 6,
      state === 'pressed' ? 0.15 : 0.22,
    );

    surface.clear();
    drawRoundedPanel(
      surface,
      options.x,
      options.y,
      options.width,
      options.height,
      CONFIRMATION_MODAL_STANDARD.buttonRadius,
      fill,
      stroke,
      CONFIRMATION_MODAL_STANDARD.buttonBorderPx,
      1,
    );
    if (state !== 'pressed') {
      surface.fillStyle(CONCEPT_UI.white, 0.18);
      surface.fillRoundedRect(
        options.x - options.width / 2 + 6,
        options.y - options.height / 2 + 6,
        options.width - 12,
        Math.max(12, options.height * 0.28),
        Math.max(8, CONFIRMATION_MODAL_STANDARD.buttonRadius - 6),
      );
    }
  };

  redraw('normal');
  hitTarget.on('pointerover', () => redraw('hover'));
  hitTarget.on('pointerout', () => redraw('normal'));
  hitTarget.on('pointerdown', () => redraw('pressed'));
  hitTarget.on('pointerup', () => {
    redraw('hover');
    options.onActivate();
  });

  return {
    objects: [shadow, surface, hitTarget, label],
    hitTarget,
    label,
  };
}
