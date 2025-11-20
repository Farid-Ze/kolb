/**
 * KLSI 4.0 - AssessmentService (LEGACY)
 * Task 25, 29, 33: Assessment API calls dengan authenticatedApiCall
 * 
 * ⚠️ DEPRECATED: This service is legacy and uses the /engine/* endpoints.
 * 
 * Modern frontend rooms (ActiveExperimentationRoom, AbstractConceptualizationRoom)
 * now use the /sessions/* and /assessments/* endpoints via frontend/src/core/api/client.ts
 * 
 * This service remains for backward compatibility with existing UI components.
 * Prefer using the centralized API client for new code.
 * 
 * Service layer untuk assessment delivery dan submission
 * Menggunakan authenticatedApiCall untuk automatic token injection
 */

import { getApiUrl } from '../config/api';
import { authenticatedApiCall } from '../utils/apiHelper';
import type {
  AssessmentItem,
  GetAssessmentItemsResponse,
  ItemResponse,
  SubmitAnswersRequest,
  SubmitAnswersResponse,
} from '../types/api';

type EngineSessionItemsResponse = {
  session_id: number;
  instrument_code: string;
  instrument_version?: string;
  status?: string;
  total_items?: number;
  delivery: Record<string, any>;
  responses?: Array<{ item_id: number; ranks: Record<string, number> }>;
  contexts?: Array<Record<string, any>>;
  progress?: number;
  completed_items?: number;
  current_item_index?: number;
};

type AutosaveBackendPayload = {
  responses: Array<{ item_id: number; ranks: Record<string, number> }>;
  contexts: Array<{ context_name: string; CE: number; RO: number; AC: number; AE: number }>;
};

/**
 * Task 25: Get assessment items untuk session
 * GET /engine/sessions/:id/items
 */
export const getAssessmentItems = async (
  sessionId: string
): Promise<GetAssessmentItemsResponse> => {
  const payload = await authenticatedApiCall<EngineSessionItemsResponse>(
    getApiUrl(`/engine/sessions/${sessionId}/items`),
    {
      method: 'GET',
    }
  );

  const items = normalizeAssessmentItems(payload?.delivery?.items ?? []);
  const responses = normalizeResponses(payload.responses ?? []);
  const contexts = (payload.contexts ?? []).map((ctx) => ({
    context_name: String(ctx.context_name ?? ''),
    CE: Number(ctx.CE ?? 0),
    RO: Number(ctx.RO ?? 0),
    AC: Number(ctx.AC ?? 0),
    AE: Number(ctx.AE ?? 0),
  }));

  return {
    session_id: String(payload.session_id ?? sessionId),
    instrument_code: payload.instrument_code ?? 'KLSI',
    instrument_version: payload.instrument_version,
    status: payload.status as GetAssessmentItemsResponse['status'],
    total_items: payload.total_items ?? items.length,
    items,
    responses,
    contexts,
    progress: payload.progress,
    completed_items: payload.completed_items,
    current_item_index: payload.current_item_index,
    instructions: extractInstructions(payload.delivery),
  };
};

/**
 * Task 29: Submit answers (autosave)
 * POST /engine/sessions/:id/items
 */
export const submitAnswers = async (
  sessionId: string,
  payload: SubmitAnswersRequest,
  items: AssessmentItem[],
): Promise<SubmitAnswersResponse> => {
  const backendPayload = buildAutosavePayload(payload.responses, items, payload.contexts);
  if (!backendPayload.responses.length && !backendPayload.contexts.length) {
    return { saved_count: 0 };
  }

  return authenticatedApiCall<SubmitAnswersResponse>(
    getApiUrl(`/engine/sessions/${sessionId}/items`),
    {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    }
  );
};

const normalizeAssessmentItems = (items: any[]): AssessmentItem[] =>
  items.map((item, index) => {
    const prompt = item.stem_localized ?? item.stem ?? '';
    const options = Array.isArray(item.options)
      ? item.options.map((option: any) => {
          const code = normalizeLearningMode(option.learning_mode ?? option.option_code);
          return {
            id: String(option.id ?? `${item.id}-${code}`),
            option_code: code,
            text: option.text ?? '',
            dimension: code,
          };
        })
      : [];

    return {
      item_id: String(item.id ?? index),
      order: Number(item.number ?? index + 1),
      prompt,
      options,
    };
  });

const normalizeLearningMode = (value: any): 'CE' | 'RO' | 'AC' | 'AE' => {
  const normalized = String(value ?? '').toUpperCase();
  if (['CE', 'RO', 'AC', 'AE'].includes(normalized)) {
    return normalized as 'CE' | 'RO' | 'AC' | 'AE';
  }
  return 'CE';
};

const normalizeResponses = (
  responses: Array<{ item_id: number; ranks: Record<string, number> }>,
): ItemResponse[] =>
  responses.map((response) => ({
    item_id: String(response.item_id),
    ranks: response.ranks ?? {},
  }));

const extractInstructions = (delivery: Record<string, any> | undefined): string | undefined => {
  if (!delivery || typeof delivery !== 'object') return undefined;
  const manifest = delivery.manifest || delivery?.instrument?.manifest;
  if (manifest && typeof manifest.instructions === 'string') {
    return manifest.instructions;
  }
  const resources = delivery?.i18n?.metadata;
  if (resources && typeof resources.instructions === 'string') {
    return resources.instructions;
  }
  return undefined;
};

export const buildAutosavePayload = (
  responses: ItemResponse[],
  items: AssessmentItem[],
  contexts: any[] = []
): AutosaveBackendPayload => {
  const itemLookup = new Map(items.map((item) => [item.item_id, item]));
  const transformed = responses
    .map((response) => {
      if (!isCompleteRanks(response.ranks)) {
        return null;
      }
      const item = itemLookup.get(response.item_id);
      if (!item) {
        return null;
      }
      // Backend expects option codes (CE, RO, AC, AE) -> rank
      const ranks: Record<string, number> = {};
      Object.entries(response.ranks).forEach(([optionCode, rank]) => {
        // Verify it's a valid code if needed, or just pass through
        if (['CE', 'RO', 'AC', 'AE'].includes(optionCode)) {
          ranks[optionCode] = rank;
        }
      });
      if (Object.keys(ranks).length !== 4) {
        return null;
      }
      return {
        item_id: Number(response.item_id),
        ranks,
      };
    })
    .filter(Boolean) as AutosaveBackendPayload['responses'];

  return { responses: transformed, contexts: contexts || [] };
};

const isCompleteRanks = (ranks: Record<string, number>): boolean => {
  const values = Object.values(ranks ?? {});
  if (values.length !== 4) return false;
  const unique = new Set(values);
  if (unique.size !== 4) return false;
  return values.every((value) => value >= 1 && value <= 4);
};

