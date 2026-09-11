import Phaser from 'phaser';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import {
  getInteractionTargetPosition,
  selectInteractionTarget,
} from '../interaction/InteractionTargeting';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import { getWorldFeedbackPresenter } from './WorldFeedbackPresenter';

interface Point {
  x: number;
  y: number;
}

type FeedbackClassification = 'guidance' | 'reaction' | 'discovery-duplicate';

const KNOWN_LEGACY_TOP_BACKGROUNDS = new Set([
  '#fff8ecf2',
  '#f3fff8f2',
  '#fff9eaf2',
  '#fff8eaf2',
  '#efffeef2',
  '#f4fff1f2',
  '#f2fff0f2',
  '#fff7eaf0',
  '#fff9edf2',
]);

const LEGACY_TOP_NAMES = new Set([
  'wp19d-interaction-feedback',
  'r6-5-beach-content-feedback',
]);

const EXCLUDED_STATUS_NAMES = new Set(['r6.5-wp12-race-feedback']);

const GUIDANCE_PATTERNS = [
  /may know how/i,
  /thinks? .+ knows?/i,
  /talk to/i,
  /ask .+ about/i,
  /come back/i,
  /bring .+ back/i,
  /look for/i,
  /head (?:to|towards?)/i,
  /find .+(?:first|near|at|in)/i,
  /(?:door|gate|steps?).+(?:closed|locked|folded|won't open|will not open)/i,
  /help .+ first/i,
  /explore .+ first/i,
];

const DISCOVERY_DUPLICATE_NAMES = new Set(['crystal-brook-story-feedback']);
const DISCOVERY_DUPLICATE_BACKGROUNDS = new Set(['#efffeef2', '#f4fff1f2']);

function findPlayer(scene: Phaser.Scene): Point | null {
  const named = scene.children.getByName(WORLD_PLAYER_NAME) as
    | (Phaser.GameObjects.GameObject & Partial<Point>)
    | null;
  if (named && typeof named.x === 'number' && typeof named.y === 'number') {
    return { x: named.x, y: named.y };
  }

  const fallback = scene.children.list.find((object) => {
    const candidate = object as Phaser.GameObjects.GameObject &
      Partial<Point> & { texture?: { key?: string } };
    return (
      typeof candidate.x === 'number' &&
      typeof candidate.y === 'number' &&
      candidate.texture?.key?.startsWith('player-unicorn')
    );
  }) as (Phaser.GameObjects.GameObject & Point) | undefined;

  return fallback ? { x: fallback.x, y: fallback.y } : null;
}

function backgroundColour(text: Phaser.GameObjects.Text): string | null {
  const value = text.style.backgroundColor;
  return typeof value === 'string' ? value.toLowerCase() : null;
}

function isLegacyTopFeedback(text: Phaser.GameObjects.Text): boolean {
  if (
    !text.visible ||
    text.text.trim().length === 0 ||
    text.scrollFactorX !== 0 ||
    EXCLUDED_STATUS_NAMES.has(text.name)
  ) {
    return false;
  }

  if (LEGACY_TOP_NAMES.has(text.name) || DISCOVERY_DUPLICATE_NAMES.has(text.name)) {
    return true;
  }

  const background = backgroundColour(text);
  return (
    text.y >= 100 &&
    text.y <= 190 &&
    text.depth >= 130 &&
    background !== null &&
    KNOWN_LEGACY_TOP_BACKGROUNDS.has(background)
  );
}

function selectedTarget(scene: Phaser.Scene): InteractionTarget | null {
  const player = findPlayer(scene);
  if (!player) {
    return null;
  }
  return selectInteractionTarget(player, getSceneInteractionRegistry(scene).getTargets(), {
    retentionMargin: 36,
  });
}

function classify(
  text: Phaser.GameObjects.Text,
  target: InteractionTarget | null,
): FeedbackClassification {
  const background = backgroundColour(text);
  if (
    DISCOVERY_DUPLICATE_NAMES.has(text.name) ||
    (background !== null && DISCOVERY_DUPLICATE_BACKGROUNDS.has(background))
  ) {
    return 'discovery-duplicate';
  }

  if (GUIDANCE_PATTERNS.some((pattern) => pattern.test(text.text))) {
    return 'guidance';
  }

  if (
    target?.actionKind === 'talk' ||
    target?.actionKind === 'enter' ||
    target?.actionKind === 'start'
  ) {
    return 'guidance';
  }

  return target ? 'reaction' : 'guidance';
}

/**
 * Transitional WP19E1 inventory/migration layer for legacy fixed top-screen producers.
 *
 * It deliberately recognises only the known legacy visual signatures. Once each producer has
 * moved to the shared presenter directly this adapter can be deleted without changing gameplay.
 */
export class LegacyWorldFeedbackMigrationManager {
  private readonly handledVisibility = new WeakSet<Phaser.GameObjects.Text>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      for (const child of scene.children.list) {
        if (!(child instanceof Phaser.GameObjects.Text)) {
          continue;
        }
        if (!child.visible) {
          this.handledVisibility.delete(child);
          continue;
        }
        if (!isLegacyTopFeedback(child)) {
          continue;
        }

        if (this.handledVisibility.has(child)) {
          child.setVisible(false);
          continue;
        }
        this.handledVisibility.add(child);

        const message = child.text.trim();
        child.setVisible(false);

        const target = selectedTarget(scene);
        const classification = classify(child, target);
        if (classification === 'discovery-duplicate') {
          // DiscoveryService already emits the Wonderbook/reward presentation. Suppress only the
          // obsolete duplicate top banner so discovery meaning remains owned by that system.
          continue;
        }

        const presenter = getWorldFeedbackPresenter(scene);
        if (classification === 'guidance' || !target) {
          presenter.showGuidance(message);
          continue;
        }

        presenter.showReaction(message, getInteractionTargetPosition(target));
      }
    }
  }
}

let browserLegacyWorldFeedbackMigrationManager: LegacyWorldFeedbackMigrationManager | null = null;

export function getLegacyWorldFeedbackMigrationManager(
  game: Phaser.Game,
): LegacyWorldFeedbackMigrationManager {
  browserLegacyWorldFeedbackMigrationManager ??= new LegacyWorldFeedbackMigrationManager(game);
  return browserLegacyWorldFeedbackMigrationManager;
}
