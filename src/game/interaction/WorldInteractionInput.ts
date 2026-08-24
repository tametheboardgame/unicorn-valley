import Phaser from 'phaser';

export const WORLD_INTERACTION_PROMPT = 'E / Enter / tap';

const INTERACTION_CODES = new Set(['KeyE', 'Enter']);
let interactionPressSerial = 0;
let interactionTrackingInstalled = false;

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  const element = target as {
    tagName?: string;
    isContentEditable?: boolean;
  } | null;
  const tagName = element?.tagName?.toUpperCase();
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    element?.isContentEditable === true
  );
}

function ensureInteractionTracking(): void {
  if (interactionTrackingInstalled || typeof globalThis.addEventListener !== 'function') {
    return;
  }

  globalThis.addEventListener('keydown', (event: KeyboardEvent) => {
    if (
      INTERACTION_CODES.has(event.code) &&
      !event.repeat &&
      !isEditableKeyboardTarget(event.target)
    ) {
      interactionPressSerial += 1;
    }
  });
  interactionTrackingInstalled = true;
}

export class WorldInteractionInput {
  private lastSeenPressSerial: number;

  public constructor(private readonly scene: Phaser.Scene) {
    ensureInteractionTracking();
    this.lastSeenPressSerial = interactionPressSerial;
  }

  public justPressed(): boolean {
    if (!this.scene.scene.isActive() || interactionPressSerial === this.lastSeenPressSerial) {
      return false;
    }
    this.lastSeenPressSerial = interactionPressSerial;
    return true;
  }

  public bindPointer(zone: Phaser.GameObjects.Zone, activate: () => void): void {
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', activate);
  }

  public destroy(): void {
    this.lastSeenPressSerial = interactionPressSerial;
  }
}
