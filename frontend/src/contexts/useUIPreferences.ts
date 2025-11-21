import { useContext } from 'react';
import { UIPreferencesContext } from './ui-preferences-context';
import type { UIPreferencesContextType } from './uiPreferences.types';

export const useUIPreferences = (): UIPreferencesContextType => {
  const context = useContext(UIPreferencesContext);
  if (context === undefined) {
    throw new Error('useUIPreferences must be used within a UIPreferencesProvider');
  }
  return context;
};

export const useUIPreferencesOptional = () => useContext(UIPreferencesContext);
