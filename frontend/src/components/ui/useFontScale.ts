import { useTextScaleFactor } from '../../lib/accessibility';

export interface FontScaleState {
  scale: number;
  isXXXL: boolean;
}

export const useFontScale = (): FontScaleState => {
  const scale = useTextScaleFactor();
  return {
    scale,
    isXXXL: scale >= 1.4,
  };
};
