---
name: svelte-patterns
description: |
  Svelte 5 patterns for Zenotika components.
  Covers runes, lifecycle, WebGL integration.
  Use when building Svelte components.
---

# Svelte 5 Patterns

## Runes Quick Reference

```svelte
<script lang="ts">
  // Reactive state
  let count = $state(0);
  let user = $state<User | null>(null);
  let items = $state<string[]>([]);
  
  // Derived values (computed)
  const doubled = $derived(count * 2);
  const isLoggedIn = $derived(user !== null);
  const itemCount = $derived(items.length);
  
  // Effects (side effects)
  $effect(() => {
    console.log('Count is now:', count);
    
    // Return cleanup function
    return () => {
      console.log('Cleaning up');
    };
  });
  
  // Pre-effect (runs before DOM updates)
  $effect.pre(() => {
    // Measure DOM before update
  });
  
  // Props
  let { 
    title,
    count = 0,
    onAction 
  }: {
    title: string;
    count?: number;
    onAction?: (value: number) => void;
  } = $props();
</script>
```

## WebGL Canvas Component

```svelte
<!-- WebGLComponent.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  
  // Canvas reference
  let canvas: HTMLCanvasElement | null = $state(null);
  
  // Loading state
  let isLoading = $state(true);
  let loadProgress = $state(0);
  let error = $state<string | null>(null);
  
  // Three.js instances (not reactive)
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let animationId: number;
  
  onMount(() => {
    if (!canvas) return;
    
    try {
      initThree();
      animate();
      isLoading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      isLoading = false;
    }
  });
  
  onDestroy(() => {
    cancelAnimationFrame(animationId);
    renderer?.dispose();
  });
  
  function initThree() {
    renderer = new THREE.WebGLRenderer({ canvas: canvas! });
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
    // ... setup
  }
  
  function animate() {
    animationId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
</script>

<canvas bind:this={canvas}></canvas>

{#if isLoading}
  <div class="loading">Loading {loadProgress}%</div>
{/if}

{#if error}
  <div class="error">{error}</div>
{/if}
```

## Store Pattern with Runes

```typescript
// stores/counter.svelte.ts

class CounterStore {
  count = $state(0);
  
  // Derived
  get doubled() {
    return this.count * 2;
  }
  
  // Actions
  increment() {
    this.count++;
  }
  
  decrement() {
    this.count--;
  }
  
  reset() {
    this.count = 0;
  }
}

export const counterStore = new CounterStore();
```

```svelte
<!-- Usage -->
<script lang="ts">
  import { counterStore } from '$lib/stores/counter.svelte';
</script>

<p>Count: {counterStore.count}</p>
<p>Doubled: {counterStore.doubled}</p>
<button onclick={() => counterStore.increment()}>+</button>
```

## Event Handling

```svelte
<script lang="ts">
  function handleClick(event: MouseEvent) {
    console.log('Clicked at:', event.clientX, event.clientY);
  }
  
  function handleCustomEvent(event: CustomEvent<{ value: number }>) {
    console.log('Value:', event.detail.value);
  }
</script>

<!-- Standard events -->
<button onclick={handleClick}>Click</button>
<button onclick={(e) => handleClick(e)}>Click</button>

<!-- Custom events -->
<svelte:window on:scrollVelocity={handleCustomEvent} />

<!-- Modifiers -->
<button onclick|preventDefault={handleClick}>Submit</button>
<div onkeydown|stopPropagation={handleKey}>...</div>
```

## Conditional Rendering

```svelte
{#if isLoading}
  <LoadingSpinner />
{:else if error}
  <ErrorMessage message={error} />
{:else}
  <Content data={data} />
{/if}

{#each items as item, index (item.id)}
  <Item {item} {index} />
{:else}
  <EmptyState />
{/each}

{#await loadData()}
  <Loading />
{:then data}
  <DataView {data} />
{:catch error}
  <Error {error} />
{/await}
```

## Bindings

```svelte
<!-- Two-way binding -->
<input bind:value={name} />
<input type="checkbox" bind:checked={isActive} />
<select bind:value={selected}>...</select>
<textarea bind:value={content}></textarea>

<!-- Element reference -->
<canvas bind:this={canvasElement}></canvas>
<div bind:clientWidth={width} bind:clientHeight={height}></div>

<!-- Component binding -->
<MyComponent bind:value={componentValue} />
```

## Slots

```svelte
<!-- Parent.svelte -->
<Card>
  <h2 slot="header">Title</h2>
  <p>Default slot content</p>
  <button slot="footer">Action</button>
</Card>

<!-- Card.svelte -->
<div class="card">
  <header>
    <slot name="header">Default Header</slot>
  </header>
  <main>
    <slot>Default Content</slot>
  </main>
  <footer>
    <slot name="footer" />
  </footer>
</div>
```

## Transitions

```svelte
<script>
  import { fade, fly, slide, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
</script>

{#if visible}
  <div transition:fade={{ duration: 300 }}>Fade</div>
  <div in:fly={{ y: 50 }} out:fade>Fly in, fade out</div>
  <div transition:slide={{ easing: cubicOut }}>Slide</div>
{/if}
```

## CSS Scoping

```svelte
<style lang="scss">
  /* Scoped to component */
  .container {
    color: var(--color-text-primary);
  }
  
  /* Global */
  :global(.global-class) {
    // ... 
  }
  
  /* Target child components */
  .container :global(.child-class) {
    // ...
  }
</style>
```
