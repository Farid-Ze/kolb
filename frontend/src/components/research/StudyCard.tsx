/**
 * KLSI 4.0 - StudyCard Component
 * Task 61: Card untuk menampilkan research study di list
 * 
 * Implementasi sesuai Guidelines.md:
 * - Material-regular untuk content card
 * - Spring-based transitions
 * - Accessible focus states
 * - Dynamic Type support (§1.4.3)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Users, Calendar, ChevronRight, FileText } from 'lucide-react';
import type { Study } from '../../services/researchService';
import { ShortLabel, DescriptionText } from '../ui/DynamicType';

interface StudyCardProps {
  study: Study;
  onClick: () => void;
}

const STATUS_CONFIG: Record<Study['status'], { label: string; className: string }> = {
  ACTIVE: {
    label: 'Aktif',
    className: 'bg-chart-4/10 text-chart-4',
  },
  COMPLETED: {
    label: 'Selesai',
    className: 'bg-chart-2/10 text-chart-2',
  },
  DRAFT: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
};

export const StudyCard: React.FC<StudyCardProps> = ({ study, onClick }) => {
  const statusConfig = STATUS_CONFIG[study.status];

  // Spring configuration (Guidelines.md Section 2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  return (
    <motion.button
      onClick={onClick}
      className="material-regular rounded-xl p-6 space-y-4 text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springConfig}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <ShortLabel as="h3" className="text-foreground">
              {study.title}
            </ShortLabel>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>
          {study.description && (
            <DescriptionText className="text-muted-foreground">
              {study.description}
            </DescriptionText>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>

      {/* Metadata - Guidelines §1.5: Proximity > separators */}
      <div className="flex flex-wrap items-center gap-4 pt-4 mt-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {study.participant_count}{' '}
            {study.participant_count === 1 ? 'partisipan' : 'partisipan'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(study.start_date).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            {study.end_date && (
              <>
                {' - '}
                {new Date(study.end_date).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>
            ID: {study.id}
          </span>
        </div>
      </div>
    </motion.button>
  );
};