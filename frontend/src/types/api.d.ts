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

export type SessionStatus = 'Started' | 'In Progress' | 'Completed' | 'Abandoned';

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

export interface AssessmentContextRank {
  context_name: string;
  CE: number;
  RO: number;
  AC: number;
  AE: number;
}

export interface GetAssessmentItemsResponse {
  session_id: string;
  instrument_code: string;
  instrument_version?: string;
  status?: SessionStatus;
  total_items: number;
  items: AssessmentItem[];
  responses: ItemResponse[];
  contexts: AssessmentContextRank[];
  progress?: number;
  completed_items?: number;
  current_item_index?: number;
  instructions?: string;
}

export interface SubmitAnswersRequest {
  responses: ItemResponse[];
  contexts?: AssessmentContextRank[];
}

export interface SubmitAnswersResponse {
  saved_count: number;
  message?: string;
}

export interface FinalizeSessionRequest {
  confirm: boolean;
}

export interface FinalizeResultPayload {
  ACCE: number | null;
  AERO: number | null;
  style_primary_id: number | null;
  LFI: number | null;
  delta?: Record<string, unknown> | null;
  percentile_sources?: Record<string, unknown> | null;
  validation?: SessionValidationSnapshot | null;
  override?: boolean;
  override_reason?: string | null;
}

export interface FinalizeSessionResponse {
  session_id: string;
  ok: boolean;
  result: FinalizeResultPayload | null;
}

export interface SessionValidationIssue {
  code: string;
  message: string;
  fatal: boolean;
  item_ids?: number[];
  details?: Record<string, any>;
  contexts?: string[];
}

export interface SessionValidationContextStatus {
  name: string;
  present: boolean;
}

export interface SessionValidationContextsDiagnostics {
  expected_total: number;
  submitted_total: number;
  submitted_names: string[];
  status: SessionValidationContextStatus[];
  missing_names: string[];
  unknown_names: string[];
  duplicate_names: string[];
}

export interface SessionValidationItemDiagnostics {
  session_exists: boolean;
  status: string | null;
  total_items: number;
  responded_items: number;
  missing_item_ids: number[];
  items_with_rank_conflict: number[];
  items_with_missing_ranks: { item_id: number; present: number[]; missing: number[] }[];
  duplicate_choice_ids: number[];
  ready_to_complete: boolean;
}

export interface SessionValidationDiagnostics {
  items: SessionValidationItemDiagnostics;
  context_count?: number;
  contexts?: SessionValidationContextsDiagnostics;
}

