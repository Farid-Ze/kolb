/**
 * KLSI 4.0 - Guide Service
 * Task Phase 7: Service untuk fetching guide markdown content
 * 
 * Menggunakan static file serving dari backend
 */

/**
 * Guide IDs (from frontend_blueprint.md §7.1)
 */
export const GUIDE_IDS = {
  // Student guides
  STUDENT_INTRO: 'student_intro',
  ASSESSMENT_INSTRUCTIONS: 'assessment_instructions',
  RESULTS_INTERPRETATION: 'results_interpretation',
  LEARNING_STRATEGIES: 'learning_strategies',
  
  // Mediator guides
  EDUCATOR_RESPONSIBLE_USE: 'educator_responsible_use',
  MEDIATOR_ONBOARDING: 'educator_responsible_use', // Alias for onboarding
  TEAM_FACILITATION: 'team_facilitation',
  RESEARCH_ETHICS: 'research_ethics',
  
  // General
  FAQ: 'faq',
  PRIVACY_POLICY: 'privacy_policy',
  CONTACT_SUPPORT: 'contact_support',
} as const;

/**
 * Get guide content markdown
 * Path: /static/guides/:guideId.:locale.md
 * With fallback to en-US if locale not found
 */
export const getGuideContent = async (
  guideId: string,
  locale: string = 'id-ID'
): Promise<string> => {
  try {
    // Try primary locale
    const response = await fetch(`/static/guides/${guideId}.${locale}.md`);
    
    if (response.ok) {
      return await response.text();
    }
    
    // Fallback to en-US
    if (locale !== 'en-US') {
      const fallbackResponse = await fetch(`/static/guides/${guideId}.en-US.md`);
      
      if (fallbackResponse.ok) {
        return await fallbackResponse.text();
      }
    }
    
    throw new Error(`Guide not found: ${guideId}`);
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to load guide content'
    );
  }
};

