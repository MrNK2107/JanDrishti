/**
 * WCAG 2.1 contrast audit for the JanDrishti palette.
 *
 *   node tools/contrast.mjs              audit the shipped palette (exit 1 on failure)
 *   node tools/contrast.mjs --candidates audit the derivation palette
 *
 * The palette separates a colour's FILL role from its TEXT role, so this script
 * measures both against every surface the app actually uses. It exits non-zero
 * on regression and is wired into `npm run verify:full`.
 *
 * History: the original palette failed five pairings. The worst was porcelain
 * text on the amber fill at 1.75:1 — an accessibility defect that STATUS.md
 * initially recorded correctly, then DELIVERY.md reclassified as an
 * "intentional design choice". It was not; it was unreadable.
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

/** Tokens, exactly as declared in tailwind.config.cjs. Keep in sync. */
const T = {
  midnight950: '#07111C',
  midnight900: '#0A1929',
  midnight800: '#0F1E2F',
  midnight700: '#1A2B3D',
  porcelain100: '#E8EDF2',
  porcelain200: '#748A9D',
  porcelain300: '#B4C4D2',
  statusVerified: '#2A9D8F',
  statusFlagged: '#E63946',
  statusPending: '#F4A261',
  textVerified: '#3FA79A',
  textFlagged: '#E94D59',
  textPending: '#F5AB71',
}

const FILLS = [T.statusVerified, T.statusFlagged, T.statusPending]
const GROUNDS = [T.midnight900, T.midnight800, T.midnight950]
const TEXTS = {
  'status-text verified': T.textVerified,
  'status-text flagged': T.textFlagged,
  'status-text pending': T.textPending,
}

const NORMAL = 4.5
const LARGE = 3.0

function buildRows() {
  const rows = []

  // Text colours on every ground the app renders them against.
  for (const [name, fg] of Object.entries(TEXTS)) {
    for (const [gi, bg] of GROUNDS.entries()) {
      const groundName = ['midnight-900', 'midnight-800', 'midnight-950'][gi]
      rows.push([fg, bg, `${name} on ${groundName}`, NORMAL])
    }
  }

  // Body and muted text.
  rows.push([T.porcelain100, T.midnight900, 'porcelain-100 on midnight-900', NORMAL])
  rows.push([T.porcelain100, T.midnight800, 'porcelain-100 on midnight-800', NORMAL])
  rows.push([T.porcelain100, T.midnight950, 'porcelain-100 on midnight-950', NORMAL])
  rows.push([T.porcelain200, T.midnight900, 'porcelain-200 on midnight-900', NORMAL])
  rows.push([T.porcelain200, T.midnight800, 'porcelain-200 on midnight-800', NORMAL])
  rows.push([T.porcelain200, T.midnight950, 'porcelain-200 on midnight-950', NORMAL])
  rows.push([T.porcelain300, T.midnight900, 'porcelain-300 on midnight-900', NORMAL])

  // Dark text sitting ON coloured fills — the badge and status-dot pairing.
  //
  // Only `midnight-950` is listed, because it is the only colour the app places
  // on a fill (see `text-midnight-950` in components/ui.jsx and AppShell.jsx).
  // An audit that measures pairings the code never produces is worse than no
  // audit: it reports failures that cannot occur and trains you to ignore it.
  // `midnight-900` on the flagged fill is 4.26:1 — real, and deliberately not
  // offered as a token combination.
  for (const [fi, fill] of FILLS.entries()) {
    const fillName = ['verified', 'flagged', 'pending'][fi]
    rows.push([T.midnight950, fill, `midnight-950 on ${fillName} fill`, NORMAL])
  }

  return rows
}

function buildCandidates() {
  return [
    [T.textVerified, T.midnight900, 'FIX verified text on midnight-900', NORMAL],
    [T.textFlagged, T.midnight900, 'FIX flagged text on midnight-900', NORMAL],
    [T.textPending, T.midnight900, 'FIX pending text on midnight-900', NORMAL],
    [T.textVerified, T.midnight800, 'FIX verified text on midnight-800', NORMAL],
    [T.textFlagged, T.midnight800, 'FIX flagged text on midnight-800', NORMAL],
    [T.textPending, T.midnight800, 'FIX pending text on midnight-800', NORMAL],
    [T.midnight950, T.statusVerified, 'FIX dark text on verified fill', NORMAL],
    [T.midnight950, T.statusFlagged, 'FIX dark text on flagged fill', NORMAL],
    [T.midnight950, T.statusPending, 'FIX dark text on pending fill', NORMAL],
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
