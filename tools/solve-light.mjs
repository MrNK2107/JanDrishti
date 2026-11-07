/**
 * Solvers for the two light-theme pairings that need care:
 *
 *  1. "soft" status backgrounds, which carry the darker status text. The first
 *     attempt used rgba tints at 12% alpha, which render to different effective
 *     colours depending on what is behind them — unmeasurable, and therefore
 *     unverifiable. These are solved as solid hex values instead.
 *
 *  2. A flagged fill for solid status marks, dark enough to be unambiguous but
 *     light enough to keep dark text legible.
 *
 * Run: node tools/solve-light.mjs
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

const INK = '#0F172A'
const PAPER = '#FFFFFF'
const NEED = 4.5

// --- 1. Soft backgrounds: brand hue mixed toward white until the darker status
//        text clears AA on it. Keep it as light as possible so it reads as a
//        tint rather than a block of colour.
console.log('\n=== Soft status backgrounds (must clear AA with their status text) ===\n')

const SOFT = [
  ['verified', '#2A9D8F', '#217A70'],
  ['flagged', '#E63946', '#CA323E'],
  ['pending', '#F4A261', '#92613A'],
  ['info', '#3B82F6', '#306BCA'],
]

const solvedSoft = {}
for (const [name, hue, text] of SOFT) {
  let best = null
  for (let t = 0.70; t <= 0.95; t += 0.01) {
    const bg = mix(hue, PAPER, t)
    if (ratio(text, bg) >= NEED) {
      best = { bg, t, r: ratio(text, bg) }
      break
    }
  }
  if (!best) {
    // Fall back to a very light neutral tint if the hue cannot be diluted enough.
    for (let t = 0.95; t <= 0.99; t += 0.005) {
      const bg = mix(hue, PAPER, t)
      if (ratio(text, bg) >= NEED) {
        best = { bg, t, r: ratio(text, bg) }
        break
      }
    }
  }
  solvedSoft[name] = best?.bg
  console.log(
    best
      ? `${name.padEnd(10)} ${best.bg}  dilute ${(best.t * 100).toFixed(0)}% toward white  ratio ${best.r.toFixed(2)}:1`
      : `${name.padEnd(10)} NO SOLUTION`
  )
}

// --- 2. Solid flagged fill carrying dark ink text.
console.log('\n=== Solid fills carrying dark ink text (need 4.5:1) ===\n')
for (const [name, hue] of [
  ['verified', '#2A9D8F'],
  ['flagged', '#E63946'],
  ['pending', '#F4A261'],
  ['info', '#3B82F6'],
]) {
  const r = ratio(INK, hue)
  let note = `ink ${r.toFixed(2)}:1`
  if (r < NEED) {
    // Lighten toward white so dark text has more room.
    let fixed = null
    for (let t = 0.02; t <= 0.5; t += 0.01) {
      const c = mix(hue, PAPER, t)
      if (ratio(INK, c) >= NEED) {
        fixed = { c, t, r: ratio(INK, c) }
        break
      }
    }
    note += fixed
      ? `   -> lighten ${(fixed.t * 100).toFixed(0)}% to ${fixed.c} = ${fixed.r.toFixed(2)}:1`
      : '   -> NO lightening solution'
  } else {
    note += '  OK as-is'
  }
  console.log(`${name.padEnd(10)} ${hue}   ${note}`)
}

console.log('\n=== Final tokens ===\n')
console.log('soft:', JSON.stringify(solvedSoft, null, 0))
console.log()
