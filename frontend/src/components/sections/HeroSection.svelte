<script lang="ts">
    import { onMount } from 'svelte';
    import { masterTimeline } from '$lib/animation/Timeline';
    import ScrollIndicator from '../ui/ScrollIndicator.svelte';

    onMount(() => {
        // Phase 1: Genesis (Initial State)
        masterTimeline.createTextReveal('.hero-microcopy', { delay: 0.5, duration: 1.5 });
        
        // Phase 2: Identity (Triggered by scroll in Timeline or here if we want auto-play intro)
        // For now, we let the scroll handle the transition to Phase 2 visuals, 
        // but the Title might need to be pinned or revealed.
        // Let's reveal the title initially for usability, but maybe with a "glitch" or "fog" style?
        // Or strictly follow narrative: Title appears later.
        // Let's keep Title visible but subtle, or maybe it IS the "Identity" phase content.
        
        masterTimeline.createTextReveal('.hero-title', { delay: 0.2 });
        masterTimeline.createTextReveal('.hero-subtitle', { delay: 0.4 });
    });
</script>

<section class="hero-section h-screen flex flex-col items-center justify-center relative pointer-events-none">
    <div class="content text-center z-10 mix-blend-difference flex flex-col items-center gap-6">
        <!-- Phase 1 Content -->
        <p class="hero-microcopy typo-mono text-xs text-white/60 tracking-[0.2em] uppercase opacity-0">
            We began with a fragment of a dream.
        </p>

        <!-- Phase 2 Content (Identity) - Initially visible for standard web UX, but could be faded -->
        <div class="identity-group">
            <h1 class="hero-title typo-display text-white mb-2">ZENOTIKA</h1>
            <p class="hero-subtitle typo-mono text-neon-cyan tracking-widest uppercase text-sm">
                Kolb Assessment Platform
            </p>
        </div>
    </div>
    
    <ScrollIndicator />
</section>

<style lang="scss">
    .hero-section {
        /* Ensure it takes full viewport */
        width: 100%;
        height: 100vh;
    }
</style>
