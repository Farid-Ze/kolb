<script lang="ts">
    import { page } from '$app/stores';
    
    let isMuted = $state(false);
    
    function toggleSound() {
        isMuted = !isMuted;
        // TODO: Connect to global audio manager
    }
</script>

<header class="header fixed top-0 left-0 w-full p-10 z-50 flex justify-between items-start pointer-events-none mix-blend-difference">
    <!-- LEFT: BRAND -->
    <div class="header__brand flex flex-col gap-1 pointer-events-auto">
        <span class="typo-label text-[11px] tracking-[0.1em] text-white/70 uppercase">ZENOTIKA</span>
        <span class="typo-label text-[11px] tracking-[0.1em] text-white/70 uppercase hidden md:block">× UNIKOM</span>
    </div>

    <!-- RIGHT: CONTROLS -->
    <div class="header__controls flex items-center gap-6 pointer-events-auto">
        <!-- Sound Toggle -->
        <button class="header__sound flex items-center gap-2 cursor-pointer group bg-transparent border-none p-0" onclick={toggleSound}>
            <div class="header__sound-wave flex items-end gap-[2px] h-3" class:muted={isMuted}>
                <div class="bar w-[2px] bg-white/80 rounded-[1px]"></div>
                <div class="bar w-[2px] bg-white/80 rounded-[1px]"></div>
                <div class="bar w-[2px] bg-white/80 rounded-[1px]"></div>
                <div class="bar w-[2px] bg-white/80 rounded-[1px]"></div>
            </div>
            <span class="header__sound-label typo-label text-[11px] tracking-[0.15em] text-white/70 uppercase hidden md:block group-hover:text-white transition-colors">
                SOUND
            </span>
        </button>

        <!-- Hamburger -->
        <button class="header__hamburger flex items-center gap-[6px] cursor-pointer bg-transparent border-none p-0 group" aria-label="Menu">
            <div class="dot w-1 h-1 rounded-full bg-white/70 group-hover:bg-white transition-colors"></div>
            <div class="dot w-1 h-1 rounded-full bg-white/70 group-hover:bg-white transition-colors"></div>
            <div class="dot w-1 h-1 rounded-full bg-white/70 group-hover:bg-white transition-colors"></div>
        </button>
    </div>
</header>

<style lang="scss">
    .header__sound-wave {
        .bar {
            animation: wave-bar 0.5s ease-in-out infinite;
            &:nth-child(1) { animation-delay: 0s; }
            &:nth-child(2) { animation-delay: 0.1s; }
            &:nth-child(3) { animation-delay: 0.2s; }
            &:nth-child(4) { animation-delay: 0.3s; }
        }

        &.muted .bar {
            animation: none;
            height: 3px;
        }
    }

    @keyframes wave-bar {
        0%, 100% { height: 4px; }
        50% { height: 12px; }
    }
</style>
