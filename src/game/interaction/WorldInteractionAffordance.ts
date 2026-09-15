import Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore } from '../accessibility/AccessibilitySettings';
import { worldDepthForY } from '../world/WorldDepth';
import type { InteractionTarget } from './InteractionTarget';
import { getInteractionTargetPosition } from './InteractionTargeting';
import {
  getWorldInteractionAffordanceOffsetY,
  shouldShowWorldInteractionAffordance,
  WORLD_INTERACTION_AFFORDANCE_NAME_PREFIX,
} from './WorldInteractionAffordanceModel';

interface AffordanceEntry {
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Arc;
  ring: Phaser.GameObjects.Arc;
  core: Phaser.GameObjects.Arc;
  moteLeft: Phaser.GameObjects.Arc;
  moteRight: Phaser.GameObjects.Arc;
  animated: boolean;
}

export class WorldInteractionAffordanceLayer {
  private readonly entries = new Map<string, AffordanceEntry>();
  private readonly accessibility = getBrowserAccessibilitySettingsStore();

  public constructor(private readonly scene: Phaser.Scene) {}

  public sync(
    targets: readonly InteractionTarget[],
    selectedTargetId: string | null,
    hidden = false,
  ): void {
    const settings = this.accessibility.load();
    const wanted = new Set<string>();

    for (const target of targets) {
      if (!shouldShowWorldInteractionAffordance(target)) {
        continue;
      }

      wanted.add(target.id);
      const position = getInteractionTargetPosition(target);
      const yOffset = getWorldInteractionAffordanceOffsetY(target.actionKind);
      const entry = this.entries.get(target.id) ?? this.createEntry(target.id);
      const selected = selectedTargetId === target.id;

      // Semantic target positions may legitimately be fractional while an NPC is tweening. The
      // affordance itself is presentation-only, so keep it on rendered pixel boundaries. This
      // prevents a one-pixel shimmer against a smoothly easing camera without quantising NPC/world
      // movement or changing interaction distance calculations.
      const renderedX = Math.round(position.x);
      const renderedY = Math.round(position.y + yOffset);
      entry.container
        .setPosition(renderedX, renderedY)
        .setDepth(worldDepthForY(position.y, 0.95))
        .setVisible(!hidden)
        .setAlpha(selected ? 1 : settings.highVisibilityInteractions ? 0.96 : 0.8)
        .setScale(settings.highVisibilityInteractions ? 1.18 : selected ? 1.08 : 1);

      entry.core.setFillStyle(settings.highVisibilityInteractions ? 0xffffff : 0xc9f4ff, 1);
      entry.ring.setStrokeStyle(
        settings.highVisibilityInteractions ? 3 : 2,
        settings.highVisibilityInteractions ? 0xffffff : 0x8bdcff,
        settings.highVisibilityInteractions ? 0.95 : 0.7,
      );
      this.syncAnimation(entry, settings.reducedMotion);
    }

    for (const [targetId, entry] of this.entries) {
      if (wanted.has(targetId)) {
        continue;
      }
      this.destroyEntry(entry);
      this.entries.delete(targetId);
    }
  }

  public destroy(): void {
    for (const entry of this.entries.values()) {
      this.destroyEntry(entry);
    }
    this.entries.clear();
  }

  private createEntry(targetId: string): AffordanceEntry {
    const glow = this.scene.add.circle(0, 0, 16, 0x69d5ff, 0.18);
    const ring = this.scene.add.circle(0, 0, 8, 0x9de7ff, 0.07).setStrokeStyle(2, 0x8bdcff, 0.7);
    const core = this.scene.add.circle(0, 0, 4, 0xc9f4ff, 1);
    const moteLeft = this.scene.add.circle(-9, 5, 2.1, 0x75dcff, 0.8);
    const moteRight = this.scene.add.circle(9, -4, 1.7, 0xd7f8ff, 0.86);
    const container = this.scene.add
      .container(0, 0, [glow, ring, core, moteLeft, moteRight])
      .setName(`${WORLD_INTERACTION_AFFORDANCE_NAME_PREFIX}${targetId}`);

    const entry: AffordanceEntry = {
      container,
      glow,
      ring,
      core,
      moteLeft,
      moteRight,
      animated: false,
    };
    this.entries.set(targetId, entry);
    return entry;
  }

  private syncAnimation(entry: AffordanceEntry, reducedMotion: boolean): void {
    if (reducedMotion) {
      if (entry.animated) {
        this.scene.tweens.killTweensOf(entry.glow);
        this.scene.tweens.killTweensOf(entry.ring);
        this.scene.tweens.killTweensOf(entry.moteLeft);
        this.scene.tweens.killTweensOf(entry.moteRight);
        entry.animated = false;
      }
      entry.glow.setAlpha(0.2).setScale(1);
      entry.ring.setAlpha(0.72).setScale(1);
      entry.moteLeft.setAlpha(0.72).setY(5);
      entry.moteRight.setAlpha(0.78).setY(-4);
      return;
    }

    if (entry.animated) {
      return;
    }
    entry.animated = true;
    this.scene.tweens.add({
      targets: entry.glow,
      alpha: { from: 0.12, to: 0.28 },
      scale: { from: 0.92, to: 1.18 },
      duration: 1120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    this.scene.tweens.add({
      targets: entry.ring,
      alpha: { from: 0.46, to: 0.84 },
      scale: { from: 0.94, to: 1.12 },
      duration: 1380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    this.scene.tweens.add({
      targets: entry.moteLeft,
      y: 1,
      alpha: { from: 0.38, to: 0.88 },
      duration: 960,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    this.scene.tweens.add({
      targets: entry.moteRight,
      y: -8,
      alpha: { from: 0.42, to: 0.94 },
      duration: 1240,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private destroyEntry(entry: AffordanceEntry): void {
    this.scene.tweens.killTweensOf(entry.glow);
    this.scene.tweens.killTweensOf(entry.ring);
    this.scene.tweens.killTweensOf(entry.moteLeft);
    this.scene.tweens.killTweensOf(entry.moteRight);
    entry.container.destroy(true);
  }
}
