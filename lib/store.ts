import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Address, Room, Space, Tenant, SpaceStats, ProjectStats, EvictionArchive, Conflict, ConflictType, AddAddressFormData, EvictionArchiveEntry, EvictionReason } from './types';

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
      
      const isWolne = space.status === 'vacant' || (space.status === 'wypowiedzenie' && !space.tenant);
      
      if (isWolne) {
        acc.vacant++;
      } else {
        acc.occupied++;
      }

      if (space.status === 'wypowiedzenie') {
        acc.wypowiedzenie++;
      }

      if (space.tenant) {
        acc.peopleCount++;
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
  
  const occupancyPercent = stats.total > 0 
    ? Math.round((stats.occupied / stats.total) * 100) 
    : 0;
  
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
    for (const tenant of address.unassignedTenants || []) {
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
        const isWholeAddress = address.isWholeAddress;

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

        if (!isWholeAddress && space.status === 'vacant' && !space.tenant) {
          conflicts.push({
            id: generateId(),
            type: 'no_room',
            projectId: project.id,
            projectName: project.name,
            addressId: address.id,
            addressName: address.name,
            tenantId: 'empty-' + space.id,
            firstName: 'Miejsce',
            lastName: 'puste',
            spaceId: space.id,
            message: `Miejsce niezajęte i nie postawione na Wyp. — proszę kogoś zakwaterować lub ustawić Wyp.`,
          });
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
export const loadEvictionArchive = async (): Promise<EvictionArchiveEntry[]> => {
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

export const saveEvictionArchive = async (archive: EvictionArchiveEntry[]): Promise<void> => {
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
  roomName: string | undefined,
  checkOutDate: string,
  reason: EvictionReason
): Promise<void> => {
  const archive = await loadEvictionArchive();
  const entry: EvictionArchiveEntry = {
    id: generateId(),
    tenantId: tenant.id,
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    gender: tenant.gender,
    birthYear: tenant.birthYear,
    monthlyPrice: tenant.monthlyPrice,
    phone: tenant.phone,
    projectId,
    projectName,
    addressId,
    addressName,
    roomName,
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

export const restoreTenantFromArchive = async (
  archiveEntryId: string,
  projectId: string,
  addressId: string
): Promise<void> => {
  const archive = await loadEvictionArchive();
  const entryIndex = archive.findIndex(e => e.id === archiveEntryId);

  if (entryIndex === -1) {
    throw new Error('Archive entry not found');
  }

  const [entry] = archive.splice(entryIndex, 1);
  await saveEvictionArchive(archive);

  const projects = await loadData();
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find(a => a.id === addressId);
  if (!address) throw new Error('Address not found');

  const newTenant: Tenant = {
    id: entry.tenantId || generateId(),
    firstName: entry.firstName || 'Nieznany',
    lastName: entry.lastName || 'Mieszkaniec',
    gender: entry.gender || 'male',
    birthYear: entry.birthYear || 1995,
    checkInDate: new Date().toISOString().split('T')[0], // Set current date as check-in
    monthlyPrice: entry.monthlyPrice || 0,
    phone: entry.phone,
  };

  address.unassignedTenants.push(newTenant);
  await saveData(projects);
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
export const addAddress = async (projectId: string, addressData: AddAddressFormData): Promise<Address> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const { regularRooms = 0, coupleRooms = 0, ...restAddressData } = addressData;
  const rooms: Room[] = [];

  // Auto-generate regular (empty) rooms
  for (let i = 0; i < regularRooms; i++) {
    const roomId = generateId();
    rooms.push({
      id: roomId,
      addressId: '', // Will be set below
      name: `Pokój ${i + 1}`,
      type: 'male',
      totalSpaces: 0,
      spaces: [],
    });
  }

  // Auto-generate couple rooms
  for (let i = 0; i < coupleRooms; i++) {
    const roomId = generateId();
    rooms.push({
      id: roomId,
      addressId: '', // Will be set below
      name: `Pokój dla par ${i + 1}`,
      type: 'couple',
      totalSpaces: 0,
      spaces: [],
    });
  }

  const newAddress: Address = {
    id: generateId(),
    projectId,
    name: restAddressData.name,
    street: restAddressData.street,
    houseNumber: restAddressData.houseNumber,
    postalCode: restAddressData.postalCode,
    city: restAddressData.city,
    totalSpaces: restAddressData.totalSpaces || 0,
    wypowiedzeniePeriod: restAddressData.wypowiedzeniePeriod || 14,
    rooms: rooms,
    unassignedTenants: [],
    isWholeAddress: restAddressData.isWholeAddress || false,
    operator: restAddressData.operator || '',
  };

  // Set addressId for rooms and spaces
  newAddress.rooms.forEach(room => {
    room.addressId = newAddress.id;
    room.spaces.forEach(space => space.roomId = room.id);
  });

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

  projects[projectIndex].addresses[addressIndex] = { ...projects[projectIndex].addresses[addressIndex], ...updates };
  await saveData(projects);
};

export const deleteAddress = async (projectId: string, addressId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  projects[projectIndex].addresses = projects[projectIndex].addresses.filter((a) => a.id !== addressId);
  await saveData(projects);
};

// CRUD operations for Rooms
export const addRoom = async (projectId: string, addressId: string, roomData: Omit<Room, 'id' | 'addressId' | 'spaces'> & { spacesCount: number }): Promise<Room> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const newRoom: Room = {
    id: generateId(),
    addressId,
    name: roomData.name,
    type: roomData.type,
    totalSpaces: roomData.spacesCount,
    spaces: Array.from({ length: roomData.spacesCount }, (_, i) => ({
      id: generateId(),
      roomId: '', // Will be set below
      number: i + 1,
      status: 'vacant',
      tenant: null,
    })),
  };
  newRoom.spaces.forEach(space => space.roomId = newRoom.id);

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

  projects[projectIndex].addresses[addressIndex].rooms[roomIndex] = { ...projects[projectIndex].addresses[addressIndex].rooms[roomIndex], ...updates };
  await saveData(projects);
};

export const deleteRoom = async (projectId: string, addressId: string, roomId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  projects[projectIndex].addresses[addressIndex].rooms = projects[projectIndex].addresses[addressIndex].rooms.filter((r) => r.id !== roomId);
  await saveData(projects);
};

// CRUD operations for Spaces
export const addSpace = async (projectId: string, addressId: string, roomId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const address = projects[projectIndex].addresses[addressIndex];

  const roomIndex = address.rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  const room = address.rooms[roomIndex];

  // Check if adding a space exceeds the address's totalSpaces limit
  const currentTotalSpacesInAddress = address.rooms.reduce((sum, r) => sum + r.totalSpaces, 0);
  if (currentTotalSpacesInAddress + 1 > address.totalSpaces) {
    // If it exceeds, ask the user if they want to increase the address's totalSpaces
    // This logic will be handled in the UI, here we just throw an error
    throw new Error('Przekroczono limit miejsc w adresie. Zwiększ limit miejsc w ustawieniach adresu lub anuluj.');
  }

  const newSpace: Space = {
    id: generateId(),
    roomId: room.id,
    number: room.spaces.length + 1,
    status: 'vacant',
    tenant: null,
  };

  room.spaces.push(newSpace);
  room.totalSpaces++;
  await saveData(projects);
};

export const removeSpace = async (projectId: string, addressId: string, roomId: string, spaceId: string): Promise<void> => {
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

  if (room.spaces[spaceIndex].tenant) {
    throw new Error('Nie można usunąć zajętego miejsca. Najpierw wymelduj mieszkańca.');
  }

  room.spaces.splice(spaceIndex, 1);
  room.totalSpaces--;
  // Re-number remaining spaces
  room.spaces.forEach((space, index) => {
    space.number = index + 1;
  });
  await saveData(projects);
};

export const updateSpace = async (projectId: string, addressId: string, roomId: string, spaceId: string, updates: Partial<Space>): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const roomIndex = projects[projectIndex].addresses[addressIndex].rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  const spaceIndex = projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces.findIndex((s) => s.id === spaceId);
  if (spaceIndex === -1) throw new Error('Space not found');

  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex] = { ...projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex], ...updates };
  await saveData(projects);
};

// CRUD operations for Tenants
export const addTenant = async (projectId: string, addressId: string, tenantData: Omit<Tenant, 'id'>): Promise<Tenant> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const newTenant: Tenant = {
    id: generateId(),
    ...tenantData,
  };

  projects[projectIndex].addresses[addressIndex].unassignedTenants.push(newTenant);
  await saveData(projects);
  return newTenant;
};

export const updateTenant = async (projectId: string, addressId: string, tenantId: string, updates: Partial<Tenant>): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  // Check unassigned tenants first
  const unassignedTenantIndex = projects[projectIndex].addresses[addressIndex].unassignedTenants.findIndex(t => t.id === tenantId);
  if (unassignedTenantIndex !== -1) {
    projects[projectIndex].addresses[addressIndex].unassignedTenants[unassignedTenantIndex] = { ...projects[projectIndex].addresses[addressIndex].unassignedTenants[unassignedTenantIndex], ...updates };
    await saveData(projects);
    return;
  }

  // Then check assigned tenants in spaces
  for (const room of projects[projectIndex].addresses[addressIndex].rooms) {
    const space = room.spaces.find(s => s.tenant?.id === tenantId);
    if (space && space.tenant) {
      space.tenant = { ...space.tenant, ...updates };
      await saveData(projects);
      return;
    }
  }

  throw new Error('Tenant not found');
};

