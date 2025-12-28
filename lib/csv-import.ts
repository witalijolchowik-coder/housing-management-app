import { Project, Address, Tenant, Gender } from './types';
import { generateId } from './lib/store';

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
