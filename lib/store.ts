import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Address, Room, Space, Tenant, SpaceStats, ProjectStats, EvictionArchive, Conflict, ConflictType } from '@/types';

const STORAGE_KEY = 'housing_management_data';
const EVICTION_ARCHIVE_KEY = 'eviction_archive';

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Calculate space statistics
export const calculateSpaceStats = (spaces: Space[]): SpaceStats => {
  return spaces.reduce(
    (acc, space) => {
      acc.total++;
      switch (space.status) {
        case 'vacant':
          acc.vacant++;
          break;
        case 'occupied':
          acc.occupied++;
          if (space.tenant) {
            acc.peopleCount++;
          }
          break;
        case 'wypowiedzenie':
          acc.wypowiedzenie++;
          if (space.tenant) {
            acc.peopleCount++;
          }
          break;
      }
      return acc;
    },
    { total: 0, occupied: 0, vacant: 0, wypowiedzenie: 0, peopleCount: 0 }
  );
};

// Calculate project statistics
export const calculateProjectStats = (project: Project): ProjectStats => {
  const allSpaces = project.addresses.flatMap((addr) =>
    addr.rooms.flatMap((room) => room.spaces)
  );
  const stats = calculateSpaceStats(allSpaces);
  
  // Occupancy = (occupied + wypowiedzenie) / total
  const occupancyPercent = stats.total > 0 
    ? Math.round(((stats.occupied + stats.wypowiedzenie) / stats.total) * 100) 
    : 0;
  
  // Count conflicts
  const conflicts = getConflicts(project);
  const conflictCount = conflicts.length;
  
  return { ...stats, occupancyPercent, conflictCount };
};

// Calculate address statistics
export const calculateAddressStats = (address: Address): SpaceStats => {
  const allSpaces = address.rooms.flatMap((room) => room.spaces);
  return calculateSpaceStats(allSpaces);
};

// Calculate room statistics
export const calculateRoomStats = (room: Room): SpaceStats => {
  return calculateSpaceStats(room.spaces);
};

// Days remaining in wypowiedzenie
export const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Check if wypowiedzenie is overdue
export const isOverdue = (endDate: string): boolean => {
  return getDaysRemaining(endDate) < 0;
};

// Get all conflicts in project
export const getConflicts = (project: Project): Conflict[] => {
  const conflicts: Conflict[] = [];
  
  for (const address of project.addresses) {
    // Check unassigned tenants
    for (const tenant of address.unassignedTenants) {
      conflicts.push({
        id: generateId(),
        type: 'no_room',
        projectId: project.id,
        projectName: project.name,
        addressId: address.id,
        addressName: address.name,
        tenantId: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        message: `Określ pokój dla ${tenant.firstName} ${tenant.lastName}`,
      });
    }

    for (const room of address.rooms) {
      for (const space of room.spaces) {
        // Type 1: Tenant without room
        if (space.tenant && !space.tenant.spaceId) {
          conflicts.push({
            id: generateId(),
            type: 'no_room',
            projectId: project.id,
            projectName: project.name,
            addressId: address.id,
            addressName: address.name,
            tenantId: space.tenant.id,
            firstName: space.tenant.firstName,
            lastName: space.tenant.lastName,
            spaceId: space.id,
            message: `Określ pokój dla ${space.tenant.firstName} ${space.tenant.lastName}`,
          });
        }
        
        // Type 2: Tenant on wypowiedzenie with overdue end date
        if (space.tenant && space.status === 'wypowiedzenie' && space.wypowiedzenie) {
          if (isOverdue(space.wypowiedzenie.endDate)) {
            conflicts.push({
              id: generateId(),
              type: 'wypowiedzenie_overdue',
              projectId: project.id,
              projectName: project.name,
              addressId: address.id,
              addressName: address.name,
              tenantId: space.tenant.id,
              firstName: space.tenant.firstName,
              lastName: space.tenant.lastName,
              spaceId: space.id,
              message: `Zwolnij miejsce lub przenieś ${space.tenant.firstName} ${space.tenant.lastName}`,
            });
          }
        }
      }
    }
  }
  
  return conflicts;
};

// Storage functions
export const loadData = async (): Promise<Project[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
};

