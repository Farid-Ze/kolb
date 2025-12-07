<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';

    let { onComplete }: { onComplete?: () => void } = $props();
    
    let progress = $state(0);
    let visible = $state(true);

    onMount(() => {
        // Simulate loading sequence
        const interval = setInterval(() => {
            progress += Math.random() * 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    visible = false;
                    onComplete?.();
                }, 500);
            }
        }, 50);

        return () => clearInterval(interval);
    });
</script>

{#if visible}
    <div class="loading-screen" out:fade={{ duration: 800 }}>
        <div class="loader-content">
            <div class="logo typo-display">ZENOTIKA</div>
            <div class="progress-bar">
                <div class="fill" style="width: {progress}%"></div>
            </div>
            <div class="status typo-mono">
                INITIALIZING NEURAL INTERFACE... {Math.floor(progress)}%
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--color-bg-void);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }

    .loader-content {
        width: 300px;
        text-align: center;
    }

    .logo {
        font-size: 2rem;
        margin-bottom: 2rem;
        letter-spacing: 0.2em;
    }

    .progress-bar {
        width: 100%;
        height: 2px;
        background: rgba(255, 255, 255, 0.1);
        margin-bottom: 1rem;
        position: relative;
        overflow: hidden;
    }

    .fill {
        height: 100%;
        background: var(--color-neon-cyan);
        box-shadow: 0 0 10px var(--color-neon-cyan);
        transition: width 0.1s linear;
    }

    .status {
        font-size: 0.75rem;
        color: var(--color-ice-surface);
        opacity: 0.7;
    }
</style>
