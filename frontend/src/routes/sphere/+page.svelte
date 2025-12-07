<script lang="ts">
    import Navigation from '../../components/ui/Navigation.svelte';
    import HUD from '../../components/ui/HUD.svelte';
    import WebGLCanvas from '../../components/canvas/WebGLCanvas.svelte';
</script>

<WebGLCanvas mode="SPHERE" />
<Navigation />
<HUD />

<main class="h-screen flex items-center justify-center pointer-events-none">
    <div class="text-center z-10 mix-blend-difference">
        <h1 class="typo-display text-white mb-4">LEARNING SPHERE</h1>
        <p class="typo-mono text-neon-cyan">INTERACTIVE EXPLORATION MODULE</p>
    </div>
</main>
