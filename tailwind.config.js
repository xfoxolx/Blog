/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        surface: 'hsl(var(--surface))',
        'text-primary': 'hsl(var(--text))',
        muted: 'hsl(var(--muted))',
        stroke: 'hsl(var(--stroke))',
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        display: ['"Instrument Serif"', 'serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
