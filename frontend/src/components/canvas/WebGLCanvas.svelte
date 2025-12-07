<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Engine, type EngineMode } from '$lib/three/Engine';
    import { initScrollController } from '$lib/animation/ScrollController';
    import { sceneStore } from '$lib/stores/scene.svelte';

    let { mode = 'LANDING' }: { mode?: EngineMode } = $props();

    let canvas: HTMLCanvasElement;
    let engine: Engine;

    onMount(() => {
        if (canvas) {
            engine = new Engine({
                canvas,
                antialias: true,
                powerPreference: 'high-performance',
                mode
            });
            engine.start();
            sceneStore.setEngine(engine);

            if (mode === 'LANDING') {
                const scroll = initScrollController();
                scroll.addScrollCallback((progress, velocity) => {
                    engine.setScroll(progress, velocity);
                });
            }
        }
    });

    onDestroy(() => {
        if (engine) {
            engine.dispose();
        }
    });
</script>

<canvas bind:this={canvas} class="webgl-canvas"></canvas>

<style>
    .webgl-canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        outline: none;
        pointer-events: none; /* Allow scrolling through canvas */
    }
</style>
