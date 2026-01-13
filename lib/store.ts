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
      amenities: {
        shower: false,
        toilet: false,
        wifi: false,
        stove: false,
        fridge: false,
      },
    });
  }

  // Auto-generate couple rooms (2 beds each)
  for (let i = 0; i < coupleRooms; i++) {
    const roomId = generateId();
    const spaces: Space[] = [];
    
    for (let j = 0; j < 2; j++) {
      spaces.push({
        id: generateId(),
        roomId,
        number: j + 1,
        status: 'vacant',
        tenant: null,
      });
    }

    rooms.push({
      id: roomId,
      addressId: '',
      name: `Pokój dla par ${i + 1}`,
      type: 'couple',
      totalSpaces: 2,
      spaces,
      amenities: {
        shower: false,
        toilet: false,
        wifi: false,
        stove: false,
        fridge: false,
      },
    });
  }

  const newAddress: Address = {
    ...restAddressData,
    id: generateId(),
    projectId,
    rooms,
    status: 'active',
    unassignedTenants: [],
    photos: [],
  };

  // Set addressId in rooms
  newAddress.rooms.forEach((r) => (r.addressId = newAddress.id));

  projects[projectIndex].addresses.push(newAddress);
  await saveData(projects);
  return newAddress;
};

export const updateAddress = async (projectId: string, addressId: string, updates: AddAddressFormData): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const currentAddress = projects[projectIndex].addresses[addressIndex];
  
  // Handle room management
  const currentRegularRooms = currentAddress.rooms.filter(r => r.type !== 'couple');
  const currentCoupleRooms = currentAddress.rooms.filter(r => r.type === 'couple');

  // Update regular rooms
  if (updates.regularRooms > currentRegularRooms.length) {
    const diff = updates.regularRooms - currentRegularRooms.length;
    for (let i = 0; i < diff; i++) {
      currentAddress.rooms.push({
        id: generateId(),
        addressId: currentAddress.id,
        name: `Pokój ${currentRegularRooms.length + i + 1}`,
        type: 'male',
        totalSpaces: 0,
        spaces: [],
        amenities: { shower: false, toilet: false, wifi: false, stove: false, fridge: false },
      });
    }
  } else if (updates.regularRooms < currentRegularRooms.length) {
    const diff = currentRegularRooms.length - updates.regularRooms;
    let removed = 0;
    for (let i = currentAddress.rooms.length - 1; i >= 0 && removed < diff; i--) {
      const room = currentAddress.rooms[i];
      const isEmpty = room.spaces.every(s => !s.tenant);
      if (room.type !== 'couple' && isEmpty) {
        currentAddress.rooms.splice(i, 1);
        removed++;
      }
    }
  }

  // Update couple rooms
  if (updates.coupleRooms > currentCoupleRooms.length) {
    const diff = updates.coupleRooms - currentCoupleRooms.length;
    for (let i = 0; i < diff; i++) {
      const roomId = generateId();
      const spaces: Space[] = [
        { id: generateId(), roomId, number: 1, status: 'vacant' },
        { id: generateId(), roomId, number: 2, status: 'vacant' }
      ];
      currentAddress.rooms.push({
        id: roomId,
        addressId: currentAddress.id,
        name: `Pokój dla par ${currentCoupleRooms.length + i + 1}`,
        type: 'couple',
        totalSpaces: 2,
        spaces,
        amenities: { shower: false, toilet: false, wifi: false, stove: false, fridge: false },
      });
    }
  } else if (updates.coupleRooms < currentCoupleRooms.length) {
    const diff = currentCoupleRooms.length - updates.coupleRooms;
    let removed = 0;
    for (let i = currentAddress.rooms.length - 1; i >= 0 && removed < diff; i--) {
      const room = currentAddress.rooms[i];
      const isEmpty = room.spaces.every(s => !s.tenant);
      if (room.type === 'couple' && isEmpty) {
        currentAddress.rooms.splice(i, 1);
        removed++;
      }
    }
  }

  projects[projectIndex].addresses[addressIndex] = {
    ...currentAddress,
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

  for (const room of address.rooms) {
    for (const space of room.spaces) {
      if (space.wypowiedzenie?.groupedWithAddress) {
        space.status = space.tenant ? 'occupied' : 'vacant';
        space.wypowiedzenie = undefined;
      }
    }
  }

  await saveData(projects);
};

export const updateProjectsOrder = async (projects: Project[]): Promise<void> => {
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
    spaces,
    amenities: roomData.amenities || {},
  };

  // If room type is 'couple', ensure 2 spaces are created
  if (newRoom.type === 'couple' && newRoom.spaces.length !== 2) {
    newRoom.spaces = [
      { id: generateId(), roomId: newRoom.id, number: 1, status: 'vacant' },
      { id: generateId(), roomId: newRoom.id, number: 2, status: 'vacant' },
    ];
    newRoom.totalSpaces = 2;
  }

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

  projects[projectIndex].addresses[addressIndex].rooms = projects[projectIndex].addresses[addressIndex].rooms.filter((r) => r.id !== roomId);
  await saveData(projects);
};

// CRUD operations for Spaces
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

  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex] = {
    ...projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex],
    ...updates,
  };
  await saveData(projects);
};

// CRUD operations for Tenants
export const addTenantToSpace = async (projectId: string, addressId: string, roomId: string, spaceId: string, tenant: Tenant): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const roomIndex = projects[projectIndex].addresses[addressIndex].rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  const spaceIndex = projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces.findIndex((s) => s.id === spaceId);
  if (spaceIndex === -1) throw new Error('Space not found');

  // Remove tenant from unassigned if they were there
  projects[projectIndex].addresses[addressIndex].unassignedTenants = projects[projectIndex].addresses[addressIndex].unassignedTenants.filter(t => t.id !== tenant.id);

  // Assign tenant to space
  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex].tenant = { ...tenant, spaceId };
  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex].status = 'occupied';

  await saveData(projects);
};

