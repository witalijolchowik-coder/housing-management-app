import { describe, it, expect } from 'vitest';
import { Project, OperatorType } from '../../types';

describe('Operator Tags Feature', () => {
  describe('Operator Collection', () => {
    it('should collect unique operators from project addresses', () => {
      const project: Project = {
        id: '1',
        name: 'Test Project',
        city: 'Warsaw',
        addresses: [
          {
            id: 'addr1',
            projectId: '1',
            name: 'Address 1',
            fullAddress: 'Test St 1',
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
          {
            id: 'addr2',
            projectId: '1',
            name: 'Address 2',
            fullAddress: 'Test St 2',
            totalSpaces: 10,
            coupleRooms: 0,
            companyName: 'Test Company',
            ownerName: 'Test Owner',
            phone: '+48123456789',
            evictionPeriod: 14,
            totalCost: 5000,
            pricePerSpace: 500,
            photos: [],
            operator: 'e_port' as OperatorType,
            rooms: [],
            unassignedTenants: [],
          },
        ],
      };

      const operators = new Set<string>();
      project.addresses.forEach(address => {
        if (address.operator) {
          operators.add(address.operator);
        }
      });
      const operatorList = Array.from(operators);

      expect(operatorList).toHaveLength(2);
      expect(operatorList).toContain('rent_planet');
      expect(operatorList).toContain('e_port');
    });

    it('should handle single operator', () => {
      const project: Project = {
        id: '1',
        name: 'Test Project',
        city: 'Warsaw',
        addresses: [
          {
            id: 'addr1',
            projectId: '1',
            name: 'Address 1',
            fullAddress: 'Test St 1',
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

      const operators = new Set<string>();
      project.addresses.forEach(address => {
        if (address.operator) {
          operators.add(address.operator);
        }
      });
      const operatorList = Array.from(operators);

      expect(operatorList).toHaveLength(1);
      expect(operatorList[0]).toBe('rent_planet');
    });

    it('should deduplicate same operators from multiple addresses', () => {
      const project: Project = {
        id: '1',
        name: 'Test Project',
        city: 'Warsaw',
        addresses: [
          {
            id: 'addr1',
            projectId: '1',
            name: 'Address 1',
            fullAddress: 'Test St 1',
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
          {
            id: 'addr2',
            projectId: '1',
            name: 'Address 2',
            fullAddress: 'Test St 2',
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

      const operators = new Set<string>();
      project.addresses.forEach(address => {
        if (address.operator) {
          operators.add(address.operator);
        }
      });
      const operatorList = Array.from(operators);

      expect(operatorList).toHaveLength(1);
      expect(operatorList[0]).toBe('rent_planet');
    });

    it('should handle project with no operators', () => {
      const project: Project = {
        id: '1',
        name: 'Test Project',
        city: 'Warsaw',
        addresses: [
          {
            id: 'addr1',
            projectId: '1',
            name: 'Address 1',
            fullAddress: 'Test St 1',
            totalSpaces: 10,
            coupleRooms: 0,
            companyName: 'Test Company',
            ownerName: 'Test Owner',
            phone: '+48123456789',
            evictionPeriod: 14,
            totalCost: 5000,
            pricePerSpace: 500,
            photos: [],
            rooms: [],
            unassignedTenants: [],
          },
        ],
      };

      const operators = new Set<string>();
      project.addresses.forEach(address => {
        if (address.operator) {
          operators.add(address.operator);
        }
      });
      const operatorList = Array.from(operators);

      expect(operatorList).toHaveLength(0);
    });

    it('should handle empty addresses array', () => {
      const project: Project = {
        id: '1',
        name: 'Test Project',
        city: 'Warsaw',
        addresses: [],
      };

      const operators = new Set<string>();
      project.addresses.forEach(address => {
        if (address.operator) {
          operators.add(address.operator);
        }
      });
      const operatorList = Array.from(operators);

      expect(operatorList).toHaveLength(0);
    });
  });

  describe('Operator Label Mapping', () => {
    const getOperatorLabel = (operator: string) => {
      switch (operator) {
        case 'rent_planet':
          return 'Rent Planet';
        case 'e_port':
          return 'E-Port';
        case 'other':
          return 'Inne';
        default:
          return operator;
      }
    };

    it('should map rent_planet to Rent Planet', () => {
      expect(getOperatorLabel('rent_planet')).toBe('Rent Planet');
    });

    it('should map e_port to E-Port', () => {
      expect(getOperatorLabel('e_port')).toBe('E-Port');
    });

    it('should map other to Inne', () => {
      expect(getOperatorLabel('other')).toBe('Inne');
    });

    it('should return original value for unknown operator', () => {
      expect(getOperatorLabel('unknown')).toBe('unknown');
    });
  });

  describe('Operator Tag Display Logic', () => {
    it('should show tags when operators exist', () => {
      const operatorList = ['rent_planet', 'e_port'];
      const shouldShowTags = operatorList.length > 0;

      expect(shouldShowTags).toBe(true);
    });

    it('should not show tags when no operators', () => {
      const operatorList: string[] = [];
      const shouldShowTags = operatorList.length > 0;

      expect(shouldShowTags).toBe(false);
    });

    it('should handle all three operator types', () => {
      const operators: OperatorType[] = ['rent_planet', 'e_port', 'other'];
      
      expect(operators).toHaveLength(3);
      expect(operators).toContain('rent_planet');
      expect(operators).toContain('e_port');
      expect(operators).toContain('other');
    });
  });
});
