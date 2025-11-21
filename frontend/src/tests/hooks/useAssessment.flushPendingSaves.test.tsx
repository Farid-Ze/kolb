import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssessment } from '../../hooks/useAssessment';
import type { GetAssessmentItemsResponse } from '../../types/api';

type MockSubmitAnswers = (
  sessionId: string,
  payload: unknown,
  items: unknown,
  options?: unknown
) => Promise<{ saved_count: number }>;

const mockSubmitAnswers = vi.fn<MockSubmitAnswers>();

interface MockMutationOptions<TVariables = unknown, TResult = unknown> {
  mutationFn: (variables: TVariables) => TResult | Promise<TResult>;
  onSuccess?: (result: TResult, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

vi.mock(new URL('../../services/assessmentService.ts', import.meta.url).pathname, () => ({
  getAssessmentItems: vi.fn(),
  submitAnswers: (
    sessionId: string,
    payload: unknown,
    items: unknown,
    options?: unknown
  ) => mockSubmitAnswers(sessionId, payload, items, options),
}));

interface MockQueryResult {
  data: GetAssessmentItemsResponse;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

interface MockMutationResult<TResult = unknown> {
  mutateAsync: (variables: unknown) => Promise<TResult>;
  readonly isPending: boolean;
}

const useQueryMock = vi.fn<(options: unknown) => MockQueryResult>();
const useMutationMock = vi.fn<
  (options: MockMutationOptions) => MockMutationResult
>();
const useQueryClientMock = {
  setQueryData: vi.fn(),
  cancelQueries: vi.fn(),
  getQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => useQueryMock(options),
  useMutation: (options: MockMutationOptions) => useMutationMock(options),
  useQueryClient: () => useQueryClientMock,
}));

const sampleAssessmentResponse: GetAssessmentItemsResponse = {
  session_id: 'session-1',
  instrument_code: 'KLSI',
  total_items: 1,
  items: [
    {
      item_id: 'item-1',
      order: 1,
      prompt: 'Prompt',
      options: [
        { id: '1', option_code: 'CE', text: 'CE', dimension: 'CE' },
        { id: '2', option_code: 'RO', text: 'RO', dimension: 'RO' },
        { id: '3', option_code: 'AC', text: 'AC', dimension: 'AC' },
        { id: '4', option_code: 'AE', text: 'AE', dimension: 'AE' },
      ],
    },
  ],
  responses: [],
  contexts: [],
  completed_items: 0,
  current_item_index: 0,
};

describe('useAssessment.flushPendingSaves', () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({
      data: sampleAssessmentResponse,
      isLoading: false,
      isError: false,
      error: null,
    });

    mockSubmitAnswers.mockReset();

    useMutationMock.mockImplementation((options: MockMutationOptions) => {
      let pending = false;

      const mutateAsync = async (variables: unknown) => {
        pending = true;
        try {
          const typed = variables as { payload: unknown; keepalive?: boolean };
          const result = await mockSubmitAnswers(
            'session-1',
            typed.payload,
            sampleAssessmentResponse.items,
            { keepalive: typed.keepalive }
          );
          options.onSuccess?.(result, variables);
          return result;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error(String(error));
          options.onError?.(normalizedError, variables);
          throw normalizedError;
        } finally {
          pending = false;
        }
      };

      return {
        mutateAsync,
        get isPending() {
          return pending;
        },
      };
    });
  });

  it('returns a promise when flushing complete responses', () => {
    mockSubmitAnswers.mockResolvedValue({ saved_count: 1 });

    const { result, unmount } = renderHook(() => useAssessment({ sessionId: 'session-1', enabled: true }));

    act(() => {
      result.current.setItemRanks('item-1', { CE: 1, RO: 2, AC: 3, AE: 4 });
    });

    const flushPromise = result.current.flushPendingSaves();

    expect(flushPromise).toBeInstanceOf(Promise);
    unmount();
  });
});
