import type { TunnelContextDraft, TunnelItemDraft } from '../model'
import type { AssessmentItem } from '../../../entities/session/model'

export const MODE_CODES = ['AC', 'CE', 'AE', 'RO'] as const
export type ModeCode = typeof MODE_CODES[number]

export const isContextComplete = (draft?: TunnelContextDraft) => {
  if (!draft) {
    return false
  }
  const ranks = MODE_CODES.map((code) => draft[code] ?? 0)
  if (ranks.some((rank) => rank === 0)) {
    return false
  }
  return new Set(ranks).size === MODE_CODES.length
}

export const isItemComplete = (draft?: TunnelItemDraft) => {
  if (!draft) return false
  // Assuming 4 options for forced choice
  const ranks = Object.values(draft.ranks)
  return ranks.length === 4 && new Set(ranks).size === 4
}

export const deriveModeRanks = (item: AssessmentItem, draft?: TunnelItemDraft): Record<string, number> | null => {
  if (!draft) {
    return null
  }
  const ranks: Record<string, number> = {}
  item.options.forEach((option) => {
    const code = option.code?.toUpperCase()
    if (!code) {
      return
    }
    const rankValue = draft.ranks[option.id]
    if (rankValue) {
      ranks[code] = rankValue
    }
  })
  return Object.keys(ranks).length === MODE_CODES.length ? ranks : null
}