export const deleteTenant = async (projectId: string, addressId: string, tenantId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  // Remove from unassigned tenants
  projects[projectIndex].addresses[addressIndex].unassignedTenants = projects[projectIndex].addresses[addressIndex].unassignedTenants.filter(t => t.id !== tenantId);

  // Remove from spaces if assigned
  for (const room of projects[projectIndex].addresses[addressIndex].rooms) {
    for (const space of room.spaces) {
      if (space.tenant?.id === tenantId) {
        space.tenant = null;
        space.status = 'vacant';
        space.wypowiedzenie = undefined;
      }
    }
  }
  await saveData(projects);
};

export const assignTenantToSpace = async (projectId: string, addressId: string, roomId: string, spaceId: string, tenantId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const roomIndex = projects[projectIndex].addresses[addressIndex].rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  const spaceIndex = projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces.findIndex((s) => s.id === spaceId);
  if (spaceIndex === -1) throw new Error('Space not found');

  const tenantIndex = projects[projectIndex].addresses[addressIndex].unassignedTenants.findIndex(t => t.id === tenantId);
  if (tenantIndex === -1) throw new Error('Tenant not found in unassigned list');

  const tenantToAssign = projects[projectIndex].addresses[addressIndex].unassignedTenants[tenantIndex];

  // Check if the space is already occupied
  if (projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex].tenant) {
    throw new Error('Miejsce jest już zajęte.');
  }

  // Assign tenant to space
  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex].tenant = {
    ...tenantToAssign,
    spaceId: spaceId, // Link tenant to the space
  };
  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex].status = 'occupied';

  // Remove tenant from unassigned list
  projects[projectIndex].addresses[addressIndex].unassignedTenants.splice(tenantIndex, 1);

  await saveData(projects);
};

