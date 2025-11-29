import { useEffect, useRef, useCallback } from 'react';
import { TelemetryService } from '@/shared/api/generated';

export function useAssessmentTelemetry(sessionId?: string, itemId?: number) {
    const startTimeRef = useRef<number>(Date.now());
    const blurCountRef = useRef<number>(0);

    useEffect(() => {
        // Reset timer and blur count when item changes
        startTimeRef.current = Date.now();
        blurCountRef.current = 0;

        const handleBlur = () => {
            blurCountRef.current += 1;
        };

        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('blur', handleBlur);
        };
    }, [itemId]);

    const recordTelemetry = useCallback(async (responseRank: number) => {
        if (!sessionId || !itemId) return;

        const endTime = Date.now();
        const latency = endTime - startTimeRef.current;

        try {
            await TelemetryService.recordAssessmentTelemetryApiV1TelemetryAssessmentPost({
                sessionId,
                itemId,
                responseRank,
                responseLatencyMs: latency,
                blurEvents: blurCountRef.current,
                meta: {
                    userAgent: navigator.userAgent,
                    screenResolution: `${window.screen.width}x${window.screen.height}`
                }
            });
        } catch (error) {
            // Telemetry errors should not block the user flow, just log them
            console.warn('Failed to record telemetry', error);
        }
    }, [sessionId, itemId]);

    const sendTelemetry = useCallback((payload: any) => {
        if (!sessionId) return;

        const fullPayload = {
            sessionId,
            timestamp: Date.now(),
            ...payload,
            meta: {
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                ...payload.meta
            }
        };

        const blob = new Blob([JSON.stringify(fullPayload)], { type: 'application/json' });

        // Use beacon for reliable transmission during unload/visibility change
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/v1/telemetry/assessment', blob);
        } else {
            // Fallback for older browsers (unlikely needed but good practice)
            TelemetryService.recordAssessmentTelemetryApiV1TelemetryAssessmentPost(fullPayload).catch(console.warn);
        }
    }, [sessionId]);

    const sendItemChanged = useCallback((itemId: number, fromRank: number | null, toRank: number | null) => {
        sendTelemetry({
            itemId,
            event: 'rank_change',
            fromRank,
            toRank,
            responseLatencyMs: Date.now() - startTimeRef.current
        });
    }, [sendTelemetry]);

    return {
        recordTelemetry,
        sendTelemetry,
        sendItemChanged
    };
}
