import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, Reorder } from 'motion/react';
import type { AssessmentItem, ItemResponse } from '../../types/api';
import { APPLE_SPRING } from '../../core/physics/motionConfig';
import { getLearningModeLabel } from '../../utils/contextHelpers';

interface RankingCardProps {
  item: AssessmentItem;
  response?: ItemResponse;
  onRankChange: (mode: string, rank: number) => void;
  onRanksCommitted: (ranks: Record<string, number>) => void;
  isSaving?: boolean;
  isPending?: boolean;
  progress?: number;
}

type DisplayOption = {
  optionCode: string;
  text: string;
  rank: number;
};

const buildInitialOrder = (item: AssessmentItem, response?: ItemResponse): DisplayOption[] => {
  const ranks = response?.ranks ?? {};
  return (item?.options ?? [])
    .map((option, index) => ({
      optionCode: option.option_code,
      text: option.text,
      rank: ranks?.[option.option_code] ?? 0,
      sortKey: ranks?.[option.option_code] ?? Number.MAX_SAFE_INTEGER,
      originalIndex: index,
    }))
    .sort((a, b) => {
      if (a.sortKey === b.sortKey) {
        return a.originalIndex - b.originalIndex;
      }
      return a.sortKey - b.sortKey;
    })
    .map((entry) => ({
      optionCode: entry.optionCode,
      text: entry.text,
      rank: entry.rank,
    }));
};

export const RankingCard = ({
  item,
  response,
  onRankChange,
  onRanksCommitted,
  isSaving = false,
  isPending = false,
  progress = 0,
}: RankingCardProps) => {
  const [options, setOptions] = useState<DisplayOption[]>(() => buildInitialOrder(item, response));

  useEffect(() => {
    setOptions(buildInitialOrder(item, response));
  }, [item, response]);

  const statusMeta = useMemo(() => {
    if (isSaving) {
      return { label: 'Menyinkronkan…', indicator: 'bg-sky-400', text: 'text-sky-600' };
    }
    if (isPending) {
      return { label: 'Perlu sinkronisasi', indicator: 'bg-amber-400', text: 'text-amber-600' };
    }
    return { label: 'Tersimpan', indicator: 'bg-emerald-400', text: 'text-emerald-600' };
  }, [isSaving, isPending]);

  const handleReorder = useCallback(
    (nextOrder: DisplayOption[]) => {
      const normalized = nextOrder.map((option, index) => ({ ...option, rank: index + 1 }));
      setOptions(normalized);
      const ranks = normalized.reduce<Record<string, number>>((acc, option, index) => {
        acc[option.optionCode] = index + 1;
        return acc;
      }, {});
      onRanksCommitted(ranks);
    },
    [onRanksCommitted]
  );

  const renderOption = useCallback(
    (option: DisplayOption) => {
      const label = getLearningModeLabel(option.optionCode) ?? option.optionCode;
      return (
        <Reorder.Item
          key={`${item.item_id}-${option.optionCode}`}
          value={option}
          className="glass-material rounded-2xl border border-white/10 p-4 shadow-md"
          whileDrag={{ scale: 1.01, boxShadow: '0 25px 50px -24px rgba(15,23,42,0.4)' }}
          transition={APPLE_SPRING}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-base font-medium text-slate-900 dark:text-white">{option.text}</p>
            </div>
            <motion.span
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={APPLE_SPRING}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/90 text-xl font-semibold text-primary-foreground"
            >
              {option.rank > 0 ? option.rank : '–'}
            </motion.span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((rank) => (
              <button
                key={`${option.optionCode}-${rank}`}
                type="button"
                onClick={() => onRankChange(option.optionCode, rank)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  option.rank === rank
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-secondary/60 text-secondary-foreground'
                }`}
              >
                {rank}
              </button>
            ))}
          </div>
        </Reorder.Item>
      );
    },
    [item.item_id, onRankChange]
  );

  return (
    <div className="glass-material rounded-3xl p-6 shadow-2xl">
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">Item {item.order}</p>
        <h2 className="text-2xl font-semibold text-black dark:text-white">{item.prompt}</h2>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className={`flex items-center gap-2 font-medium ${statusMeta.text}`}>
            <span className={`h-2 w-2 rounded-full ${statusMeta.indicator}`} />
            {statusMeta.label}
          </span>
          <span>{Math.round(progress)}% selesai</span>
        </div>
      </div>

      <div className="mt-6">
        <Reorder.Group axis="y" values={options} onReorder={handleReorder} className="space-y-4">
          {options.map((option) => renderOption(option))}
        </Reorder.Group>
      </div>
    </div>
  );
};
