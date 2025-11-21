import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssessment } from '../../hooks/useAssessment';

const mockSubmitAnswers = vi.fn();

vi.mock('../../services/assessmentService', () => ({
  getAssessmentItems: vi.fn(),
  submitAnswers: (
    sessionId: string,
    payload: unknown,
    items: unknown,
    options?: unknown
  ) => mockSubmitAnswers(sessionId, payload, items, options),
}));

const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => useQueryMock(options),
  useMutation: (options: unknown) => useMutationMock(options),
}));

const sampleAssessmentResponse = {
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

    useMutationMock.mockImplementation((options: any) => {
      let pending = false;
      return {
        mutateAsync: (variables: any) => {
          pending = true;
          try {
            const result = options.mutationFn(variables);
            options.onSuccess?.(result, variables, undefined);
          } catch (error) {
            pending = false;
            options.onError?.(error as Error, variables, undefined);
            return Promise.reject(error);
          }
          pending = false;
          return Promise.resolve();
        },
        get isPending() {
          return pending;
        },
      };
    });
  });

  it('returns a promise and triggers submitAnswers when flushing complete responses', () => {
    mockSubmitAnswers.mockResolvedValue({ saved_count: 1 });

    const { result, unmount } = renderHook(() => useAssessment({ sessionId: 'session-1', enabled: true }));

    act(() => {
      result.current.setItemRanks('item-1', { CE: 1, RO: 2, AC: 3, AE: 4 });
    });

    const flushPromise = result.current.flushPendingSaves();

    expect(flushPromise).toBeInstanceOf(Promise);
    expect(mockSubmitAnswers).toHaveBeenCalledTimes(1);
    expect(result.current.hasPendingSave).toBe(true);
    unmount();
  });
});
