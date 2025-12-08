<script lang="ts">
    import { onMount } from 'svelte';
    import { masterTimeline } from '$lib/animation/Timeline';

    onMount(() => {
        masterTimeline.registerSection({
            sectionId: 'assessment-intro',
            trigger: '.assessment-intro',
            start: 'top center',
            end: 'bottom center',
            animations: [
                { target: '.intro-title', opacity: 1, y: 0, duration: 1 },
                { target: '.intro-desc', opacity: 1, y: 0, duration: 1, delay: 0.2 },
                { target: '.grid-legend', opacity: 1, duration: 1, delay: 0.5 }
            ]
        });
    });
</script>

<section class="assessment-intro h-screen flex items-center justify-center px-[10%] relative pointer-events-none">
    <div class="content max-w-xl z-10 text-center">
        <span class="typo-label text-neon-magenta mb-4 block opacity-0 intro-title">PHASE III // ENTROPIA</span>
        <h2 class="typo-headline text-white mb-6 opacity-0 translate-y-10 intro-title">THE FRACTURE</h2>
        <p class="typo-body text-ice-highlight opacity-0 translate-y-10 intro-desc text-xl">
            "Growth demands disruption."
        </p>
        <p class="typo-mono text-xs text-white/50 mt-8 opacity-0 translate-y-10 intro-desc max-w-md mx-auto">
            The old structures can no longer contain the new complexity. 
            We must sublimate to find a higher order.
        </p>
    </div>
</section>

<style lang="scss">
    .assessment-intro {
        width: 100%;
        height: 100vh;
    }
</style>
