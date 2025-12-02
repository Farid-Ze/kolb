import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SessionsService } from '@/shared/api/generated';
import type { AssessmentItemResponsePayload } from '@/shared/api/generated';
import { toast } from 'sonner';

// Simple debounce implementation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function simpleDebounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function useAssessmentSession(sessionId?: string) {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);

    // Start/Resume Session
    const startSessionMutation = useMutation({
        mutationFn: () => SessionsService.startSessionApiV1SessionsStartPost({ instrumentCode: 'KLSI4' }),
        onSuccess: (data) => {
            setCurrentSessionId(data.sessionId);
            toast.success('Assessment session started');
        },
        onError: (error) => {
            toast.error('Failed to start session');
            console.error(error);
        }
    });

    // Fetch Items
    const { data: items, isLoading: isLoadingItems } = useQuery({
        queryKey: ['session', currentSessionId, 'items'],
        queryFn: () => SessionsService.getItemsApiV1SessionsSessionIdItemsGet(currentSessionId!),
        enabled: !!currentSessionId,
    });

    // Autosave Mutation
    const autosaveMutation = useMutation({
        mutationFn: (payload: { sessionId: string, responses: AssessmentItemResponsePayload[] }) =>
            SessionsService.upsertSessionResponsesApiV1SessionsSessionIdResponsesPatch(payload.sessionId, payload.responses),
        onError: () => {
            toast.error('Failed to save progress');
        }
    });

    // Debounced Autosave
    const debouncedSave = useRef(
        simpleDebounce((id: string, responses: AssessmentItemResponsePayload[]) => {
            autosaveMutation.mutate({ sessionId: id, responses });
        }, 1000)
    ).current;

    const saveResponse = useCallback((response: AssessmentItemResponsePayload) => {
        if (!currentSessionId) return;

        // Trigger autosave
        debouncedSave(currentSessionId, [response]);
    }, [currentSessionId, debouncedSave]);

    return {
        sessionId: currentSessionId,
        startSession: startSessionMutation.mutate,
        items,
        isLoading: isLoadingItems || startSessionMutation.isPending,
        saveResponse,
        isSaving: autosaveMutation.isPending
    };
}
