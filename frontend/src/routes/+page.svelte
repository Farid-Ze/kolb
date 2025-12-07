<script lang="ts">
    import { onMount } from 'svelte';
    import WebGLCanvas from '../components/canvas/WebGLCanvas.svelte';
    import LoadingScreen from '../components/canvas/LoadingScreen.svelte';
    import HUD from '../components/ui/HUD.svelte';
    import Navigation from '../components/ui/Navigation.svelte';
    import HeroSection from '../components/sections/HeroSection.svelte';
    import AssessmentIntro from '../components/sections/AssessmentIntro.svelte';
    import StylesSection from '../components/sections/StylesSection.svelte';
    import ResultsDemo from '../components/sections/ResultsDemo.svelte';
    import CTASection from '../components/sections/CTASection.svelte';
    import { masterTimeline } from '$lib/animation/Timeline';

    let isLoaded = $state(false);

    onMount(() => {
        // Timeline initialization is handled within each section component
    });
</script>

<LoadingScreen onComplete={() => isLoaded = true} />

{#if isLoaded}
    <WebGLCanvas />
    <Navigation />
    <HUD />

    <main>
        <HeroSection />
        <AssessmentIntro />
        <StylesSection />
        <ResultsDemo />
        <CTASection />
    </main>
{/if}

<style>
    :global(body) {
        margin: 0;
        background-color: #030508;
        color: white;
        overflow-x: hidden;
    }
</style>
