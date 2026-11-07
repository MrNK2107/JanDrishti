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

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Grounds ---
        canvas: '#F6F8FA', // app background
        paper: '#FFFFFF', // cards and panels
        sunken: '#EDF1F5', // inset areas, table stripes, chart tracks

        // --- Text ---
        ink: '#0F172A', // primary           15.7:1 on paper
        'ink-2': '#334155', // secondary          9.1:1
        'ink-muted': '#5A6B7F', // muted / captions   4.8:1
        'ink-subtle': '#7C8CA0', // axis + decorative only, 3.0:1 — never body copy

        // --- Lines ---
        hairline: '#E4E9EF', // decorative separators
        border: '#CBD5E1', // functional component borders

        // --- Status: fills carry DARK text only; text tones are AA on paper ---
        //
        // Why dark text only: white on these fills measures 2.06:1 (pending),
        // 3.32:1 (verified), 4.17:1 (flagged), 3.68:1 (info) — all below AA.
        // Light text on a mid-luminance fill is the exact defect that produced
        // the original 1.75:1 failure. `tools/solve-light.mjs` proves the point
        // for each hue rather than assuming it.
        status: {
          verified: '#2A9D8F', // ink 5.37:1
          flagged: '#E7434F', // ink 4.52:1 — lightened 5%; the brand red is 4.28:1
          pending: '#F4A261', // ink 8.66:1
          info: '#3B82F6', // ink 4.85:1
        },
        'status-text': {
          verified: '#217A70', // 22% toward black — 4.53:1 worst case
          flagged: '#CA323E', // 12% toward black — 4.58:1
          pending: '#92613A', // 40% toward black — 4.63:1
          info: '#306BCA', // 18% toward black — 4.53:1
        },
        // Soft status backgrounds for badges, rows, and callouts. Solid hex, not
        // rgba: a translucent tint resolves to different effective colours over
        // different grounds, which makes the contrast unmeasurable.
        'status-soft': {
          verified: '#E5F3F2', // 4.52:1 with status-text-verified
          flagged: '#FDEBED', // 4.53:1
          pending: '#FDEBDC', // 4.53:1
          info: '#E9F1FE', // 4.53:1
        },
      },

      borderWidth: { 3: '3px' },

      fontFamily: {
        // Inter for the interface; a serif for document headings, so the record
        // reads like something issued rather than something computed.
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Charter', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'monospace'],
      },

      fontSize: {
        // A tighter, more document-like scale than Tailwind's default display sizes.
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '19px' }],
        base: ['14px', { lineHeight: '21px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['26px', { lineHeight: '32px' }],
        '3xl': ['34px', { lineHeight: '38px' }],
        '4xl': ['44px', { lineHeight: '46px' }],
      },

      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        raised: '0 2px 4px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.08)',
      },

      keyframes: {
        // Chart bars grow on mount so the reader's eye is drawn to magnitude.
        'bar-grow': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(3px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'bar-grow': 'bar-grow 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
        rise: 'rise 220ms ease-out both',
        'fade-in': 'fade-in 300ms ease-out both',
      },

      transitionDuration: { 240: '240ms' },
    },
  },
  plugins: [],
}
