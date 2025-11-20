import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useExperienceStore, useExperienceActions } from '../stores/useExperienceStore';
import { ROOM_REGISTRY } from './registry';
import { springs } from '../core/physics/springs';
import { RoomFallback } from '../core/design-system/RoomFallback';
import { BackgroundVignette } from '../core/design-system/Background';
import { useAuthStatus } from '../core/auth/useAuthStatus';

// Placeholder for IntroRoom
const IntroRoom = React.lazy(() => import('./IntroRoom/IntroRoom'));
const ConcreteExperienceRoom = React.lazy(() => import('./ConcreteExperienceRoom/ConcreteExperienceRoom'));
const ReflectiveObservationRoom = React.lazy(() => import('./ReflectiveObservationRoom/ReflectiveObservationRoom'));
const AbstractConceptualizationRoom = React.lazy(() => import('./AbstractConceptualizationRoom/AbstractConceptualizationRoom'));
const ActiveExperimentationRoom = React.lazy(() => import('./ActiveExperimentationRoom/ActiveExperimentationRoom'));

const RoomComponents: Record<string, React.ComponentType<any>> = {
    'intro-room': IntroRoom,
    'concrete-experience-room': ConcreteExperienceRoom,
    'reflective-observation-room': ReflectiveObservationRoom,
    'abstract-conceptualization-room': AbstractConceptualizationRoom,
    'active-experimentation-room': ActiveExperimentationRoom,
};

export const SceneController: React.FC = () => {
    const { currentRoomIndex, direction } = useExperienceStore();
    const { nextRoom, prevRoom, goToRoom } = useExperienceActions();
    const { status } = useAuthStatus();

    const currentRoom = ROOM_REGISTRY[currentRoomIndex] || ROOM_REGISTRY[0];
    const CurrentRoomComponent = RoomComponents[currentRoom.id] || (() => <div>Room not found</div>);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95,
            filter: 'blur(10px)',
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95,
            filter: 'blur(10px)',
        }),
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black text-white">
            <BackgroundVignette />

      {/* Global Auth Indicator (HUD) */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 pointer-events-none">
        {status === 'loading' && (
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md pointer-events-auto"
            title="Checking authentication status..."
            aria-label="Authentication status: Loading"
          >
            <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
            <span className="text-xs font-medium text-white/50">Checking...</span>
          </div>
        )}
        {status === 'authenticated' && (
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md pointer-events-auto"
            title="You are signed in. Your progress will be saved."
            aria-label="Authentication status: Signed In"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-200">Signed In</span>
          </div>
        )}
        {status === 'guest' && (
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md pointer-events-auto"
            title="You are browsing as a guest. Sign in to save your results."
            aria-label="Authentication status: Guest"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400/50" />
            <span className="text-xs font-medium text-white/50">Guest</span>
          </div>
        )}
      </div>
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={currentRoomIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: springs.medium,
                        opacity: { duration: 0.4 },
                        scale: springs.medium,
                        filter: { duration: 0.4 },
                    }}
                    className={`absolute inset-0 w-full h-full ${currentRoom?.backgroundClassName || ''}`}
                >
                    <React.Suspense fallback={<RoomFallback />}>
                        <CurrentRoomComponent />
                    </React.Suspense>
                </motion.div>
            </AnimatePresence>

            {/* HUD / Navigation */}
            <div className="absolute bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevRoom}
                        disabled={currentRoomIndex === 0}
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                        ←
                    </button>
                    <div className="text-center">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white/80">{currentRoom?.stage}</h2>
                        <p className="text-xs text-white/50">{currentRoom?.title}</p>
                    </div>
                    <button
                        onClick={() => nextRoom(ROOM_REGISTRY.length)}
                        disabled={currentRoomIndex === ROOM_REGISTRY.length - 1}
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                        →
                    </button>
                </div>

                {/* Dots */}
                <div className="flex gap-2">
                    {ROOM_REGISTRY.map((room, idx) => (
                        <button
                            key={room.id}
                            onClick={() => goToRoom(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentRoomIndex ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'
                                }`}
                            aria-label={`Go to ${room.title}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
