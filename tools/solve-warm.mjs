/**
 * Solvers for the warm light theme.
 *
 * Two problems to fix, both caused by choosing a warm neutral ground:
 *
 *   1. The sunken ground needed to be light enough that every status text tone
 *      still clears AA on it. Tint something too dark and the text tones that
 *      passed on white quietly fail.
 *   2. The ink is now near-black, which reduced the headroom on the flagged fill
 *      (4.40:1). The fill must move, not the ink.
 *
 * Run: node tools/solve-warm.mjs
 */

const parse = (h) => {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16))
}
const hexOf = (a) =>
  '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()
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
const mix = (a, b, t) => hexOf(parse(a).map((v, i) => v + (parse(b)[i] - v) * t))

const INK = '#1A1A1A'
const PAPER = '#FFFFFF'
const CANVAS = '#F7F5F2'
const CANDIDATE_SUNKEN = '#F2EFEB'
const NEED = 4.5

const STATUS_TEXT = {
  verified: '#217A70',
  flagged: '#CA323E',
  pending: '#92613A',
  info: '#306BCA',
}

console.log('\n=== 1. Every text tone on paper / canvas / candidate sunken ===\n')
const grounds = { paper: PAPER, canvas: CANVAS, sunken: CANDIDATE_SUNKEN }
let worst = Infinity
for (const [name, fg] of Object.entries({ ink: INK, 'ink-2': '#3D3D3D', 'ink-muted': '#5C5C5C', ...STATUS_TEXT })) {
  const rs = Object.entries(grounds).map(([g, bg]) => [g, ratio(fg, bg)])
  const min = Math.min(...rs.map(([, r]) => r))
  worst = Math.min(worst, min)
  console.log(
    `${name.padEnd(10)} ${fg}  ` +
      rs.map(([g, r]) => `${g} ${r.toFixed(2)}`).join('   ') +
      `   ${min >= NEED ? 'OK' : 'FAIL'}`
  )
}
console.log(`\nworst text pairing on sunken-ground set: ${worst.toFixed(2)}:1`)

console.log('\n=== 2. ink-subtle on the three grounds (3.0 threshold, fills only) ===\n')
for (const [g, bg] of Object.entries(grounds)) {
  console.log(`ink-subtle #8A8A8A on ${g.padEnd(7)} ${ratio('#8A8A8A', bg).toFixed(2)}:1`)
}

console.log('\n=== 1b. Derive the status text tones for the warm grounds ===\n')
// Find the lightest variant of each brand hue that clears AA on the *darkest*
// ground in use (sunken). Lightest-variant matters: over-darkening makes the
// status colours indistinguishable from plain ink.
const SUNKEN = CANDIDATE_SUNKEN
for (const [name, seed] of Object.entries({
  verified: '#2A9D8F',
  flagged: '#E63946',
  pending: '#F4A261',
  info: '#3B82F6',
})) {
  let found = null
  for (let t = 0; t <= 0.6; t += 0.01) {
    const c = mix(seed, '#000000', t)
    if (ratio(c, SUNKEN) >= 4.6) {
      found = { c, t, r: ratio(c, SUNKEN) }
      break
    }
  }
  console.log(
    found
      ? `${name.padEnd(9)} ${found.c}  mix ${(found.t * 100).toFixed(0)}% to black   sunken ${found.r.toFixed(2)}:1  paper ${ratio(found.c, PAPER).toFixed(2)}:1`
      : `${name.padEnd(9)} NO SOLUTION`
  )
}

console.log('\n=== 3. Flagged fill: lighten until ink clears AA ===\n')
for (const base of ['#E7434F', '#E63946']) {
  let found = null
  for (let t = 0; t <= 0.3; t += 0.01) {
    const c = mix(base, PAPER, t)
    if (ratio(INK, c) >= NEED) {
      found = { c, t, r: ratio(INK, c) }
      break
    }
  }
  console.log(
    found
      ? `${base} -> lighten ${(found.t * 100).toFixed(0)}% to ${found.c} = ${found.r.toFixed(2)}:1`
      : `${base} -> no solution within 30%`
  )
}

console.log('\n=== 4. Confirm the other three fills already pass with the new ink ===\n')
for (const [name, fill] of Object.entries({
  verified: '#2A9D8F',
  pending: '#F4A261',
  info: '#3B82F6',
})) {
  console.log(`${name.padEnd(9)} ${fill}  ink ${ratio(INK, fill).toFixed(2)}:1  ${ratio(INK, fill) >= NEED ? 'OK' : 'FAIL'}`)
}
console.log()
