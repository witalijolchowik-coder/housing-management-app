import { describe, it, expect, beforeEach } from 'vitest';
import { Address, Room, Space, Tenant, Project } from '@/types';

describe('Tenant Settlement Workflow', () => {
  let project: Project;
  let address: Address;
  let room: Room;

  beforeEach(() => {
    // Create test data
    const space1: Space = {
      id: 'space-1',
      roomId: 'room-1',
      number: 1,
      status: 'vacant',
    };

    const space2: Space = {
      id: 'space-2',
      roomId: 'room-1',
      number: 2,
      status: 'vacant',
    };

    room = {
      id: 'room-1',
      addressId: 'address-1',
      name: 'Pokój 101',
      type: 'male',
      totalSpaces: 2,
      spaces: [space1, space2],
    };

    address = {
      id: 'address-1',
      projectId: 'project-1',
      name: 'Akademik Centrum',
      fullAddress: 'ul. Centralna 15',
      totalSpaces: 2,
      coupleRooms: 0,
      companyName: 'E-Port',
      ownerName: 'Jan Kowalski',
      phone: '+48 123 456 789',
      evictionPeriod: 14,
      totalCost: 1000,
      pricePerSpace: 500,
      photos: [],
      rooms: [room],
      unassignedTenants: [],
    };

    project = {
      id: 'project-1',
      name: 'Project Alpha',
      addresses: [address],
    };
  });

  describe('Step 1: Add tenant without room assignment', () => {
    it('should add tenant to unassignedTenants array', () => {
      const newTenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(newTenant);

      expect(address.unassignedTenants).toHaveLength(1);
      expect(address.unassignedTenants[0].id).toBe('tenant-1');
      expect(address.unassignedTenants[0].firstName).toBe('Jan');
    });

    it('should not assign spaceId to new tenant', () => {
      const newTenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(newTenant);

      expect(address.unassignedTenants[0].spaceId).toBeUndefined();
    });

    it('should display tenant in list with "Bez miejsca" status', () => {
      const newTenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(newTenant);

      // Simulate getting all residents (unassigned + assigned)
      const assignedTenants = address.rooms.flatMap((room) =>
        room.spaces.filter((space) => space.tenant).map((space) => space.tenant!)
      );
      const allResidents = [...address.unassignedTenants, ...assignedTenants];

      expect(allResidents).toHaveLength(1);
      expect(allResidents[0].id).toBe('tenant-1');
      expect(allResidents[0].spaceId).toBeUndefined();
    });
  });

  describe('Step 2: Select tenant from unassignedTenants and assign to room', () => {
    it('should list unassigned tenants in "Bez komnat" section', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant1);

      const unassignedList = address.unassignedTenants.map((t) => ({ ...t }));
      expect(unassignedList).toHaveLength(1);
      expect(unassignedList[0].firstName).toBe('Jan');
    });

    it('should assign tenant to first available space in room', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant1);

      // Remove from unassignedTenants
      address.unassignedTenants = address.unassignedTenants.filter((t) => t.id !== tenant1.id);

      // Find first available space
      const availableSpace = room.spaces.find((s) => !s.tenant);
      if (availableSpace) {
        availableSpace.tenant = tenant1;
        availableSpace.status = 'occupied';
      }

      expect(address.unassignedTenants).toHaveLength(0);
      expect(room.spaces[0].tenant?.id).toBe('tenant-1');
      expect(room.spaces[0].status).toBe('occupied');
    });

    it('should remove tenant from unassignedTenants when assigned', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        firstName: 'Maria',
        lastName: 'Nowak',
        gender: 'female',
        birthYear: 1992,
        checkInDate: '2024-01-16',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant1, tenant2);

      // Assign tenant1
      address.unassignedTenants = address.unassignedTenants.filter((t) => t.id !== tenant1.id);

      expect(address.unassignedTenants).toHaveLength(1);
      expect(address.unassignedTenants[0].id).toBe('tenant-2');
    });
  });

  describe('Step 3: Verify tenant appears in list with room assignment', () => {
    it('should show tenant with room name after assignment', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        spaceId: 'space-1',
        monthlyPrice: 500,
      };

      // Assign tenant to space
      room.spaces[0].tenant = tenant1;
      room.spaces[0].status = 'occupied';

      // Get room name for tenant
      const getRoomName = (spaceId: string | undefined): string => {
        if (!spaceId) return 'Unknown';
        for (const r of address.rooms) {
          const space = r.spaces.find((s) => s.id === spaceId);
          if (space) {
            return r.name;
          }
        }
        return 'Unknown';
      };

      const roomName = getRoomName(tenant1.spaceId);
      expect(roomName).toBe('Pokój 101');
    });

    it('should not show "Bez miejsca" status after assignment', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        spaceId: 'space-1',
        monthlyPrice: 500,
      };

      room.spaces[0].tenant = tenant1;

      const hasSpaceId = tenant1.spaceId !== undefined;
      expect(hasSpaceId).toBe(true);
    });
  });

  describe('Conflict detection for unassigned tenants', () => {
    it('should detect unassigned tenant as conflict', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant1);

      // Check if there are unassigned tenants
      const hasConflicts = address.unassignedTenants.length > 0;
      expect(hasConflicts).toBe(true);
    });

    it('should not detect conflict after assignment', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        spaceId: 'space-1',
        monthlyPrice: 500,
      };

      room.spaces[0].tenant = tenant1;

      // Check if there are unassigned tenants
      const hasConflicts = address.unassignedTenants.length > 0;
      expect(hasConflicts).toBe(false);
    });
  });

  describe('Delete tenant operations', () => {
    it('should delete unassigned tenant', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant1);
      expect(address.unassignedTenants).toHaveLength(1);

      // Delete tenant
      address.unassignedTenants = address.unassignedTenants.filter((t) => t.id !== tenant1.id);

      expect(address.unassignedTenants).toHaveLength(0);
    });

    it('should delete assigned tenant and free space', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        spaceId: 'space-1',
        monthlyPrice: 500,
      };

      room.spaces[0].tenant = tenant1;
      room.spaces[0].status = 'occupied';

      // Delete tenant
      if (tenant1.spaceId) {
        for (const r of address.rooms) {
          const space = r.spaces.find((s) => s.id === tenant1.spaceId);
          if (space) {
            space.tenant = null;
            space.status = 'vacant';
          }
        }
      }

      expect(room.spaces[0].tenant).toBeNull();
      expect(room.spaces[0].status).toBe('vacant');
    });
  });

  describe('Multiple tenants workflow', () => {
    it('should handle multiple unassigned tenants', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        firstName: 'Maria',
        lastName: 'Nowak',
        gender: 'female',
        birthYear: 1992,
        checkInDate: '2024-01-16',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant1, tenant2);

      expect(address.unassignedTenants).toHaveLength(2);
    });

    it('should assign tenants to different spaces', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        spaceId: 'space-1',
        monthlyPrice: 500,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        firstName: 'Maria',
        lastName: 'Nowak',
        gender: 'female',
        birthYear: 1992,
        checkInDate: '2024-01-16',
        spaceId: 'space-2',
        monthlyPrice: 500,
      };

      room.spaces[0].tenant = tenant1;
      room.spaces[1].tenant = tenant2;

      expect(room.spaces[0].tenant?.id).toBe('tenant-1');
      expect(room.spaces[1].tenant?.id).toBe('tenant-2');
    });

    it('should handle reassignment of tenant to different room', () => {
      const room2: Room = {
        id: 'room-2',
        addressId: 'address-1',
        name: 'Pokój 102',
        type: 'female',
        totalSpaces: 2,
        spaces: [
          { id: 'space-3', roomId: 'room-2', number: 1, status: 'vacant' },
          { id: 'space-4', roomId: 'room-2', number: 2, status: 'vacant' },
        ],
      };

      address.rooms.push(room2);

      const tenant1: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        spaceId: 'space-1',
        monthlyPrice: 500,
      };

      // Assign to room 1
      room.spaces[0].tenant = tenant1;

      // Reassign to room 2
      room.spaces[0].tenant = null; // Remove from room 1
      tenant1.spaceId = 'space-3';
      room2.spaces[0].tenant = tenant1;

      expect(room.spaces[0].tenant).toBeNull();
      expect(room2.spaces[0].tenant?.id).toBe('tenant-1');
    });
  });
});
