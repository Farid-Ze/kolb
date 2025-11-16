/**
 * KLSI 4.0 - TeamCard Component
 * Task 53: Card untuk menampilkan team item di list
 * 
 * Implementasi sesuai Guidelines.md:
 * - Material-regular untuk content card
 * - Spring-based transitions
 * - Accessible focus states
 * - Dynamic Type support (§1.4.3)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Users, Calendar, ChevronRight } from 'lucide-react';
import type { Team } from '../../services/teamService';
import { ShortLabel, DescriptionText } from '../ui/DynamicType';

interface TeamCardProps {
  team: Team;
  onClick: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onClick }) => {
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
          <ShortLabel as="h3" className="text-foreground mb-2">
            {team.name}
          </ShortLabel>
          {team.description && (
            <DescriptionText className="text-muted-foreground">
              {team.description}
            </DescriptionText>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>

      {/* Metadata - Guidelines §1.5: Spacing instead of border */}
      <div className="flex items-center gap-4 pt-4 mt-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {team.member_count} {team.member_count === 1 ? 'anggota' : 'anggota'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(team.created_at).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </motion.button>
  );
};