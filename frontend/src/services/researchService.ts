/**
 * KLSI 4.0 - ResearchService
 * Task 66, 69, 71: Service layer untuk research data management (Mediator Flow)
 * Menggunakan authenticatedApiCall untuk automatic token injection
 */

import { getApiUrl } from '../config/api';
import { authenticatedApiCall } from '../utils/apiHelper';

// API payloads --------------------------------------------------------------

interface ResearchStudyPayload {
  id: number;
  title: string;
  description?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
}

// Types consumed by UI ------------------------------------------------------

export interface Study {
  id: number;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  participant_count: number;
  status: 'ACTIVE' | 'COMPLETED' | 'DRAFT';
  notes?: string | null;
}

export interface StudyParticipant {
  user_id: string;
  email: string;
  name: string;
  joined_at: string;
  sessions_count: number;
  latest_session?: {
    session_id: number;
    generated_at: string;
    learning_style: string;
    ac_ce: number;
    ae_ro: number;
  };
}

export interface StudyDetail extends Study {
  participants: StudyParticipant[];
}

export interface StudyDataPoint {
  session_id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  generated_at: string;
  
  // Raw scores
  ce_score: number;
  ro_score: number;
  ac_score: number;
  ae_score: number;
  
  // Combined scores
  ac_ce: number;
  ae_ro: number;
  
  // Results
  learning_style?: string | null;
  style_code?: string | null;
  
  // Metadata
  norm_group?: string | null;
  assessment_duration_seconds?: number | null;
}

export interface StudyData {
  study_id: number;
  study_title: string;
  filters_applied: Record<string, string | null>;
  data_points: StudyDataPoint[];
  summary: {
    total_sessions: number;
    unique_participants: number;
    date_range?: {
      earliest: string;
      latest: string;
    } | null;
    style_distribution: Record<string, number>;
  };
}

export interface ExportFilters {
  start_date?: string;
  end_date?: string;
  norm_group?: string;
  learning_style?: string;
  user_email?: string;
}

/**
 * Get all research studies for current user
 * GET /research/studies
 * Task 66
 */
export const getStudies = async (): Promise<Study[]> => {
  const response = await authenticatedApiCall<ResearchStudyPayload[]>(getApiUrl('research/studies'), {
    method: 'GET',
  });
  return response.map(mapStudyPayload);
};

/**
 * Create new research study
 * POST /research/studies
 * Task 69
 */
export const createStudy = async (data: {
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
}): Promise<Study> => {
  const payload = await authenticatedApiCall<ResearchStudyPayload>(getApiUrl('research/studies'), {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      started_at: data.start_date ? `${data.start_date}T00:00:00Z` : null,
      completed_at: data.end_date ? `${data.end_date}T23:59:59Z` : null,
    }),
  });
  return mapStudyPayload(payload);
};

/**
 * Get study details with participants
 * GET /research/studies/:id
 */
export const getStudyDetails = async (studyId: number): Promise<StudyDetail> => {
  const payload = await authenticatedApiCall<ResearchStudyPayload>(getApiUrl(`research/studies/${studyId}`), {
    method: 'GET',
  });
  return {
    ...mapStudyPayload(payload),
    participants: [],
  };
};

/**
 * Get study data (all sessions/data points)
 * GET /research/studies/:id/data
 * Task 71
 * 
 * @param filters - Optional filters for data export
 */
export const getStudyData = async (
  studyId: number,
  filters?: ExportFilters
): Promise<StudyData> => {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  if (filters?.start_date) queryParams.append('start_date', filters.start_date);
  if (filters?.end_date) queryParams.append('end_date', filters.end_date);
  if (filters?.norm_group) queryParams.append('norm_group', filters.norm_group);
  if (filters?.learning_style) queryParams.append('learning_style', filters.learning_style);
  if (filters?.user_email) queryParams.append('user_email', filters.user_email);

  const queryString = queryParams.toString();
  const url = queryString
    ? `${getApiUrl(`research/studies/${studyId}/data`)}?${queryString}`
    : getApiUrl(`research/studies/${studyId}/data`);

  return authenticatedApiCall<StudyData>(url, {
    method: 'GET',
  });
};

/**
 * Export study data to CSV (client-side)
 * Task 79
 * 
 * Converts study data to CSV format and triggers download
 */
export const exportStudyDataToCSV = (
  studyData: StudyData,
  filename?: string
): void => {
  // Define CSV headers
  const headers = [
    'Session ID',
    'User ID',
    'Email',
    'Name',
    'Date & Time',
    'CE Score',
    'RO Score',
    'AC Score',
    'AE Score',
    'AC-CE',
    'AE-RO',
    'Learning Style',
    'Style Code',
    'Norm Group',
    'Duration (seconds)',
  ];

  // Convert data points to CSV rows
  const rows = studyData.data_points.map((point) => {
    const row: string[] = [
      point.session_id.toString(),
      point.user_id.toString(),
      point.user_email,
      point.user_name,
      new Date(point.generated_at).toLocaleString('id-ID'),
      point.ce_score.toFixed(2),
      point.ro_score.toFixed(2),
      point.ac_score.toFixed(2),
      point.ae_score.toFixed(2),
      point.ac_ce.toFixed(2),
      point.ae_ro.toFixed(2),
      point.learning_style || 'N/A',
      point.style_code || 'N/A',
      point.norm_group || 'N/A',
      point.assessment_duration_seconds?.toString() || 'N/A',
    ];
    return row;
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        // Escape cells containing commas or quotes
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const defaultFilename = `${studyData.study_title
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename || defaultFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helpers ------------------------------------------------------------------

const mapStudyPayload = (payload: ResearchStudyPayload): Study => {
  const status: Study['status'] = payload.completed_at
    ? 'COMPLETED'
    : payload.started_at
    ? 'ACTIVE'
    : 'DRAFT';
  return {
    id: payload.id,
    title: payload.title,
    description: payload.description ?? null,
    start_date: payload.started_at ?? null,
    end_date: payload.completed_at ?? null,
    participant_count: 0,
    status,
    notes: payload.notes ?? null,
  };
};
