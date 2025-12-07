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

<section class="styles-section min-h-screen py-20 px-[10%] relative z-10">
    <div class="header mb-16">
        <span class="typo-label text-neon-cyan mb-4 block opacity-0 styles-title">02 // The 9 Styles</span>
        <h2 class="typo-headline text-white opacity-0 translate-y-10 styles-title">Learning Archetypes</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each styles as style}
            <div class="style-card p-6 border border-white/10 bg-black/20 backdrop-blur-sm rounded hover:border-neon-cyan/50 transition-colors opacity-0 translate-y-10">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="typo-label text-white text-lg">{style.name}</h3>
                    <span class="typo-mono text-neon-cyan text-xs border border-neon-cyan/30 px-2 py-1 rounded">{style.code}</span>
                </div>
                <p class="typo-body text-sm text-ice-highlight/70">{style.desc}</p>
            </div>
        {/each}
    </div>
</section>

<style lang="scss">
    .styles-section {
        width: 100%;
    }
</style>
