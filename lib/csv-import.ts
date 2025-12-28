import { Project, Address, Tenant, Gender } from '@/types';
import { generateId } from './store';

export interface CSVRow {
  nazwisko: string;
  imię: string;
  'data urodzenia': string;
  'kobieta/ mężczyzna': string;
  'data zakwaterowania': string;
  adres: string;
  'numer viber': string;
  zatrudnienie: string;
}

export const parseCSV = (csvText: string): CSVRow[] => {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].replace(/^\uFEFF/, '').split(';').map(h => h.trim().toLowerCase());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(';').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row as CSVRow);
  }

  return rows;
};

export const processCSVData = (projectName: string, city: string | undefined, rows: CSVRow[]): Project => {
  const project: Project = {
    id: generateId(),
    name: projectName,
    city: city,
    addresses: [],
  };

  const addressMap = new Map<string, Address>();

  rows.forEach(row => {
    const fullAddressStr = row.adres;
    if (!fullAddressStr) return;

    // Extract address name (Street + Number)
    // Example: "ul. Kolejowa 10, 59-730 Wykroty" -> "ul. Kolejowa 10"
    // Example: "ul. Kolejowa, 28 59-730 Wykroty" -> "ul. Kolejowa 28"
    const addressParts = fullAddressStr.split(',');
    let streetPart = addressParts[0].trim();
    let numberPart = '';
    
    if (addressParts.length > 1) {
      // Check if the second part starts with a number (like " 28 59-730 Wykroty")
      const secondPart = addressParts[1].trim();
      const match = secondPart.match(/^(\d+)/);
      if (match) {
        numberPart = match[1];
      }
    }

    const addressName = numberPart ? `${streetPart} ${numberPart}` : streetPart;

    if (!addressMap.has(addressName)) {
      const newAddress: Address = {
        id: generateId(),
        projectId: project.id,
        name: addressName,
        fullAddress: fullAddressStr,
        totalSpaces: 0,
        coupleRooms: 0,
        companyName: '',
        ownerName: '',
        phone: '',
        evictionPeriod: 14,
        totalCost: 0,
        pricePerSpace: 0,
        photos: [],
        rooms: [],
        unassignedTenants: [],
        status: 'active',
      };
      addressMap.set(addressName, newAddress);
      project.addresses.push(newAddress);
    }

    const address = addressMap.get(addressName)!;

    // Create tenant
    const birthDate = new Date(row['data urodzenia']);
    const birthYear = isNaN(birthDate.getFullYear()) ? 1995 : birthDate.getFullYear();
    
    const gender: Gender = row['kobieta/ mężczyzna'].toLowerCase().includes('kobieta') ? 'female' : 'male';

    const tenant: Tenant = {
      id: generateId(),
      firstName: row.imię,
      lastName: row.nazwisko,
      gender: gender,
      birthYear: birthYear,
      checkInDate: row['data zakwaterowania'] || new Date().toISOString().split('T')[0],
      workStartDate: row.zatrudnienie || undefined,
      monthlyPrice: 0, // Default to 0, user will set later
      phone: row['numer viber'] || undefined,
    };

    address.unassignedTenants.push(tenant);
  });

  return project;
};

/**
 * Normalize address for comparison (remove spaces, commas, lowercase)
 */
export const normalizeAddress = (address: string): string => {
  return address
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/,/g, '')
    .trim();
};

/**
 * Check if two addresses are similar enough to be considered the same
 */
export const areAddressesSimilar = (addr1: string, addr2: string): boolean => {
  const normalized1 = normalizeAddress(addr1);
  const normalized2 = normalizeAddress(addr2);
  
  // Exact match after normalization
  return normalized1 === normalized2;
};

/**
 * Find similar (but not exact) addresses for user confirmation
 */
export const findSimilarAddresses = (
  targetAddress: string,
  existingAddresses: Address[]
): Address[] => {
  const similar: Address[] = [];
  const targetNormalized = normalizeAddress(targetAddress);
  
  for (const existing of existingAddresses) {
    const existingNormalized = normalizeAddress(existing.fullAddress);
    
    // Skip exact matches (they will be handled automatically)
    if (targetNormalized === existingNormalized) {
      continue;
    }
    
    // Check if they share street name
    const targetParts = targetAddress.split(',')[0].trim().toLowerCase();
    const existingParts = existing.fullAddress.split(',')[0].trim().toLowerCase();
    
    // If street names are similar (contains each other)
    if (targetParts.includes(existingParts) || existingParts.includes(targetParts)) {
      similar.push(existing);
    }
  }
  
  return similar;
};

/**
 * Import CSV data into an existing project
 */
