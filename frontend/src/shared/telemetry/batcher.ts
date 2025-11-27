/**
 * Telemetry Batcher - Client-side batching for scalable telemetry
 * 
 * Reduces server load by batching high-frequency events and using
 * the Beacon API for fire-and-forget delivery.
 * 
 * Performance Impact:
 * - Before: 100 users × 20 events/sec = 2,000 req/sec (server overload)
 * - After: 100 users × (100 events / 30 sec) = 5.5 req/sec (99.7% reduction)
 */

interface TelemetryEvent {
    type: string
    timestamp_ms: number
    payload: Record<string, any>
}

interface TelemetryBatch {
    session_id?: string | null
    events: TelemetryEvent[]
}

interface TelemetryBatcherOptions {
    endpoint?: string
    flushInterval?: number
    maxBatchSize?: number
    samplingRate?: number
}

export class TelemetryBatcher {
    private buffer: TelemetryEvent[] = []
    private flushInterval: number
    private maxBatchSize: number
    private samplingRate: number
    private endpoint: string
    private timerId: number | null = null

    constructor(options: TelemetryBatcherOptions = {}) {
        this.endpoint = options.endpoint || '/telemetry/batch'
        this.flushInterval = options.flushInterval || 30000  // 30 seconds
        this.maxBatchSize = options.maxBatchSize || 100
        this.samplingRate = options.samplingRate || 1.0  // 100% by default

        // Auto-flush on interval
        this.startAutoFlush()

        // Flush on page unload (Beacon API ensures delivery)
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.flush())
            window.addEventListener('pagehide', () => this.flush())
        }
    }

    /**
     * Track a telemetry event (will be batched automatically).
     * 
     * @param type - Event type (e.g., 'mouse', 'scroll', 'time_on_page')
     * @param payload - Event-specific data
     * 
     * @example
     * ```typescript
     * telemetry.track('mouse', { x: 100, y: 200 });
     * telemetry.track('scroll', { scrollY: 500 });
     * telemetry.track('time_on_page', { durationMs: 30000 });
     * ```
     */
    track(type: string, payload: Record<string, any>) {
        // Apply sampling (reduce frequency for high-volume events)
        if (Math.random() > this.samplingRate) {
            return
        }

        this.buffer.push({
            type,
            timestamp_ms: Date.now(),
            payload
        })

        // Flush if buffer full
        if (this.buffer.length >= this.maxBatchSize) {
            this.flush()
        }
    }

    /**
     * Immediately flush all buffered events to the server.
     * 
     * Uses Beacon API when available for guaranteed delivery,
     * even during page unload.
     */
    flush() {
        if (this.buffer.length === 0) return

        const batch: TelemetryBatch = {
            session_id: this.getSessionId(),
            events: this.buffer.splice(0, this.maxBatchSize)
        }

        const payload = JSON.stringify(batch)

        // Use Beacon API (fire-and-forget, survives page unload)
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' })
            navigator.sendBeacon(this.endpoint, blob)
        } else {
            // Fallback to fetch with keepalive (best effort)
            if (typeof fetch !== 'undefined') {
                fetch(this.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                }).catch(() => {
                    // Ignore errors (telemetry is non-critical)
                })
            }
        }
    }

    /**
     * Get current session ID for correlation.
     * Override this method to use your app's session management.
     */
    private getSessionId(): string | null {
        if (typeof localStorage === 'undefined') return null
        return localStorage.getItem('telemetry_session_id')
    }

    /**
     * Start auto-flush timer.
     */
    private startAutoFlush() {
        if (typeof window === 'undefined') return

        this.timerId = window.setInterval(
            () => this.flush(),
            this.flushInterval
        )
    }

    /**
     * Clean up resources (stop auto-flush, flush remaining events).
     */
    destroy() {
        if (this.timerId !== null) {
            clearInterval(this.timerId)
            this.timerId = null
        }
        this.flush()
    }

    /**
     * Get current buffer size (for debugging/monitoring).
     */
    get bufferSize(): number {
        return this.buffer.length
    }
}

// Singleton instance with default configuration
export const telemetry = new TelemetryBatcher()

// High-frequency event helpers with built-in sampling
export const telemetryHelpers = {
    /**
     * Track mouse movement (sampled at 10% to reduce volume).
     */
    trackMouse: (x: number, y: number) => {
        // Only track 10% of mouse events (still provides useful data)
        if (Math.random() > 0.1) return
        telemetry.track('mouse', { x, y })
    },

    /**
     * Track scroll position (sampled at 20%).
     */
    trackScroll: (scrollY: number) => {
        if (Math.random() > 0.2) return
        telemetry.track('scroll', { scrollY })
    },

    /**
     * Track time on page (always tracked, low frequency).
     */
    trackTimeOnPage: (durationMs: number, page?: string) => {
        telemetry.track('time_on_page', { durationMs, page })
    }
}
