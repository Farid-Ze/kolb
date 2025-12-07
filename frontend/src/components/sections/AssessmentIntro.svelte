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

<section class="assessment-intro h-screen flex items-center justify-between px-[10%] relative pointer-events-none">
    <div class="content max-w-md z-10">
        <span class="typo-label text-neon-cyan mb-4 block opacity-0 intro-title">01 // The Framework</span>
        <h2 class="typo-headline text-white mb-6 opacity-0 translate-y-10 intro-title">Cognitive Mapping</h2>
        <p class="typo-body text-ice-highlight opacity-0 translate-y-10 intro-desc">
            The Kolb Learning Style Inventory 4.0 maps learning preferences across two dialectic dimensions: 
            Perceiving (Grasping) and Processing (Transforming).
        </p>
    </div>

    <div class="grid-legend absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-0">
        <div class="legend-item text-right">
            <span class="typo-hud text-neon-magenta block mb-1">Y-AXIS</span>
            <span class="typo-label text-white">Concrete Experience (CE)</span>
            <span class="typo-label text-white block text-xs opacity-50">vs Abstract Conceptualization (AC)</span>
        </div>
        <div class="legend-item text-right">
            <span class="typo-hud text-neon-cyan block mb-1">X-AXIS</span>
            <span class="typo-label text-white">Active Experimentation (AE)</span>
            <span class="typo-label text-white block text-xs opacity-50">vs Reflective Observation (RO)</span>
        </div>
    </div>
</section>

<style lang="scss">
    .assessment-intro {
        width: 100%;
        height: 100vh;
    }
</style>
