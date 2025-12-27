// Data types for Housing Management App

export type Gender = 'male' | 'female';
export type RoomType = 'male' | 'female' | 'couple';
export type SpaceStatus = 'vacant' | 'occupied' | 'wypowiedzenie';
export type EvictionReason = 'job_change' | 'own_housing' | 'disciplinary';

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthYear: number;
  checkInDate: string; // ISO date string
  workStartDate?: string;
  spaceId?: string; // Optional - tenant can be without room
  monthlyPrice: number;
  isCouple?: boolean; // If true, uses couplePrice instead of monthlyPrice
  photo?: string;
}

export interface EvictionArchive {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  projectId: string;
  projectName: string;
  addressId: string;
  addressName: string;
  checkInDate: string;
  checkOutDate: string;
  reason: EvictionReason;
  createdAt: string;
}

export interface Wypowiedzenie {
  startDate: string; // ISO date string
  endDate: string;
  paidUntil: string;
  groupedWithAddress?: boolean; // True if this space was put on wypowiedzenie with the address
}

export interface Space {
  id: string;
  roomId: string;
  number: number;
  status: SpaceStatus;
  tenant?: Tenant | null;
  wypowiedzenie?: Wypowiedzenie;
  amenities?: {
    shower: boolean;
    toilet: boolean;
    wifi: boolean;
    stove: boolean;
    fridge: boolean;
  };
}

export interface Room {
  id: string;
  addressId: string;
  name: string;
  type: RoomType;
  totalSpaces: number;
  spaces: Space[];
  amenities?: {
    shower: boolean;
    toilet: boolean;
    wifi: boolean;
    stove: boolean;
    fridge: boolean;
  };
}

export interface Address {
  id: string;
  projectId: string;
  name: string;
  fullAddress: string;
  totalSpaces: number;
  coupleRooms: number;
  companyName: string;
  ownerName: string;
  phone: string;
  evictionPeriod: number; // days, default 14
  totalCost: number;
  pricePerSpace: number;
  couplePrice?: number; // Price for couple rooms
  photos: string[];
  rooms: Room[];
  status?: 'active' | 'wypowiedzenie'; // Address-level status
  addressWypowiedzienieStart?: string; // When address was put on wypowiedzenie
}

export interface Project {
  id: string;
  name: string;
  city?: string;
  addresses: Address[];
}

// Computed statistics
export interface SpaceStats {
  total: number;
  occupied: number;
  vacant: number;
  wypowiedzenie: number;
  peopleCount: number; // Actual number of people (for occupancy display)
}

export interface ProjectStats extends SpaceStats {
  occupancyPercent: number;
  conflictCount: number;
}

// Calendar event types
export type CalendarEventType = 'checkin' | 'checkout' | 'wypowiedzenie_end';

export interface CalendarEvent {
  id: string;
  date: string;
  type: CalendarEventType;
  projectId: string;
  projectName: string;
  addressId: string;
  addressName: string;
  tenantId?: string;
  firstName?: string;
  lastName?: string;
  spaceId?: string;
}

// Form data types
export interface AddTenantFormData {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthYear: number;
  checkInDate: string;
  workStartDate?: string;
  isCouple?: boolean;
  monthlyPrice: number;
}

export interface AddAddressFormData {
  name: string;
  fullAddress: string;
  totalSpaces: number;
  coupleRooms: number;
  companyName: string;
  ownerName: string;
  phone: string;
  evictionPeriod: number;
  totalCost: number;
  pricePerSpace: number;
  couplePrice?: number;
}

export interface AddProjectFormData {
  name: string;
  city?: string;
}

export interface EvictionFormData {
  checkoutDate: string;
  reason: EvictionReason;
}

export interface AddRoomFormData {
  name: string;
  type: RoomType;
  totalSpaces: number;
  amenities?: {
    shower: boolean;
    toilet: boolean;
    wifi: boolean;
    stove: boolean;
    fridge: boolean;
  };
}

// Conflict types
export type ConflictType = 'no_room' | 'wypowiedzenie_overdue';

export interface Conflict {
  id: string;
  type: ConflictType;
  projectId: string;
  projectName: string;
  addressId: string;
  addressName: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  spaceId?: string;
  message: string;
}
