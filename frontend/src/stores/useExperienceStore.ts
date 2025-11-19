import { create } from 'zustand';

interface ExperienceState {
  currentRoomIndex: number;
  direction: 1 | -1;
  isTransitioning: boolean;
  actions: {
    nextRoom: (totalRooms: number) => void;
    prevRoom: () => void;
    goToRoom: (index: number) => void;
    setTransitioning: (isTransitioning: boolean) => void;
  };
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  currentRoomIndex: 0,
  direction: 1,
  isTransitioning: false,
  actions: {
    nextRoom: (totalRooms) =>
      set((state) => {
        if (state.currentRoomIndex >= totalRooms - 1) return state;
        return {
          currentRoomIndex: state.currentRoomIndex + 1,
          direction: 1,
          isTransitioning: true,
        };
      }),
    prevRoom: () =>
      set((state) => {
        if (state.currentRoomIndex <= 0) return state;
        return {
          currentRoomIndex: state.currentRoomIndex - 1,
          direction: -1,
          isTransitioning: true,
        };
      }),
    goToRoom: (index) =>
      set((state) => ({
        currentRoomIndex: index,
        direction: index > state.currentRoomIndex ? 1 : -1,
        isTransitioning: true,
      })),
    setTransitioning: (isTransitioning) => set({ isTransitioning }),
  },
}));

export const useExperienceActions = () => useExperienceStore((state) => state.actions);