export const evictTenant = async (
  projectId: string,
  addressId: string,
  tenantId: string,
  checkoutDate: string,
  reason: EvictionReason
): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const address = projects[projectIndex].addresses[addressIndex];

  let evictedTenant: Tenant | null = null;
  let roomName: string | undefined = undefined;

  for (const room of address.rooms) {
    const space = room.spaces.find(s => s.tenant?.id === tenantId);
    if (space && space.tenant) {
      evictedTenant = space.tenant;
      roomName = room.name;

      // Add to eviction archive
      await addToEvictionArchive(
        evictedTenant,
        projectId,
        projects[projectIndex].name,
        addressId,
        address.name,
        roomName,
        checkoutDate,
        reason
      );

      // Clear tenant from space
      space.tenant = null;
      space.status = 'vacant';
      space.wypowiedzenie = undefined;
      break;
    }
  }

  if (!evictedTenant) {
    throw new Error('Tenant not found in any space');
  }

  await saveData(projects);
};

export const updateSpaceWypowiedzenieStartDate = async (
  projectId: string,
  addressId: string,
  roomId: string,
  spaceId: string,
  newStartDate: string
): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const address = projects[projectIndex].addresses[addressIndex];

  const roomIndex = address.rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  const room = address.rooms[roomIndex];
  const spaceIndex = room.spaces.findIndex((s) => s.id === spaceId);

  if (spaceIndex === -1) throw new Error('Space not found');

  const space = room.spaces[spaceIndex];

  if (!space.wypowiedzenie) {
    throw new Error('Space is not on wypowiedzenie');
  }

  const wypowiedzeniePeriod = address.wypowiedzeniePeriod || 14; // Default to 14 days
  const startDate = new Date(newStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + wypowiedzeniePeriod);

  space.wypowiedzenie.startDate = newStartDate;
  space.wypowiedzenie.endDate = endDate.toISOString().split('T')[0];

  await saveData(projects);
};

export const updateAddressTotalSpaces = async (
  projectId: string,
  addressId: string,
  newTotalSpaces: number
): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  projects[projectIndex].addresses[addressIndex].totalSpaces = newTotalSpaces;
  await saveData(projects);
};
