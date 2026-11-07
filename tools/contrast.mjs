// WCAG 2.1 relative-luminance contrast check against the REAL tokens in
// tailwind.config.cjs. Usage: node tools/contrast.mjs
//
// Supports both `npm run contrast` and direct invocation with overrides:
//   node tools/contrast.mjs                 -> audit shipped palette
//   node tools/contrast.mjs --candidates    -> audit proposed fix palette

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

// --- tokens exactly as declared in tailwind.config.cjs ---
const T = {
  midnight950: '#07111C',
  midnight900: '#0A1929',
  midnight800: '#0F1E2F',
  midnight700: '#1A2B3D',
  porcelain100: '#E8EDF2',
  porcelain200: '#748A9D',
  verified: '#2A9D8F',
  flagged: '#E63946',
  pending: '#F4A261',
}

// --- proposed fixes: brand hues preserved for fills, darkened for text use ---
const C = {
  verifiedText: '#3FBFAE', // brighter green for text on dark
  flaggedText: '#FF6B75', // brighter red for text on dark
  pendingText: '#F4A261', // already passes on dark
  verifiedFill: '#2A9D8F',
  flaggedFill: '#C42A36', // darkened red so dark text sits on it
  pendingFill: '#F4A261',
  onFillText: '#07111C',
}

const normal = 4.5
const large = 3.0

const rows = (t) => [
  // colored TEXT on dark surfaces
  [t.verified, t.midnight900, 'verified text on midnight-900', normal],
  [t.flagged, t.midnight900, 'flagged text on midnight-900', normal],
  [t.pending, t.midnight900, 'pending text on midnight-900', normal],
  [t.verified, t.midnight800, 'verified text on midnight-800', normal],
  [t.flagged, t.midnight800, 'flagged text on midnight-800', normal],
  [t.pending, t.midnight800, 'pending text on midnight-800', normal],
  // body text on dark surfaces
  [t.porcelain100, t.midnight900, 'porcelain-100 on midnight-900', normal],
  [t.porcelain100, t.midnight800, 'porcelain-100 on midnight-800', normal],
  [t.porcelain200, t.midnight900, 'porcelain-200 on midnight-900', normal],
  [t.porcelain200, t.midnight800, 'porcelain-200 on midnight-800', normal],
  [t.porcelain200, t.midnight950, 'porcelain-200 on midnight-950', normal],
  // text sitting ON colored fills (the badges)
  [t.porcelain100, t.verified, 'porcelain-100 on verified fill', normal],
  [t.porcelain100, t.flagged, 'porcelain-100 on flagged fill', normal],
  [t.porcelain100, t.pending, 'porcelain-100 on pending fill', normal],
  [t.midnight950, t.verified, 'midnight-950 on verified fill', normal],
  [t.midnight950, t.flagged, 'midnight-950 on flagged fill', normal],
  [t.midnight950, t.pending, 'midnight-950 on pending fill', normal],
]

const mode = process.argv.includes('--candidates') ? 'candidates' : 'shipped'

if (mode === 'candidates') {
  const t = {
    ...T,
    verified: C.verifiedText,
    flagged: C.flaggedText,
    pending: C.pendingText,
  }
  const cand = [
    [t.verified, t.midnight900, 'FIX verified text on midnight-900', normal],
    [t.flagged, t.midnight900, 'FIX flagged text on midnight-900', normal],
    [t.pending, t.midnight900, 'FIX pending text on midnight-900', normal],
    [t.verified, t.midnight800, 'FIX verified text on midnight-800', normal],
    [t.flagged, t.midnight800, 'FIX flagged text on midnight-800', normal],
    [t.pending, t.midnight800, 'FIX pending text on midnight-800', normal],
    [C.onFillText, C.verifiedFill, 'FIX midnight text on verified fill', normal],
    [C.onFillText, C.flaggedFill, 'FIX midnight text on flagged fill', normal],
    [C.onFillText, C.pendingFill, 'FIX midnight text on pending fill', normal],
    [t.porcelain100, t.midnight900, 'body porcelain-100 on midnight-900', normal],
    [t.porcelain200, t.midnight900, 'muted porcelain-200 on midnight-900', normal],
  ]
  report(cand, mode)
} else {
  report(rows(T), mode)
}

function report(list, label) {
  console.log(`\n=== ${label} palette ===\n`)
  let fail = 0
  for (const [fg, bg, name, req] of list) {
    const r = ratio(fg, bg)
    const ok = r >= req
    if (!ok) fail++
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  needs ${req}  ${name}`
    )
  }
  console.log(`\n${fail} failing of ${list.length}\n`)
  if (label === 'shipped' && fail > 0) process.exitCode = 1
}
