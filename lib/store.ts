import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Address, Room, Space, Tenant, SpaceStats, ProjectStats } from '@/types';

const STORAGE_KEY = 'housing_management_data';

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
          break;
        case 'wypowiedzenie':
          acc.wypowiedzenie++;
          break;
        case 'conflict':
          acc.conflict++;
          break;
        case 'overdue':
          acc.overdue++;
          break;
      }
      return acc;
    },
    { total: 0, occupied: 0, vacant: 0, wypowiedzenie: 0, conflict: 0, overdue: 0 }
  );
};

// Calculate project statistics
export const calculateProjectStats = (project: Project): ProjectStats => {
  const allSpaces = project.addresses.flatMap((addr) =>
    addr.rooms.flatMap((room) => room.spaces)
  );
  const stats = calculateSpaceStats(allSpaces);
  const occupancyPercent = stats.total > 0 
    ? Math.round(((stats.occupied + stats.wypowiedzenie) / stats.total) * 100) 
    : 0;
  return { ...stats, occupancyPercent };
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

// CRUD operations for Projects
export const addProject = async (name: string): Promise<Project> => {
  const projects = await loadData();
  const newProject: Project = {
    id: generateId(),
    name,
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
export const addAddress = async (projectId: string, addressData: Omit<Address, 'id' | 'projectId' | 'rooms'>): Promise<Address> => {
  const projects = await loadData();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const newAddress: Address = {
    ...addressData,
    id: generateId(),
    projectId,
    rooms: [],
  };
  projects[projectIndex].addresses.push(newAddress);
  await saveData(projects);
  return newAddress;
};

// CRUD operations for Rooms
export const addRoom = async (
  projectId: string,
  addressId: string,
  roomData: { number: string; type: Room['type']; totalSpaces: number }
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
    number: roomData.number,
    type: roomData.type,
    totalSpaces: roomData.totalSpaces,
    spaces: spaces.map((s) => ({ ...s, roomId: '' })),
  };

  // Update room ID in spaces
  newRoom.spaces = newRoom.spaces.map((s) => ({ ...s, roomId: newRoom.id }));

  projects[projectIndex].addresses[addressIndex].rooms.push(newRoom);
  await saveData(projects);
  return newRoom;
};

// Check-in tenant
export const checkInTenant = async (
  projectId: string,
  addressId: string,
  roomId: string,
  spaceId: string,
  tenantData: Omit<Tenant, 'id' | 'spaceId'>
): Promise<Tenant> => {
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

  const newTenant: Tenant = {
    ...tenantData,
    id: generateId(),
    spaceId,
  };

  projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex] = {
    ...projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex],
    status: 'occupied',
    tenant: newTenant,
  };

  await saveData(projects);
  return newTenant;
};

// Check-out tenant (start wypowiedzenie)
export const checkOutTenant = async (
  projectId: string,
  addressId: string,
  roomId: string,
  spaceId: string,
  checkoutDate: string,
  enableWypowiedzenie: boolean,
  wypowiedzeniStartDate?: string,
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

  if (enableWypowiedzenie) {
    const startDate = wypowiedzeniStartDate || checkoutDate;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + evictionPeriod);

    projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex] = {
      ...space,
      status: 'wypowiedzenie',
      wypowiedzenie: {
        startDate,
        endDate: endDate.toISOString().split('T')[0],
        paidUntil: endDate.toISOString().split('T')[0],
      },
    };
  } else {
    // Immediate checkout
    projects[projectIndex].addresses[addressIndex].rooms[roomIndex].spaces[spaceIndex] = {
      ...space,
      status: 'vacant',
      tenant: undefined,
      wypowiedzenie: undefined,
    };
  }

  await saveData(projects);
};

// Process wypowiedzenie (auto-release expired)
export const processWypowiedzenie = async (): Promise<void> => {
  const projects = await loadData();
  const today = new Date().toISOString().split('T')[0];
  let hasChanges = false;

  for (const project of projects) {
    for (const address of project.addresses) {
      for (const room of address.rooms) {
        for (const space of room.spaces) {
          if (space.status === 'wypowiedzenie' && space.wypowiedzenie) {
            if (space.wypowiedzenie.endDate <= today) {
              // Check if space is physically occupied (has tenant)
              if (space.tenant) {
                space.status = 'conflict';
              } else {
                space.status = 'vacant';
                space.wypowiedzenie = undefined;
              }
              hasChanges = true;
            }
          }
        }
      }
    }
  }

  if (hasChanges) {
    await saveData(projects);
  }
};

// Get demo data for initial setup
export const initializeDemoData = async (): Promise<void> => {
  const existingData = await loadData();
  if (existingData.length > 0) return;

  const demoProjects: Project[] = [
    {
      id: generateId(),
      name: 'Project Alpha',
      addresses: [
        {
          id: generateId(),
          projectId: '',
          name: 'Общежитие Центральное',
          fullAddress: 'ул. Центральная, 15',
          totalSpaces: 20,
          coupleRooms: 2,
          companyName: 'ООО Строй',
          ownerName: 'Иванов И.И.',
          phone: '+48 123 456 789',
          evictionPeriod: 14,
          totalCost: 10000,
          pricePerSpace: 500,
          photos: [],
          rooms: [
            {
              id: generateId(),
              addressId: '',
              number: '101',
              type: 'male',
              totalSpaces: 4,
              spaces: [
                { id: generateId(), roomId: '', number: 1, status: 'occupied', tenant: { id: generateId(), firstName: 'Анна', lastName: 'Петрова', gender: 'female', birthYear: 1990, checkInDate: '2024-01-15', spaceId: '', monthlyPrice: 500 } },
                { id: generateId(), roomId: '', number: 2, status: 'occupied', tenant: { id: generateId(), firstName: 'Мария', lastName: 'Сидорова', gender: 'female', birthYear: 1985, checkInDate: '2024-02-01', spaceId: '', monthlyPrice: 500 } },
                { id: generateId(), roomId: '', number: 3, status: 'wypowiedzenie', wypowiedzenie: { startDate: '2024-12-20', endDate: '2025-01-03', paidUntil: '2025-01-03' } },
                { id: generateId(), roomId: '', number: 4, status: 'vacant' },
              ],
            },
            {
              id: generateId(),
              addressId: '',
              number: '102',
              type: 'female',
              totalSpaces: 4,
              spaces: [
                { id: generateId(), roomId: '', number: 1, status: 'occupied', tenant: { id: generateId(), firstName: 'Петр', lastName: 'Иванов', gender: 'male', birthYear: 1988, checkInDate: '2024-03-10', spaceId: '', monthlyPrice: 500 } },
                { id: generateId(), roomId: '', number: 2, status: 'vacant' },
                { id: generateId(), roomId: '', number: 3, status: 'vacant' },
                { id: generateId(), roomId: '', number: 4, status: 'conflict', tenant: { id: generateId(), firstName: 'Олег', lastName: 'Козлов', gender: 'male', birthYear: 1992, checkInDate: '2024-11-01', spaceId: '', monthlyPrice: 500 } },
              ],
            },
          ],
        },
      ],
    },
    {
      id: generateId(),
      name: 'Project Beta',
      addresses: [],
    },
    {
      id: generateId(),
      name: 'Project Gamma',
      addresses: [],
    },
    {
      id: generateId(),
      name: 'Project Delta',
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
