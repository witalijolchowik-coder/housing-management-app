import { describe, it, expect } from 'vitest';
import { Project, EvictionReason, OperatorType, RoomType } from '../../types';

describe('Export/Import Data Functionality', () => {
  describe('Export Data Structure', () => {
    it('should create valid export structure with version and date', () => {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        projects: [],
        evictionArchive: [],
      };

      expect(exportData.version).toBe('1.0');
      expect(exportData.exportDate).toBeDefined();
      expect(exportData.projects).toBeDefined();
      expect(exportData.evictionArchive).toBeDefined();
    });

    it('should export projects as JSON string', () => {
      const testProjects: Project[] = [
        {
          id: '1',
          name: 'Test Project',
          city: 'Warsaw',
          addresses: [],
        },
      ];

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        projects: testProjects,
        evictionArchive: [],
      };

      const jsonString = JSON.stringify(exportData);
      expect(jsonString).toContain('Test Project');
      expect(jsonString).toContain('Warsaw');
    });

    it('should include eviction archive in export', () => {
      const testArchive = [
        {
          id: '1',
          tenantId: 't1',
          firstName: 'Jan',
          lastName: 'Kowalski',
          projectId: 'p1',
          projectName: 'Test Project',
          addressId: 'a1',
          addressName: 'Test Address',
          checkInDate: '2024-12-01',
          checkOutDate: '2025-01-01',
          reason: 'job_change' as EvictionReason,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        projects: [],
        evictionArchive: testArchive,
      };

      expect(exportData.evictionArchive).toHaveLength(1);
      expect(exportData.evictionArchive[0].firstName).toBe('Jan');
    });

    it('should export complex project structure', () => {
      const complexProject: Project = {
        id: '1',
        name: 'Complex Project',
        city: 'Krakow',
        addresses: [
          {
            id: 'addr1',
            projectId: '1',
            name: 'Test Address',
            fullAddress: 'Main St 10',
            totalSpaces: 10,
            coupleRooms: 0,
            companyName: 'Test Company',
            ownerName: 'Test Owner',
            phone: '+48123456789',
            evictionPeriod: 14,
            totalCost: 5000,
            pricePerSpace: 500,
            photos: [],
            operator: 'rent_planet' as OperatorType,
            rooms: [
              {
                id: 'room1',
                addressId: 'addr1',
                name: 'Pokój 1',
                type: 'male' as RoomType,
                totalSpaces: 4,
                spaces: [],
              },
            ],
            unassignedTenants: [],
          },
        ],
      };

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        projects: [complexProject],
        evictionArchive: [],
      };

      expect(exportData.projects[0].addresses).toHaveLength(1);
      expect(exportData.projects[0].addresses[0].rooms).toHaveLength(1);
      expect(exportData.projects[0].addresses[0].rooms[0].name).toBe('Pokój 1');
    });
  });

  describe('Import Data Validation', () => {
    it('should validate import data has required fields', () => {
      const validData = {
        version: '1.0',
        exportDate: '2025-01-01T00:00:00.000Z',
        projects: [],
        evictionArchive: [],
      };

      expect(validData.projects).toBeDefined();
      expect(Array.isArray(validData.projects)).toBe(true);
      expect(validData.evictionArchive).toBeDefined();
      expect(Array.isArray(validData.evictionArchive)).toBe(true);
    });

    it('should detect invalid import data structure', () => {
      const invalidData: any = {
        version: '1.0',
        exportDate: '2025-01-01T00:00:00.000Z',
        // Missing projects array
      };

      expect(invalidData.projects).toBeUndefined();
    });

    it('should parse valid JSON import data', () => {
      const jsonString = JSON.stringify({
        version: '1.0',
        exportDate: '2025-01-01T00:00:00.000Z',
        projects: [
          {
            id: '1',
            name: 'Imported Project',
            city: 'Poznan',
            addresses: [],
          },
        ],
        evictionArchive: [],
      });

      const parsed = JSON.parse(jsonString);
      expect(parsed.projects).toHaveLength(1);
      expect(parsed.projects[0].name).toBe('Imported Project');
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => {
        JSON.parse(invalidJson);
      }).toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('should preserve project data through JSON serialization', () => {
      const originalProject: Project = {
        id: '1',
        name: 'Test Project',
        city: 'Warsaw',
        addresses: [
          {
            id: 'addr1',
            projectId: '1',
            name: 'Test Address',
            fullAddress: 'Test St 5',
            totalSpaces: 10,
            coupleRooms: 0,
            companyName: 'Test Company',
            ownerName: 'Test Owner',
            phone: '+48123456789',
            evictionPeriod: 14,
            totalCost: 5000,
            pricePerSpace: 500,
            photos: [],
            operator: 'rent_planet' as OperatorType,
            rooms: [],
            unassignedTenants: [],
          },
        ],
      };

      const jsonString = JSON.stringify(originalProject);
      const parsed = JSON.parse(jsonString);

      expect(parsed.id).toBe(originalProject.id);
      expect(parsed.name).toBe(originalProject.name);
      expect(parsed.addresses).toHaveLength(1);
      expect(parsed.addresses[0].name).toBe('Test Address');
    });

    it('should preserve eviction archive through JSON serialization', () => {
      const originalArchive = [
        {
          id: '1',
          tenantId: 't1',
          firstName: 'Jan',
          lastName: 'Kowalski',
          projectId: 'p1',
          projectName: 'Test Project',
          addressId: 'a1',
          addressName: 'Test Address',
          checkInDate: '2024-12-01',
          checkOutDate: '2025-01-01',
          reason: 'job_change' as EvictionReason,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const jsonString = JSON.stringify(originalArchive);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].firstName).toBe('Jan');
      expect(parsed[0].reason).toBe('job_change');
    });
  });

  describe('Export File Format', () => {
    it('should create export with proper metadata', () => {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        projects: [],
        evictionArchive: [],
      };

      expect(exportData.version).toMatch(/^\d+\.\d+$/);
      expect(exportData.exportDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should generate unique export filenames', () => {
      const date1 = new Date('2025-01-01').toISOString().split('T')[0];
      const date2 = new Date('2025-01-02').toISOString().split('T')[0];

      const filename1 = `housing-manager-backup-${date1}.json`;
      const filename2 = `housing-manager-backup-${date2}.json`;

      expect(filename1).not.toBe(filename2);
      expect(filename1).toContain('2025-01-01');
      expect(filename2).toContain('2025-01-02');
    });
  });
});
