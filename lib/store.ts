import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Address, Room, Space, Tenant, SpaceStats, ProjectStats, Conflict, AddAddressFormData, EvictionArchiveEntry, EvictionReason, ResidenceHistoryEntry } from '@/types';

const STORAGE_KEY = 'housing_management_data';
const EVICTION_ARCHIVE_KEY = 'eviction_archive';

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const todayISO = (): string => new Date().toISOString().split('T')[0];

const toISODate = (date: Date): string => date.toISOString().split('T')[0];

const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return toISODate(date);
};

const isValidDateString = (dateString?: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
};

const compareDates = (left?: string, right?: string): number => {
  if (!left || !right) return 0;
  return new Date(left).getTime() - new Date(right).getTime();
};

const getNoticePeriod = (address: Address): number => {
  return address.evictionPeriod || address.wypowiedzeniePeriod || 14;
};

const getAddressActualSpaces = (address: Address): Space[] => {
  return (address.rooms || []).flatMap((room) => room.spaces || []);
};

const getSpaceUnitCost = (address: Address): number => {
  const paidCapacity = Math.max(1, address.totalSpaces || getAddressActualSpaces(address).length || 1);
  return address.totalCost > 0 ? address.totalCost / paidCapacity : address.pricePerSpace || 0;
};

const isNoticeActive = (space: Space, asOf = todayISO()): boolean => {
  if (!space.wypowiedzenie?.endDate) return space.status === 'wypowiedzenie';
  return compareDates(space.wypowiedzenie.endDate, asOf) >= 0;
};

const isSpacePaid = (space: Space, asOf = todayISO()): boolean => {
  if (space.status === 'inactive') return false;
  if (space.tenant) return true;
  if (space.status === 'wypowiedzenie') return isNoticeActive(space, asOf);
  return true;
};

const normalizeTenant = (tenant: Tenant): Tenant => ({
  ...tenant,
  monthlyPrice: Number(tenant.monthlyPrice) || 0,
  residenceHistory: tenant.residenceHistory || [],
});

const normalizeProjects = (projects: Project[]): Project[] => {
  return projects.map((project) => ({
    ...project,
    addresses: (project.addresses || []).map((address) => {
      const normalizedAddress: Address = {
        ...address,
        fullAddress: address.fullAddress || [address.street, address.zipCode, address.city].filter(Boolean).join(', '),
        totalSpaces: Number(address.totalSpaces) || 0,
        coupleRooms: Number(address.coupleRooms) || 0,
        evictionPeriod: getNoticePeriod(address),
        totalCost: Number(address.totalCost) || 0,
        pricePerSpace: Number(address.pricePerSpace) || 0,
        couplePrice: Number(address.couplePrice) || 0,
        mediaFee: Number(address.mediaFee) || 0,
        rooms: address.rooms || [],
        unassignedTenants: (address.unassignedTenants || []).map(normalizeTenant),
        photos: address.photos || [],
        status: address.status || 'active',
      };

      normalizedAddress.rooms = normalizedAddress.rooms.map((room) => ({
        ...room,
        addressId: normalizedAddress.id,
        totalSpaces: Math.max(Number(room.totalSpaces) || 0, (room.spaces || []).length),
        spaces: (room.spaces || []).map((space, index) => {
          const normalizedSpace: Space = {
            ...space,
            roomId: room.id,
            number: space.number || index + 1,
            tenant: space.tenant ? normalizeTenant({ ...space.tenant, spaceId: space.id }) : null,
          };

          if (normalizedSpace.status !== 'inactive' && normalizedSpace.status !== 'wypowiedzenie') {
            normalizedSpace.status = normalizedSpace.tenant ? 'occupied' : 'vacant';
          }

          if (normalizedSpace.status === 'wypowiedzenie' && !normalizedSpace.tenant && !isNoticeActive(normalizedSpace)) {
            normalizedSpace.status = 'inactive';
          }

          return normalizedSpace;
        }),
      }));

      const actualSpaces = getAddressActualSpaces(normalizedAddress).length;
      normalizedAddress.totalSpaces = Math.max(normalizedAddress.totalSpaces, actualSpaces);
      return normalizedAddress;
    }),
  }));
};

