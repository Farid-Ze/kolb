/**
 * Local-first assessment state store (Zustand)
 * Enforces ipsative constraints (1-4 ranks, unique per item) and tracks dirtiness.
 */
import { create } from 'zustand';
import type { ItemResponse } from '../types/api';

export const LEARNING_MODES = ['CE', 'RO', 'AC', 'AE'] as const;
export type LearningModeCode = (typeof LEARNING_MODES)[number];

export type RankMap = Record<LearningModeCode, number>;

export interface ResponseMeta {
  dirty: boolean;
  optimistic: boolean;
  updatedAt: number;
}

interface HydrateOptions {
  force?: boolean;
}

interface AssessmentStoreState {
  responses: Record<string, ItemResponse>;
  meta: Record<string, ResponseMeta>;
  hydrateFromServer: (responses: ItemResponse[], options?: HydrateOptions) => void;
  setRank: (itemId: string, optionCode: string, rank: number) => void;
  setItemRanks: (itemId: string, ranks: Record<string, number>) => void;
  markSynced: (itemId: string, serverRanks?: Record<string, number>) => void;
  reset: () => void;
}

const createEmptyRankMap = (): RankMap => ({ CE: 0, RO: 0, AC: 0, AE: 0 });

const sanitizeOptionCode = (code: string): LearningModeCode | null => {
  const upper = String(code ?? '').trim().toUpperCase();
  return (LEARNING_MODES as readonly string[]).includes(upper) ? (upper as LearningModeCode) : null;
};

const clampRank = (rank: number): number => {
  if (!Number.isFinite(rank)) {
    return 0;
  }
  return Math.min(4, Math.max(1, Math.round(rank)));
};

export const isCompleteRanks = (ranks: Record<string, number>): boolean => {
  const values = Object.values(ranks ?? {});
  if (values.length !== 4) {
    return false;
  }
  if (new Set(values).size !== 4) {
    return false;
  }
  return values.every((value) => value >= 1 && value <= 4);
};

const dedupeRanks = (ranks: RankMap): RankMap => {
  const used = new Set<number>();
  const normalized = createEmptyRankMap();
  LEARNING_MODES.forEach((mode) => {
    const value = ranks[mode];
    if (value >= 1 && value <= 4 && !used.has(value)) {
      normalized[mode] = value;
      used.add(value);
    } else {
      normalized[mode] = 0;
    }
  });
  return normalized;
};

export const useAssessmentStore = create<AssessmentStoreState>((set) => ({
  responses: {},
  meta: {},

  hydrateFromServer: (payload, options) => {
    const forced = Boolean(options?.force);
    set((state) => {
      const nextResponses = { ...state.responses };
      const nextMeta = { ...state.meta };
      payload.forEach((entry) => {
        const itemId = String(entry.item_id);
        const existingMeta = state.meta[itemId];
        if (!forced && existingMeta?.dirty) {
          return;
        }
        const sanitizedRanks = { ...createEmptyRankMap(), ...entry.ranks } as RankMap;
        nextResponses[itemId] = {
          item_id: itemId,
          ranks: dedupeRanks(sanitizedRanks),
        };
        nextMeta[itemId] = {
          dirty: false,
          optimistic: false,
          updatedAt: Date.now(),
        };
      });
      return { responses: nextResponses, meta: nextMeta };
    });
  },

  setRank: (itemId, optionCode, rank) => {
    set((state) => {
      const normalizedCode = sanitizeOptionCode(optionCode);
      if (!normalizedCode) {
        return state;
      }
      const normalizedRank = clampRank(rank);
      if (!normalizedRank) {
        return state;
      }
      const current = state.responses[itemId] ?? { item_id: itemId, ranks: createEmptyRankMap() };
      const ranks: RankMap = { ...createEmptyRankMap(), ...current.ranks };
      const previousRank = ranks[normalizedCode];
      const conflictingMode = LEARNING_MODES.find((mode) => mode !== normalizedCode && ranks[mode] === normalizedRank);
      if (conflictingMode) {
        ranks[conflictingMode] = previousRank ?? 0;
      }
      ranks[normalizedCode] = normalizedRank;

      return {
        responses: {
          ...state.responses,
          [itemId]: { item_id: itemId, ranks },
        },
        meta: {
          ...state.meta,
          [itemId]: {
            dirty: true,
            optimistic: true,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  setItemRanks: (itemId, incomingRanks) => {
    set((state) => {
      const ranks = createEmptyRankMap();
      Object.entries(incomingRanks ?? {}).forEach(([code, value]) => {
        const normalizedCode = sanitizeOptionCode(code);
        if (!normalizedCode) {
          return;
        }
        const normalizedValue = clampRank(value);
        ranks[normalizedCode] = normalizedValue;
      });
      const sanitized = dedupeRanks(ranks);
      const normalizedRanks: RankMap = { ...sanitized };
      return {
        responses: {
          ...state.responses,
          [itemId]: { item_id: itemId, ranks: normalizedRanks },
        },
        meta: {
          ...state.meta,
          [itemId]: {
            dirty: true,
            optimistic: true,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  markSynced: (itemId, serverRanks) => {
    set((state) => {
      const current = state.responses[itemId];
      if (!current && !serverRanks) {
        return state;
      }
      const nextRanks = serverRanks
        ? { ...createEmptyRankMap(), ...serverRanks }
        : current?.ranks ?? createEmptyRankMap();
      return {
        responses: {
          ...state.responses,
          [itemId]: { item_id: itemId, ranks: dedupeRanks(nextRanks as RankMap) },
        },
        meta: {
          ...state.meta,
          [itemId]: {
            dirty: false,
            optimistic: false,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  reset: () => ({ responses: {}, meta: {} }),
}));

export const selectResponses = (state: AssessmentStoreState) => state.responses;
export const selectResponseMeta = (state: AssessmentStoreState) => state.meta;
export const selectResponseByItemId = (itemId: string) => (state: AssessmentStoreState) => state.responses[itemId];
export const selectCompletedCount = (state: AssessmentStoreState): number =>
  Object.values(state.responses).filter((response) => isCompleteRanks(response.ranks)).length;
export const selectHasDirtyResponses = (state: AssessmentStoreState): boolean =>
  Object.values(state.meta).some((meta) => meta.dirty);