export const saveData = async (projects: Project[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Eviction Archive functions
export const loadEvictionArchive = async (): Promise<EvictionArchive[]> => {
  try {
    const data = await AsyncStorage.getItem(EVICTION_ARCHIVE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading eviction archive:', error);
    return [];
  }
};

export const saveEvictionArchive = async (archive: EvictionArchive[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(EVICTION_ARCHIVE_KEY, JSON.stringify(archive));
  } catch (error) {
    console.error('Error saving eviction archive:', error);
  }
};

export const addToEvictionArchive = async (
  tenant: Tenant,
  projectId: string,
  projectName: string,
  addressId: string,
  addressName: string,
  checkOutDate: string,
  reason: any
): Promise<void> => {
  const archive = await loadEvictionArchive();
  const entry: EvictionArchive = {
    id: generateId(),
    tenantId: tenant.id,
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    projectId,
    projectName,
    addressId,
    addressName,
    checkInDate: tenant.checkInDate,
    checkOutDate,
    reason,
    createdAt: new Date().toISOString(),
  };
  archive.push(entry);
  await saveEvictionArchive(archive);
};

export const clearEvictionArchive = async (): Promise<void> => {
  await saveEvictionArchive([]);
};

// CRUD operations for Projects
export const addProject = async (name: string, city?: string): Promise<Project> => {
  const projects = await loadData();
  const newProject: Project = {
    id: generateId(),
    name,
    city,
    addresses: [],
  };
  projects.push(newProject);
  await saveData(projects);
  return newProject;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  const projects = await loadData();
  const index = projects.findIndex((p) => p.id === projectId);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates };
    await saveData(projects);
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const projects = await loadData();
  const filtered = projects.filter((p) => p.id !== projectId);
  await saveData(filtered);
};

// CRUD operations for Addresses
export const addAddress = async (projectId: string, addressData: Omit<Address, 'id' | 'projectId' | 'rooms' | 'status'>): Promise<Address> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const newAddress: Address = {
    ...addressData,
    id: generateId(),
    projectId,
    rooms: [],
    status: 'active',
  };
  projects[projectIndex].addresses.push(newAddress);
  await saveData(projects);
  return newAddress;
};

export const updateAddress = async (projectId: string, addressId: string, updates: Partial<Address>): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  projects[projectIndex].addresses[addressIndex] = {
    ...projects[projectIndex].addresses[addressIndex],
    ...updates,
  };
  await saveData(projects);
};

export const deleteAddress = async (projectId: string, addressId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  projects[projectIndex].addresses = projects[projectIndex].addresses.filter((a) => a.id !== addressId);
  await saveData(projects);
};

// Put address on wypowiedzenie
export const putAddressOnWypowiedzenie = async (projectId: string, addressId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const address = projects[projectIndex].addresses[addressIndex];
  const evictionPeriod = address.evictionPeriod || 14;
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + evictionPeriod);

  address.status = 'wypowiedzenie';
  address.addressWypowiedzienieStart = startDate;

  // Put all non-wypowiedzenie spaces on wypowiedzenie
  for (const room of address.rooms) {
    for (const space of room.spaces) {
      if (space.status !== 'wypowiedzenie') {
        space.status = 'wypowiedzenie';
        space.wypowiedzenie = {
          startDate,
          endDate: endDate.toISOString().split('T')[0],
          paidUntil: endDate.toISOString().split('T')[0],
          groupedWithAddress: true,
        };
      }
    }
  }

  await saveData(projects);
};

// Remove address from wypowiedzenie
export const removeAddressFromWypowiedzenie = async (projectId: string, addressId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const address = projects[projectIndex].addresses[addressIndex];
  address.status = 'active';
  address.addressWypowiedzienieStart = undefined;

  // Remove wypowiedzenie only from spaces that were grouped with address
  for (const room of address.rooms) {
    for (const space of room.spaces) {
      if (space.wypowiedzenie?.groupedWithAddress) {
        space.status = 'vacant';
        space.tenant = undefined;
        space.wypowiedzenie = undefined;
      }
    }
  }

  await saveData(projects);
};

// CRUD operations for Rooms
export const addRoom = async (
  projectId: string,
  addressId: string,
  roomData: { name: string; type: Room['type']; totalSpaces: number; amenities?: any }
): Promise<Room> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const spaces: Space[] = Array.from({ length: roomData.totalSpaces }, (_, i) => ({
    id: generateId(),
    roomId: '',
    number: i + 1,
    status: 'vacant',
  }));

  const newRoom: Room = {
    id: generateId(),
    addressId,
    name: roomData.name,
    type: roomData.type,
    totalSpaces: roomData.totalSpaces,
    spaces: [],
    amenities: roomData.amenities,
  };

  // Update room ID in spaces
  newRoom.spaces = spaces.map((s) => ({ ...s, roomId: newRoom.id }));

  projects[projectIndex].addresses[addressIndex].rooms.push(newRoom);
  await saveData(projects);
  return newRoom;
};

export const updateRoom = async (projectId: string, addressId: string, roomId: string, updates: Partial<Room>): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const roomIndex = projects[projectIndex].addresses[addressIndex].rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  projects[projectIndex].addresses[addressIndex].rooms[roomIndex] = {
    ...projects[projectIndex].addresses[addressIndex].rooms[roomIndex],
    ...updates,
  };
  await saveData(projects);
};

