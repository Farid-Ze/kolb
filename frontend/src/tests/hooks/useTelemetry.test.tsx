import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTelemetry } from '../../hooks/useTelemetry';

type MutateFn = (variables?: unknown) => void;

const guideMutate = vi.fn<MutateFn>();
const pageMutate = vi.fn<MutateFn>();
const actionMutate = vi.fn<MutateFn>();

interface MutationHookStub {
  mutate: MutateFn;
  isPending: boolean;
}

const useMutationMock = vi.fn<(options: unknown) => MutationHookStub>();

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useMutation: (options: unknown) => useMutationMock(options),
  };
});

const mockAuth = {
  user: {
    id: 'user-1',
    email: 'mediator@example.com',
    name: 'Mediator',
    role: 'MEDIATOR',
    created_at: '2025-01-01T00:00:00.000Z',
  },
};

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockAuth,
}));

const mockPrefs: { telemetryEnabled: boolean } = { telemetryEnabled: true };

vi.mock('../../contexts/useUIPreferences', () => ({
  useUIPreferencesOptional: () => mockPrefs,
}));

const setupMutations = () => {
  useMutationMock.mockReset();
  const queue: MutateFn[] = [guideMutate, pageMutate, actionMutate];
  useMutationMock.mockImplementation(() => ({ mutate: queue.shift() ?? (() => undefined), isPending: false }));
};

describe('useTelemetry', () => {
  beforeEach(() => {
    guideMutate.mockReset();
    pageMutate.mockReset();
    actionMutate.mockReset();
    mockPrefs.telemetryEnabled = true;
    setupMutations();
  });

  it('skips sending events when telemetry disabled', () => {
    mockPrefs.telemetryEnabled = false;
    const { result } = renderHook(() => useTelemetry());

    act(() => {
      result.current.trackGuideOpen('guide', 'id-ID');
      result.current.trackPageView('/home', 'Home');
      result.current.trackAction('test', 'target');
    });

    expect(guideMutate).not.toHaveBeenCalled();
    expect(pageMutate).not.toHaveBeenCalled();
    expect(actionMutate).not.toHaveBeenCalled();
  });

  it('sends guide telemetry with normalized language', () => {
    const { result } = renderHook(() => useTelemetry());

    act(() => {
      result.current.trackGuideOpen('guide', 'id-ID', 'context');
    });

    expect(guideMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        guide_id: 'guide',
        language: 'id',
        surface: 'modal',
        consent: true,
      })
    );
  });

  it('includes actor role for action telemetry', () => {
    const { result } = renderHook(() => useTelemetry());

    act(() => {
      result.current.trackAction('share', 'report', '123', { channel: 'link' });
    });

    expect(actionMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: 'share',
        action_target: 'report',
        action_value: '123',
        metadata: { channel: 'link' },
        actor_role: 'MEDIATOR',
        consent: true,
      })
    );
  });
});
