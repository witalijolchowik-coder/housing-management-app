// Data types for Housing Management App

export type Gender = 'male' | 'female';
export type RoomType = 'male' | 'female' | 'couple';
export type SpaceStatus = 'vacant' | 'occupied' | 'wypowiedzenie' | 'inactive';
export type EvictionReason = 'job_change' | 'own_housing' | 'disciplinary' | 'relocation';

export interface ResidenceHistoryEntry {
  id: string;
  projectId: string;
  projectName: string;
  addressId: string;
  addressName: string;
  roomId?: string;
  roomName?: string;
  spaceId?: string;
  spaceNumber?: number;
  checkInDate: string;
  checkOutDate: string;
  reason?: EvictionReason | 'relocation';
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthYear: number;
  checkInDate: string; // ISO date string
  checkOutDate?: string; // ISO date string, present only in archived/history records
  workStartDate?: string;
  spaceId?: string; // Optional - tenant can be without room
  monthlyPrice: number;
  isCouple?: boolean; // If true, uses couplePrice instead of monthlyPrice
  residenceHistory?: ResidenceHistoryEntry[];
  photo?: string;
  phone?: string;
}

export interface EvictionArchive {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthYear: number;
  monthlyPrice: number;
  phone?: string;
  projectId: string;
  projectName: string;
  addressId: string;
  addressName: string;
  roomName?: string;
  checkInDate: string;
  checkOutDate: string;
  reason: EvictionReason;
  createdAt: string;
}

export type EvictionArchiveEntry = EvictionArchive;

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

export type OperatorType = 'rent_planet' | 'e_port' | 'other';

export interface Address {
  id: string;
  projectId: string;
  name: string;
  street: string;
  city: string;
  zipCode: string;
  fullAddress: string;
  totalSpaces: number;
  coupleRooms: number;
  companyName: string;
  ownerName: string;
  phone: string;
  evictionPeriod: number; // days, default 14
  wypowiedzeniePeriod?: number; // Legacy field kept for imported backups
  totalCost: number;
  pricePerSpace: number;
  couplePrice?: number; // Price for couple rooms
  mediaFee?: number; // Media fee
  photos: string[];
  rooms: Room[];
  unassignedTenants: Tenant[]; // Tenants without assigned space (temporary, waiting for room assignment)
  status?: 'active' | 'wypowiedzenie'; // Address-level status
  isWholeAddress?: boolean; // If true, address is rented as a whole
  addressWypowiedzienieStart?: string; // When address was put on wypowiedzenie
  addressWypowiedzenieEnd?: string;
  operator?: OperatorType; // Operator: Rent Planet, E-Port, or Other
  operatorName?: string; // Custom operator name if operator is 'other'
}

export interface Project {
  id: string;
  name: string;
  city?: string;
  addresses: Address[];
  evictionArchive?: EvictionArchive[];
}

// Computed statistics
export interface SpaceStats {
  total: number; // Physical places in rooms
  occupied: number; // Places with an active resident
  vacant: number; // Empty but still paid places
  wypowiedzenie: number; // Places currently in notice period
  peopleCount: number; // Actual number of people (for occupancy display)
  paid: number; // Places still paid by the agency
  paidVacant: number; // Empty paid places causing losses
  inactive: number; // Places handed back to owner and no longer paid
  agencyCost: number;
  workerCharges: number;
  vacantLoss: number;
  netCost: number;
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
  phone?: string;
}

export interface AddAddressFormData {
  name: string;
  street: string;
  city: string;
  zipCode: string;
  fullAddress: string;
  totalSpaces: number;
  regularRooms: number; // Number of regular (empty) rooms to create
  coupleRooms: number;
  companyName: string;
  ownerName: string;
  phone: string;
  evictionPeriod: number;
  totalCost: number;
  pricePerSpace: number;
  couplePrice?: number;
  mediaFee?: number;
  operator?: OperatorType;
  operatorName?: string;
  isWholeAddress?: boolean;
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
export type ConflictType =
  | 'no_room'
  | 'wypowiedzenie_overdue'
  | 'duplicate_tenant'
  | 'invalid_dates'
  | 'status_mismatch'
  | 'missing_wypowiedzenie_dates'
  | 'statistics_mismatch'
  | 'inactive_occupied';

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
  roomId?: string;
  roomName?: string;
  severity?: 'warning' | 'error';
  message: string;
}
