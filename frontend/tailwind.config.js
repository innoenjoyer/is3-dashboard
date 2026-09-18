/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens are single-source: defined as CSS custom properties in
        // src/index.css (BRIEF §3), referenced here by role only.
        'page-plane': 'var(--page-plane)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        gridline: 'var(--gridline)',
        baseline: 'var(--baseline)',
        border: 'var(--border)',
        'status-good': 'var(--status-good)',
        'status-warning': 'var(--status-warning)',
        'status-serious': 'var(--status-serious)',
        'status-critical': 'var(--status-critical)',
        'status-offline': 'var(--status-offline)',
        'series-1': 'var(--series-1)',
        'series-2': 'var(--series-2)',
        'series-3': 'var(--series-3)',
        'series-4': 'var(--series-4)',
      },
      fontFamily: {
        // BRIEF §3 typography roles.
        display: ['"IBM Plex Sans Condensed"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        data: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
