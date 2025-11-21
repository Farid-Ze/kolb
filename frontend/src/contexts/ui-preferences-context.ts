import { createContext } from 'react';
import type { UIPreferencesContextType } from './uiPreferences.types';

export const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(undefined);
