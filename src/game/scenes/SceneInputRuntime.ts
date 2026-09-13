import type Phaser from 'phaser';
import { InputController } from '../input/InputController';
import type { ButtonInputAction } from '../input/InputAction';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import type { SceneEventSource, SceneLifecycleScope } from './SceneLifecycleScope';

type PointerActionTarget = SceneEventSource<[]>;

export class SceneInputRuntime {
  public readonly pointerInput = new PointerTouchInputAdapter();
  private readonly inputController: InputController;

  public constructor(
    scene: Phaser.Scene,
    private readonly lifecycle: SceneLifecycleScope,
  ) {
    this.inputController = new InputController([
      new KeyboardInputAdapter(scene),
      this.pointerInput,
    ]);
    this.lifecycle.own(() => this.inputController.destroy());
  }

  public bindActionTarget(target: PointerActionTarget, action: ButtonInputAction): void {
    this.lifecycle.listen(target, 'pointerdown', () => this.pointerInput.setButton(action, true));
    this.lifecycle.listen(target, 'pointerup', () => this.pointerInput.setButton(action, false));
    this.lifecycle.listen(target, 'pointerout', () => this.pointerInput.setButton(action, false));
  }

  public update(): void {
    this.inputController.update();
  }

  public justPressed(action: ButtonInputAction): boolean {
    return this.inputController.justPressed(action);
  }
}
