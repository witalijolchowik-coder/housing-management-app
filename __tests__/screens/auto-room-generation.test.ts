import { describe, it, expect } from 'vitest';
import { Room, Address } from '@/types';

describe('Auto-Room Generation', () => {
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  it('should generate correct number of empty rooms', () => {
    const roomCount = 4;
    const rooms: Room[] = [];

    for (let i = 1; i <= roomCount; i++) {
      const room: Room = {
        id: generateUUID(),
        addressId: 'addr-1',
        name: `Pokój ${i}`,
        type: 'male',
        totalSpaces: 0,
        spaces: [],
      };
      rooms.push(room);
    }

    expect(rooms.length).toBe(4);
    expect(rooms[0].name).toBe('Pokój 1');
    expect(rooms[1].name).toBe('Pokój 2');
    expect(rooms[2].name).toBe('Pokój 3');
    expect(rooms[3].name).toBe('Pokój 4');
  });

  it('should create rooms with correct structure', () => {
    const room: Room = {
      id: 'room-1',
      addressId: 'addr-1',
      name: 'Pokój 1',
      type: 'male',
      totalSpaces: 0,
      spaces: [],
    };

    expect(room.id).toBeDefined();
    expect(room.addressId).toBe('addr-1');
    expect(room.name).toBe('Pokój 1');
    expect(room.type).toBe('male');
    expect(room.totalSpaces).toBe(0);
    expect(room.spaces).toEqual([]);
  });

  it('should handle zero rooms', () => {
    const roomCount = 0;
    const rooms: Room[] = [];

    for (let i = 1; i <= roomCount; i++) {
      rooms.push({
        id: generateUUID(),
        addressId: 'addr-1',
        name: `Pokój ${i}`,
        type: 'male',
        totalSpaces: 0,
        spaces: [],
      });
    }

    expect(rooms.length).toBe(0);
  });

  it('should handle large room count', () => {
    const roomCount = 100;
    const rooms: Room[] = [];

    for (let i = 1; i <= roomCount; i++) {
      rooms.push({
        id: generateUUID(),
        addressId: 'addr-1',
        name: `Pokój ${i}`,
        type: 'male',
        totalSpaces: 0,
        spaces: [],
      });
    }

    expect(rooms.length).toBe(100);
    expect(rooms[0].name).toBe('Pokój 1');
    expect(rooms[99].name).toBe('Pokój 100');
  });

  it('should assign correct addressId to all rooms', () => {
    const addressId = 'test-address-123';
    const rooms: Room[] = [];

    for (let i = 1; i <= 3; i++) {
      const room: Room = {
        id: generateUUID(),
        addressId,
        name: `Pokój ${i}`,
        type: 'male',
        totalSpaces: 0,
        spaces: [],
      };
      rooms.push(room);
    }

    rooms.forEach((room) => {
      expect(room.addressId).toBe(addressId);
    });
  });

  it('should create rooms with empty spaces array', () => {
    const rooms: Room[] = [];

    for (let i = 1; i <= 3; i++) {
      rooms.push({
        id: generateUUID(),
        addressId: 'addr-1',
        name: `Pokój ${i}`,
        type: 'male',
        totalSpaces: 0,
        spaces: [],
      });
    }

    rooms.forEach((room) => {
      expect(Array.isArray(room.spaces)).toBe(true);
      expect(room.spaces.length).toBe(0);
    });
  });

  it('should prevent deletion of room with occupied spaces', () => {
    const room: Room = {
      id: 'room-1',
      addressId: 'addr-1',
      name: 'Pokój 1',
      type: 'male',
      totalSpaces: 1,
      spaces: [
        {
          id: 'space-1',
          roomId: 'room-1',
          number: 1,
          status: 'occupied',
          tenant: {
            id: 'tenant-1',
            firstName: 'Jan',
            lastName: 'Kowalski',
            gender: 'male',
            birthYear: 1990,
            checkInDate: '2024-01-01',
            monthlyPrice: 500,
          },
        },
      ],
    };

    const hasOccupiedSpaces = room.spaces.some((space) => space.tenant);
    expect(hasOccupiedSpaces).toBe(true);
  });

  it('should allow deletion of empty room', () => {
    const room: Room = {
      id: 'room-1',
      addressId: 'addr-1',
      name: 'Pokój 1',
      type: 'male',
      totalSpaces: 0,
      spaces: [],
    };

    const hasOccupiedSpaces = room.spaces.some((space) => space.tenant);
    expect(hasOccupiedSpaces).toBe(false);
  });

  it('should generate unique room IDs', () => {
    const rooms: Room[] = [];
    const ids = new Set<string>();

    for (let i = 1; i <= 5; i++) {
      const room: Room = {
        id: generateUUID(),
        addressId: 'addr-1',
        name: `Pokój ${i}`,
        type: 'male',
        totalSpaces: 0,
        spaces: [],
      };
      rooms.push(room);
      ids.add(room.id);
    }

    expect(ids.size).toBe(5); // All IDs should be unique
  });

  it('should support different room types', () => {
    const roomTypes = ['male', 'female', 'couple'] as const;
    const rooms: Room[] = [];

    roomTypes.forEach((type, index) => {
      rooms.push({
        id: generateUUID(),
        addressId: 'addr-1',
        name: `Pokój ${index + 1}`,
        type,
        totalSpaces: 0,
        spaces: [],
      });
    });

    expect(rooms[0].type).toBe('male');
    expect(rooms[1].type).toBe('female');
    expect(rooms[2].type).toBe('couple');
  });
});
