<script lang="ts">
    import { sceneStore } from '$lib/stores/scene.svelte';
    import { onMount } from 'svelte';
    import gsap from 'gsap';
    import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

    let container: HTMLElement;

    let scores = $state({
        CE: 24,
        RO: 24,
        AC: 24,
        AE: 24
    });

    function updateScore(key: 'CE' | 'RO' | 'AC' | 'AE', value: number) {
        scores[key] = value;
        sceneStore.updateRadarData(scores);
    }

    function randomize() {
        scores = {
            CE: Math.floor(Math.random() * 36) + 12,
            RO: Math.floor(Math.random() * 36) + 12,
            AC: Math.floor(Math.random() * 36) + 12,
            AE: Math.floor(Math.random() * 36) + 12
        };
        sceneStore.updateRadarData(scores);
    }

    onMount(() => {
        gsap.registerPlugin(ScrollTrigger);
        
        gsap.from(container.children, {
            scrollTrigger: {
                trigger: container,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1
        });
    });
</script>

<section class="results-demo" bind:this={container}>
    <div class="content">
        <h2 class="typo-headline">Interactive Results</h2>
        <p class="typo-body">Explore how different learning styles manifest in the 3D radar visualization.</p>
        
        <div class="controls">
            {#each Object.entries(scores) as [key, value]}
                <div class="control-group">
                    <label for={key} class="typo-label">{key}</label>
                    <input 
                        type="range" 
                        id={key} 
                        min="12" 
                        max="48" 
                        value={value} 
                        oninput={(e) => updateScore(key as any, parseInt(e.currentTarget.value))}
                    />
                    <span class="typo-data">{value}</span>
                </div>
            {/each}
        </div>

        <button class="btn-primary" onclick={randomize}>Randomize Profile</button>
    </div>
</section>

<style lang="scss">
    .results-demo {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: flex-start; /* Align to left to leave room for 3D */
        padding: 0 10%;
        position: relative;
        z-index: 10;
        pointer-events: none; /* Let clicks pass through to canvas if needed, but controls need pointer-events */

        .content {
            pointer-events: auto;
            background: rgba(10, 14, 20, 0.8);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            max-width: 500px;
        }

        h2 {
            color: var(--color-ice-surface);
            margin-bottom: 1rem;
        }

        p {
            color: var(--color-ice-highlight);
            opacity: 0.8;
            margin-bottom: 2rem;
        }

        .controls {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .control-group {
            display: flex;
            align-items: center;
            gap: 1rem;

            label {
                width: 30px;
                color: var(--color-neon-cyan);
                font-weight: bold;
            }

            input {
                flex: 1;
                accent-color: var(--color-neon-cyan);
            }

            span {
                width: 30px;
                text-align: right;
                color: var(--color-ice-surface);
            }
        }

        .btn-primary {
            background: transparent;
            border: 1px solid var(--color-neon-cyan);
            color: var(--color-neon-cyan);
            padding: 0.8rem 2rem;
            font-family: var(--font-mono);
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
                background: var(--color-neon-cyan);
                color: var(--color-bg-void);
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
            }
        }
    }
</style>
