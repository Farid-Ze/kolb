import { describe, it, expect } from 'vitest';
import {
  formatContextName,
  getContextInfo,
  validateContextRanks,
  getLearningModeLabel,
} from '../../utils/contextHelpers';

describe('contextHelpers', () => {
  describe('formatContextName', () => {
    it('should convert snake_case to Title Case', () => {
      expect(formatContextName('Starting_Something_New')).toBe('Starting Something New');
      expect(formatContextName('Getting_To_Know_Someone')).toBe('Getting To Know Someone');
    });

    it('should handle single word names', () => {
      expect(formatContextName('Learning')).toBe('Learning');
    });
  });

  describe('getContextInfo', () => {
    it('should return correct info for known contexts', () => {
      const info = getContextInfo('Starting_Something_New');
      expect(info.name).toBe('Starting_Something_New');
      expect(info.displayName).toBe('Starting Something New');
      expect(info.description).toContain('initiating');
    });

    it('should return default description for unknown contexts', () => {
      const info = getContextInfo('Unknown_Context');
      expect(info.description).toBe('How you approach this situation');
    });
  });

  describe('validateContextRanks', () => {
    it('should validate complete and unique ranks', () => {
      const ranks = { 1: 1, 2: 2, 3: 3, 4: 4 };
      const result = validateContextRanks(ranks);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate incomplete ranks', () => {
      const ranks = { 1: 1, 2: 2 };
      const result = validateContextRanks(ranks);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All four learning modes must be ranked');
    });

    it('should invalidate duplicate ranks', () => {
      const ranks = { 1: 1, 2: 1, 3: 2, 4: 3 };
      const result = validateContextRanks(ranks);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Each rank (1-4) must be used exactly once');
    });

    it('should invalidate invalid rank values', () => {
      const ranks = { 1: 1, 2: 2, 3: 3, 4: 5 };
      const result = validateContextRanks(ranks);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ranks must be between 1 and 4');
    });

    it('should handle empty ranks', () => {
      const result = validateContextRanks({});
      expect(result.isValid).toBe(false);
    });
  });

  describe('getLearningModeLabel', () => {
    it('should return correct labels for full mode names', () => {
      expect(getLearningModeLabel('Concrete Experience')).toBe('CE - Feeling');
      expect(getLearningModeLabel('Reflective Observation')).toBe('RO - Watching');
      expect(getLearningModeLabel('Abstract Conceptualization')).toBe('AC - Thinking');
      expect(getLearningModeLabel('Active Experimentation')).toBe('AE - Doing');
    });

    it('should return correct labels for short mode names', () => {
      expect(getLearningModeLabel('CE')).toBe('CE - Feeling');
      expect(getLearningModeLabel('RO')).toBe('RO - Watching');
    });

    it('should return original mode for unknown modes', () => {
      expect(getLearningModeLabel('Unknown')).toBe('Unknown');
    });
  });
});
