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
  | {
      type: 'dialogue';
      dialogueId: DialogueId;
    }
  | {
      type: 'callback';
      activate: () => void;
    };

/**
 * One semantic contract for anything the player can explicitly engage with in the world.
 *
 * Position, visibility and enabled state may be live functions so moving residents and changing
 * quest objects do not need duplicate hit zones or stale target copies. Presentation consumes
 * actionKind directly and never infers behaviour from rendered text.
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
  result: InteractionResult;
}
