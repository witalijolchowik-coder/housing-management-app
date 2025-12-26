// Data types for Housing Management App

export type Gender = 'male' | 'female' | 'other';
export type RoomType = 'male' | 'female' | 'couple';
export type SpaceStatus = 'vacant' | 'occupied' | 'wypowiedzenie' | 'conflict' | 'overdue';

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthYear: number;
  checkInDate: string; // ISO date string
  workStartDate?: string;
  spaceId: string;
  monthlyPrice: number;
  photo?: string;
}

export interface Wypowiedzenie {
  startDate: string; // ISO date string
  endDate: string;
  paidUntil: string;
}

export interface Space {
  id: string;
  roomId: string;
  number: number;
  status: SpaceStatus;
  tenant?: Tenant;
  wypowiedzenie?: Wypowiedzenie;
}

export interface Room {
  id: string;
  addressId: string;
  number: string;
  type: RoomType;
  totalSpaces: number;
  spaces: Space[];
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
  photos: string[];
  rooms: Room[];
}

export interface Project {
  id: string;
  name: string;
  addresses: Address[];
}

// Computed statistics
export interface SpaceStats {
  total: number;
  occupied: number;
  vacant: number;
  wypowiedzenie: number;
  conflict: number;
  overdue: number;
}

export interface ProjectStats extends SpaceStats {
  occupancyPercent: number;
}

// Calendar event types
export type CalendarEventType = 'checkin' | 'wypowiedzenie_start' | 'wypowiedzenie_end' | 'conflict';

export interface CalendarEvent {
  id: string;
  date: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  tenantId?: string;
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
  roomId: string;
  spaceId: string;
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
}

export interface CheckoutFormData {
  checkoutDate: string;
  enableWypowiedzenie: boolean;
  wypowiedzeniStartDate?: string;
}