export interface SessionValidationSnapshot {
  ready: boolean;
  issues: SessionValidationIssue[];
  diagnostics: SessionValidationDiagnostics;
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

export interface LongitudinalDelta {
  previous_report_id: string;
  previous_session_date: string;
  previous_session_id: string | number;
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

export interface ReportRawBlock {
  CE: number | null;
  RO: number | null;
  AC: number | null;
  AE: number | null;
  ACCE: number | null;
  AERO: number | null;
  ACC_ASSM: number | null;
  CONV_DIV: number | null;
  BALANCE?: {
    ACCE: number | null;
    AERO: number | null;
  } | null;
}

export type ReportPercentileBand = 'LOW' | 'MID' | 'HIGH';

export interface ReportBalanceLevels {
  ACCE: 'HIGH' | 'MODERATE' | 'LOW';
  AERO: 'HIGH' | 'MODERATE' | 'LOW';
}

export interface ReportBalanceBlock {
  ACCE: number | null;
  AERO: number | null;
  levels: ReportBalanceLevels;
  note: string;
  heuristic: boolean;
  kind: string;
  reference: {
    centers: { ACCE: number; AERO: number };
    max_distance: { ACCE: number; AERO: number };
  };
}

export interface ReportPercentiles {
  CE: number | null;
  RO: number | null;
  AC: number | null;
  AE: number | null;
  ACCE: number | null;
  AERO: number | null;
  bands?: {
    ACCE: ReportPercentileBand;
    AERO: ReportPercentileBand;
  } | null;
  BALANCE?: ReportBalanceBlock | null;
  source_provenance?: string | null;
  norm_group_used?: string | null;
  per_scale_provenance?: Record<string, any> | null;
  per_scale_sources?: {
    CE?: string | null;
    RO?: string | null;
    AC?: string | null;
    AE?: string | null;
    ACCE?: string | null;
    AERO?: string | null;
  } | null;
  used_fallback_any?: boolean;
  raw_outside_norm_range?: boolean;
  truncated_scales?: Record<string, any> | null;
}

export interface ReportStyleBlock {
  primary_code?: string | null;
  primary_name?: string | null;
  primary_brief?: string | null;
  primary_detail?: string | null;
  backup_name?: string | null;
  backup_code?: string | null;
  backup_brief?: string | null;
  backup_detail?: string | null;
  intensity?: number | null;
  educator_reco?: string | null;
}

export interface ReportLfiBlock {
  value: number | null;
  percentile: number | null;
  level: string | null;
  level_label: string | null;
}

export interface ReportVisualizationBlock {
  kite?: Record<string, number> | null;
  dialectic?: {
    ACCE: number | null;
    AERO: number | null;
    CONV_DIV: number | null;
    intensity: number | null;
  } | null;
}

export interface SessionDesignRecommendation {
  code: string;
  title: string;
  summary: string;
  activates: string[];
  duration_min: number;
}

export interface ReportAnalyticsMeta {
  heuristic?: boolean;
  note?: string;
}

export interface ReportAnalytics {
  predicted_lfi_curve?: { acc_assm: number; pred_lfi: number }[] | null;
  acc_assm_peak_note?: string | null;
  meta?: ReportAnalyticsMeta | null;
}

export interface LearningSpaceMeta {
  heuristic: boolean;
  note: string;
}

export interface LearningSpaceDevelopment {
  spiral_stage: string;
  deep_learning_level: string;
  rationale: string;
  disclaimer: string;
  is_heuristic?: boolean;
  label?: string;
}

export interface LearningSpaceEducatorRole {
  step?: number;
  role?: string;
  focus?: string;
  actions?: string[];
  note?: string;
}

export interface HeuristicListBlock {
  items: string[];
  is_heuristic: boolean;
  label?: string;
}

export interface LearningSpaceBlock {
  meta: LearningSpaceMeta;
  suggestions: HeuristicListBlock | null;
  development: LearningSpaceDevelopment | null;
  meta_learning: HeuristicListBlock | null;
  educator_roles: LearningSpaceEducatorRole[];
}

export interface ReportNotes {
  psychometric_terms?: string;
  acc_assm_definition?: string;
  conv_div_definition?: string;
  balance_definition?: string;
  interpretation_summary?: string;
}

export interface ReportOwnerSummary {
  id: number | string;
  name?: string | null;
  email?: string | null;
}

export interface ReportShareContext {
  share_id: number;
  session_id: number;
  mediator_email: string;
  mediator_name?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  expires_at: string;
  note?: string | null;
}

export interface ContextStyleEntry {
  context: string;
  style: string;
  ACCE: number;
  AERO: number;
  CE: number;
  RO: number;
  AC: number;
  AE: number;
}

export interface ContextualProfileSummary {
  context_styles: ContextStyleEntry[];
  style_frequency: Record<string, number>;
  mode_usage: Record<string, { count: number; contexts: string[] }>;
  flexibility_pattern: string;
}

export interface HeatmapSummary {
  lfi_percentile_band: string;
  style_matrix: Record<string, number>;
  region_coverage: Record<string, number>;
}

export interface IntegrativeDevelopmentInsight {
  predicted_score: number;
  interpretation: string;
  model_info: string;
  heuristic: boolean;
  note: string;
}

export interface EnhancedAnalyticsMeta {
  heuristic: boolean;
  note: string;
}

export interface EnhancedAnalyticsPayload {
  validation_error?: string;
  context_count?: number;
  message?: string;
  contextual_profile?: ContextualProfileSummary;
  heatmap?: HeatmapSummary;
  integrative_development?: IntegrativeDevelopmentInsight;
  flexibility_narrative?: string;
  meta?: EnhancedAnalyticsMeta;
}

export interface Report {
  session_id: string | number;
  raw: ReportRawBlock | null;
  percentiles: ReportPercentiles | null;
  style: ReportStyleBlock | null;
  lfi: ReportLfiBlock | null;
  visualization: ReportVisualizationBlock | null;
  session_designs: SessionDesignRecommendation[];
  analytics: ReportAnalytics | null;
  learning_space: LearningSpaceBlock | null;
  notes: ReportNotes | null;
  enhanced_analytics: EnhancedAnalyticsPayload | null; // MEDIATOR-only
  responsible_use_notice?: string | null;
  owner?: ReportOwnerSummary | null;
  share_context?: ReportShareContext | null;
}

export interface CreateReportShareRequest {
  mediator_email: string;
  expires_in_hours?: number;
  note?: string;
}

export interface CreateReportShareResponse {
  share_id: number;
  session_id: number;
  mediator_email: string;
  mediator_name?: string | null;
  expires_at: string;
  share_token: string;
  note?: string | null;
}

// ============================================================================
// TEAM TYPES
// ============================================================================

export interface TeamMember {
  user_id: number;
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
  user_id: number;
  name: string;
  email?: string;
  learning_style?: LearningStyleType;
  style_code?: string;
  AC_CE?: number;
  AE_RO?: number;
  ac_ce?: number;
  ae_ro?: number;
  session_id?: number;
  generated_at?: string;
  dialectic_scores?: DialecticScores;
  raw_scores?: RawScores;
}

export interface TeamRollupBalanceMetrics {
  CE_percentage: number;
  RO_percentage: number;
  AC_percentage: number;
  AE_percentage: number;
}

export interface TeamRollupSummary {
  total_members: number;
  members_with_data: number;
  avg_ac_ce: number;
  avg_ae_ro: number;
  style_distribution: Record<string, number>;
}

export interface TeamRollup {
  team_id: number;
  team_name: string;
  member_count: number;
  members: TeamRollupMember[];
  data_points: TeamRollupMember[];
  summary: TeamRollupSummary;
  diversity_score?: number | null;
  balance_metrics: TeamRollupBalanceMetrics;
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