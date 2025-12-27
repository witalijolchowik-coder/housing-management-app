import { describe, it, expect } from 'vitest';

describe('Dashboard Detail Screens', () => {
  describe('Evictions Detail Screen', () => {
    it('should group evictions by project', () => {
      const projects = [
        {
          id: 'p1',
          name: 'Project Alpha',
          addresses: [
            {
              id: 'a1',
              name: 'Street 1',
              rooms: [
                {
                  id: 'r1',
                  name: 'Room 1',
                  spaces: [
                    {
                      id: 's1',
                      tenant: { firstName: 'John', lastName: 'Doe' },
                      wypowiedzenie: { endDate: '2025-01-15' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const evictions = projects.flatMap((p) =>
        p.addresses.flatMap((a) =>
          a.rooms.flatMap((r) =>
            r.spaces
              .filter((s) => s.tenant && s.wypowiedzenie)
              .map((s) => ({
                projectName: p.name,
                addressName: a.name,
                roomName: r.name,
                tenant: s.tenant,
                endDate: s.wypowiedzenie.endDate,
              }))
          )
        )
      );

      expect(evictions).toHaveLength(1);
      expect(evictions[0].projectName).toBe('Project Alpha');
      expect(evictions[0].tenant.firstName).toBe('John');
    });

    it('should calculate days remaining for eviction', () => {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 5);

      const daysLeft = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysLeft).toBe(5);
    });

    it('should identify overdue evictions', () => {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() - 3);

      const daysLeft = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysLeft).toBeLessThan(0);
    });
  });

  describe('Conflicts Detail Screen', () => {
    it('should group conflicts by project', () => {
      const conflicts = [
        {
          id: 'c1',
          type: 'no_room' as const,
          projectId: 'p1',
          projectName: 'Project Alpha',
          addressId: 'a1',
          addressName: 'Street 1',
          tenantId: 't1',
          firstName: 'Jane',
          lastName: 'Smith',
          message: 'No room available',
        },
      ];

      const grouped = conflicts.reduce(
        (acc, c) => {
          if (!acc[c.projectId]) acc[c.projectId] = [];
          acc[c.projectId].push(c);
          return acc;
        },
        {} as Record<string, typeof conflicts>
      );

      expect(Object.keys(grouped)).toHaveLength(1);
      expect(grouped['p1']).toHaveLength(1);
    });

    it('should translate conflict types', () => {
      const conflictTypes = {
        no_room: 'Brak miejsca',
        wypowiedzenie_overdue: 'Wypowiedzenie przeterminowane',
      };

      expect(conflictTypes['no_room']).toBe('Brak miejsca');
      expect(conflictTypes['wypowiedzenie_overdue']).toBe('Wypowiedzenie przeterminowane');
    });
  });

  describe('Vacant Spaces Detail Screen', () => {
    it('should calculate vacant spaces per address', () => {
      const address = {
        id: 'a1',
        name: 'Street 1',
        rooms: [
          {
            id: 'r1',
            spaces: [
              { id: 's1', status: 'occupied' as const },
              { id: 's2', status: 'vacant' as const },
              { id: 's3', status: 'vacant' as const },
            ],
          },
        ],
      };

      let totalSpaces = 0;
      let occupied = 0;

      for (const room of address.rooms) {
          for (const space of room.spaces) {
          totalSpaces++;
          if (space.status === 'occupied') {
            occupied++;
          }
        }
      }

      const vacant = totalSpaces - occupied;

      expect(totalSpaces).toBe(3);
      expect(occupied).toBe(1);
      expect(vacant).toBe(2);
    });

    it('should filter addresses with no vacant spaces', () => {
      const addresses = [
        { id: 'a1', name: 'Street 1', vacant: 0 },
        { id: 'a2', name: 'Street 2', vacant: 2 },
        { id: 'a3', name: 'Street 3', vacant: 0 },
      ];

      const withVacant = addresses.filter((a) => a.vacant > 0);

      expect(withVacant).toHaveLength(1);
      expect(withVacant[0].name).toBe('Street 2');
    });
  });

  describe('Occupied Spaces Detail Screen', () => {
    it('should calculate occupied spaces per address', () => {
      const address = {
        id: 'a1',
        name: 'Street 1',
        rooms: [
          {
            id: 'r1',
            spaces: [
              { id: 's1', status: 'occupied' as const },
              { id: 's2', status: 'occupied' as const },
              { id: 's3', status: 'vacant' as const },
            ],
          },
        ],
      };

      let totalSpaces = 0;
      let occupied = 0;

      for (const room of address.rooms) {
        for (const space of room.spaces) {
          totalSpaces++;
          if (space.status === 'occupied') {
            occupied++;
          }
        }
      }

      const vacant = totalSpaces - occupied;

      expect(totalSpaces).toBe(3);
      expect(occupied).toBe(2);
      expect(vacant).toBe(1);
    });

    it('should filter addresses with no occupied spaces', () => {
      const addresses = [
        { id: 'a1', name: 'Street 1', occupied: 0 },
        { id: 'a2', name: 'Street 2', occupied: 3 },
        { id: 'a3', name: 'Street 3', occupied: 0 },
      ];

      const withOccupied = addresses.filter((a) => a.occupied > 0);

      expect(withOccupied).toHaveLength(1);
      expect(withOccupied[0].name).toBe('Street 2');
    });
  });

  describe('Total Spaces Detail Screen', () => {
    it('should calculate project occupancy percentage', () => {
      const stats = {
        total: 8,
        occupied: 4,
        vacant: 3,
        wypowiedzenie: 1,
      };

      const occupancyPercent = Math.round(
        ((stats.occupied + stats.wypowiedzenie) / stats.total) * 100
      );

      expect(occupancyPercent).toBe(63);
    });

    it('should handle zero total spaces', () => {
      const stats = {
        total: 0,
        occupied: 0,
        vacant: 0,
        wypowiedzenie: 0,
      };

      const occupancyPercent =
        stats.total > 0 ? Math.round(((stats.occupied + stats.wypowiedzenie) / stats.total) * 100) : 0;

      expect(occupancyPercent).toBe(0);
    });

    it('should calculate correct percentages for different scenarios', () => {
      const scenarios = [
        { total: 10, occupied: 10, wypowiedzenie: 0, expected: 100 },
        { total: 10, occupied: 0, wypowiedzenie: 0, expected: 0 },
        { total: 10, occupied: 5, wypowiedzenie: 2, expected: 70 },
        { total: 8, occupied: 3, wypowiedzenie: 1, expected: 50 },
      ];

      scenarios.forEach((scenario) => {
        const occupancyPercent = Math.round(
          ((scenario.occupied + scenario.wypowiedzenie) / scenario.total) * 100
        );
        expect(occupancyPercent).toBe(scenario.expected);
      });
    });
  });

  describe('Navigation', () => {
    it('should have correct route names for detail screens', () => {
      const routes = [
        '/statistics-detail-evictions',
        '/statistics-detail-conflicts',
        '/statistics-detail-vacant',
        '/statistics-detail-occupied',
        '/statistics-detail-total',
      ];

      expect(routes).toHaveLength(5);
      routes.forEach((route) => {
        expect(route).toMatch(/^\/statistics-detail-/);
      });
    });
  });
});
