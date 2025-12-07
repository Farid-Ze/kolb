<script lang="ts">
    import { onMount } from 'svelte';
    import { initScrollController } from '$lib/animation/ScrollController';

    let velocity = $state(0);
    let progress = $state(0);
    let mode = $state('CALM'); // CALM, ACTIVE, VELOCITY
    let section = $state('HERO');

    onMount(() => {
        const scroll = initScrollController();
        scroll.addScrollCallback((p, v) => {
            progress = p;
            velocity = v;

            if (v < 200) mode = 'CALM';
            else if (v < 500) mode = 'ACTIVE';
            else mode = 'VELOCITY';

            if (p < 0.2) section = 'HERO';
            else if (p < 0.4) section = 'INTRO';
            else if (p < 0.6) section = 'STYLES';
            else if (p < 0.8) section = 'DEMO';
            else section = 'START';
        });
    });
</script>

<div class="hud-container">
    <div class="hud-top-left">
        <div class="typo-hud text-xs text-gray-500">SYSTEM STATUS</div>
        <div class="typo-data text-xl">{mode}</div>
        <div class="typo-hud text-xs text-gray-500 mt-2">SECTOR</div>
        <div class="typo-data text-lg text-neon-cyan">{section}</div>
    </div>

    <div class="hud-bottom-left">
        <div class="typo-hud text-xs text-gray-500">VELOCITY</div>
        <div class="typo-data text-xl">{Math.round(velocity)} px/s</div>
        <div class="velocity-bar">
            <div class="velocity-fill" style="width: {Math.min(velocity / 10, 100)}%"></div>
        </div>
    </div>

    <div class="hud-bottom-right">
        <div class="typo-hud text-xs text-gray-500">PROGRESS</div>
        <div class="typo-data text-xl">{Math.round(progress * 100)}%</div>
    </div>
</div>

<style>
    .hud-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
        padding: 2rem;
        box-sizing: border-box;
    }

    .hud-top-left {
        position: absolute;
        top: 8rem; /* Moved down to avoid Header overlap */
        left: 2rem;
    }

    .hud-bottom-left {
        position: absolute;
        bottom: 2rem;
        left: 2rem;
    }

    .hud-bottom-right {
        position: absolute;
        bottom: 2rem;
        right: 2rem;
    }

    .velocity-bar {
        width: 100px;
        height: 2px;
        background: rgba(255, 255, 255, 0.1);
        margin-top: 0.5rem;
    }

    .velocity-fill {
        height: 100%;
        background: var(--color-neon-cyan);
        transition: width 0.1s ease-out;
    }

    .text-gray-500 {
        color: #6b7280;
    }

    .text-xl {
        font-size: 1.25rem;
        line-height: 1.75rem;
    }
</style>