export const deleteRoom = async (projectId: string, addressId: string, roomId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  projects[projectIndex].addresses[addressIndex].rooms = projects[projectIndex].addresses[addressIndex].rooms.filter(
    (r) => r.id !== roomId
  );
  await saveData(projects);
};

// CRUD operations for Spaces (Places)
export const deleteSpace = async (projectId: string, addressId: string, roomId: string, spaceId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const roomIndex = projects[projectIndex].addresses[addressIndex].rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  const room = projects[projectIndex].addresses[addressIndex].rooms[roomIndex];
  const spaceIndex = room.spaces.findIndex((s) => s.id === spaceId);
  if (spaceIndex === -1) throw new Error('Space not found');

  // Can only delete vacant spaces
  if (room.spaces[spaceIndex].status !== 'vacant') {
    throw new Error('Can only delete vacant spaces');
  }

  room.spaces = room.spaces.filter((s) => s.id !== spaceId);
  await saveData(projects);
};

// Put space on wypowiedzenie
export const putSpaceOnWypowiedzenie = async (
  projectId: string,
  addressId: string,
  roomId: string,
  spaceId: string,
  evictionPeriod: number = 14
): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const roomIndex = projects[projectIndex].addresses[addressIndex].rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  const spaceIndex = projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces.findIndex(
    (s) => s.id === spaceId
  );
  if (spaceIndex === -1) throw new Error('Space not found');

  const space = projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex];
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + evictionPeriod);

  space.status = 'wypowiedzenie';
  space.wypowiedzenie = {
    startDate,
    endDate: endDate.toISOString().split('T')[0],
    paidUntil: endDate.toISOString().split('T')[0],
    groupedWithAddress: false,
  };

  await saveData(projects);
};

// Remove space from wypowiedzenie
export const removeSpaceFromWypowiedzenie = async (
  projectId: string,
  addressId: string,
  roomId: string,
  spaceId: string
): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const roomIndex = projects[projectIndex].addresses[addressIndex].rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  const spaceIndex = projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces.findIndex(
    (s) => s.id === spaceId
  );
  if (spaceIndex === -1) throw new Error('Space not found');

  const space = projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex];
  space.status = space.tenant ? 'occupied' : 'vacant';
  space.wypowiedzenie = undefined;

  await saveData(projects);
};

// Check-in tenant (without room initially)
export const checkInTenant = async (
  projectId: string,
  addressId: string,
  tenantData: Omit<Tenant, 'id' | 'spaceId'>
): Promise<Tenant> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const newTenant: Tenant = {
    ...tenantData,
    id: generateId(),
    // spaceId is undefined initially
  };

  // Store tenant in a temporary location or in the first space
  // For now, we'll add to address's first room's first space
  if (projects[projectIndex].addresses[addressIndex].rooms.length > 0) {
    const firstRoom = projects[projectIndex].addresses[addressIndex].rooms[0];
    if (firstRoom.spaces.length > 0) {
      const firstSpace = firstRoom.spaces[0];
      newTenant.spaceId = firstSpace.id;
      firstSpace.tenant = newTenant;
      firstSpace.status = 'occupied';
    }
  }

  await saveData(projects);
  return newTenant;
};

// Assign tenant to space (move between rooms)
export const assignTenantToSpace = async (
  projectId: string,
  addressId: string,
  tenantId: string,
  newSpaceId: string
): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const address = projects[projectIndex].addresses[addressIndex];
  let tenant: Tenant | undefined;
  let oldSpaceId: string | undefined;

  // Find tenant and remove from old space
  for (const room of address.rooms) {
    for (const space of room.spaces) {
      if (space.tenant?.id === tenantId) {
        tenant = space.tenant;
        oldSpaceId = space.id;
        space.tenant = undefined;
        space.status = 'vacant';
        break;
      }
    }
    if (tenant) break;
  }

  if (!tenant) throw new Error('Tenant not found');

  // Assign to new space
  for (const room of address.rooms) {
    for (const space of room.spaces) {
      if (space.id === newSpaceId) {
        tenant.spaceId = newSpaceId;
        space.tenant = tenant;
        space.status = 'occupied';
        break;
      }
    }
  }

  await saveData(projects);
};

// Check-out tenant (eviction)
export const checkOutTenant = async (
  projectId: string,
  addressId: string,
  tenantId: string,
  checkoutDate: string,
  reason: any
): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const address = projects[projectIndex].addresses[addressIndex];
  let tenant: Tenant | undefined;
  let spaceId: string | undefined;

  // Find and remove tenant
  for (const room of address.rooms) {
    for (const space of room.spaces) {
      if (space.tenant?.id === tenantId) {
        tenant = space.tenant;
        spaceId = space.id;
        space.tenant = undefined;
        space.status = 'vacant';
        break;
      }
    }
    if (tenant) break;
  }

  if (!tenant) throw new Error('Tenant not found');

  // Add to eviction archive
  await addToEvictionArchive(tenant, projectId, projects[projectIndex].name, addressId, address.name, checkoutDate, reason);

  await saveData(projects);
};

