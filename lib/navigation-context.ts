import { createContext, useContext } from 'react';

export interface NavigationContextType {
  selectedProjectId: string | null;
  selectedAddressId: string | null;
  selectedRoomId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedAddressId: (id: string | null) => void;
  setSelectedRoomId: (id: string | null) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
