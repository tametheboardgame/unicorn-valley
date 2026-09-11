import type { DialogueId } from '../../content/contentTypes';
import type { MapPoint } from '../world/MapTraversal';

export type InteractionActionKind =
  | 'talk'
  | 'enter'
  | 'start'
  | 'inspect'
  | 'buy'
  | 'use'
  | 'interact';

export type InteractionActivationMode = 'explicit' | 'automatic';
export type InteractionPosition = MapPoint | (() => MapPoint);
export type InteractionCondition = boolean | (() => boolean);
export type InteractionDialogueId = DialogueId | (() => DialogueId);

export interface InteractionDirectArea {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
  name?: string;
}

export interface InteractionDialogueLifecycle {
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export type InteractionResult =
  | {
      type: 'message';
      title: string;
      message: string;
    }
  | {
      type: 'scene-transition';
      sceneKey: string;
      payload?: Record<string, unknown>;
    }
  | ({
      type: 'dialogue';
      dialogueId: InteractionDialogueId;
    } & InteractionDialogueLifecycle)
  | {
      type: 'callback';
      activate: () => void;
    };

/**
 * One semantic contract for anything the player can explicitly engage with in the world.
 *
 * Position, visibility and enabled state may be live functions so moving residents and changing
 * quest objects do not need duplicate hit zones or stale target copies. Presentation consumes
 * actionKind directly and never infers behaviour from rendered text. directArea is optional
 * presentation geometry for targets that need a larger touch affordance; activation still routes
 * through the shared coordinator and the target remains range-gated by interactionRadius.
 *
 * Dialogue IDs may resolve at activation time so quest/friendship state can select the correct
 * branch without rebuilding the interaction registry. Lifecycle hooks carry existing story side
 * effects while WP19E retires conversation-only scenes; the shared presenter remains responsible
 * for visual/input ownership and DialogueSession remains responsible for node progression.
 */
export interface InteractionTarget {
  id: string;
  label: string;
  actionLabel: string;
  actionKind?: InteractionActionKind;
  activationMode?: InteractionActivationMode;
  position: InteractionPosition;
  interactionRadius: number;
  priority?: number;
  visible?: InteractionCondition;
  enabled?: InteractionCondition;
  reachable?: InteractionCondition | ((playerPosition: MapPoint) => boolean);
  approachPosition?: InteractionPosition;
  directArea?: InteractionDirectArea;
  result: InteractionResult;
}
