import React from 'react';
import { motion } from 'framer-motion';
import { AssessmentItemOption } from '../../core/api/client';
import { getContextInfo, validateContextRanks, getLearningModeLabel } from '../../utils/contextHelpers';
import { BodyText } from '../../core/design-system/Typography';

interface LFIContextCardProps {
  contextName: string;
  stem: string;
  options: AssessmentItemOption[];
  currentRanks: Record<number, number>;
  onRankChange: (choiceId: number, rank: number) => void;
}

export const LFIContextCard: React.FC<LFIContextCardProps> = ({
  contextName,
  stem,
  options,
  currentRanks,
  onRankChange,
}) => {
  const contextInfo = getContextInfo(contextName);
  const validation = validateContextRanks(currentRanks);

  return (
    <div className="flex flex-col gap-6" data-testid="lfi-context-card">
      {/* Context Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span>Learning Flexibility Context</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {contextInfo.displayName}
        </h3>
        <BodyText tone="muted" className="text-base md:text-lg">
          {contextInfo.description}
        </BodyText>
      </div>

      {/* Instructions */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <p className="text-sm md:text-base text-white/80 leading-relaxed">
          <span className="font-semibold text-amber-400">Instructions:</span> Rank how you typically approach this situation using each learning mode.{' '}
          <span className="font-semibold">1 = Least like you, 4 = Most like you</span>
        </p>
      </div>

      {/* Question Stem (if different from context name) */}
      {stem && stem !== contextInfo.displayName && (
        <p className="text-lg text-white/90 leading-relaxed italic">
          "{stem}"
        </p>
      )}

      {/* Ranking Options */}
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const currentRank = currentRanks[option.id];
          const modeLabel = getLearningModeLabel(option.learning_mode);
          
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 p-5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Learning Mode Label */}
                <div className="flex-shrink-0">
                  <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm font-mono font-semibold text-amber-400">
                    {modeLabel}
                  </span>
                </div>

                {/* Option Text */}
                <div className="flex-grow">
                  <p className="text-base md:text-lg text-white/90 leading-relaxed">
                    {option.text}
                  </p>
                </div>

                {/* Rank Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {[1, 2, 3, 4].map(rank => {
                    const isSelected = currentRank === rank;
                    const isUsedByOther = Object.entries(currentRanks).some(
                      ([key, val]) => Number(key) !== option.id && val === rank
                    );

                    return (
                      <button
                        key={rank}
                        onClick={() => onRankChange(option.id, rank)}
                        disabled={isUsedByOther && !isSelected}
                        className={`
                          w-12 h-12 rounded-lg flex items-center justify-center 
                          text-lg font-bold transition-all
                          ${isSelected
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-110'
                            : isUsedByOther
                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105 border border-white/20'
                          }
                        `}
                        aria-label={`Rank ${rank} for ${modeLabel}`}
                      >
                        {rank}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Validation Feedback */}
      {!validation.isValid && Object.keys(currentRanks).length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-grow">
              <p className="text-sm font-semibold text-red-400 mb-1">Incomplete Ranking</p>
              <ul className="text-sm text-red-300 space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Feedback */}
      {validation.isValid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-emerald-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-semibold text-emerald-400">
              Context ranking complete!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
