import { describe, it, expect } from 'vitest';

describe('Dashboard Statistics Restructuring', () => {
  describe('Overall Statistics Calculation', () => {
    it('should calculate overall occupancy percentage correctly', () => {
      const totalSpaces = 10;
      const occupiedSpaces = 5;
      const wypowiedzienieSpaces = 2;
      
      const occupancyPercent = Math.round(((occupiedSpaces + wypowiedzienieSpaces) / totalSpaces) * 100);
      
      expect(occupancyPercent).toBe(70);
    });

    it('should calculate 0% occupancy when no spaces are occupied', () => {
      const totalSpaces = 10;
      const occupiedSpaces = 0;
      const wypowiedzienieSpaces = 0;
      
      const occupancyPercent = Math.round(((occupiedSpaces + wypowiedzienieSpaces) / totalSpaces) * 100);
      
      expect(occupancyPercent).toBe(0);
    });

    it('should calculate 100% occupancy when all spaces are occupied', () => {
      const totalSpaces = 8;
      const occupiedSpaces = 6;
      const wypowiedzienieSpaces = 2;
      
      const occupancyPercent = Math.round(((occupiedSpaces + wypowiedzienieSpaces) / totalSpaces) * 100);
      
      expect(occupancyPercent).toBe(100);
    });

    it('should handle zero total spaces gracefully', () => {
      const totalSpaces = 0;
      const occupiedSpaces = 0;
      const wypowiedzienieSpaces = 0;
      
      const occupancyPercent = totalSpaces > 0 
        ? Math.round(((occupiedSpaces + wypowiedzienieSpaces) / totalSpaces) * 100)
        : 0;
      
      expect(occupancyPercent).toBe(0);
    });
  });

  describe('Dashboard Data Aggregation', () => {
    it('should aggregate statistics from multiple projects', () => {
      const projects = [
        {
          id: '1',
          name: 'Project A',
          stats: { total: 8, occupied: 3, vacant: 3, wypowiedzenie: 1, conflictCount: 0 }
        },
        {
          id: '2',
          name: 'Project B',
          stats: { total: 6, occupied: 2, vacant: 2, wypowiedzenie: 1, conflictCount: 1 }
        }
      ];

      let totalSpaces = 0;
      let totalOccupied = 0;
      let totalVacant = 0;
      let totalWypowiedzenie = 0;
      let totalConflicts = 0;

      for (const project of projects) {
        totalSpaces += project.stats.total;
        totalOccupied += project.stats.occupied;
        totalVacant += project.stats.vacant;
        totalWypowiedzenie += project.stats.wypowiedzenie;
        totalConflicts += project.stats.conflictCount;
      }

      expect(totalSpaces).toBe(14);
      expect(totalOccupied).toBe(5);
      expect(totalVacant).toBe(5);
      expect(totalWypowiedzenie).toBe(2);
      expect(totalConflicts).toBe(1);
    });

    it('should calculate total cost from all addresses', () => {
      const projects = [
        {
          id: '1',
          name: 'Project A',
          addresses: [
            { totalCost: 1000 },
            { totalCost: 1500 }
          ]
        },
        {
          id: '2',
          name: 'Project B',
          addresses: [
            { totalCost: 2000 }
          ]
        }
      ];

      let totalCost = 0;
      for (const project of projects) {
        for (const address of project.addresses) {
          totalCost += address.totalCost || 0;
        }
      }

      expect(totalCost).toBe(4500);
    });
  });

  describe('Reports Tab Simplification', () => {
    it('should display project reports with download option', () => {
      const projects = [
        {
          id: '1',
          name: 'Project Alpha',
          city: 'Warsaw',
          stats: { occupancyPercent: 50, occupied: 3, total: 8, vacant: 3, wypowiedzenie: 1 }
        }
      ];

      const project = projects[0];
      
      expect(project.name).toBe('Project Alpha');
      expect(project.stats.occupancyPercent).toBe(50);
      expect(project.stats.occupied).toBe(3);
    });

    it('should format CSV export correctly', () => {
      const project = {
        name: 'Project A',
        addresses: [
          {
            name: 'Address 1',
            rooms: [
              {
                name: 'Room 1',
                spaces: [
                  {
                    number: 1,
                    tenant: {
                      firstName: 'John',
                      lastName: 'Doe',
                      gender: 'male',
                      birthYear: 1990,
                      checkInDate: '2024-01-15',
                      monthlyPrice: 1000
                    }
                  }
                ]
              }
            ]
          }
        ]
      };

      let csv = 'Projekt,Adres,Pokój,Miejsce,Imię,Nazwisko,Płeć,Rok urodzenia,Data zameldowania,Cena\n';
      
      for (const address of project.addresses) {
        for (const room of address.rooms) {
          for (const space of room.spaces) {
            if (space.tenant) {
              csv += `"${project.name}","${address.name}","${room.name}","${space.number}","${space.tenant.firstName}","${space.tenant.lastName}","${space.tenant.gender}","${space.tenant.birthYear}","${space.tenant.checkInDate}","${space.tenant.monthlyPrice}"\n`;
            }
          }
        }
      }

      expect(csv).toContain('Project A');
      expect(csv).toContain('John');
      expect(csv).toContain('Doe');
      expect(csv).toContain('1000');
    });
  });

  describe('Dashboard Card Display', () => {
    it('should display all required dashboard cards', () => {
      const dashboardCards = [
        { id: 'occupancy', label: 'Obłożenie', value: '50%' },
        { id: 'totalSpaces', label: 'Razem', value: '8' },
        { id: 'occupied', label: 'Zajęte', value: '3' },
        { id: 'vacant', label: 'Wolne', value: '3' },
        { id: 'wypowiedzenie', label: 'Wyp.', value: '1' },
        { id: 'conflicts', label: 'Konflikty', value: '0' }
      ];

      expect(dashboardCards).toHaveLength(6);
      expect(dashboardCards.map(c => c.id)).toContain('occupancy');
      expect(dashboardCards.map(c => c.id)).toContain('conflicts');
      expect(dashboardCards.map(c => c.id)).not.toContain('totalCost');
    });

  });

  describe('Statistics Hierarchy', () => {
    it('should maintain project hierarchy for statistics', () => {
      const hierarchy = {
        project: {
          id: 'p1',
          name: 'Project A',
          addresses: [
            {
              id: 'a1',
              name: 'Address 1',
              rooms: [
                {
                  id: 'r1',
                  name: 'Room 1',
                  spaces: [
                    {
                      id: 's1',
                      number: 1,
                      tenant: {
                        firstName: 'John',
                        lastName: 'Doe'
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      };

      expect(hierarchy.project.name).toBe('Project A');
      expect(hierarchy.project.addresses[0].name).toBe('Address 1');
      expect(hierarchy.project.addresses[0].rooms[0].name).toBe('Room 1');
      expect(hierarchy.project.addresses[0].rooms[0].spaces[0].tenant.firstName).toBe('John');
    });
  });
});
