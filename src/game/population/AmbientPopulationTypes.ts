import type { CharacterId, DialogueId, QuestId } from '../../content/contentTypes';
import type { AtmosphericTimeState } from '../atmosphere/AtmosphericTimeService';
import type { UnicornAppearance } from '../player/UnicornAppearance';
import type { MapPoint } from '../world/MapTraversal';

export type SupportingResidentId =
  | 'resident:clover'
  | 'resident:breeze'
  | 'resident:tansy'
  | 'resident:maple'
  | 'resident:juniper'
  | 'resident:fern'
  | 'resident:coral'
  | 'resident:skipper'
  | 'resident:echo';

export type ResidentBehaviourMode =
  | 'local-wander'
  | 'purposeful-route'
  | 'activity-loop'
  | 'story-anchor';

export type ResidentRouteMode = 'loop' | 'ping-pong' | 'random-neighbour';

export interface ResidentWorldFlagCondition {
  id: string;
  value: boolean;
}

export interface ResidentCondition {
  timeStates?: readonly AtmosphericTimeState[];
  worldFlags?: readonly ResidentWorldFlagCondition[];
}

export interface ResidentTalkVariant {
  id: string;
  lines: readonly string[];
  activeWhen: ResidentCondition;
  priority?: number;
}

export interface ResidentTalkDefinition {
  lines: readonly string[];
  dialogueId?: DialogueId;
  variants?: readonly ResidentTalkVariant[];
}

export interface SupportingResidentDefinition {
  id: SupportingResidentId;
  name: string;
  role: string;
  appearance: UnicornAppearance;
  talk: ResidentTalkDefinition;
  characterId?: CharacterId;
  startsQuestId?: QuestId;
}

export interface ResidentWaypoint extends MapPoint {
  id: string;
  pauseMs?: number;
}

export interface ResidentPlacementDefinition {
  id: string;
  residentId: SupportingResidentId;
  sceneKey: string;
  behaviour: ResidentBehaviourMode;
  routeMode: ResidentRouteMode;
  waypoints: readonly ResidentWaypoint[];
  speedPxPerSecond: number;
  interactionRadius: number;
  priority?: number;
  activeWhen?: ResidentCondition;
}

export interface ResidentStoryAnchorDefinition {
  id: string;
  residentId: SupportingResidentId;
  sceneKey: string;
  position: MapPoint;
  interactionRadius: number;
  activeWhen: ResidentCondition;
  priority?: number;
}

export type SmallWorldInteractionKind =
  | 'inspect'
  | 'play'
  | 'sit'
  | 'ring'
  | 'splash'
  | 'listen'
  | 'reveal';

export interface SmallWorldInteractionDefinition {
  id: string;
  sceneKey: string;
  kind: SmallWorldInteractionKind;
  label: string;
  actionLabel: string;
  position: MapPoint;
  interactionRadius: number;
  feedback: string;
  activeWhen?: ResidentCondition;
}

export interface AmbientSafetyProfile {
  sceneKey: string;
  width: number;
  height: number;
  margin: number;
  blockers: readonly {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  forbiddenPoints?: readonly {
    id: string;
    position: MapPoint;
    radius: number;
  }[];
}

export interface AmbientPopulationContext {
  timeState: AtmosphericTimeState;
  worldFlags: Readonly<Record<string, boolean>>;
}
