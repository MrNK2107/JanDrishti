/**
 * WCAG 2.1 contrast audit for the JanDrishti light palette.
 *
 *   node tools/contrast.mjs              audit the shipped palette (exit 1 on failure)
 *   node tools/contrast.mjs --candidates audit the derivation palette
 *
 * Text tokens are derived by `tools/palette-light.mjs`. This script is the
 * regression guard: it measures every pairing the app actually renders and
 * fails the build if any drops below AA.
 *
 * Two deliberate exclusions, stated so they are not mistaken for oversights:
 *   - `hairline` and `border` are decorative and functional lines, not text.
 *     They are not required to meet a text ratio.
 *   - `ink-subtle` is used only for chart axes and de-emphasised micro-labels,
 *     never for content the reader must read to act. It is checked against the
 *     large-text threshold instead.
 */

const hex = (h) => {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255)
}
const channel = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const luminance = (h) => {
  const [r, g, b] = hex(h).map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Tokens exactly as declared in tailwind.config.cjs. Keep in sync. */
const T = {
  canvas: '#F7F5F2',
  paper: '#FFFFFF',
  sunken: '#F2EFEB',
  muted: '#E9E5E0',
  ink: '#1A1A1A',
  ink2: '#3D3D3D',
  inkMuted: '#5C5C5C',
  inkSubtle: '#8A8A8A',
  accent: '#1F5F55',
  accentSoft: '#E9F1EF',
  statusVerified: '#2A9D8F',
  statusFlagged: '#E84954',
  statusPending: '#F4A261',
  statusInfo: '#3B82F6',
  textVerified: '#20776D',
  textFlagged: '#C8323D',
  textPending: '#906039',
  textInfo: '#3069C7',
  softVerified: '#E5F3F2',
  softFlagged: '#FDEBED',
  softPending: '#FDEBDC',
  softInfo: '#E9F1FE',
}

const NORMAL = 4.5
const LARGE = 3.0
const GROUNDS = {
  paper: T.paper,
  canvas: T.canvas,
  sunken: T.sunken,
}

function buildRows() {
  const rows = []
  const grounds = Object.entries(GROUNDS)

  // Text tones on every ground.
  const texts = {
    ink: T.ink,
    'ink-2': T.ink2,
    'ink-muted': T.inkMuted,
    accent: T.accent,
    'status-text verified': T.textVerified,
    'status-text flagged': T.textFlagged,
    'status-text pending': T.textPending,
    'status-text info': T.textInfo,
  }
  for (const [name, fg] of Object.entries(texts)) {
    for (const [gname, bg] of grounds) {
      rows.push([fg, bg, `${name} on ${gname}`, NORMAL])
    }
  }

  // De-emphasised axis colour — large-text threshold by policy.
  for (const [gname, bg] of grounds) {
    rows.push([T.inkSubtle, bg, `ink-subtle on ${gname} (axes only)`, LARGE])
  }

  // Status text on its own soft background — this is the badge pairing.
  rows.push([T.textVerified, T.softVerified, 'verified text on verified soft', NORMAL])
  rows.push([T.textFlagged, T.softFlagged, 'flagged text on flagged soft', NORMAL])
  rows.push([T.textPending, T.softPending, 'pending text on pending soft', NORMAL])
  rows.push([T.textInfo, T.softInfo, 'info text on info soft', NORMAL])
  rows.push([T.accent, T.accentSoft, 'accent text on accent soft', NORMAL])

  // Dark text on solid fills. White-on-fill is deliberately NOT listed and must
  // not be reintroduced: it measures 2.06–4.17:1 across these four hues, all
  // below AA. Confirmed per-hue by `tools/solve-light.mjs`.
  const fills = {
    verified: T.statusVerified,
    flagged: T.statusFlagged,
    pending: T.statusPending,
    info: T.statusInfo,
  }
  for (const [name, fill] of Object.entries(fills)) {
    rows.push([T.ink, fill, `ink on ${name} fill`, NORMAL])
  }

  return rows
}

function buildCandidates() {
  return [
    [T.textVerified, T.paper, 'derived verified text on paper', NORMAL],
    [T.textFlagged, T.paper, 'derived flagged text on paper', NORMAL],
    [T.textPending, T.paper, 'derived pending text on paper', NORMAL],
    [T.textInfo, T.paper, 'derived info text on paper', NORMAL],
    [T.textVerified, T.canvas, 'derived verified text on canvas', NORMAL],
    [T.textFlagged, T.canvas, 'derived flagged text on canvas', NORMAL],
    [T.textPending, T.canvas, 'derived pending text on canvas', NORMAL],
    [T.textInfo, T.canvas, 'derived info text on canvas', NORMAL],
  ]
}

const mode = process.argv.includes('--candidates') ? 'candidates' : 'shipped'
const rows = mode === 'candidates' ? buildCandidates() : buildRows()

console.log(`\n=== JanDrishti palette — ${mode} (WCAG 2.1 AA) ===\n`)

let failures = 0
for (const [fg, bg, name, need] of rows) {
  const r = ratio(fg, bg)
  const ok = r >= need
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(6)}:1  needs ${need}  ${name}`)
}

console.log(
  `\n${rows.length - failures}/${rows.length} pairings pass` +
    (failures ? `  (${failures} FAILING)` : '') +
    '\n'
)

if (failures > 0) process.exitCode = 1
