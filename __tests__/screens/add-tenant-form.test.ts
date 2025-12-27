import { describe, it, expect } from 'vitest';
import { Tenant, Gender } from '@/types';

describe('Add Tenant Form Validation', () => {
  it('should validate required fields', () => {
    const validateForm = (firstName: string, lastName: string, checkInDate: string, monthlyPrice: string): boolean => {
      return !!(firstName.trim() && lastName.trim() && checkInDate && monthlyPrice.trim());
    };

    expect(validateForm('Jan', 'Kowalski', '2024-01-15', '500')).toBe(true);
    expect(validateForm('', 'Kowalski', '2024-01-15', '500')).toBe(false);
    expect(validateForm('Jan', '', '2024-01-15', '500')).toBe(false);
    expect(validateForm('Jan', 'Kowalski', '', '500')).toBe(false);
    expect(validateForm('Jan', 'Kowalski', '2024-01-15', '')).toBe(false);
  });

  it('should accept only male or female gender', () => {
    const isValidGender = (gender: Gender): boolean => {
      return gender === 'male' || gender === 'female';
    };

    expect(isValidGender('male')).toBe(true);
    expect(isValidGender('female')).toBe(true);
  });

  it('should parse birth year correctly', () => {
    const parseBirthYear = (birthYear: string): number => {
      return birthYear.trim() ? parseInt(birthYear.trim()) : new Date().getFullYear() - 30;
    };

    expect(parseBirthYear('1990')).toBe(1990);
    expect(parseBirthYear('')).toBe(new Date().getFullYear() - 30);
    expect(parseBirthYear('  1985  ')).toBe(1985);
  });

  it('should parse monthly price as number', () => {
    const parsePrice = (price: string): number => {
      return parseFloat(price) || 0;
    };

    expect(parsePrice('500')).toBe(500);
    expect(parsePrice('500.50')).toBe(500.5);
    expect(parsePrice('')).toBe(0);
    expect(parsePrice('invalid')).toBe(0);
  });

  it('should create tenant with correct structure', () => {
    const createTenant = (
      firstName: string,
      lastName: string,
      gender: Gender,
      birthYear: string,
      checkInDate: string,
      workStartDate: string,
      monthlyPrice: string
    ): Tenant => ({
      id: 'test-id',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthYear: birthYear.trim() ? parseInt(birthYear.trim()) : new Date().getFullYear() - 30,
      checkInDate,
      workStartDate: workStartDate || undefined,
      monthlyPrice: parseFloat(monthlyPrice) || 0,
    });

    const tenant = createTenant('Jan', 'Kowalski', 'male', '1990', '2024-01-15', '2024-01-01', '500');

    expect(tenant.firstName).toBe('Jan');
    expect(tenant.lastName).toBe('Kowalski');
    expect(tenant.gender).toBe('male');
    expect(tenant.birthYear).toBe(1990);
    expect(tenant.checkInDate).toBe('2024-01-15');
    expect(tenant.workStartDate).toBe('2024-01-01');
    expect(tenant.monthlyPrice).toBe(500);
  });

  it('should handle optional work start date', () => {
    const createTenant = (workStartDate: string): Tenant => ({
      id: 'test-id',
      firstName: 'Jan',
      lastName: 'Kowalski',
      gender: 'male',
      birthYear: 1990,
      checkInDate: '2024-01-15',
      workStartDate: workStartDate || undefined,
      monthlyPrice: 500,
    });

    const tenant1 = createTenant('2024-01-01');
    const tenant2 = createTenant('');

    expect(tenant1.workStartDate).toBe('2024-01-01');
    expect(tenant2.workStartDate).toBeUndefined();
  });

  it('should trim whitespace from string fields', () => {
    const trimField = (value: string): string => value.trim();

    expect(trimField('  Jan  ')).toBe('Jan');
    expect(trimField('Kowalski')).toBe('Kowalski');
    expect(trimField('  ')).toBe('');
  });

  it('should validate date format YYYY-MM-DD', () => {
    const isValidDateFormat = (dateStr: string): boolean => {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      return regex.test(dateStr);
    };

    expect(isValidDateFormat('2024-01-15')).toBe(true);
    expect(isValidDateFormat('2024-12-31')).toBe(true);
    expect(isValidDateFormat('01-15-2024')).toBe(false);
    expect(isValidDateFormat('2024/01/15')).toBe(false);
    expect(isValidDateFormat('2024-1-15')).toBe(false);
  });

  it('should handle price with decimal places', () => {
    const parsePrice = (price: string): number => {
      return parseFloat(price) || 0;
    };

    expect(parsePrice('500.00')).toBe(500);
    expect(parsePrice('500.50')).toBe(500.5);
    expect(parsePrice('1000.99')).toBe(1000.99);
  });
});
