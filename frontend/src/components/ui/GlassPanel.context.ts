import { createContext, useContext } from 'react';

export interface GlassPanelContextValue {
  isGlass: boolean;
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  contrastRatio: number;
}

export const GlassPanelContext = createContext<GlassPanelContextValue | null>(null);

export const useGlassPanelContext = () => useContext(GlassPanelContext);
