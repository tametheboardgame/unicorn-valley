import type { AtmosphericTimeState } from '../atmosphere/AtmosphericTimeService';
import type { SupportingResidentId } from './AmbientPopulationTypes';
import type { VillageInteriorId } from '../world/VillageInteriorMap';

export interface VillageInteriorResidentAssignment {
  residentId: SupportingResidentId;
  interiorId: VillageInteriorId;
  workAnchorId: 'npc-work';
  role: 'bakery-worker' | 'shopkeeper' | 'story-keeper' | 'resident-home';
  supportedRoleAccessories: readonly ('chef-hat' | 'apron' | 'satchel')[];
  activeWhen?: {
    timeStates: readonly AtmosphericTimeState[];
  };
}

export const VILLAGE_INTERIOR_RESIDENT_ASSIGNMENTS = [
  {
    residentId: 'resident:cinnamon',
    interiorId: 'bakery',
    workAnchorId: 'npc-work',
    role: 'bakery-worker',
    supportedRoleAccessories: ['chef-hat', 'apron'],
  },
  {
    residentId: 'resident:velvet',
    interiorId: 'accessory-shop',
    workAnchorId: 'npc-work',
    role: 'shopkeeper',
    supportedRoleAccessories: [],
  },
  {
    residentId: 'resident:quill',
    interiorId: 'library',
    workAnchorId: 'npc-work',
    role: 'story-keeper',
    supportedRoleAccessories: [],
  },
  {
    residentId: 'resident:rosehip',
    interiorId: 'rosehip-cottage',
    workAnchorId: 'npc-work',
    role: 'resident-home',
    supportedRoleAccessories: [],
    activeWhen: { timeStates: ['sunset', 'night'] },
  },
  {
    residentId: 'resident:bluebell',
    interiorId: 'bluebell-cottage',
    workAnchorId: 'npc-work',
    role: 'resident-home',
    supportedRoleAccessories: [],
    activeWhen: { timeStates: ['sunset', 'night'] },
  },
  {
    residentId: 'resident:sunpetal',
    interiorId: 'sunpetal-cottage',
    workAnchorId: 'npc-work',
    role: 'resident-home',
    supportedRoleAccessories: [],
    activeWhen: { timeStates: ['sunset', 'night'] },
  },
] as const satisfies readonly VillageInteriorResidentAssignment[];

function assignmentIsActive(
  assignment: VillageInteriorResidentAssignment,
  timeState?: AtmosphericTimeState,
): boolean {
  if (!assignment.activeWhen) {
    return true;
  }
  return timeState !== undefined && assignment.activeWhen.timeStates.includes(timeState);
}

export class VillageInteriorOccupancyService {
  private activeInteriorId: VillageInteriorId | null = null;

  public enter(interiorId: VillageInteriorId): void {
    this.activeInteriorId = interiorId;
  }

  public leave(interiorId: VillageInteriorId): void {
    if (this.activeInteriorId === interiorId) {
      this.activeInteriorId = null;
    }
  }

  public getActiveInteriorId(): VillageInteriorId | null {
    return this.activeInteriorId;
  }

  public getInteriorAssignment(
    interiorId: VillageInteriorId,
    timeState?: AtmosphericTimeState,
  ): VillageInteriorResidentAssignment | null {
    const assignment =
      VILLAGE_INTERIOR_RESIDENT_ASSIGNMENTS.find(
        (candidate) => candidate.interiorId === interiorId,
      ) ?? null;
    return assignment && assignmentIsActive(assignment, timeState) ? assignment : null;
  }

  public isResidentAllowedInScene(
    residentId: SupportingResidentId,
    sceneKey: string,
    timeState?: AtmosphericTimeState,
  ): boolean {
    const assignment = VILLAGE_INTERIOR_RESIDENT_ASSIGNMENTS.find(
      (candidate) => candidate.residentId === residentId,
    );
    if (!assignment) {
      return sceneKey !== 'VillageInteriorScene';
    }

    const assignedInteriorActive = assignment.interiorId === this.activeInteriorId;
    const assignmentActive = assignmentIsActive(assignment, timeState);
    if (sceneKey === 'VillageInteriorScene') {
      return assignedInteriorActive && assignmentActive;
    }
    return !assignedInteriorActive || !assignmentActive;
  }
}

let browserVillageInteriorOccupancyService: VillageInteriorOccupancyService | null = null;

export function getVillageInteriorOccupancyService(): VillageInteriorOccupancyService {
  browserVillageInteriorOccupancyService ??= new VillageInteriorOccupancyService();
  return browserVillageInteriorOccupancyService;
}
