import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const RoomComponents: Record<string, React.LazyExoticComponent<any> | React.ComponentType<any>> = {
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

    const currentRoom = ROOM_REGISTRY[currentRoomIndex] ?? ROOM_REGISTRY[0];
    
    if (!currentRoom) {
        return <div>Configuration Error: No rooms defined</div>;
    }

    const CurrentRoomComponent = RoomComponents[currentRoom.id] || (() => <div>Room not found</div>);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isInput = !!target?.matches(
                'input, select, textarea, button, [role="slider"], [contenteditable]'
            );

            if (isInput) {
                return;
            }

            if (e.key === 'ArrowRight') {
                nextRoom(ROOM_REGISTRY.length);
            } else if (e.key === 'ArrowLeft') {
                prevRoom();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextRoom, prevRoom]);

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
            <header className="absolute top-6 right-6 z-50 flex items-center gap-2 pointer-events-none">
                {status === 'loading' && (
                    <div 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md pointer-events-auto"
                        title="Checking authentication status..."
                        aria-label="Authentication status: Checking"
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
            </header>

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
            <nav className="absolute bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-6 pointer-events-none">
                {/* Room Title & Arrows */}
                <div className="flex items-center gap-8 pointer-events-auto">
                    <button
                        onClick={prevRoom}
                        disabled={currentRoomIndex === 0}
                        className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm group"
                        aria-label="Previous room"
                    >
                        <ChevronLeft className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                    </button>
                    
                    <div className="text-center min-w-[240px]">
                        <motion.h2 
                          key={`stage-${currentRoomIndex}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2"
                        >
                          {currentRoom?.stage}
                        </motion.h2>
                        <motion.p 
                          key={`title-${currentRoomIndex}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-lg font-medium text-white/90 tracking-wide"
                        >
                          {currentRoom?.title}
                        </motion.p>
                    </div>

                    <button
                        onClick={() => nextRoom(ROOM_REGISTRY.length)}
                        disabled={currentRoomIndex === ROOM_REGISTRY.length - 1}
                        className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm group"
                        aria-label="Next room"
                    >
                        <ChevronRight className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Navigation Rail (Dots) */}
                <div className="flex items-center gap-4 pointer-events-auto bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                    {ROOM_REGISTRY.map((room, idx) => (
                        <button
                            key={room.id}
                            onClick={() => goToRoom(idx)}
                            className={`group relative flex items-center justify-center transition-all duration-500 ${
                              idx === currentRoomIndex 
                                ? 'w-12' 
                                : 'w-2 hover:scale-150'
                            }`}
                            aria-label={`Go to ${room.title}`}
                        >
                            <div className={`h-1 rounded-full w-full transition-colors duration-500 ${
                                idx === currentRoomIndex ? 'bg-white' : 'bg-white/30 group-hover:bg-white/60'
                            }`} />
                            
                            {/* Tooltip */}
                            <span className="absolute bottom-full mb-4 px-3 py-1.5 text-xs font-medium text-white bg-black/90 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 shadow-xl transform translate-y-2 group-hover:translate-y-0 duration-200">
                              {room.title}
                            </span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};
