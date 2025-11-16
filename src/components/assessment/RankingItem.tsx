/**
 * KLSI 4.0 - RankingItem Component
 * Task 31-32: RankingItem dengan dual input: drag-and-drop OR button ranking
 * 
 * Implementasi sesuai Guidelines.md:
 * - Liquid Glass material untuk elevated content
 * - Spring-based animations untuk interaksi
 * - Ergonomi touch (Zona Hijau untuk tombol ranking)
 * - Accessibility (focus-visible, reduce-motion)
 * - Drag-and-drop support dengan @dnd-kit untuk power users
 * - Removed text-* classes, 8px grid spacing
 */

import React from 'react';
import { motion } from 'motion/react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RankingItemProps {
  mode: {
    mode: string; // CE, RO, AC, AE
    statement: string;
    rank?: number; // 1-4
  };
  onRankChange: (mode: string, rank: number) => void;
  isSelected?: boolean;
  isDraggable?: boolean;
  dragId?: string; // Unique ID for drag-and-drop
}

export const RankingItem: React.FC<RankingItemProps> = ({
  mode,
  onRankChange,
  isSelected = false,
  isDraggable = false,
  dragId,
}) => {
  const currentRank = mode.rank;

  // Task 31: Setup drag-and-drop dengan @dnd-kit/sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dragId || mode.mode,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Mode labels dan colors untuk Kolb dimensions
  const modeInfo: Record<string, { label: string; color: string; description: string }> = {
    CE: {
      label: 'Concrete Experience',
      color: 'chart-1',
      description: 'Belajar melalui pengalaman langsung dan perasaan',
    },
    RO: {
      label: 'Reflective Observation',
      color: 'chart-2',
      description: 'Belajar melalui pengamatan dan refleksi',
    },
    AC: {
      label: 'Abstract Conceptualization',
      color: 'chart-3',
      description: 'Belajar melalui analisis dan pemikiran logis',
    },
    AE: {
      label: 'Active Experimentation',
      color: 'chart-4',
      description: 'Belajar melalui eksperimen dan tindakan',
    },
  };

  const info = modeInfo[mode.mode] || {
    label: mode.mode,
    color: 'primary',
    description: '',
  };

  // Spring configuration (Guidelines.md Section 2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        material-regular rounded-xl p-6
        ${isSelected ? 'ring-2 ring-primary' : ''}
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isDragging ? 'opacity-50 scale-105 shadow-2xl z-50' : ''}
      `}
      whileHover={isDraggable && !isDragging ? { scale: 1.01 } : {}}
      transition={springConfig}
    >
      <div className="flex items-start gap-4">
        {/* Task 31: Drag Handle (Guidelines §1.3.2 - Touch target minimum 44px) */}
        {isDraggable && (
          <motion.div 
            className="flex-shrink-0 pt-1 touch-manipulation cursor-grab active:cursor-grabbing"
            whileHover={{ scale: 1.1, color: 'hsl(var(--foreground))' }}
            transition={springConfig}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        )}

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Mode Badge with label */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center rounded-lg bg-${info.color}/10 px-3 py-1.5 text-${info.color}`}>
              {mode.mode}
            </span>
            <span className="text-muted-foreground">
              {info.label}
            </span>
          </div>

          {/* Statement */}
          <p className="text-foreground leading-relaxed">
            {mode.statement}
          </p>

          {/* Description hint (optional, can be hidden on mobile) */}
          {info.description && (
            <p className="text-muted-foreground hidden md:block">
              {info.description}
            </p>
          )}
        </div>

        {/* Rank Badge (Guidelines §1.3.2 - Visual hierarchy) */}
        <div className="flex-shrink-0">
          {currentRank ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={springConfig}
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            >
              <span className="text-2xl">{currentRank}</span>
            </motion.div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-border">
              <span className="text-muted-foreground text-xl">?</span>
            </div>
          )}
        </div>
      </div>

      {/* Ranking Buttons - Task 31 (Zona Hijau - bottom placement for mobile ergonomics) */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((rank) => (
          <motion.button
            key={rank}
            onClick={() => onRankChange(mode.mode, rank)}
            className={`
              rounded-xl px-4 py-4 touch-manipulation
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              ${
                currentRank === rank
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-secondary-foreground'
              }
            `}
            whileHover={{ scale: 1.05, opacity: 0.9 }}
            whileTap={{ scale: 0.95 }}
            transition={springConfig}
            aria-label={`Rank ${rank}: ${rank === 1 ? 'Paling sesuai' : rank === 4 ? 'Paling tidak sesuai' : `Ranking ${rank}`}`}
            aria-pressed={currentRank === rank}
          >
            <span className="text-xl">{rank}</span>
          </motion.button>
        ))}
      </div>

      {/* Rank labels untuk guidance */}
      <div className="mt-2 grid grid-cols-4 gap-3 text-center">
        <span className="text-muted-foreground">Paling</span>
        <span className="text-muted-foreground">Sesuai</span>
        <span className="text-muted-foreground">Kurang</span>
        <span className="text-muted-foreground">Tidak</span>
      </div>
    </motion.div>
  );
};