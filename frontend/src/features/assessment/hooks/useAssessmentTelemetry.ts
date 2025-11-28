import { useEffect, useRef, useCallback } from 'react';
import { TelemetryService } from '@/shared/api/generated';

export function useAssessmentTelemetry(sessionId?: number, itemId?: number) {
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
            await TelemetryService.recordAssessmentTelemetryTelemetryAssessmentPost({
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

    return { recordTelemetry };
}
