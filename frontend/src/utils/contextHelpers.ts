/**
 * Helper utilities for LFI context display and formatting
 */

export interface ContextInfo {
  name: string;
  displayName: string;
  description: string;
}

/**
 * Converts snake_case context names to human-readable format
 */
export const formatContextName = (contextName: string): string => {
  return contextName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Returns descriptive information for each LFI context
 */
export const getContextInfo = (contextName: string): ContextInfo => {
  const contextDescriptions: Record<string, string> = {
    'Starting_Something_New': 'How you approach initiating new projects or activities',
    'Influencing_Someone': 'Your strategy when trying to persuade or influence others',
    'Getting_To_Know_Someone': 'How you build relationships with new people',
    'Learning_In_A_Group': 'Your preferred approach when learning with others',
    'Planning_Something': 'How you organize and prepare for future activities',
    'Analyzing_Something': 'Your method for breaking down and understanding complex information',
    'Evaluating_An_Opportunity': 'How you assess new possibilities or chances',
    'Choosing_Between_Alternatives': 'Your decision-making process when faced with options',
  };

  return {
    name: contextName,
    displayName: formatContextName(contextName),
    description: contextDescriptions[contextName] || 'How you approach this situation',
  };
};

/**
 * Validates that ranks are unique and complete (1-4 for CE, RO, AC, AE)
 */
export const validateContextRanks = (ranks: Record<number, number>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const rankValues = Object.values(ranks);

  // Check if all 4 options are ranked
  if (rankValues.length !== 4) {
    errors.push('All four learning modes must be ranked');
  }

  // Check for unique ranks 1-4
  const uniqueRanks = new Set(rankValues);
  if (uniqueRanks.size !== 4) {
    errors.push('Each rank (1-4) must be used exactly once');
  }

  // Check for valid rank values
  const validRanks = [1, 2, 3, 4];
  const hasInvalidRanks = rankValues.some(rank => !validRanks.includes(rank));
  if (hasInvalidRanks) {
    errors.push('Ranks must be between 1 and 4');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Gets the display label for a learning mode
 */
export const getLearningModeLabel = (mode: string): string => {
  const labels: Record<string, string> = {
    'Concrete Experience': 'CE - Feeling',
    'Reflective Observation': 'RO - Watching',
    'Abstract Conceptualization': 'AC - Thinking',
    'Active Experimentation': 'AE - Doing',
    'CE': 'CE - Feeling',
    'RO': 'RO - Watching',
    'AC': 'AC - Thinking',
    'AE': 'AE - Doing',
  };

  return labels[mode] || mode;
};
