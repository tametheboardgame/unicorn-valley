import { describe, expect, it } from 'vitest';
import { VillageInteriorOccupancyService } from './VillageInteriorOccupancy';

describe('VillageInteriorOccupancyService', () => {
  it('gives Maple one authoritative location while the Bakery is active', () => {
    const service = new VillageInteriorOccupancyService();
    service.enter('bakery');

    expect(service.isResidentAllowedInScene('resident:maple', 'VillageInteriorScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:maple', 'SunbeamVillageScene')).toBe(false);
    expect(service.isResidentAllowedInScene('resident:tansy', 'SunbeamVillageScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:tansy', 'VillageInteriorScene')).toBe(false);
    expect(service.getInteriorAssignment('bakery')?.supportedRoleAccessories).toEqual([
      'chef-hat',
      'apron',
    ]);
  });

  it('moves occupancy authority cleanly between interiors and releases it on exit', () => {
    const service = new VillageInteriorOccupancyService();
    service.enter('bakery');
    service.enter('library');

    expect(service.getActiveInteriorId()).toBe('library');
    expect(service.isResidentAllowedInScene('resident:tansy', 'VillageInteriorScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:tansy', 'RainbowMeadowScene')).toBe(false);
    expect(service.isResidentAllowedInScene('resident:maple', 'SunbeamVillageScene')).toBe(true);

    service.leave('bakery');
    expect(service.getActiveInteriorId()).toBe('library');
    service.leave('library');
    expect(service.getActiveInteriorId()).toBeNull();
    expect(service.isResidentAllowedInScene('resident:tansy', 'RainbowMeadowScene')).toBe(true);
  });

  it('does not claim residents without an interior assignment', () => {
    const service = new VillageInteriorOccupancyService();
    service.enter('bakery');
    expect(service.isResidentAllowedInScene('resident:juniper', 'SunbeamVillageScene')).toBe(true);
  });
});
