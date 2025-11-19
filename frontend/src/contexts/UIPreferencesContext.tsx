import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
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
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const [systemReduceTransparency, setSystemReduceTransparency] = useState(false);

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
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateMotion = (event: MediaQueryList | MediaQueryListEvent) => {
      setSystemReduceMotion(event.matches);
    };

    updateMotion(motionQuery);

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', updateMotion);
    } else {
      motionQuery.addListener(updateMotion);
    }

    return () => {
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', updateMotion);
      } else {
        motionQuery.removeListener(updateMotion);
      }
    };
  }, []);

  // Detect prefers-reduced-transparency (Guidelines.md Bagian 8.5.3)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const transparencyQuery = window.matchMedia(
      '(prefers-reduced-transparency: reduce)'
    );

    const updateTransparency = (
      event: MediaQueryList | MediaQueryListEvent
    ) => {
      setSystemReduceTransparency(event.matches);
    };

    updateTransparency(transparencyQuery);

    if (transparencyQuery.addEventListener) {
      transparencyQuery.addEventListener('change', updateTransparency);
    } else {
      transparencyQuery.addListener(updateTransparency);
    }

    return () => {
      if (transparencyQuery.removeEventListener) {
        transparencyQuery.removeEventListener('change', updateTransparency);
      } else {
        transparencyQuery.removeListener(updateTransparency);
      }
    };
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

  const reduceMotion = preferences.reduceMotion || systemReduceMotion;
  const reduceTransparency =
    preferences.reduceTransparency || systemReduceTransparency;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (reduceMotion) {
      root.setAttribute('data-reduce-motion', 'true');
    } else {
      root.removeAttribute('data-reduce-motion');
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (reduceTransparency) {
      root.setAttribute('data-reduce-transparency', 'true');
    } else {
      root.removeAttribute('data-reduce-transparency');
    }
  }, [reduceTransparency]);

  const value: UIPreferencesContextType = {
    ...preferences,
    reduceMotion,
    reduceTransparency,
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