export const removeTenantFromSpace = async (projectId: string, addressId: string, roomId: string, spaceId: string): Promise<void> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const addressIndex = projects[projectIndex].addresses.findIndex((a) => a.id === addressId);
  if (addressIndex === -1) throw new Error('Address not found');

  const roomIndex = projects[projectIndex].addresses[addressIndex].rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) throw new Error('Room not found');

  const spaceIndex = projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces.findIndex((s) => s.id === spaceId);
  if (spaceIndex === -1) throw new Error('Space not found');

  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex].tenant = null;
  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex].status = 'vacant';
  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex].wypowiedzenie = undefined;

  await saveData(projects);
};

export const updateTenant = async (projectId: string, addressId: string, tenantId: string, updates: Partial<Tenant>): Promise<void> => {
  const projects = await loadData();
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find(a => a.id === addressId);
  if (!address) throw new Error('Address not found');

  let tenantFound = false;

  // Check unassigned tenants
  const unassignedTenantIndex = address.unassignedTenants.findIndex(t => t.id === tenantId);
  if (unassignedTenantIndex !== -1) {
    address.unassignedTenants[unassignedTenantIndex] = { ...address.unassignedTenants[unassignedTenantIndex], ...updates };
    tenantFound = true;
  }

  // Check assigned tenants
  if (!tenantFound) {
    for (const room of address.rooms) {
      const space = room.spaces.find(s => s.tenant?.id === tenantId);
      if (space && space.tenant) {
        space.tenant = { ...space.tenant, ...updates };
        tenantFound = true;
        break;
      }
    }
  }

  if (!tenantFound) throw new Error('Tenant not found');

  await saveData(projects);
};

export const putSpaceOnWypowiedzenie = async (
  projectId: string,
  addressId: string,
  roomId: string,
  spaceId: string,
  wypowiedzenieStartDate: string,
  wypowiedzenieEndDate: string,
  paidUntilDate: string
): Promise<void> => {
  const projects = await loadData();
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find(a => a.id === addressId);
  if (!address) throw new Error('Address not found');

  const room = address.rooms.find(r => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const space = room.spaces.find(s => s.id === spaceId);
  if (!space) throw new Error('Space not found');

  space.wypowiedzenie = {
    startDate: wypowiedzenieStartDate,
    endDate: wypowiedzenieEndDate,
    paidUntil: paidUntilDate,
  };
  space.status = 'wypowiedzenie';

  await saveData(projects);
};

export const removeSpaceFromWypowiedzenie = async (
  projectId: string,
  addressId: string,
  roomId: string,
  spaceId: string
): Promise<void> => {
  const projects = await loadData();
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find(a => a.id === addressId);
  if (!address) throw new Error('Address not found');

  const room = address.rooms.find(r => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const space = room.spaces.find(s => s.id === spaceId);
  if (!space) throw new Error('Space not found');

  space.wypowiedzenie = undefined;
  if (space.tenant) {
    space.status = 'occupied';
  } else {
    space.status = 'vacant';
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
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find(a => a.id === addressId);
  if (!address) throw new Error('Address not found');

  const room = address.rooms.find(r => r.id === roomId);
  if (!room) throw new Error('Room not found');

  const space = room.spaces.find(s => s.id === spaceId);
  if (!space) throw new Error('Space not found');

  if (!space.wypowiedzenie) throw new Error('Space is not on wypowiedzenie');

  // Calculate new end date based on address eviction period
  const addressEvictionPeriod = address.evictionPeriod || 14; // Default to 14 days
  const newEndDate = new Date(newStartDate);
  newEndDate.setDate(newEndDate.getDate() + addressEvictionPeriod);

  space.wypowiedzenie = {
    ...space.wypowiedzenie,
    startDate: newStartDate,
    endDate: newEndDate.toISOString().split('T')[0],
  };

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
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find(a => a.id === addressId);
  if (!address) throw new Error('Address not found');

  let tenantToArchive: Tenant | undefined;
  let spaceToVacate: Space | undefined;
  let roomName: string = '';

  // Remove tenant from unassignedTenants if they were there
  address.unassignedTenants = address.unassignedTenants.filter(t => {
    if (t.id === tenantId) {
      tenantToArchive = t;
      return false;
    }
    return true;
  });

  // Find and remove tenant from a space
  for (const room of address.rooms) {
    for (const space of room.spaces) {
      if (space.tenant && space.tenant.id === tenantId) {
        tenantToArchive = space.tenant;
        spaceToVacate = space;
        roomName = room.name;
        space.tenant = null;
        space.status = 'vacant';
        space.wypowiedzenie = undefined; // Clear wypowiedzenie status on eviction
        break;
      }
    }
    if (tenantToArchive) break;
  }

  if (!tenantToArchive) throw new Error('Tenant not found for eviction');

  // Add to eviction archive
  const archive = await loadEvictionArchive();
  archive.push({
    id: generateId(),
    tenantId: tenantToArchive.id,
    firstName: tenantToArchive.firstName,
    lastName: tenantToArchive.lastName,
    gender: tenantToArchive.gender,
    birthYear: tenantToArchive.birthYear,
    checkInDate: tenantToArchive.checkInDate,
    checkOutDate: checkoutDate,
    reason: reason,
    monthlyPrice: tenantToArchive.monthlyPrice,
    phone: tenantToArchive.phone,
    projectName: project.name,
    addressName: address.name,
    roomName: roomName,
  });
  await saveEvictionArchive(archive);

  await saveData(projects);
};
