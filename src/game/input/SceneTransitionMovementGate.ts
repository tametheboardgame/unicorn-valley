export class SceneTransitionMovementGate {
  private waitingForNeutral = true;

  public update(hasHeldMovementInput: boolean): void {
    if (this.waitingForNeutral && !hasHeldMovementInput) {
      this.waitingForNeutral = false;
    }
  }

  public filter(axisValue: number): number {
    return this.waitingForNeutral ? 0 : axisValue;
  }

  public isWaitingForNeutral(): boolean {
    return this.waitingForNeutral;
  }
}
