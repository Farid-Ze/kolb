/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'bg-void': 'var(--color-bg-void)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'neural-deep': 'var(--color-neural-deep)',
        'ice-surface': 'var(--color-ice-surface)',
        'ice-highlight': 'var(--color-ice-highlight)',
        'neon-cyan': 'var(--color-neon-cyan)',
        'neon-magenta': 'var(--color-neon-magenta)',
        'neon-gold': 'var(--color-neon-gold)',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
