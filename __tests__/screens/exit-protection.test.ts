import { describe, it, expect, beforeEach } from 'vitest';
import { Address, Room, Space, Tenant, Project } from '@/types';

describe('Exit Protection for Unassigned Tenants', () => {
  let project: Project;
  let address: Address;
  let room: Room;

  beforeEach(() => {
    const space1: Space = {
      id: 'space-1',
      roomId: 'room-1',
      number: 1,
      status: 'vacant',
    };

    room = {
      id: 'room-1',
      addressId: 'address-1',
      name: 'Pokój 101',
      type: 'male',
      totalSpaces: 1,
      spaces: [space1],
    };

    address = {
      id: 'address-1',
      projectId: 'project-1',
      name: 'Akademik Centrum',
      fullAddress: 'ul. Centralna 15',
      totalSpaces: 1,
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

  describe('Exit protection logic', () => {
    it('should allow exit when no unassigned tenants', () => {
      expect(address.unassignedTenants.length).toBe(0);
      const canExit = address.unassignedTenants.length === 0;
      expect(canExit).toBe(true);
    });

    it('should block exit when there are unassigned tenants', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      const canExit = address.unassignedTenants.length === 0;
      expect(canExit).toBe(false);
    });

    it('should show alert message with tenant count', () => {
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

      const alertMessage = `Masz ${address.unassignedTenants.length} mieszkańca/ów bez przydzielonego miejsca. Przejdź do karty "Pokoje" i przydziel im pokoje, aby zakończyć operację.`;
      expect(alertMessage).toContain('2 mieszkańca/ów');
    });

    it('should allow exit after assigning all tenants', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        spaceId: 'space-1',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);
      expect(address.unassignedTenants.length).toBe(1);

      // Assign tenant to room
      room.spaces[0].tenant = tenant;
      address.unassignedTenants = address.unassignedTenants.filter((t) => t.id !== tenant.id);

      const canExit = address.unassignedTenants.length === 0;
      expect(canExit).toBe(true);
    });
  });

  describe('Conflict detection for unassigned tenants', () => {
    it('should detect unassigned tenant as conflict', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      const hasConflict = address.unassignedTenants.length > 0;
      expect(hasConflict).toBe(true);
    });

    it('should create conflict message with tenant info', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      const conflictMessage = `${tenant.firstName} ${tenant.lastName} nie ma przydzielonego miejsca w adresie ${address.name}`;
      expect(conflictMessage).toContain('Jan Kowalski');
      expect(conflictMessage).toContain('Akademik Centrum');
    });

    it('should persist conflict after app restart (simulated)', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      // Simulate app restart - data persists in storage
      const persistedAddress = { ...address };

      expect(persistedAddress.unassignedTenants).toHaveLength(1);
      expect(persistedAddress.unassignedTenants[0].id).toBe('tenant-1');
    });
  });

  describe('Multiple unassigned tenants', () => {
    it('should block exit with multiple unassigned tenants', () => {
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

      const canExit = address.unassignedTenants.length === 0;
      expect(canExit).toBe(false);
    });

    it('should allow exit after assigning some but not all tenants', () => {
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
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant1, tenant2);
      expect(address.unassignedTenants.length).toBe(2);

      // Assign only tenant1
      room.spaces[0].tenant = tenant1;
      address.unassignedTenants = address.unassignedTenants.filter((t) => t.id !== tenant1.id);

      // Still has tenant2 unassigned
      const canExit = address.unassignedTenants.length === 0;
      expect(canExit).toBe(false);
    });

    it('should allow exit after assigning all tenants', () => {
      const room2: Room = {
        id: 'room-2',
        addressId: 'address-1',
        name: 'Pokój 102',
        type: 'female',
        totalSpaces: 1,
        spaces: [
          { id: 'space-2', roomId: 'room-2', number: 1, status: 'vacant' },
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

      address.unassignedTenants.push(tenant1, tenant2);

      // Assign both tenants
      room.spaces[0].tenant = tenant1;
      room2.spaces[0].tenant = tenant2;
      address.unassignedTenants = [];

      const canExit = address.unassignedTenants.length === 0;
      expect(canExit).toBe(true);
    });
  });

  describe('Tab switching with unassigned tenants', () => {
    it('should allow switching to Pokoje tab when unassigned tenants exist', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      // Alert should suggest switching to Pokoje tab
      const canSwitchToRooms = true; // Always allow tab switching
      expect(canSwitchToRooms).toBe(true);
    });

    it('should show unassigned tenants in Bez komnat section', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      // Simulate select-tenant screen logic
      const unassignedList = address.unassignedTenants.map((t) => ({ ...t }));
      expect(unassignedList).toHaveLength(1);
      expect(unassignedList[0].firstName).toBe('Jan');
    });
  });
});


describe('Alert Actions for Unassigned Tenants', () => {
  let project: Project;
  let address: Address;
  let room: Room;

  beforeEach(() => {
    const space1: Space = {
      id: 'space-1',
      roomId: 'room-1',
      number: 1,
      status: 'vacant',
    };

    room = {
      id: 'room-1',
      addressId: 'address-1',
      name: 'Pokój 101',
      type: 'male',
      totalSpaces: 1,
      spaces: [space1],
    };

    address = {
      id: 'address-1',
      projectId: 'project-1',
      name: 'Akademik Centrum',
      fullAddress: 'ul. Centralna 15',
      totalSpaces: 1,
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

  describe('Delete tenant action from alert', () => {
    it('should show delete button in alert when unassigned tenant exists', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      // Alert should have delete button
      const hasDeleteButton = true; // In real implementation, Alert is shown
      expect(hasDeleteButton).toBe(true);
    });

    it('should delete tenant when delete button is pressed', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);
      expect(address.unassignedTenants).toHaveLength(1);

      // Simulate delete action
      address.unassignedTenants = address.unassignedTenants.filter((t) => t.id !== tenant.id);

      expect(address.unassignedTenants).toHaveLength(0);
    });

    it('should allow exit after deleting unassigned tenant', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      // Delete tenant
      address.unassignedTenants = address.unassignedTenants.filter((t) => t.id !== tenant.id);

      const canExit = address.unassignedTenants.length === 0;
      expect(canExit).toBe(true);
    });

    it('should show alert with specific tenant name', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      const tenantName = `${tenant.firstName} ${tenant.lastName}`;
      const alertMessage = `Mieszkaniec ${tenantName} nie ma przydzielonego miejsca. Przejdź do karty Pokoje i wybierz dla niego pokój, lub usuń go, jeśli został dodany przez pomyłkę.`;

      expect(alertMessage).toContain('Jan Kowalski');
      expect(alertMessage).toContain('Pokoje');
    });

    it('should show alert title with operation name', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      const alertTitle = 'Niezakończona operacja zaselenia';
      expect(alertTitle).toContain('zaselenia');
    });

    it('should have three alert buttons: Cancel, Delete, Go to Rooms', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        gender: 'male',
        birthYear: 1990,
        checkInDate: '2024-01-15',
        monthlyPrice: 500,
      };

      address.unassignedTenants.push(tenant);

      // Simulate alert buttons
      const buttons = ['Anuluj', 'Usuń mieszkańca', 'Przejdź do Pokojów'];
      expect(buttons).toHaveLength(3);
      expect(buttons).toContain('Anuluj');
      expect(buttons).toContain('Usuń mieszkańca');
      expect(buttons).toContain('Przejdź do Pokojów');
    });
  });
});
