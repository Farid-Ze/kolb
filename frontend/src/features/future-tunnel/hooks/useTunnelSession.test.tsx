import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTunnelSession } from './useTunnelSession'
import * as api from '../api'

// Mock constants to simplify completion logic
vi.mock('../../../entities/session/constants', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    LFI_CONTEXTS: ['test-context'],
    MODE_CODES: ['A', 'B'],
  }
})

// Mock dependencies
vi.mock('../../auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isTimeLocked: false,
    user: { id: 1, fullName: 'Test User' },
  }),
}))

vi.mock('../../telemetry', () => ({
  useAssessmentTelemetry: () => vi.fn(),
}))

vi.mock('../api', () => ({
  startSession: vi.fn(),
  fetchSessionItems: vi.fn(),
  fetchSessionState: vi.fn(),
  submitAllResponses: vi.fn(),
  submitSingleResponse: vi.fn(),
  autosaveSession: vi.fn(),
  finalizeSession: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTunnelSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Default mock implementations to avoid "Query data cannot be undefined"
    vi.mocked(api.fetchSessionItems).mockResolvedValue([])
    vi.mocked(api.fetchSessionState).mockResolvedValue({} as any)
  })

  it('should initialize in idle state', () => {
    const { result } = renderHook(() => useTunnelSession(), { wrapper: createWrapper() })
    expect(result.current.phase).toBe('idle')
    expect(result.current.sessionId).toBeNull()
  })

  it('should start a session successfully', async () => {
    const mockSessionId = 123
    vi.mocked(api.startSession).mockResolvedValue({ 
      sessionId: mockSessionId, 
      items: [],
      session_id: mockSessionId 
    } as any)

    const { result } = renderHook(() => useTunnelSession(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.start()
    })

    expect(api.startSession).toHaveBeenCalled()
    expect(result.current.sessionId).toBe(mockSessionId)
    expect(result.current.phase).toBe('in-progress')
  })

  it('should hydrate from localStorage', () => {
    const sessionId = 456
    localStorage.setItem('zenotika.tunnel.sessionId', String(sessionId))
    
    const { result } = renderHook(() => useTunnelSession(), { wrapper: createWrapper() })

    expect(result.current.sessionId).toBe(sessionId)
    expect(result.current.phase).toBe('in-progress')
    expect(result.current.restoredFromDraft).toBe(true)
  })

  it('should update item ranks', async () => {
    const mockSessionId = 123
    vi.mocked(api.startSession).mockResolvedValue({ sessionId: mockSessionId } as any)
    
    const { result } = renderHook(() => useTunnelSession(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.start()
    })

    const itemId = 1
    const choiceId = 1
    const rank = 4

    act(() => {
      result.current.setOptionRank(itemId, choiceId, rank)
    })

    expect(result.current.drafts[itemId]).toBeDefined()
    expect(result.current.drafts[itemId].ranks[choiceId]).toBe(rank)
  })

  it('should submit session successfully', async () => {
    const mockSessionId = 123
    const mockItem = { 
      id: 1, 
      type: 'Learning_Style',
      options: [{ id: 10, code: 'A' }, { id: 11, code: 'B' }] 
    }
    
    vi.mocked(api.startSession).mockResolvedValue({ 
      sessionId: mockSessionId,
      items: [mockItem],
      session_id: mockSessionId
    } as any)
    
    vi.mocked(api.fetchSessionItems).mockResolvedValue([mockItem] as any)

    vi.mocked(api.submitAllResponses).mockResolvedValue({ 
      success: true, 
      result: { 
        style_primary: 'Converging',
        style_primary_id: 'CV',
        ACCE: 10,
        AERO: 10,
        LFI: 0.5
      } 
    } as any)

    const { result } = renderHook(() => useTunnelSession(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.start()
    })

    await waitFor(() => expect(result.current.items.length).toBe(1))

    // Complete Item
    act(() => {
      result.current.setOptionRank(1, 10, 1)
    })
    act(() => {
      result.current.setOptionRank(1, 11, 2)
    })

    // Complete Context
    act(() => {
      result.current.setContextRank('test-context', 'A' as any, 1)
    })
    act(() => {
      result.current.setContextRank('test-context', 'B' as any, 2)
    })

    await act(async () => {
      await result.current.finalize()
    })

    expect(api.submitAllResponses).toHaveBeenCalledWith(mockSessionId, expect.anything())
    expect(result.current.phase).toBe('completed')
    expect(result.current.result).toBeDefined()
  })
})
