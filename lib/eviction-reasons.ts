import { EvictionReason } from '@/types';

export const getEvictionReasonLabel = (reason: EvictionReason): string => {
  switch (reason) {
    case 'job_change':
      return 'Zmiana pracy';
    case 'own_housing':
      return 'Własne mieszkanie';
    case 'disciplinary':
      return 'Dyscyplinarne';
    case 'relocation':
      return 'Przeprowadzka';
    default:
      return reason;
  }
};
