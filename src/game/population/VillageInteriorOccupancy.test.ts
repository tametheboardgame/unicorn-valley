import { describe, expect, it } from 'vitest';
import { VillageInteriorOccupancyService } from './VillageInteriorOccupancy';

describe('VillageInteriorOccupancyService', () => {
  it('assigns dedicated Bakery staff without suppressing Maple outside', () => {
    const service = new VillageInteriorOccupancyService();
    service.enter('bakery');

    expect(service.getInteriorAssignment('bakery')).toMatchObject({
      residentId: 'resident:cinnamon',
      role: 'bakery-worker',
    });
    expect(service.getInteriorAssignment('bakery')?.supportedRoleAccessories).toEqual([
      'chef-hat',
      'apron',
    ]);
    expect(service.isResidentAllowedInScene('resident:cinnamon', 'VillageInteriorScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:maple', 'SunbeamVillageScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:maple', 'VillageInteriorScene')).toBe(false);
  });

  it('does not reuse outdoor Tansy as the Story House interior worker', () => {
    const service = new VillageInteriorOccupancyService();
    service.enter('library');

    expect(service.getInteriorAssignment('library')).toBeNull();
    expect(service.isResidentAllowedInScene('resident:tansy', 'SunbeamVillageScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:tansy', 'VillageInteriorScene')).toBe(false);
  });

  it('releases the active interior cleanly on exit', () => {
    const service = new VillageInteriorOccupancyService();
    service.enter('bakery');
    expect(service.getActiveInteriorId()).toBe('bakery');
    service.leave('bakery');
    expect(service.getActiveInteriorId()).toBeNull();
  });
});
