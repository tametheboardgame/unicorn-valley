import type { MapPoint } from '../world/MapTraversal';

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
    };

export interface InteractionTarget {
  id: string;
  label: string;
  actionLabel: string;
  position: MapPoint;
  interactionRadius: number;
  priority?: number;
  enabled?: boolean;
  result: InteractionResult;
}
