import { describe, it, expect } from 'vitest';
import { Tenant, Room, Space } from '@/types';

describe('Tenant Selection Logic', () => {
  // Mock data
  const createMockTenant = (id: string, firstName: string, lastName: string): Tenant => ({
    id,
    firstName,
    lastName,
    gender: 'male',
    birthYear: 1990,
    checkInDate: '2024-01-01',
    monthlyPrice: 500,
  });

  const createMockSpace = (id: string, number: number, tenant?: Tenant | null): Space => ({
    id,
    roomId: 'room1',
    number,
    status: tenant ? 'occupied' : 'vacant',
    tenant: tenant || null,
  });

  const createMockRoom = (id: string, name: string, spaces: Space[]): Room => ({
    id,
    addressId: 'addr1',
    name,
    type: 'male',
    totalSpaces: spaces.length,
    spaces,
  });

  it('should organize tenants into two sections: without room and with room', () => {
    const tenant1 = createMockTenant('t1', 'Jan', 'Kowalski');
    const tenant2 = createMockTenant('t2', 'Maria', 'Nowak');
    const tenant3 = createMockTenant('t3', 'Piotr', 'Lewandowski');

    const space1 = createMockSpace('s1', 1, tenant1);
    const space2 = createMockSpace('s2', 2, null);
    const space3 = createMockSpace('s3', 3, tenant2);

    const room = createMockRoom('room1', 'Pokój 1', [space1, space2, space3]);

    // Simulate tenant selection logic
    const allTenants = new Map<string, Tenant>();
    const tenantsWithRooms = new Map<string, string>();

    for (const space of room.spaces) {
      if (space.tenant) {
        allTenants.set(space.tenant.id, space.tenant);
        tenantsWithRooms.set(space.tenant.id, room.name);
      }
    }

    const withoutRoom = Array.from(allTenants.values()).filter((t) => !tenantsWithRooms.has(t.id));
    const withRoom = Array.from(allTenants.values()).filter((t) => tenantsWithRooms.has(t.id));

    expect(withoutRoom.length).toBe(0);
    expect(withRoom.length).toBe(2);
    expect(withRoom.map((t) => t.id)).toContain('t1');
    expect(withRoom.map((t) => t.id)).toContain('t2');
  });

  it('should reassign tenant from one room to another', () => {
    const tenant = createMockTenant('t1', 'Jan', 'Kowalski');

    const space1 = createMockSpace('s1', 1, tenant);
    const space2 = createMockSpace('s2', 2, null);
    const room1 = createMockRoom('room1', 'Pokój 1', [space1]);
    const room2 = createMockRoom('room2', 'Pokój 2', [space2]);

    // Simulate reassignment
    // Remove from room1
    space1.tenant = null;

    // Add to room2
    const availableSpace = room2.spaces.find((s) => !s.tenant);
    if (availableSpace) {
      availableSpace.tenant = tenant;
    }

    expect(space1.tenant).toBeNull();
    expect(space2.tenant).toBe(tenant);
  });

  it('should find first available space in room', () => {
    const tenant1 = createMockTenant('t1', 'Jan', 'Kowalski');
    const tenant2 = createMockTenant('t2', 'Maria', 'Nowak');

    const space1 = createMockSpace('s1', 1, tenant1);
    const space2 = createMockSpace('s2', 2, tenant2);
    const space3 = createMockSpace('s3', 3, null);
    const space4 = createMockSpace('s4', 4, null);

    const room = createMockRoom('room1', 'Pokój 1', [space1, space2, space3, space4]);

    const availableSpace = room.spaces.find((s) => !s.tenant);

    expect(availableSpace).toBe(space3);
    expect(availableSpace?.number).toBe(3);
  });

  it('should handle case when no space is available', () => {
    const tenant1 = createMockTenant('t1', 'Jan', 'Kowalski');
    const tenant2 = createMockTenant('t2', 'Maria', 'Nowak');

    const space1 = createMockSpace('s1', 1, tenant1);
    const space2 = createMockSpace('s2', 2, tenant2);

    const room = createMockRoom('room1', 'Pokój 1', [space1, space2]);

    const availableSpace = room.spaces.find((s) => !s.tenant);

    expect(availableSpace).toBeUndefined();
  });

  it('should track tenant current room correctly', () => {
    const tenant1 = createMockTenant('t1', 'Jan', 'Kowalski');
    const tenant2 = createMockTenant('t2', 'Maria', 'Nowak');
    const tenant3 = createMockTenant('t3', 'Piotr', 'Lewandowski');

    const space1 = createMockSpace('s1', 1, tenant1);
    const space2 = createMockSpace('s2', 2, tenant2);
    const space3 = createMockSpace('s3', 3, null);

    const room1 = createMockRoom('room1', 'Pokój 1', [space1, space2]);
    const room2 = createMockRoom('room2', 'Pokój 2', [space3]);

    const rooms = [room1, room2];

    // Build tenant-to-room mapping
    const tenantsWithRooms = new Map<string, string>();
    for (const room of rooms) {
      for (const space of room.spaces) {
        if (space.tenant) {
          tenantsWithRooms.set(space.tenant.id, room.name);
        }
      }
    }

    expect(tenantsWithRooms.get('t1')).toBe('Pokój 1');
    expect(tenantsWithRooms.get('t2')).toBe('Pokój 1');
    expect(tenantsWithRooms.get('t3')).toBeUndefined();
  });

  it('should prevent deletion of occupied space', () => {
    const tenant = createMockTenant('t1', 'Jan', 'Kowalski');
    const space = createMockSpace('s1', 1, tenant);

    const canDelete = !space.tenant;

    expect(canDelete).toBe(false);
  });

  it('should allow deletion of vacant space', () => {
    const space = createMockSpace('s1', 1, null);

    const canDelete = !space.tenant;

    expect(canDelete).toBe(true);
  });
});
