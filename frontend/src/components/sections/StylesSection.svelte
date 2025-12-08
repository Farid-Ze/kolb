<script lang="ts">
    import { onMount } from 'svelte';
    import { masterTimeline } from '$lib/animation/Timeline';

    const styles = [
        { code: 'I', name: 'Initiating', desc: 'Initiating action to deal with experiences and situations.' },
        { code: 'E', name: 'Experiencing', desc: 'Finding meaning from deep involvement in experience.' },
        { code: 'C', name: 'Creating', desc: 'Creating meaning by observing and reflecting on experiences.' },
        { code: 'R', name: 'Reflecting', desc: 'Reflecting on experiences to observe and understand meaning.' },
        { code: 'AN', name: 'Analyzing', desc: 'Integrating and systematizing ideas through reflection.' },
        { code: 'T', name: 'Thinking', desc: 'Disciplined involvement in abstract reasoning and logic.' },
        { code: 'D', name: 'Deciding', desc: 'Using theories and models to decide on problem solutions.' },
        { code: 'A', name: 'Acting', desc: 'Goal-directed action to accomplish objectives.' },
        { code: 'B', name: 'Balancing', desc: 'Balancing the extremes of the learning modes.' }
    ];

    onMount(() => {
        masterTimeline.registerSection({
            sectionId: 'styles-section',
            trigger: '.styles-section',
            start: 'top center',
            end: 'bottom center',
            animations: [
                { target: '.styles-title', opacity: 1, y: 0, duration: 1 },
                { target: '.style-card', opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }
            ]
        });
    });
</script>

<section class="styles-section h-screen flex flex-col items-center justify-center px-[10%] relative z-10 pointer-events-none text-center">
    <div class="header mb-12">
        <span class="typo-label text-neon-cyan mb-4 block opacity-0 styles-title">PHASE IV // KOSMOS</span>
        <h2 class="typo-headline text-white opacity-0 translate-y-10 styles-title text-6xl mb-6">THE RING</h2>
    </div>

    <div class="philosophy-group flex flex-col gap-4 opacity-0 translate-y-10 styles-title">
        <p class="typo-display text-white/80 text-2xl tracking-widest">ZEN</p>
        <p class="typo-display text-white/80 text-2xl tracking-widest">NOVA</p>
        <p class="typo-display text-white/80 text-2xl tracking-widest">INFORMATIKA</p>
    </div>

    <p class="typo-mono text-xs text-white/40 mt-12 max-w-md opacity-0 translate-y-10 styles-title">
        From the dust of entropy, a new gravity emerges. 
        The Monoliths of learning stand as guide stones in the current.
    </p>
</section>

<style lang="scss">
    .styles-section {
        width: 100%;
    }
</style>
