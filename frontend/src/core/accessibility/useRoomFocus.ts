import { useEffect, RefObject } from 'react';

export const useRoomFocus = (ref: RefObject<HTMLElement | null>, isActive: boolean = true) => {
  useEffect(() => {
    if (isActive && ref.current) {
      // Small timeout to ensure transition/mount is complete and DOM is ready
      const timer = setTimeout(() => {
        ref.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isActive, ref]);
};
