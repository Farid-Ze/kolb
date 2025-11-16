/**
 * KLSI 4.0 - ResearchService
 * Task 66, 69, 71: Service layer untuk research data management (Mediator Flow)
 * Menggunakan authenticatedApiCall untuk automatic token injection
 */

import { getApiUrl } from '../config/api';
import { authenticatedApiCall } from '../utils/apiHelper';

// Types
export interface Study {
  id: number;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  start_date: string;
  end_date?: string;
  participant_count: number;
  status: 'ACTIVE' | 'COMPLETED' | 'DRAFT';
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
  user_id: string;
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
  learning_style: string;
  style_code: string;
  
  // Metadata
  norm_group?: string;
  assessment_duration_seconds?: number;
}

export interface StudyData {
  study_id: number;
  study_title: string;
  data_points: StudyDataPoint[];
  summary: {
    total_sessions: number;
    unique_participants: number;
    date_range: {
      earliest: string;
      latest: string;
    };
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
  return authenticatedApiCall<Study[]>(getApiUrl('research/studies'), {
    method: 'GET',
  });
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
  return authenticatedApiCall<Study>(getApiUrl('research/studies'), {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Get study details with participants
 * GET /research/studies/:id
 */
export const getStudyDetails = async (studyId: number): Promise<StudyDetail> => {
  return authenticatedApiCall<StudyDetail>(getApiUrl(`research/studies/${studyId}`), {
    method: 'GET',
  });
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
 * Update study
 * PUT /research/studies/:id
 */
export const updateStudy = async (
  studyId: number,
  data: {
    title?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: 'ACTIVE' | 'COMPLETED' | 'DRAFT';
  }
): Promise<Study> => {
  return authenticatedApiCall<Study>(getApiUrl(`research/studies/${studyId}`), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete study
 * DELETE /research/studies/:id
 */
export const deleteStudy = async (
  studyId: number
): Promise<{ ok: boolean; message: string }> => {
  return authenticatedApiCall<{ ok: boolean; message: string }>(
    getApiUrl(`research/studies/${studyId}`),
    {
      method: 'DELETE',
    }
  );
};

/**
 * Add participant to study
 * POST /research/studies/:id/participants
 */
export const addParticipantToStudy = async (
  studyId: number,
  data: {
    user_email: string;
  }
): Promise<{ ok: boolean; message: string }> => {
  return authenticatedApiCall<{ ok: boolean; message: string }>(
    getApiUrl(`research/studies/${studyId}/participants`),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};

/**
 * Remove participant from study
 * DELETE /research/studies/:id/participants/:userId
 */
export const removeParticipantFromStudy = async (
  studyId: number,
  userId: string
): Promise<{ ok: boolean; message: string }> => {
  return authenticatedApiCall<{ ok: boolean; message: string }>(
    getApiUrl(`research/studies/${studyId}/participants/${userId}`),
    {
      method: 'DELETE',
    }
  );
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
  const rows = studyData.data_points.map((point) => [
    point.session_id.toString(),
    point.user_id,
    point.user_email,
    point.user_name,
    new Date(point.generated_at).toLocaleString('id-ID'),
    point.ce_score.toFixed(2),
    point.ro_score.toFixed(2),
    point.ac_score.toFixed(2),
    point.ae_score.toFixed(2),
    point.ac_ce.toFixed(2),
    point.ae_ro.toFixed(2),
    point.learning_style,
    point.style_code,
    point.norm_group || 'N/A',
    point.assessment_duration_seconds?.toString() || 'N/A',
  ]);

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
