<script lang="ts">
    import { onMount } from 'svelte';
    import { masterTimeline } from '$lib/animation/Timeline';

    onMount(() => {
        masterTimeline.registerSection({
            sectionId: 'cta-section',
            trigger: '.cta-section',
            start: 'top 80%',
            end: 'bottom bottom',
            animations: [
                { target: '.cta-content', opacity: 1, scale: 1, duration: 1, ease: 'power3.out' }
            ]
        });
    });
</script>

<section class="cta-section h-[50vh] flex items-center justify-center relative z-10">
    <div class="cta-content text-center opacity-0 scale-90">
        <h2 class="typo-headline text-white mb-8">Discover Your Learning Style</h2>
        <a href="/assessment" class="btn-primary inline-block">
            Start Assessment
            <span class="ml-2">→</span>
        </a>
    </div>
</section>

<style lang="scss">
    .cta-section {
        width: 100%;
    }

    .btn-primary {
        background: var(--color-neon-cyan);
        color: var(--color-bg-void);
        padding: 1rem 3rem;
        font-family: var(--font-mono);
        text-transform: uppercase;
        font-weight: bold;
        letter-spacing: 0.1em;
        border: 1px solid var(--color-neon-cyan);
        transition: all 0.3s ease;
        text-decoration: none;

        &:hover {
            background: transparent;
            color: var(--color-neon-cyan);
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.2);
        }
    }
</style>
