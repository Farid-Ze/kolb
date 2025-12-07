<script lang="ts">
    import { onMount } from 'svelte';
    import gsap from 'gsap';

    let line: HTMLElement;

    onMount(() => {
        gsap.to(line, {
            height: '0%',
            duration: 1.5,
            repeat: -1,
            ease: 'power2.inOut',
            yoyo: true
        });
    });
</script>

<div class="scroll-indicator absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 mix-blend-difference z-10 pointer-events-none">
    <span class="typo-hud text-[10px] uppercase tracking-widest text-white">Scroll to Explore</span>
    <div class="track w-[1px] h-12 bg-white/20 relative overflow-hidden">
        <div bind:this={line} class="fill w-full h-full bg-neon-cyan absolute top-0 left-0"></div>
    </div>
</div>