// Calculate space statistics
export const calculateSpaceStats = (spaces: Space[], address?: Address): SpaceStats => {
  const unitCost = address ? getSpaceUnitCost(address) : 0;

  return spaces.reduce(
    (acc, space) => {
      acc.total++;

      const paid = isSpacePaid(space);
      if (paid) acc.paid++;
      if (space.status === 'inactive') acc.inactive++;

      if (space.tenant) {
        acc.occupied++;
        acc.peopleCount++;
        acc.workerCharges += Number(space.tenant.monthlyPrice) || 0;
      } else if (paid) {
        acc.vacant++;
        acc.paidVacant++;
      }

      if (space.status === 'wypowiedzenie' && isNoticeActive(space)) {
        acc.wypowiedzenie++;
      }

      acc.agencyCost += paid ? unitCost : 0;
      acc.vacantLoss += !space.tenant && paid ? unitCost : 0;
      acc.netCost = acc.agencyCost - acc.workerCharges;

      return acc;
    },
    {
      total: 0,
      occupied: 0,
      vacant: 0,
      wypowiedzenie: 0,
      peopleCount: 0,
      paid: 0,
      paidVacant: 0,
      inactive: 0,
      agencyCost: 0,
      workerCharges: 0,
      vacantLoss: 0,
      netCost: 0,
    }
  );
};

// Calculate project statistics
export const calculateProjectStats = (project: Project): ProjectStats => {
  const allSpaces = project.addresses.flatMap((addr) =>
    addr.rooms.flatMap((room) => room.spaces)
  );
  const stats = project.addresses.reduce(
    (acc, address) => {
      const addressStats = calculateAddressStats(address);
      for (const key of Object.keys(acc) as Array<keyof SpaceStats>) {
        acc[key] += addressStats[key];
      }
      return acc;
    },
    {
      total: 0,
      occupied: 0,
      vacant: 0,
      wypowiedzenie: 0,
      peopleCount: 0,
      paid: 0,
      paidVacant: 0,
      inactive: 0,
      agencyCost: 0,
      workerCharges: 0,
      vacantLoss: 0,
      netCost: 0,
    } as SpaceStats
  );
  
  const occupancyPercent = stats.paid > 0
    ? Math.round((stats.occupied / stats.paid) * 100)
    : 0;
  
  const conflicts = getConflicts(project);
  const conflictCount = conflicts.length;
  
  return { ...stats, occupancyPercent, conflictCount };
};

