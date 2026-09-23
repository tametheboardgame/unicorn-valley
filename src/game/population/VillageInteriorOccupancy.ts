import type { SupportingResidentId } from './AmbientPopulationTypes';
import type { VillageInteriorId } from '../world/VillageInteriorMap';

export interface VillageInteriorResidentAssignment {
  residentId: SupportingResidentId;
  interiorId: VillageInteriorId;
  workAnchorId: 'npc-work';
  role: 'bakery-worker' | 'story-keeper';
  supportedRoleAccessories: readonly ('chef-hat' | 'apron' | 'satchel')[];
}

export const VILLAGE_INTERIOR_RESIDENT_ASSIGNMENTS = [
  {
    residentId: 'resident:maple',
    interiorId: 'bakery',
    workAnchorId: 'npc-work',
    role: 'bakery-worker',
    supportedRoleAccessories: ['chef-hat', 'apron'],
  },
  {
    residentId: 'resident:tansy',
    interiorId: 'library',
    workAnchorId: 'npc-work',
    role: 'story-keeper',
    supportedRoleAccessories: ['satchel'],
  },
] as const satisfies readonly VillageInteriorResidentAssignment[];

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
  ): VillageInteriorResidentAssignment | null {
    return (
      VILLAGE_INTERIOR_RESIDENT_ASSIGNMENTS.find(
        (assignment) => assignment.interiorId === interiorId,
      ) ?? null
    );
  }

  public isResidentAllowedInScene(residentId: SupportingResidentId, sceneKey: string): boolean {
    const assignment = VILLAGE_INTERIOR_RESIDENT_ASSIGNMENTS.find(
      (candidate) => candidate.residentId === residentId,
    );
    if (!assignment) {
      return true;
    }

    const assignedInteriorActive = assignment.interiorId === this.activeInteriorId;
    if (sceneKey === 'VillageInteriorScene') {
      return assignedInteriorActive;
    }
    return !assignedInteriorActive;
  }
}

let browserVillageInteriorOccupancyService: VillageInteriorOccupancyService | null = null;

export function getVillageInteriorOccupancyService(): VillageInteriorOccupancyService {
  browserVillageInteriorOccupancyService ??= new VillageInteriorOccupancyService();
  return browserVillageInteriorOccupancyService;
}
