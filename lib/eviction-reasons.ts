export type EvictionReason = 'relocation' | 'job_change' | 'own_housing' | 'other';

export const getEvictionReasonLabel = (reason?: EvictionReason | string): string => {
  switch (reason) {
    case 'relocation':
      return 'Przeprowadzka na inne mieszkanie';
    case 'job_change':
      return 'Zmiana pracy';
    case 'own_housing':
      return 'Przeprowadzka na własne mieszkanie';
    case 'other':
      return 'Inne';
    default:
      return reason || 'Nieznany powód';
  }
};

export const EVICTION_REASONS: Array<{ value: EvictionReason; label: string }> = [
  { value: 'relocation', label: 'Przeprowadzka na inne mieszkanie' },
  { value: 'job_change', label: 'Zmiana pracy' },
  { value: 'own_housing', label: 'Przeprowadzka na własne mieszkanie' },
  { value: 'other', label: 'Inne' },
];
