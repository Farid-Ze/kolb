import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * KLSI 4.0 - UIPreferencesContext
 * Task 81-83: Manajemen preferensi UI (theme, motion, transparency)
 * Guidelines.md §2.5 & §8.5.3: Accessibility support
 */

interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  reduceMotion: boolean;
  reduceTransparency: boolean;
}

export interface UIPreferencesContextType extends UIPreferences {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  setReduceMotion: (value: boolean) => void;
  setReduceTransparency: (value: boolean) => void;
}

export const UIPreferencesContext = createContext<
  UIPreferencesContextType | undefined
>(undefined);

interface UIPreferencesProviderProps {
  children: ReactNode;
}

export const UIPreferencesProvider: React.FC<UIPreferencesProviderProps> = ({
  children,
}) => {
  const [preferences, setPreferences] = useLocalStorage<UIPreferences>(
    'ui-preferences',
    {
      theme: 'system',
      reduceMotion: false,
      reduceTransparency: false,
    }
  );

  // Detect system preferences
  useEffect(() => {
    // Detect prefers-color-scheme
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      if (preferences.theme === 'system') {
        document.documentElement.classList.toggle('dark', darkModeQuery.matches);
      } else {
        document.documentElement.classList.toggle(
          'dark',
          preferences.theme === 'dark'
        );
      }
    };

    updateTheme();
    darkModeQuery.addEventListener('change', updateTheme);

    return () => darkModeQuery.removeEventListener('change', updateTheme);
  }, [preferences.theme]);

  // Detect prefers-reduced-motion (Guidelines.md Bagian 2.5)
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const updateMotion = () => {
      if (motionQuery.matches) {
        setPreferences((prev) => ({ ...prev, reduceMotion: true }));
      }
    };

    updateMotion();
    motionQuery.addEventListener('change', updateMotion);

    return () => motionQuery.removeEventListener('change', updateMotion);
  }, []);

  // Detect prefers-reduced-transparency (Guidelines.md Bagian 8.5.3)
  useEffect(() => {
    const transparencyQuery = window.matchMedia(
      '(prefers-reduced-transparency: reduce)'
    );
    
    const updateTransparency = () => {
      if (transparencyQuery.matches) {
        setPreferences((prev) => ({ ...prev, reduceTransparency: true }));
      }
    };

    updateTransparency();
    transparencyQuery.addEventListener('change', updateTransparency);

    return () =>
      transparencyQuery.removeEventListener('change', updateTransparency);
  }, []);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setPreferences((prev) => ({ ...prev, theme }));
  };

  const toggleTheme = () => {
    setPreferences((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const setReduceMotion = (value: boolean) => {
    setPreferences((prev) => ({ ...prev, reduceMotion: value }));
  };

  const setReduceTransparency = (value: boolean) => {
    setPreferences((prev) => ({ ...prev, reduceTransparency: value }));
  };

  const value: UIPreferencesContextType = {
    ...preferences,
    setTheme,
    toggleTheme,
    setReduceMotion,
    setReduceTransparency,
  };

  return (
    <UIPreferencesContext.Provider value={value}>
      {children}
    </UIPreferencesContext.Provider>
  );
};

export const useUIPreferences = (): UIPreferencesContextType => {
  const context = useContext(UIPreferencesContext);
  if (context === undefined) {
    throw new Error(
      'useUIPreferences must be used within a UIPreferencesProvider'
    );
  }
  return context;
};

export const useUIPreferencesOptional = () => useContext(UIPreferencesContext);