export const importCSVIntoProject = (
  project: Project,
  rows: CSVRow[],
  addressMappings?: Map<string, string> // Map of CSV address -> existing address ID
): Project => {
  const addressMap = new Map<string, Address>();
  
  // Build map of existing addresses by normalized full address
  project.addresses.forEach(addr => {
    const normalized = normalizeAddress(addr.fullAddress);
    addressMap.set(normalized, addr);
  });

  const newAddresses: Address[] = [];

  rows.forEach(row => {
    const fullAddressStr = row.adres;
    if (!fullAddressStr) return;

    // Extract address name
    const addressParts = fullAddressStr.split(',');
    let streetPart = addressParts[0].trim();
    let numberPart = '';
    
    if (addressParts.length > 1) {
      const secondPart = addressParts[1].trim();
      const match = secondPart.match(/^(\d+)/);
      if (match) {
        numberPart = match[1];
      }
    }

    const addressName = numberPart ? `${streetPart} ${numberPart}` : streetPart;
    const normalizedAddr = normalizeAddress(fullAddressStr);

    // Check if user provided a mapping for this address
    let targetAddress: Address | undefined;
    
    if (addressMappings && addressMappings.has(fullAddressStr)) {
      const mappedId = addressMappings.get(fullAddressStr)!;
      targetAddress = project.addresses.find(a => a.id === mappedId);
    } else {
      // Try to find exact match
      targetAddress = addressMap.get(normalizedAddr);
    }

    // If no match found, create new address
    if (!targetAddress) {
      // Check if we already created this address in this import
      targetAddress = newAddresses.find(a => normalizeAddress(a.fullAddress) === normalizedAddr);
      
      if (!targetAddress) {
        const newAddress: Address = {
          id: generateId(),
          projectId: project.id,
          name: addressName,
          fullAddress: fullAddressStr,
          totalSpaces: 0,
          coupleRooms: 0,
          companyName: '',
          ownerName: '',
          phone: '',
          evictionPeriod: 14,
          totalCost: 0,
          pricePerSpace: 0,
          photos: [],
          rooms: [],
          unassignedTenants: [],
          status: 'active',
        };
        newAddresses.push(newAddress);
        targetAddress = newAddress;
      }
    }

    // Create tenant
    const birthDate = new Date(row['data urodzenia']);
    const birthYear = isNaN(birthDate.getFullYear()) ? 1995 : birthDate.getFullYear();
    
    const gender: Gender = row['kobieta/ mężczyzna'].toLowerCase().includes('kobieta') ? 'female' : 'male';

    const tenant: Tenant = {
      id: generateId(),
      firstName: row.imię,
      lastName: row.nazwisko,
      gender: gender,
      birthYear: birthYear,
      checkInDate: row['data zakwaterowania'] || new Date().toISOString().split('T')[0],
      workStartDate: row.zatrudnienie || undefined,
      monthlyPrice: targetAddress.pricePerSpace || 0,
      phone: row['numer viber'] || undefined,
    };

    // Ensure unassignedTenants exists
    if (!targetAddress.unassignedTenants) {
      targetAddress.unassignedTenants = [];
    }
    targetAddress.unassignedTenants.push(tenant);
  });

  // Add new addresses to project
  const updatedProject = {
    ...project,
    addresses: [...project.addresses, ...newAddresses],
  };

  return updatedProject;
};

/**
 * Group CSV rows by address for conflict resolution
 */
export interface AddressGroup {
  fullAddress: string;
  addressName: string;
  tenantCount: number;
  tenants: Tenant[];
}

export const groupCSVByAddress = (rows: CSVRow[]): AddressGroup[] => {
  const groups = new Map<string, AddressGroup>();

  rows.forEach(row => {
    const fullAddressStr = row.adres;
    if (!fullAddressStr) return;

    const normalizedAddr = normalizeAddress(fullAddressStr);

    if (!groups.has(normalizedAddr)) {
      // Extract address name
      const addressParts = fullAddressStr.split(',');
      let streetPart = addressParts[0].trim();
      let numberPart = '';
      
      if (addressParts.length > 1) {
        const secondPart = addressParts[1].trim();
        const match = secondPart.match(/^(\d+)/);
        if (match) {
          numberPart = match[1];
        }
      }

      const addressName = numberPart ? `${streetPart} ${numberPart}` : streetPart;

      groups.set(normalizedAddr, {
        fullAddress: fullAddressStr,
        addressName: addressName,
        tenantCount: 0,
        tenants: [],
      });
    }

    const group = groups.get(normalizedAddr)!;
    
    // Create tenant
    const birthDate = new Date(row['data urodzenia']);
    const birthYear = isNaN(birthDate.getFullYear()) ? 1995 : birthDate.getFullYear();
    
    const gender: Gender = row['kobieta/ mężczyzna'].toLowerCase().includes('kobieta') ? 'female' : 'male';

    const tenant: Tenant = {
      id: generateId(),
      firstName: row.imię,
      lastName: row.nazwisko,
      gender: gender,
      birthYear: birthYear,
      checkInDate: row['data zakwaterowania'] || new Date().toISOString().split('T')[0],
      workStartDate: row.zatrudnienie || undefined,
      monthlyPrice: 0,
      phone: row['numer viber'] || undefined,
    };

    group.tenants.push(tenant);
    group.tenantCount++;
  });

  return Array.from(groups.values());
};
