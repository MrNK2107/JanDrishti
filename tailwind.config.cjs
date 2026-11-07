/**
 * JanDrishti design tokens.
 *
 * Two rules govern this palette, and they are the reason it is split the way
 * it is:
 *
 *   1. A brand color used as a FILL and the same color used as TEXT have
 *      different contrast requirements. `verified` on `midnight-900` is a text
 *      pairing; porcelain text on a `verified` fill is a fill pairing. Serving
 *      both from one hex value is what produced the original 1.75:1 defect.
 *
 *   2. Every pairing that carries text must clear WCAG AA — 4.5:1 for normal
 *      text, 3:1 for large text. `tools/contrast.mjs` enforces this and exits
 *      non-zero on regression. Run it after changing anything here.
 *
 * The `-text` variants are the brand hues mixed 10% toward white: the minimum
 * shift that clears AA on both `midnight-900` and `midnight-800`. They were
 * derived by `tools/pick-palette.mjs`, not chosen by eye.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark ground. Panels step lighter as they come forward.
        midnight: {
          950: '#07111C', // deepest — text that sits ON colored fills
          900: '#0A1929', // app ground
          800: '#0F1E2F', // panels
          700: '#1A2B3D', // borders, dividers
        },

        // Foreground text on dark ground.
        porcelain: {
          100: '#E8EDF2', // primary text   — 15.06:1 on midnight-900
          200: '#748A9D', // muted text     —  4.95:1 on midnight-900
          300: '#B4C4D2', // secondary text — between the two
        },

        // Status fills. Safe for large solids and status dots.
        status: {
          verified: '#2A9D8F',
          flagged: '#E63946',
          pending: '#F4A261',
        },

        // Status TEXT on dark ground — AA-verified variants.
        'status-text': {
          verified: '#3FA79A', // 6.09:1 on midnight-900
          flagged: '#E94D59', // 4.79:1 on midnight-900
          pending: '#F5AB71', // 9.25:1 on midnight-900
        },

        // Status TINTS for badge/pill backgrounds — dark text over these.
        'status-tint': {
          verified: 'rgba(42, 157, 143, 0.16)',
          flagged: 'rgba(230, 57, 70, 0.16)',
          pending: 'rgba(244, 162, 97, 0.16)',
        },
      },

      // Legacy aliases. The dashboard referenced `bg-verified` / `text-flagged`
      // before the palette was split. These keep those class names resolvable
      // while the components migrate to explicit `status` / `status-text`
      // roles. Do not add new uses.
      backgroundColor: {
        verified: '#2A9D8F',
        flagged: '#E63946',
        pending: '#F4A261',
      },

      borderWidth: {
        3: '3px',
      },

      fontFamily: {
        sans: [
          'Inter',
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'monospace'],
      },

      // Transit-diagram motion. Kept short: this is a government tool, not a
      // showcase. Motion communicates state change, nothing else.
      keyframes: {
        'flag-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'draw-in': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        'rise': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'flag-pulse': 'flag-pulse 2.4s ease-in-out infinite',
        'draw-in': 'draw-in 600ms ease-out both',
        rise: 'rise 240ms ease-out both',
      },

      transitionDuration: {
        240: '240ms',
      },
    },
  },
  plugins: [],
}
