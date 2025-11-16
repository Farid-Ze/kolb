/**
 * KLSI 4.0 - Centralized API Type Definitions
 * Task 10: Tipe terpusat untuk payload API berdasarkan SITEMAP.md
 * 
 * Single source of truth untuk semua interface API
 */

// ============================================================================
// AUTH & USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'MEDIATOR' | 'ADMIN';
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'MEDIATOR';
}

export interface RegisterResponse {
  user: User;
  message: string;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export interface Session {
  id: string;
  user_id: string;
  instrument_id: string;
  status: SessionStatus;
  started_at: string;
  completed_at?: string;
  progress: number; // 0-100
  current_item_index?: number;
  metadata?: Record<string, any>;
}

export interface StartSessionRequest {
  instrument_code: string; // e.g., "S-KLSI-4"
  metadata?: Record<string, any>;
}

export interface StartSessionResponse {
  session_id: string;
  instrument_id: string;
  status: SessionStatus;
  started_at: string;
}

// ============================================================================
// ASSESSMENT ITEM TYPES
// ============================================================================

export interface AssessmentOption {
  id: string;
  option_code: string; // CE, RO, AC, AE
  text: string;
  dimension: 'CE' | 'RO' | 'AC' | 'AE'; // Kolb dimensions
}

export interface AssessmentItem {
  item_id: string;
  order: number;
  prompt: string; // Question prompt/stem
  options: AssessmentOption[];
  context?: string;
}

export interface ItemResponse {
  item_id: string;
  ranks: Record<string, number>; // option_code -> rank (1-4)
}

export interface GetAssessmentItemsResponse {
  session_id: string;
  instrument_code: string;
  total_items: number;
  items: AssessmentItem[];
  instructions?: string;
}

export interface SubmitAnswersRequest {
  responses: ItemResponse[];
}

export interface SubmitAnswersResponse {
  saved_count: number;
  message: string;
}

export interface FinalizeSessionRequest {
  confirm: boolean;
}

export interface FinalizeSessionResponse {
  session_id: string;
  status: SessionStatus;
  completed_at: string;
  message: string;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface RawScores {
  CE: number;
  RO: number;
  AC: number;
  AE: number;
}

export interface DialecticScores {
  'AC-CE': number; // Abstract vs Concrete (-20 to +20)
  'AE-RO': number; // Active vs Reflective (-20 to +20)
}

export type LearningStyleType =
  | 'Accommodating'
  | 'Diverging'
  | 'Assimilating'
  | 'Converging'
  | 'Balancing'
  | 'Northern'
  | 'Eastern'
  | 'Southern'
  | 'Western';

export interface LearningStyle {
  style_code: string; // e.g., "DIV", "ACC", "CON", "ASS"
  style_name: string; // Full name, e.g., "Diverging"
  quadrant: number; // 1-4 for main quadrants
  description: string;
  strengths?: string[];
  development_areas?: string[];
}

export interface NineStyle {
  style_code: string; // e.g., "N-EAST"
  style_name: string; // e.g., "Northern-Eastern"
  description: string;
}

export interface FlexibilityIndex {
  lfi_score: number; // 0-100
  category: 'High' | 'Moderate' | 'Low';
  interpretation: string;
}

export interface NormGroup {
  norm_id: string;
  norm_name: string;
  description: string;
  sample_size: number;
}

export interface PercentileScores {
  CE: number;
  RO: number;
  AC: number;
  AE: number;
  'AC-CE': number;
  'AE-RO': number;
}

export interface EnhancedAnalytics {
  contextual_profile?: {
    context_name: string;
    style_code: string;
    style_name: string;
  }[];
  heatmap?: {
    context_name: string;
    kendall_w: number;
    flexibility_level: 'High' | 'Moderate' | 'Low';
  }[];
  integrative_development?: {
    phase: 'Acquisition' | 'Specialization' | 'Integration';
    interpretation: string;
    recommendation?: string;
  };
  flexibility_narrative?: string;
  educator_role_suggestions?: {
    role: 'Facilitator' | 'Expert' | 'Evaluator' | 'Coach';
    description: string;
  }[];
  validation_error?: string;
}

export interface LongitudinalDelta {
  previous_report_id: string;
  previous_session_date: string;
  time_elapsed_days: number;
  delta_acce: number; // Change in AC-CE score
  delta_aero: number; // Change in AE-RO score
  delta_lfi: number; // Change in LFI score
  style_shift?: {
    from_style: string;
    to_style: string;
    is_major_shift: boolean;
  };
  interpretation?: string;
}

export interface Report {
  report_id: string;
  session_id: string;
  user_id: string;
  instrument_id: string;
  generated_at: string;
  raw_scores: RawScores;
  dialectic_scores: DialecticScores;
  learning_style: LearningStyle;
  nine_style: NineStyle;
  flexibility: FlexibilityIndex;
  norm_group: NormGroup;
  percentile_scores: PercentileScores;
  reliability_flags?: string[];
  responsible_use_notice?: string;
  enhanced_analytics?: EnhancedAnalytics | null; // MEDIATOR-only
  delta?: LongitudinalDelta | null; // Longitudinal changes
}

export interface ReportGenerationStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  message?: string;
}

// ============================================================================
// TEAM TYPES
// ============================================================================

export interface TeamMember {
  user_id: string;
  name: string;
  email: string;
  joined_at: string;
  latest_report_id?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  member_count: number;
  members?: TeamMember[];
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface AddMemberRequest {
  user_id: string;
}

export interface TeamRollupMember {
  user_id: string;
  name: string;
  learning_style: LearningStyleType;
  dialectic_scores: DialecticScores;
  raw_scores: RawScores;
}

export interface TeamRollup {
  team_id: string;
  members: TeamRollupMember[];
  aggregated_stats: {
    style_distribution: Record<LearningStyleType, number>;
    average_scores: RawScores;
    diversity_index?: number;
  };
}

// ============================================================================
// RESEARCH TYPES
// ============================================================================

export type StudyStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';

export interface Study {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  status: StudyStatus;
  start_date: string;
  end_date?: string;
  participant_count: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateStudyRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
}

export interface StudyDataRow {
  user_id: string;
  session_id: string;
  completed_at: string;
  raw_scores: RawScores;
  dialectic_scores: DialecticScores;
  learning_style: LearningStyleType;
  lfi_score: number;
  metadata?: Record<string, any>;
}

export interface StudyDataResponse {
  study_id: string;
  data: StudyDataRow[];
  total_count: number;
  exported_at: string;
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

export interface ApiErrorResponse {
  detail: string | ValidationError[];
  message?: string;
  status_code?: number;
}