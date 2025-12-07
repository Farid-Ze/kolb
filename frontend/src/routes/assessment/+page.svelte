<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import WebGLCanvas from '../../components/canvas/WebGLCanvas.svelte';
    import HUD from '../../components/ui/HUD.svelte';
    import Navigation from '../../components/ui/Navigation.svelte';
    import { assessmentStore } from '$lib/stores/assessment.svelte';
    import type { AssessmentItem } from '$lib/api/types';

    let rankings = $state<{ id: string; rank: number }[]>([]);
    let startTime = 0;

    onMount(async () => {
        await assessmentStore.startSession();
        startTime = Date.now();
    });

    function handleSelect(optionId: string) {
        if (rankings.find(r => r.id === optionId)) {
            // Deselect if already selected
            rankings = rankings.filter(r => r.id !== optionId);
        } else {
            // Add to rankings
            rankings = [...rankings, { id: optionId, rank: rankings.length + 1 }];
        }
    }

    function getRank(optionId: string) {
        const r = rankings.find(r => r.id === optionId);
        return r ? r.rank : null;
    }

    async function handleNext() {
        if (rankings.length !== 4) return;
        
        const responseTime = Date.now() - startTime;
        await assessmentStore.submitResponse(
            rankings.map(r => ({ option_id: r.id, rank: r.rank })),
            responseTime
        );
        
        rankings = [];
        startTime = Date.now();

        if (assessmentStore.canFinalize) {
            await assessmentStore.finalize();
        }
    }
</script>

<WebGLCanvas mode="ASSESSMENT" />
<Navigation />
<HUD />

<main class="assessment-page">
    {#if assessmentStore.isLoading && !assessmentStore.currentItem}
        <div class="loading typo-mono" in:fade>INITIALIZING ASSESSMENT PROTOCOL...</div>
    {:else if assessmentStore.scores}
        <div class="results-container" in:fade>
            <h1 class="typo-display text-white mb-4">ANALYSIS COMPLETE</h1>
            <div class="score-card">
                <div class="typo-label text-neon-cyan mb-2">PRIMARY STYLE</div>
                <div class="typo-headline text-white mb-8">{assessmentStore.scores.learning_style.primary_style}</div>
                
                <div class="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <div class="typo-hud text-gray-500">LFI SCORE</div>
                        <div class="typo-data text-xl">{assessmentStore.scores.lfi.score}</div>
                    </div>
                    <div>
                        <div class="typo-hud text-gray-500">FLEXIBILITY</div>
                        <div class="typo-data text-xl">{assessmentStore.scores.lfi.interpretation}</div>
                    </div>
                </div>

                <a href="/" class="btn-primary">RETURN TO HUB</a>
            </div>
        </div>
    {:else if assessmentStore.currentItem}
        <div class="question-container" in:fade={{ duration: 500 }}>
            <div class="progress-indicator typo-hud mb-8">
                ITEM {assessmentStore.currentIndex + 1} / {assessmentStore.items.length}
            </div>

            <h2 class="prompt typo-headline text-white mb-12">
                {assessmentStore.currentItem.prompt}
            </h2>

            <div class="options-grid">
                {#each assessmentStore.currentItem.options as option (option.id)}
                    <button 
                        class="option-card {getRank(option.id) ? 'selected' : ''}"
                        onclick={() => handleSelect(option.id)}
                        in:fly={{ y: 20, duration: 500, delay: 100 }}
                    >
                        <div class="rank-indicator typo-mono">
                            {getRank(option.id) ?? ''}
                        </div>
                        <span class="text typo-body">{option.text}</span>
                    </button>
                {/each}
            </div>

            <div class="actions mt-12">
                <button 
                    class="btn-next {rankings.length === 4 ? 'active' : ''}"
                    onclick={handleNext}
                    disabled={rankings.length !== 4}
                >
                    CONFIRM SELECTION
                </button>
            </div>
        </div>
    {/if}
</main>

<style lang="scss">
    .assessment-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        position: relative;
        z-index: 10;
    }

    .loading {
        color: var(--color-neon-cyan);
        letter-spacing: 0.2em;
    }

    .question-container {
        max-width: 800px;
        width: 100%;
        text-align: center;
    }

    .progress-indicator {
        color: var(--color-ice-surface);
        opacity: 0.5;
    }

    .options-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
        
        @media (min-width: 768px) {
            grid-template-columns: 1fr 1fr;
        }
    }

    .option-card {
        background: rgba(10, 14, 20, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1.5rem;
        text-align: left;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 1rem;
        backdrop-filter: blur(10px);

        &:hover {
            border-color: var(--color-ice-surface);
            background: rgba(26, 35, 50, 0.6);
        }

        &.selected {
            border-color: var(--color-neon-cyan);
            background: rgba(0, 212, 255, 0.1);
            
            .rank-indicator {
                background: var(--color-neon-cyan);
                color: var(--color-bg-void);
                border-color: var(--color-neon-cyan);
            }
        }
    }

    .rank-indicator {
        width: 30px;
        height: 30px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        color: var(--color-neon-cyan);
        flex-shrink: 0;
        transition: all 0.3s ease;
    }

    .text {
        color: var(--color-ice-highlight);
    }

    .btn-next {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.3);
        padding: 1rem 3rem;
        font-family: var(--font-mono);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        cursor: not-allowed;
        transition: all 0.3s ease;

        &.active {
            border-color: var(--color-neon-cyan);
            color: var(--color-neon-cyan);
            cursor: pointer;
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);

            &:hover {
                background: var(--color-neon-cyan);
                color: var(--color-bg-void);
                box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
            }
        }
    }

    .results-container {
        text-align: center;
        background: rgba(10, 14, 20, 0.8);
        padding: 3rem;
        border: 1px solid var(--color-neon-cyan);
        backdrop-filter: blur(20px);
        max-width: 600px;
    }

    .btn-primary {
        display: inline-block;
        background: var(--color-neon-cyan);
        color: var(--color-bg-void);
        padding: 1rem 2rem;
        font-family: var(--font-mono);
        text-transform: uppercase;
        text-decoration: none;
        font-weight: bold;
        margin-top: 2rem;
        
        &:hover {
            background: white;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }
    }
</style>
