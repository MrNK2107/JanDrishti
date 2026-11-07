// One-off solver: find palette values that clear WCAG AA, keeping brand hues.
// Run: node tools/pick-palette.mjs
const hex = (h) => {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255)
}
const channel = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const lum = (h) => {
  const [r, g, b] = hex(h).map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
const hexOf = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()

const mix = (a, b, t) => {
  const A = hex(a).map((v) => v * 255)
  const B = hex(b).map((v) => v * 255)
  return hexOf(A.map((v, i) => v + (B[i] - v) * t))
}

const DARK = '#0A1929' // midnight-900, the dominant ground
const DARK2 = '#0F1E2F' // midnight-800, panel ground
const ONFILL = '#07111C' // midnight-950, text that sits on colored fills

console.log('--- candidates for TEXT-on-dark, mixed toward white ---')
for (const [name, base] of [['verified', '#2A9D8F'], ['flagged', '#E63946'], ['pending', '#F4A261']]) {
  for (const t of [0.1, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]) {
    const c = mix(base, '#FFFFFF', t)
    const r1 = ratio(c, DARK)
    const r2 = ratio(c, DARK2)
    const ok = r1 >= 4.5 && r2 >= 4.5
    if (ok) console.log(`  ${name.padEnd(8)} ${c}  t=${t}  on900=${r1.toFixed(2)} on800=${r2.toFixed(2)}  <-- first viable`)
    if (ok) break
  }
}

console.log('\n--- candidates for FILLS carrying dark text (need LIGHT fills) ---')
for (const [name, base] of [['verified', '#2A9D8F'], ['flagged', '#E63946'], ['pending', '#F4A261']]) {
  const tested = []
  for (const t of [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4]) {
    const c = mix(base, '#FFFFFF', t)
    tested.push([c, ratio(ONFILL, c) >= 4.5])
  }
  const firstOk = tested.find(([, ok]) => ok)
  if (firstOk) console.log(`  ${name.padEnd(8)} lighten ${firstOk[0]}  ratio=${ratio(ONFILL, firstOk[0]).toFixed(2)}`)
  else console.log(`  ${name.padEnd(8)} no lighten <=0.4 works; keep original ${base} -> ${ratio(ONFILL, base).toFixed(2)}`)
}
