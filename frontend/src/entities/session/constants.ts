export const MODE_CODES = ['CE', 'RO', 'AC', 'AE'] as const
export type ModeCode = (typeof MODE_CODES)[number]

export const LFI_CONTEXTS = [
  'Starting_Something_New',
  'Influencing_Someone',
  'Getting_To_Know_Someone',
  'Learning_In_A_Group',
  'Planning_Something',
  'Analyzing_Something',
  'Evaluating_An_Opportunity',
  'Choosing_Between_Alternatives',
] as const
export type LfiContextName = (typeof LFI_CONTEXTS)[number]

export const LFI_CONTEXT_LABELS: Record<LfiContextName, string> = {
  Starting_Something_New: 'Starting Something New',
  Influencing_Someone: 'Influencing Someone',
  Getting_To_Know_Someone: 'Getting to Know Someone',
  Learning_In_A_Group: 'Learning in a Group',
  Planning_Something: 'Planning Something',
  Analyzing_Something: 'Analyzing Something',
  Evaluating_An_Opportunity: 'Evaluating an Opportunity',
  Choosing_Between_Alternatives: 'Choosing Between Alternatives',
}

export function formatContextDescription(name: LfiContextName): string {
  return LFI_CONTEXT_LABELS[name] ?? name.replace(/_/g, ' ')
}
