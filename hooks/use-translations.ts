import { pl } from '@/locales/pl';

// Simple i18n hook - currently supports Polish only
export const useTranslations = () => {
  return pl;
};

// Helper to get nested translation values
export const getTranslation = (path: string, defaultValue = ''): string => {
  const keys = path.split('.');
  let value: any = pl;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return typeof value === 'string' ? value : defaultValue;
};
