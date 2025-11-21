export type ThemePreference = 'light' | 'dark' | 'system';

export interface UIPreferences {
  theme: ThemePreference;
  reduceMotion: boolean;
  reduceTransparency: boolean;
  telemetryEnabled: boolean;
}

export interface UIPreferencesContextType extends UIPreferences {
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  setReduceMotion: (value: boolean) => void;
  setReduceTransparency: (value: boolean) => void;
  setTelemetryEnabled: (value: boolean) => void;
}
