/**
 * JanDrishti design tokens — light theme.
 *
 * Ground: white paper on a faintly cool canvas. This is a transparency record
 * meant to be read and printed, so it follows the conventions of official
 * documents rather than those of a dashboard: high-contrast dark text on light
 * ground, restrained colour, and nothing that only works on a screen.
 *
 * Three rules govern this palette:
 *
 *   1. A colour's FILL role and its TEXT role are separate tokens. Serving both
 *      from one hex value is what produced the original 1.75:1 failure.
 *   2. Text tokens are derived by `tools/palette-light.mjs`, which searches for
 *      the darkest variant clearing AA on every ground actually used. Do not
 *      hand-edit them.
 *   3. Status is never carried by colour alone. Every status surface also has a
 *      label and a glyph.
 *
 * `npm run contrast` verifies every pairing; it exits non-zero on regression.
 */

/**
 * JanDrishti design tokens — light theme.
 *
 * A warm off-white document surface. This is a public transparency record, so it
 * follows the conventions of official documents rather than those of a
 * dashboard: high-contrast ink on paper, restrained colour, nothing that only
 * works on a screen.
 *
 * Three rules govern this palette:
 *
 *   1. A colour's FILL role and its TEXT role are separate tokens. Serving both
 *      from one hex value produced the original 1.75:1 failure.
 *   2. Text tokens are derived by `tools/palette-light.mjs`, which searches for
 *      the darkest variant clearing AA on every ground actually used. Do not
 *      hand-edit them.
 *   3. Status is never carried by colour alone. Every status surface also has a
 *      label and a glyph.
 *
 * `npm run contrast` verifies every pairing and exits non-zero on regression.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Grounds ---
        // A warm off-white rather than a cool grey. The app is a document
        // surface; warm neutrals read as paper and give the ink something to sit
        // against, where a cool grey reads as a form control.
        canvas: '#F7F5F2', // app background
        paper: '#FFFFFF', // cards and panels
        sunken: '#F2EFEB', // inset areas, chart tracks, table stripes
        muted: '#E9E5E0', // deeper inset, disabled fills

        // --- Text ---
        ink: '#1A1A1A', // primary           17.4:1 on paper
        'ink-2': '#3D3D3D', // secondary         10.9:1
        'ink-muted': '#5C5C5C', // captions           6.7:1
        'ink-subtle': '#8A8A8A', // fills and chart rules only — 3.45:1, never body copy

        // --- Lines ---
        hairline: '#E5E0DA', // decorative separators
        border: '#CFC9C2', // functional component borders

        // --- Brand ---
        accent: '#1F5F55', // deep teal, for links and primary emphasis  7.4:1 on paper
        'accent-soft': '#E9F1EF',

        // --- Status ---
        //
        // `status-*` are the brand hues, used as fills and marks. They carry
        // DARK text only: white on these measures 2.06–4.17:1, below AA.
        //
        // `status-text-*` are the same hues mixed toward black until they clear
        // AA on the *darkest* ground in use (sunken), because a status colour is
        // applied on paper, canvas and sunken interchangeably. Derived by
        // `tools/solve-warm.mjs` — do not hand-edit.
        status: {
          verified: '#2A9D8F', // ink 5.24:1
          flagged: '#E84954', // ink 4.57:1 — lightened 3%; the brand red was 4.40:1
          pending: '#F4A261', // ink 8.44:1
          info: '#3B82F6', // ink 4.73:1
        },
        'status-text': {
          verified: '#20776D', // 24% to black — 4.67:1 on sunken
          flagged: '#C8323D', // 13% to black — 4.60:1
          pending: '#906039', // 41% to black — 4.68:1
          info: '#3069C7', // 19% to black — 4.61:1
        },
        // Soft status backgrounds. Solid hex, not rgba: a translucent tint
        // resolves to different effective colours over different grounds, which
        // makes its contrast unmeasurable and therefore unverifiable.
        'status-soft': {
          verified: '#E5F3F2',
          flagged: '#FDEBED',
          pending: '#FDEBDC',
          info: '#E9F1FE',
        },
      },

      borderWidth: { 3: '3px' },

      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Charter', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'monospace'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '19px' }],
        base: ['14px', { lineHeight: '21px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['26px', { lineHeight: '32px' }],
        '3xl': ['34px', { lineHeight: '40px' }],
        '4xl': ['42px', { lineHeight: '48px' }],
        '5xl': ['54px', { lineHeight: '58px' }],
      },

      // Layered, low-opacity shadows. A single hard shadow reads as a UI kit;
      // two soft ones read as depth.
      boxShadow: {
        card: '0 1px 2px rgba(26, 26, 26, 0.04), 0 1px 3px rgba(26, 26, 26, 0.05)',
        raised: '0 4px 6px -1px rgba(26, 26, 26, 0.07), 0 10px 24px -4px rgba(26, 26, 26, 0.10)',
        overlay: '0 24px 48px -12px rgba(26, 26, 26, 0.25)',
      },

      keyframes: {
        'bar-grow': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'bar-grow': 'bar-grow 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
        rise: 'rise 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 260ms ease-out both',
        'slide-down': 'slide-down 180ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.4s infinite',
      },

      transitionDuration: { 240: '240ms' },
    },
  },
  plugins: [],
}
