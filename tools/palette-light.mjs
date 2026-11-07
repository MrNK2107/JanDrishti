/**
 * Palette solver for the light theme.
 *
 * Given a set of candidate grounds and a set of wanted hues, find the darkest
 * variant of each hue that clears WCAG AA as text on every ground. Both the
 * text and fill tones for the status colours are derived here rather than
 * chosen by eye, because guessing gets luminance moving the wrong way — a
 * mistake already made once in this project.
 *
 * Run: node tools/palette-light.mjs
 */

const hexOf = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()

const parse = (h) => {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16))
}
const channel = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const lum = (h) => {
  const [r, g, b] = parse(h).map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
const mix = (a, b, t) =>
  hexOf(parse(a).map((v, i) => v + (parse(b)[i] - v) * t))

/** Candidate grounds actually used by the light theme. */
const GROUNDS = {
  white: '#FFFFFF',
  canvas: '#F6F8FA',
  sunken: '#EDF1F5',
}
const TEXT_GROUNDS = Object.values(GROUNDS)
const REQUIRED = 4.5

const HUE_CANDIDATES = [
  { name: 'status-green  (verified)', seed: '#2A9D8F' },
  { name: 'status-red    (flagged)', seed: '#E63946' },
  { name: 'status-amber  (pending)', seed: '#F4A261' },
  { name: 'info-blue', seed: '#3B82F6' },
]

console.log('\n=== TEXT tones: darkest mix toward black that clears AA on every ground ===\n')

const solved = {}
for (const { name, seed } of HUE_CANDIDATES) {
  let found = null
  for (let t = 0; t <= 0.75; t += 0.01) {
    const c = mix(seed, '#000000', t)
    const worst = Math.min(...TEXT_GROUNDS.map((g) => ratio(c, g)))
    if (worst >= REQUIRED) {
      found = { color: c, t, worst }
      break
    }
  }
  solved[name] = found?.color
  if (found) {
    console.log(
      `${name.padEnd(26)} ${found.color}   mix ${(found.t * 100).toFixed(0)}% toward black   worst ${found.worst.toFixed(2)}:1`
    )
  } else {
    console.log(`${name.padEnd(26)} NO SOLUTION within 75% darkening`)
  }
}

console.log('\n=== FILL tones: brand hues checked against white text, and as chart areas ===\n')
for (const { name, seed } of HUE_CANDIDATES) {
  const onWhite = ratio('#FFFFFF', seed)
  const onInk = ratio('#111827', seed)
  console.log(
    `${name.padEnd(26)} ${seed}   white text ${onWhite.toFixed(2)}:1   ink text ${onInk.toFixed(2)}:1`
  )
}

console.log('\n=== Ink / neutral scale, against all grounds ===\n')
const INK = {
  ink: '#0F172A',
  'ink-secondary': '#334155',
  'ink-muted': '#5A6B7F',
  'ink-subtle': '#7C8CA0',
  hairline: '#DCE3EA',
  border: '#CBD5E1',
}
for (const [name, color] of Object.entries(INK)) {
  const worst = Math.min(...TEXT_GROUNDS.map((g) => ratio(color, g)))
  const label = name.includes('hairline') || name.includes('border') ? 'large/3.0' : 'text/4.5'
  const need = label.startsWith('large') ? 3 : 4.5
  console.log(
    `${name.padEnd(26)} ${color}   worst ${worst.toFixed(2)}:1   needs ${need}   ${worst >= need ? 'OK' : 'FAIL'}`
  )
}
console.log()