// Get tenant history (all addresses where tenant lived)
export const getTenantHistory = async (projectId: string, tenantId: string): Promise<any[]> => {
  const projects = await loadData();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return [];

  const history: any[] = [];

  // Check current addresses
  for (const address of project.addresses) {
    for (const room of address.rooms) {
      for (const space of room.spaces) {
        if (space.tenant?.id === tenantId) {
          history.push({
            addressName: address.name,
            checkInDate: space.tenant.checkInDate,
            checkOutDate: null,
            status: 'active',
          });
        }
      }
    }
  }

  // Check eviction archive
  const archive = await loadEvictionArchive();
  const archivedEntries = archive.filter((e) => e.tenantId === tenantId);
  for (const entry of archivedEntries) {
    history.push({
      addressName: entry.addressName,
      checkInDate: entry.checkInDate,
      checkOutDate: entry.checkOutDate,
      status: 'archived',
      reason: entry.reason,
    });
  }

  // Sort by date (newest first)
  history.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

  return history;
};

// Get demo data for initial setup
export const initializeDemoData = async (): Promise<void> => {
  const existingData = await loadData();
  if (existingData.length > 0) return;

  const demoProjects: Project[] = [
    {
      id: generateId(),
      name: 'Project Alpha',
      city: 'Warszawa',
      addresses: [
        {
          id: generateId(),
          projectId: '',
          name: 'Akademik Centrum',
          fullAddress: 'ul. Centralna 15',
          totalSpaces: 20,
          coupleRooms: 2,
          companyName: 'E-Port',
          ownerName: 'Jan Kowalski',
          phone: '+48 123 456 789',
          evictionPeriod: 14,
          totalCost: 10000,
          pricePerSpace: 500,
          couplePrice: 800,
          photos: [],
          unassignedTenants: [],
          rooms: [
            {
              id: generateId(),
              addressId: '',
              name: '101',
              type: 'male',
              totalSpaces: 4,
              spaces: [
                { id: generateId(), roomId: '', number: 1, status: 'occupied', tenant: { id: generateId(), firstName: 'Anna', lastName: 'Petrov', gender: 'female', birthYear: 1990, checkInDate: '2024-01-15', spaceId: '', monthlyPrice: 500 } },
                { id: generateId(), roomId: '', number: 2, status: 'occupied', tenant: { id: generateId(), firstName: 'Maria', lastName: 'Sidorova', gender: 'female', birthYear: 1985, checkInDate: '2024-02-01', spaceId: '', monthlyPrice: 500 } },
                { id: generateId(), roomId: '', number: 3, status: 'wypowiedzenie', wypowiedzenie: { startDate: '2024-12-20', endDate: '2025-01-03', paidUntil: '2025-01-03' } },
                { id: generateId(), roomId: '', number: 4, status: 'vacant' },
              ],
            },
            {
              id: generateId(),
              addressId: '',
              name: '102',
              type: 'female',
              totalSpaces: 4,
              spaces: [
                { id: generateId(), roomId: '', number: 1, status: 'occupied', tenant: { id: generateId(), firstName: 'Petr', lastName: 'Ivanov', gender: 'male', birthYear: 1988, checkInDate: '2024-03-10', spaceId: '', monthlyPrice: 500 } },
                { id: generateId(), roomId: '', number: 2, status: 'vacant' },
                { id: generateId(), roomId: '', number: 3, status: 'vacant' },
                { id: generateId(), roomId: '', number: 4, status: 'occupied', tenant: { id: generateId(), firstName: 'Oleg', lastName: 'Kozlov', gender: 'male', birthYear: 1992, checkInDate: '2024-11-01', spaceId: '', monthlyPrice: 500 } },
              ],
            },
          ],
          status: 'active',
        },
      ],
    },
    {
      id: generateId(),
      name: 'Project Beta',
      city: 'Kraków',
      addresses: [],
    },
    {
      id: generateId(),
      name: 'Project Gamma',
      city: 'Gdańsk',
      addresses: [],
    },
    {
      id: generateId(),
      name: 'Project Delta',
      city: 'Wrocław',
      addresses: [],
    },
  ];

  // Fix references
  for (const project of demoProjects) {
    for (const address of project.addresses) {
      address.projectId = project.id;
      for (const room of address.rooms) {
        room.addressId = address.id;
        for (const space of room.spaces) {
          space.roomId = room.id;
          if (space.tenant) {
            space.tenant.spaceId = space.id;
          }
        }
      }
    }
  }

  await saveData(demoProjects);
};
