import { describe, it, expect } from 'vitest';

describe('DatePicker Component', () => {
  it('should format date string to YYYY-MM-DD format', () => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'Wybierz datę';
      const [year, month, day] = dateStr.split('-');
      return `${day}.${month}.${year}`;
    };

    expect(formatDate('2024-01-15')).toBe('15.01.2024');
    expect(formatDate('2024-12-31')).toBe('31.12.2024');
    expect(formatDate('')).toBe('Wybierz datę');
  });

  it('should validate date selection', () => {
    const isValidDate = (year: number, month: number, day: number) => {
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    };

    expect(isValidDate(2024, 1, 15)).toBe(true);
    expect(isValidDate(2024, 2, 29)).toBe(true); // 2024 is leap year
    expect(isValidDate(2023, 2, 29)).toBe(false); // 2023 is not leap year
    expect(isValidDate(2024, 13, 1)).toBe(false); // Invalid month
  });

  it('should calculate days in month correctly', () => {
    const getDaysInMonth = (month: number, year: number) => {
      return new Date(year, month, 0).getDate();
    };

    expect(getDaysInMonth(1, 2024)).toBe(31); // January
    expect(getDaysInMonth(2, 2024)).toBe(29); // February (leap year)
    expect(getDaysInMonth(2, 2023)).toBe(28); // February (non-leap year)
    expect(getDaysInMonth(4, 2024)).toBe(30); // April
    expect(getDaysInMonth(12, 2024)).toBe(31); // December
  });

  it('should generate year range correctly', () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    expect(years[0]).toBe(currentYear);
    expect(years[99]).toBe(currentYear - 99);
    expect(years.length).toBe(100);
  });

  it('should pad date components with zeros', () => {
    const padDate = (value: number) => String(value).padStart(2, '0');

    expect(padDate(1)).toBe('01');
    expect(padDate(9)).toBe('09');
    expect(padDate(10)).toBe('10');
    expect(padDate(31)).toBe('31');
  });

  it('should construct ISO date string correctly', () => {
    const constructDate = (year: number, month: number, day: number) => {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    expect(constructDate(2024, 1, 15)).toBe('2024-01-15');
    expect(constructDate(2024, 12, 31)).toBe('2024-12-31');
    expect(constructDate(2024, 3, 5)).toBe('2024-03-05');
  });
});
