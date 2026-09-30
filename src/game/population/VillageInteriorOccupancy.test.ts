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
    expect(service.isResidentAllowedInScene('resident:cinnamon', 'VillageInteriorScene')).toBe(
      true,
    );
    expect(service.isResidentAllowedInScene('resident:maple', 'SunbeamVillageScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:maple', 'VillageInteriorScene')).toBe(false);
  });

  it('assigns a dedicated Twinkle & Thread shopkeeper who is not an outdoor resident', () => {
    const service = new VillageInteriorOccupancyService();
    service.enter('accessory-shop');

    expect(service.getInteriorAssignment('accessory-shop')).toMatchObject({
      residentId: 'resident:velvet',
      role: 'shopkeeper',
    });
    expect(service.isResidentAllowedInScene('resident:velvet', 'VillageInteriorScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:velvet', 'SunbeamVillageScene')).toBe(false);
  });

  it('assigns a dedicated Story House keeper without moving outdoor Tansy indoors', () => {
    const service = new VillageInteriorOccupancyService();
    service.enter('library');

    expect(service.getInteriorAssignment('library')).toMatchObject({
      residentId: 'resident:quill',
      role: 'story-keeper',
    });
    expect(service.isResidentAllowedInScene('resident:quill', 'VillageInteriorScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:quill', 'SunbeamVillageScene')).toBe(false);
    expect(service.isResidentAllowedInScene('resident:tansy', 'SunbeamVillageScene')).toBe(true);
    expect(service.isResidentAllowedInScene('resident:tansy', 'VillageInteriorScene')).toBe(false);
  });

  it('brings cottage residents home at sunset and night without making daytime homes static NPC rooms', () => {
    const service = new VillageInteriorOccupancyService();

    for (const [interiorId, residentId] of [
      ['rosehip-cottage', 'resident:rosehip'],
      ['bluebell-cottage', 'resident:bluebell'],
      ['sunpetal-cottage', 'resident:sunpetal'],
    ] as const) {
      service.enter(interiorId);

      expect(service.getInteriorAssignment(interiorId, 'morning')).toBeNull();
      expect(service.getInteriorAssignment(interiorId, 'afternoon')).toBeNull();
      expect(service.getInteriorAssignment(interiorId, 'sunset')).toMatchObject({ residentId });
      expect(service.getInteriorAssignment(interiorId, 'night')).toMatchObject({ residentId });
      expect(
        service.isResidentAllowedInScene(residentId, 'VillageInteriorScene', 'afternoon'),
      ).toBe(false);
      expect(service.isResidentAllowedInScene(residentId, 'VillageInteriorScene', 'night')).toBe(
        true,
      );

      service.leave(interiorId);
    }
  });

  it('releases the active interior cleanly on exit', () => {
    const service = new VillageInteriorOccupancyService();
    service.enter('bakery');
    expect(service.getActiveInteriorId()).toBe('bakery');
    service.leave('bakery');
    expect(service.getActiveInteriorId()).toBeNull();
  });
});
