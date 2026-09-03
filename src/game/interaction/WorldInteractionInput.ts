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

function isModalDialogueVisible(scene: Phaser.Scene): boolean {
  const panel = scene.children.getByName('dialogue-production-panel');
  return panel instanceof Phaser.GameObjects.Rectangle && panel.visible;
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
  private modalWasVisible = false;

  public constructor(private readonly scene: Phaser.Scene) {
    ensureInteractionTracking();
    this.lastSeenPressSerial = interactionPressSerial;
  }

  public justPressed(): boolean {
    if (!this.scene.scene.isActive()) {
      this.lastSeenPressSerial = interactionPressSerial;
      this.modalWasVisible = false;
      return false;
    }

    const modalVisible = isModalDialogueVisible(this.scene);
    if (modalVisible) {
      this.lastSeenPressSerial = interactionPressSerial;
      this.modalWasVisible = true;
      return false;
    }

    if (interactionPressSerial === this.lastSeenPressSerial) {
      this.modalWasVisible = false;
      return false;
    }

    this.lastSeenPressSerial = interactionPressSerial;
    if (this.modalWasVisible) {
      this.modalWasVisible = false;
      return false;
    }
    return true;
  }

  public bindPointer(zone: Phaser.GameObjects.Zone, activate: () => void): void {
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (!isModalDialogueVisible(this.scene)) {
        activate();
      }
    });
  }

  public destroy(): void {
    this.lastSeenPressSerial = interactionPressSerial;
    this.modalWasVisible = false;
  }
}