// Calculate address statistics
export const calculateAddressStats = (address: Address): SpaceStats => {
  const allSpaces = address.rooms.flatMap((room) => room.spaces);
  return calculateSpaceStats(allSpaces, address);
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
const getLegacyConflicts = (project: Project): Conflict[] => {
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

export const getConflicts = (project: Project): Conflict[] => {
  const conflicts: Conflict[] = [];
  const tenantLocations = new Map<string, Conflict[]>();

  const addConflict = (conflict: Omit<Conflict, 'id' | 'projectId' | 'projectName'>) => {
    conflicts.push({
      id: generateId(),
      projectId: project.id,
      projectName: project.name,
      severity: 'error',
      ...conflict,
    });
  };

  const rememberTenantLocation = (tenant: Tenant, conflict: Omit<Conflict, 'id' | 'projectId' | 'projectName'>) => {
    const existing = tenantLocations.get(tenant.id) || [];
    existing.push({
      id: generateId(),
      projectId: project.id,
      projectName: project.name,
      ...conflict,
    });
    tenantLocations.set(tenant.id, existing);
  };

  for (const address of project.addresses) {
    for (const tenant of address.unassignedTenants || []) {
      const conflict = {
        type: 'no_room' as const,
        addressId: address.id,
        addressName: address.name,
        tenantId: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        severity: 'warning' as const,
        message: `Assign a room and place for ${tenant.firstName} ${tenant.lastName}.`,
      };
      addConflict(conflict);
      rememberTenantLocation(tenant, conflict);

      if (tenant.checkOutDate && compareDates(tenant.checkOutDate, tenant.checkInDate) < 0) {
        addConflict({
          type: 'invalid_dates',
          addressId: address.id,
          addressName: address.name,
          tenantId: tenant.id,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          message: `Checkout date is earlier than check-in date for ${tenant.firstName} ${tenant.lastName}.`,
        });
      }
    }

    for (const room of address.rooms) {
      if (room.totalSpaces !== room.spaces.length) {
        addConflict({
          type: 'statistics_mismatch',
          addressId: address.id,
          addressName: address.name,
          roomId: room.id,
          roomName: room.name,
          tenantId: `room-${room.id}`,
          firstName: 'Room',
          lastName: room.name,
          message: `Room ${room.name} has totalSpaces=${room.totalSpaces}, but contains ${room.spaces.length} places.`,
        });
      }

      for (const space of room.spaces) {
        const isWholeAddress = address.isWholeAddress;
        const tenant = space.tenant || undefined;

        if (tenant) {
          rememberTenantLocation(tenant, {
            type: 'duplicate_tenant',
            addressId: address.id,
            addressName: address.name,
            tenantId: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            spaceId: space.id,
            roomId: room.id,
            roomName: room.name,
            message: `${tenant.firstName} ${tenant.lastName} appears in more than one active place.`,
          });
        }

        if (tenant && !tenant.spaceId) {
          addConflict({
            type: 'status_mismatch',
            addressId: address.id,
            addressName: address.name,
            tenantId: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            spaceId: space.id,
            roomId: room.id,
            roomName: room.name,
            message: `${tenant.firstName} ${tenant.lastName} is placed in a bed, but tenant.spaceId is missing.`,
          });
        }

        if (tenant?.checkOutDate && compareDates(tenant.checkOutDate, tenant.checkInDate) < 0) {
          addConflict({
            type: 'invalid_dates',
            addressId: address.id,
            addressName: address.name,
            tenantId: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            spaceId: space.id,
            roomId: room.id,
            roomName: room.name,
            message: `Checkout date is earlier than check-in date for ${tenant.firstName} ${tenant.lastName}.`,
          });
        }

        if (tenant && space.status === 'inactive') {
          addConflict({
            type: 'inactive_occupied',
            addressId: address.id,
            addressName: address.name,
            tenantId: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            spaceId: space.id,
            roomId: room.id,
            roomName: room.name,
            message: `Place ${space.number} is inactive but still has ${tenant.firstName} ${tenant.lastName}.`,
          });
        }

        if (tenant && space.status === 'vacant') {
          addConflict({
            type: 'status_mismatch',
            addressId: address.id,
            addressName: address.name,
            tenantId: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            spaceId: space.id,
            roomId: room.id,
            roomName: room.name,
            message: `Place ${space.number} is marked vacant but has an active resident.`,
          });
        }

        if (!tenant && space.status === 'occupied') {
          addConflict({
            type: 'status_mismatch',
            addressId: address.id,
            addressName: address.name,
            tenantId: `empty-${space.id}`,
            firstName: 'Empty',
            lastName: 'place',
            spaceId: space.id,
            roomId: room.id,
            roomName: room.name,
            message: `Place ${space.number} is marked occupied but has no resident.`,
          });
        }

        if (space.status === 'wypowiedzenie' && (!space.wypowiedzenie?.startDate || !space.wypowiedzenie?.endDate)) {
          addConflict({
            type: 'missing_wypowiedzenie_dates',
            addressId: address.id,
            addressName: address.name,
            tenantId: tenant?.id || `empty-${space.id}`,
            firstName: tenant?.firstName || 'Empty',
            lastName: tenant?.lastName || 'place',
            spaceId: space.id,
            roomId: room.id,
            roomName: room.name,
            message: `Place ${space.number} is on notice but start or end date is missing.`,
          });
        }

        if (space.status === 'wypowiedzenie' && space.wypowiedzenie && isOverdue(space.wypowiedzenie.endDate)) {
          addConflict({
            type: 'wypowiedzenie_overdue',
            addressId: address.id,
            addressName: address.name,
            tenantId: tenant?.id || `empty-${space.id}`,
            firstName: tenant?.firstName || 'Empty',
            lastName: tenant?.lastName || 'place',
            spaceId: space.id,
            roomId: room.id,
            roomName: room.name,
            message: tenant
              ? `Notice period has ended. Move or evict ${tenant.firstName} ${tenant.lastName}.`
              : `Notice period has ended. Place ${space.number} should be inactive and not paid.`,
          });
        }

        if (!isWholeAddress && space.status === 'vacant' && !tenant) {
          addConflict({
            type: 'no_room',
            addressId: address.id,
            addressName: address.name,
            tenantId: 'empty-' + space.id,
            firstName: 'Empty',
            lastName: 'paid place',
            spaceId: space.id,
            roomId: room.id,
            roomName: room.name,
            severity: 'warning',
            message: `Empty paid place ${space.number}. Assign a worker or put it on notice to owner.`,
          });
        }
      }
    }
  }

  for (const locations of tenantLocations.values()) {
    if (locations.length > 1) {
      locations.forEach((location) => {
        conflicts.push({
          ...location,
          id: generateId(),
          type: 'duplicate_tenant',
          severity: 'error',
          message: `${location.firstName} ${location.lastName} is active in ${locations.length} places/lists at once.`,
        });
      });
    }
  }

  return conflicts;
};

// Storage functions
export const loadData = async (): Promise<Project[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return normalizeProjects(JSON.parse(data));
    }
    return [];
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
};

export const saveData = async (projects: Project[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProjects(projects)));
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
    zipCode: restAddressData.zipCode,
    fullAddress: restAddressData.fullAddress || [restAddressData.street, restAddressData.zipCode, restAddressData.city].filter(Boolean).join(', '),
    city: restAddressData.city,
    totalSpaces: restAddressData.totalSpaces || 0,
    coupleRooms,
    companyName: restAddressData.companyName || '',
    ownerName: restAddressData.ownerName || '',
    phone: restAddressData.phone || '',
    evictionPeriod: restAddressData.evictionPeriod || 14,
    totalCost: restAddressData.totalCost || 0,
    pricePerSpace: restAddressData.pricePerSpace || 0,
    couplePrice: restAddressData.couplePrice || 0,
    mediaFee: restAddressData.mediaFee || 0,
    photos: [],
    rooms: rooms,
    unassignedTenants: [],
    status: 'active',
    isWholeAddress: restAddressData.isWholeAddress || false,
    operator: restAddressData.operator,
    operatorName: restAddressData.operatorName,
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

  const address = projects[projectIndex].addresses.find((a) => a.id === addressId);
  if (!address) throw new Error('Address not found');

  const hasResidents = getAddressActualSpaces(address).some((space) => !!space.tenant)
    || (address.unassignedTenants || []).length > 0;
  if (hasResidents) throw new Error('HAS_RESIDENTS');

  const hasPaidNotice = getAddressActualSpaces(address).some((space) => space.status === 'wypowiedzenie' && isNoticeActive(space));
  if (hasPaidNotice) throw new Error('HAS_ACTIVE_NOTICE');

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

  if (room.spaces[spaceIndex].status === 'wypowiedzenie' && isNoticeActive(room.spaces[spaceIndex])) {
    throw new Error('Nie mozna usunac miejsca w aktywnym okresie wypowiedzenia. Poczekaj do konca terminu albo oznacz je jako nieaktywne.');
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

const findTenantInProject = (
  project: Project,
  tenantId: string
): {
  tenant: Tenant;
  address: Address;
  room?: Room;
  space?: Space;
  unassignedIndex?: number;
} | null => {
  for (const address of project.addresses) {
    const unassignedIndex = (address.unassignedTenants || []).findIndex((tenant) => tenant.id === tenantId);
    if (unassignedIndex !== -1) {
      return {
        tenant: address.unassignedTenants[unassignedIndex],
        address,
        unassignedIndex,
      };
    }

    for (const room of address.rooms) {
      for (const space of room.spaces) {
        if (space.tenant?.id === tenantId) {
          return {
            tenant: space.tenant,
            address,
            room,
            space,
          };
        }
      }
    }
  }

  return null;
};

const buildHistoryEntry = (
  tenant: Tenant,
  project: Project,
  address: Address,
  room: Room,
  space: Space,
  checkOutDate: string,
  reason: ResidenceHistoryEntry['reason']
): ResidenceHistoryEntry => ({
  id: generateId(),
  projectId: project.id,
  projectName: project.name,
  addressId: address.id,
  addressName: address.name,
  roomId: room.id,
  roomName: room.name,
  spaceId: space.id,
  spaceNumber: space.number,
  checkInDate: tenant.checkInDate,
  checkOutDate,
  reason,
});

const assignTenantToSpaceLegacy = async (projectId: string, addressId: string, roomId: string, spaceId: string, tenantId: string): Promise<void> => {
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

export const assignTenantToSpace = async (
  projectId: string,
  addressId: string,
  roomId: string,
  spaceId: string,
  tenantId: string,
  moveDate: string = todayISO()
): Promise<void> => {
  const projects = await loadData();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const targetAddress = project.addresses.find((a) => a.id === addressId);
  if (!targetAddress) throw new Error('Address not found');

  const targetRoom = targetAddress.rooms.find((r) => r.id === roomId);
  if (!targetRoom) throw new Error('Room not found');

  const targetSpace = targetRoom.spaces.find((s) => s.id === spaceId);
  if (!targetSpace) throw new Error('Space not found');

  if (targetSpace.tenant && targetSpace.tenant.id !== tenantId) {
    throw new Error('Miejsce jest juz zajete.');
  }

  if (targetSpace.status === 'inactive') {
    throw new Error('Miejsce zostalo juz przekazane wlascicielowi i nie jest aktywne.');
  }

  if (targetSpace.status === 'wypowiedzenie' && targetSpace.wypowiedzenie && !isNoticeActive(targetSpace)) {
    targetSpace.status = 'inactive';
    throw new Error('Termin wypowiedzenia tego miejsca juz minal.');
  }

  const found = findTenantInProject(project, tenantId);
  if (!found) throw new Error('Tenant not found');

  const history = [...(found.tenant.residenceHistory || [])];
  if (found.space && found.room) {
    const sameSpace = found.space.id === targetSpace.id;
    if (sameSpace) return;

    history.push(buildHistoryEntry(found.tenant, project, found.address, found.room, found.space, moveDate, 'relocation'));
    found.space.tenant = null;
    found.space.status = found.space.wypowiedzenie
      ? (isNoticeActive(found.space) ? 'wypowiedzenie' : 'inactive')
      : 'vacant';
  } else if (found.unassignedIndex !== undefined) {
    found.address.unassignedTenants.splice(found.unassignedIndex, 1);
  }

  targetSpace.tenant = {
    ...found.tenant,
    checkInDate: found.space ? moveDate : found.tenant.checkInDate,
    checkOutDate: undefined,
    spaceId: targetSpace.id,
    residenceHistory: history,
  };
  targetSpace.status = 'occupied';

  await saveData(projects);
};

const evictTenantLegacy = async (
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

export const evictTenant = async (
  projectId: string,
  addressId: string,
  tenantId: string,
  checkoutDate: string,
  reason: EvictionReason
): Promise<void> => {
  if (!isValidDateString(checkoutDate)) {
    throw new Error('Invalid checkout date');
  }

  const projects = await loadData();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find((a) => a.id === addressId);
  if (!address) throw new Error('Address not found');

  let evictedTenant: Tenant | null = null;
  let roomName: string | undefined;

  for (const room of address.rooms) {
    const space = room.spaces.find((s) => s.tenant?.id === tenantId);
    if (!space?.tenant) continue;

    if (compareDates(checkoutDate, space.tenant.checkInDate) < 0) {
      throw new Error('Data wymeldowania nie moze byc wczesniejsza niz data zameldowania.');
    }

    evictedTenant = space.tenant;
    roomName = room.name;

    await addToEvictionArchive(
      evictedTenant,
      projectId,
      project.name,
      addressId,
      address.name,
      roomName,
      checkoutDate,
      reason
    );

    const history = [...(evictedTenant.residenceHistory || [])];
    history.push(buildHistoryEntry(evictedTenant, project, address, room, space, checkoutDate, reason));

    const existingNotice = space.wypowiedzenie;
    const period = getNoticePeriod(address);
    const noticeStart = existingNotice?.startDate || checkoutDate;
    const noticeEnd = existingNotice?.endDate || addDays(noticeStart, period);
    const noticeIsFinishedAtCheckout = compareDates(noticeEnd, checkoutDate) <= 0;

    space.tenant = null;
    space.wypowiedzenie = noticeIsFinishedAtCheckout
      ? undefined
      : {
          startDate: noticeStart,
          endDate: noticeEnd,
          paidUntil: noticeEnd,
          groupedWithAddress: existingNotice?.groupedWithAddress || false,
        };
    space.status = noticeIsFinishedAtCheckout ? 'inactive' : 'wypowiedzenie';
    break;
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

  const wypowiedzeniePeriod = getNoticePeriod(address);
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

export const putAddressOnWypowiedzenie = async (
  projectId: string,
  addressId: string,
  startDate: string = todayISO()
): Promise<void> => {
  const projects = await loadData();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find((a) => a.id === addressId);
  if (!address) throw new Error('Address not found');

  const endDate = addDays(startDate, getNoticePeriod(address));
  address.status = 'wypowiedzenie';
  address.addressWypowiedzienieStart = startDate;
  address.addressWypowiedzenieEnd = endDate;

  for (const room of address.rooms) {
    for (const space of room.spaces) {
      if (space.status === 'inactive') continue;
      space.status = 'wypowiedzenie';
      space.wypowiedzenie = {
        startDate,
        endDate,
        paidUntil: endDate,
        groupedWithAddress: true,
      };
    }
  }

  await saveData(projects);
};

export const removeAddressFromWypowiedzenie = async (
  projectId: string,
  addressId: string
): Promise<void> => {
  const projects = await loadData();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find((a) => a.id === addressId);
  if (!address) throw new Error('Address not found');

  address.status = 'active';
  address.addressWypowiedzienieStart = undefined;
  address.addressWypowiedzenieEnd = undefined;

  for (const room of address.rooms) {
    for (const space of room.spaces) {
      if (space.wypowiedzenie?.groupedWithAddress) {
        space.wypowiedzenie = undefined;
        space.status = space.tenant ? 'occupied' : 'vacant';
      }
    }
  }

  await saveData(projects);
};

export const applyPricesToAll = async (
  projectId: string,
  addressId: string,
  addressData: AddAddressFormData
): Promise<void> => {
  const projects = await loadData();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const address = project.addresses.find((a) => a.id === addressId);
  if (!address) throw new Error('Address not found');

  Object.assign(address, {
    totalCost: addressData.totalCost || 0,
    pricePerSpace: addressData.pricePerSpace || 0,
    couplePrice: addressData.couplePrice || 0,
    mediaFee: addressData.mediaFee || 0,
    evictionPeriod: addressData.evictionPeriod || 14,
  });

  for (const room of address.rooms) {
    const roomPrice = room.type === 'couple' && addressData.couplePrice
      ? addressData.couplePrice
      : addressData.pricePerSpace;

    for (const space of room.spaces) {
      if (space.tenant) {
        space.tenant.monthlyPrice = roomPrice || 0;
      }
    }
  }

  for (const tenant of address.unassignedTenants || []) {
    tenant.monthlyPrice = addressData.pricePerSpace || 0;
  }

  await saveData(projects);
};

export const updateProjectsOrder = async (projects: Project[]): Promise<void> => {
  await saveData(projects);
};

export const initializeDemoData = async (): Promise<void> => {
  const existing = await loadData();
  if (existing.length > 0) return;

  const projectId = generateId();
  const addressId = generateId();
  const maleRoomId = generateId();
  const femaleRoomId = generateId();
  const tenantId = generateId();
  const maleSpace1 = generateId();
  const maleSpace2 = generateId();
  const femaleSpace1 = generateId();

  const demo: Project[] = [
    {
      id: projectId,
      name: 'Demo project',
      city: 'Warszawa',
      addresses: [
        {
          id: addressId,
          projectId,
          name: 'Demo address',
          street: 'ul. Przykladowa 1',
          city: 'Warszawa',
          zipCode: '00-001',
          fullAddress: 'ul. Przykladowa 1, 00-001 Warszawa',
          totalSpaces: 3,
          coupleRooms: 0,
          companyName: 'Demo supplier',
          ownerName: 'Demo owner',
          phone: '',
          evictionPeriod: 14,
          totalCost: 3000,
          pricePerSpace: 600,
          photos: [],
          rooms: [
            {
              id: maleRoomId,
              addressId,
              name: 'Pokoj 1',
              type: 'male',
              totalSpaces: 2,
              spaces: [
                {
                  id: maleSpace1,
                  roomId: maleRoomId,
                  number: 1,
                  status: 'occupied',
                  tenant: {
                    id: tenantId,
                    firstName: 'Jan',
                    lastName: 'Kowalski',
                    gender: 'male',
                    birthYear: 1990,
                    checkInDate: todayISO(),
                    spaceId: maleSpace1,
                    monthlyPrice: 600,
                    residenceHistory: [],
                  },
                },
                {
                  id: maleSpace2,
                  roomId: maleRoomId,
                  number: 2,
                  status: 'vacant',
                  tenant: null,
                },
              ],
            },
            {
              id: femaleRoomId,
              addressId,
              name: 'Pokoj 2',
              type: 'female',
              totalSpaces: 1,
              spaces: [
                {
                  id: femaleSpace1,
                  roomId: femaleRoomId,
                  number: 1,
                  status: 'vacant',
                  tenant: null,
                },
              ],
            },
          ],
          unassignedTenants: [],
          status: 'active',
        },
      ],
    },
  ];

  await saveData(demo);
};
