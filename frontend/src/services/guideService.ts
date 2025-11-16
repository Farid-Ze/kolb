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

export type GuideId = (typeof GUIDE_IDS)[keyof typeof GUIDE_IDS];

export interface GuideMetadata {
  id: string;
  title: string;
  category: 'student' | 'mediator' | 'general';
  locales: string[];
}

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

/**
 * Get list of available guides
 * This is a static list as guides are predefined
 */
export const getGuideList = async (): Promise<GuideMetadata[]> => {
  return [
    // Student guides
    {
      id: GUIDE_IDS.STUDENT_INTRO,
      title: 'Pengenalan KLSI 4.0',
      category: 'student',
      locales: ['id-ID', 'en-US'],
    },
    {
      id: GUIDE_IDS.ASSESSMENT_INSTRUCTIONS,
      title: 'Instruksi Asesmen',
      category: 'student',
      locales: ['id-ID', 'en-US'],
    },
    {
      id: GUIDE_IDS.RESULTS_INTERPRETATION,
      title: 'Interpretasi Hasil',
      category: 'student',
      locales: ['id-ID', 'en-US'],
    },
    {
      id: GUIDE_IDS.LEARNING_STRATEGIES,
      title: 'Strategi Belajar',
      category: 'student',
      locales: ['id-ID', 'en-US'],
    },
    
    // Mediator guides
    {
      id: GUIDE_IDS.EDUCATOR_RESPONSIBLE_USE,
      title: 'Panduan Penggunaan Bertanggung Jawab',
      category: 'mediator',
      locales: ['id-ID', 'en-US'],
    },
    {
      id: GUIDE_IDS.TEAM_FACILITATION,
      title: 'Fasilitasi Tim',
      category: 'mediator',
      locales: ['id-ID', 'en-US'],
    },
    {
      id: GUIDE_IDS.RESEARCH_ETHICS,
      title: 'Etika Penelitian',
      category: 'mediator',
      locales: ['id-ID', 'en-US'],
    },
    
    // General guides
    {
      id: GUIDE_IDS.FAQ,
      title: 'Pertanyaan Umum',
      category: 'general',
      locales: ['id-ID', 'en-US'],
    },
    {
      id: GUIDE_IDS.PRIVACY_POLICY,
      title: 'Kebijakan Privasi',
      category: 'general',
      locales: ['id-ID', 'en-US'],
    },
    {
      id: GUIDE_IDS.CONTACT_SUPPORT,
      title: 'Hubungi Dukungan',
      category: 'general',
      locales: ['id-ID', 'en-US'],
    },
  ];
};