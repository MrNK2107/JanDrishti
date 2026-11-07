/**
 * Browser verification for JanDrishti.
 *
 * Not a unit test suite — that lives in src/. This answers questions only a real
 * browser can:
 *
 *   1. Does every route render, without console errors?
 *   2. Is the palette AA in *rendered pixels*, not just in config?
 *   3. Does the delivery chart actually communicate magnitude — i.e. is the
 *      short bar measurably shorter than the long one?
 *   4. Does the explainability copy actually appear, naming the real figures?
 *   5. Does the accountability loop close end to end?
 *
 * Run: node tools/verify-browser.mjs   (dev server or preview on :3002)
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Reuse a browser already on this machine rather than downloading Chromium.
 * Driver and cached browser versions need not agree.
 */
const SYSTEM_BROWSERS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]
const findSystemBrowser = () => SYSTEM_BROWSERS.find((p) => existsSync(p))

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3002'
const OUT = resolve('screenshots')
mkdirSync(OUT, { recursive: true })

const results = []
const consoleErrors = []
let failures = 0

const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
}

const systemBrowser = findSystemBrowser()
console.log(
  systemBrowser
    ? `Using system browser: ${systemBrowser}\n`
    : 'No system browser found; using the Playwright bundle.\n'
)

const browser = await chromium.launch(systemBrowser ? { executablePath: systemBrowser } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

const shot = async (name, { full = true } = {}) => {
  await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: full })
}

/** Measure WCAG contrast on every rendered text node against its real backdrop. */
const auditContrast = () =>
  page.evaluate(() => {
    const parse = (s) => {
      const m = s.match(/rgba?\(([^)]+)\)/)
      if (!m) return null
      const p = m[1].split(',').map(Number)
      return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 }
    }
    const ch = (c) => {
      const v = c / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    const lum = ([r, g, b]) => 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
      return (x + 0.05) / (y + 0.05)
    }
    const bgOf = (el) => {
      let n = el
      while (n) {
        const p = parse(getComputedStyle(n).backgroundColor)
        if (p && p.a > 0.5) return p.rgb
        n = n.parentElement
      }
      return [255, 255, 255]
    }

    const bad = []
    let measured = 0
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim()
      if (!text || text.length < 2) continue
      const el = node.parentElement
      if (!el) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') continue
      if (parseFloat(cs.opacity) < 0.15) continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue

      const fg = parse(cs.color)
      if (!fg) continue
      measured++
      const r = ratio(fg.rgb, bgOf(el))
      const size = parseFloat(cs.fontSize)
      const weight = parseInt(cs.fontWeight, 10) || 400
      const isLarge = size >= 24 || (size >= 18.66 && weight >= 700)
      const need = isLarge ? 3 : 4.5
      if (r < need) {
        bad.push({ text: text.slice(0, 48), ratio: Number(r.toFixed(2)), need, size })
      }
    }
    return { bad, measured }
  })

try {
  // === 1. Every route renders ================================================
  const routes = [
    ['/', 'admin-overview', 'Ward overview'],
    ['/contractor', 'contractor-portal', 'Report work complete'],
    ['/inspector', 'inspector-interface', 'Record what is on site'],
    ['/citizen', 'citizen-record', 'What your ward paid for'],
  ]

  for (const [path, shotName, expectText] of routes) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    const body = await page.textContent('body')
    check(`route ${path} renders`, body.includes(expectText), `looking for "${expectText}"`)
    await shot(shotName)
  }

  // Also capture the admin overview at viewport height. The full-page capture
  // is 2000px tall and shows everything at once, which is useful for review but
  // misleading about what a person actually sees without scrolling.
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await shot('admin-overview-viewport', { full: false })

  // === 2. Contrast on rendered pixels =======================================
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const { bad, measured } = await auditContrast()
  check(
    'no AA contrast violations in rendered text',
    bad.length === 0,
    bad.length
      ? `${bad.length} violation(s): ` + bad.slice(0, 4).map((v) => `"${v.text}" ${v.ratio}:1`).join('; ')
      : `${measured} text nodes measured`
  )

  // === 3. The chart communicates magnitude ==================================
  // The whole point of replacing the transit diagram. T Nagar was observed at
  // 64% of sanction; Anna Nagar at 99%. Their bars must differ accordingly.
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await page.waitForTimeout(400)

  // Read the chart through explicit data hooks rather than guessing at class
  // names or aria-label text. An earlier version of this check discovered only
  // two of the three bars, because it keyed off a word that appeared in some
  // project summaries and not others.
  const bars = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-chart-row]')).map((row) => {
      const track = row.querySelector('[data-chart-track]')
      const seg = row.querySelector('[data-chart-delivered]')
      const trackW = track ? track.getBoundingClientRect().width : 0
      const segW = seg ? seg.getBoundingClientRect().width : 0
      return {
        id: row.getAttribute('data-chart-row'),
        trackW: Math.round(trackW),
        segW: Math.round(segW),
        pct: trackW ? Number(((segW / trackW) * 100).toFixed(1)) : 0,
      }
    })
  })

  check('delivery chart renders a bar per project', bars.length >= 3, `${bars.length} bars`)
  const tNagar = bars.find((b) => b.id === 'JDT-2026-0143')
  const annaNagar = bars.find((b) => b.id === 'JDT-2026-0138')
  const saidapet = bars.find((b) => b.id === 'JDT-2026-0152')
  check(
    'T Nagar bar stops near 64% of sanction (the shortfall is visible, not just labelled)',
    tNagar && Math.abs(tNagar.pct - 64) <= 3,
    tNagar ? `${tNagar.pct}% of track` : 'bar not found'
  )
  check(
    'Anna Nagar bar runs near full length, so the two are visually distinct',
    annaNagar && annaNagar.pct >= 95,
    annaNagar ? `${annaNagar.pct}% of track` : 'bar not found'
  )
  check(
    'the uninspected project renders no delivered segment at all',
    saidapet && saidapet.pct === 0,
    saidapet ? `${saidapet.pct}% of track` : 'bar not found'
  )
  check(
    'the flagged project\u2019s bar is materially shorter than the verified one',
    tNagar && annaNagar && annaNagar.pct - tNagar.pct > 25,
    tNagar && annaNagar ? `${tNagar.pct}% vs ${annaNagar.pct}%` : 'comparison unavailable'
  )

  // === 4. Explainability is present, in words, with the real figures ========
  const bodyText = await page.textContent('body')
  check(
    'the page states the plain-language consequence of the shortfall',
    /Short by 180 m/i.test(bodyText),
    'expected "Short by 180 m"'
  )
  check(
    'the page names the three sources of truth for the reader',
    /Sanctioned/i.test(bodyText) && /Contractor claims/i.test(bodyText) && /Inspection found/i.test(bodyText)
  )
  check(
    'the chart legend explains what each visual treatment means',
    /Delivered — confirmed by inspection/i.test(bodyText) &&
      /Claimed but not found on site/i.test(bodyText) &&
      /Still outstanding/i.test(bodyText)
  )
  check(
    'the tolerance rule is published rather than hidden',
    /tolerance/i.test(bodyText)
  )

  // Drill into the project and check the four-step explanation exists.
  await page.locator('[data-chart-row="JDT-2026-0143"]').click()
  await page.waitForTimeout(300)
  const detailText = await page.textContent('body')
  check('project detail opens', /What happened, step by step/.test(detailText))
  const steps = [
    'Approved and paid for',
    'Contractor reported complete',
    'Independent inspection',
    'System comparison',
  ]
  for (const s of steps) {
    check(`explanation step present: "${s}"`, detailText.includes(s))
  }
  check(
    'the conclusion is written as a sentence, not only a badge',
    /the claimed work is not on the ground/i.test(detailText)
  )
  await shot('admin-project-explained')

  // === 5. The accountability loop closes ====================================
  await page.goto(BASE + '/contractor', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Saidapet/ }).click()
  await page.waitForTimeout(250)
  await page.locator('#claimed').fill('200')
  await page.getByRole('button', { name: /Submit claim for inspection/ }).click()
  await page.waitForTimeout(350)
  check('contractor can file a claim', await page.getByText(/Claim recorded/).isVisible())
  await shot('contractor-claim-filed')

  await page.goto(BASE + '/inspector', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Saidapet/ }).click()
  await page.waitForTimeout(250)
  await page.locator('input[type="number"]').first().fill('90')
  await page.getByRole('button', { name: /Submit measurement/ }).click()
  await page.waitForTimeout(450)

  const verdictText = await page.textContent('body')
  check(
    'inspector sees the shortfall explained in words',
    /short of what was claimed/i.test(verdictText)
  )
  check(
    'the inspector is told they have not decided the outcome',
    /You have not decided anything/i.test(verdictText)
  )
  await shot('inspector-verdict')

  // Assert on records, not scraped text.
  const storeAfter = await page.evaluate(() => {
    const st = window.__JANDRISHTI__?.getState()
    if (!st) return null
    const said = st.projects.find((p) => p.id === 'JDT-2026-0152')
    return {
      observed: said?.milestones?.[0]?.inspection?.observedQuantity ?? null,
      discrepancies: st.discrepancies.map((d) => ({
        id: d.id,
        projectId: d.projectId,
        kind: d.kind,
      })),
    }
  })
  check('store reachable for assertion', storeAfter !== null)
  check('the measurement persisted', storeAfter?.observed === 90, `observed=${storeAfter?.observed}`)
  const newFinding = storeAfter?.discrepancies.find(
    (d) => d.projectId === 'JDT-2026-0152' && d.kind === 'quantity_shortfall'
  )
  check('a discrepancy opened on the correct project', Boolean(newFinding), newFinding?.id)

  // Resolve it, with the reason the interface requires.
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /^Discrepancies/ }).click()
  await page.waitForTimeout(300)
  await page.locator('button[aria-current]').filter({ hasText: newFinding.id }).first().click()
  await page.waitForTimeout(300)

  const REASON = 'Contractor directed to surface the remaining 110 m within 30 days.'
  await page.locator('#resolution').fill(REASON)
  await page.getByRole('button', { name: /Uphold the finding/ }).click()
  await page.waitForTimeout(400)

  const resolved = await page.evaluate(
    (id) => window.__JANDRISHTI__?.getState()?.discrepancies.find((d) => d.id === id),
    newFinding.id
  )
  check(
    'a decision is recorded with its written reason',
    resolved?.status === 'resolved' && resolved?.resolution === REASON,
    `status=${resolved?.status}`
  )
  await shot('admin-finding-decided')

  // === 6. The public record reflects it =====================================
  await page.goto(BASE + '/citizen', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Saidapet/ }).click()
  await page.waitForTimeout(350)
  const citizen = await page.textContent('body')
  check('the decision is published to the public', citizen.includes('remaining 110 m'))
  check(
    'the public view explains the three figures in plain terms',
    /what was sanctioned/i.test(citizen) && /what an independent inspector/i.test(citizen)
  )
  await shot('citizen-record')

  const controls = await page.locator('button, input[type="submit"]').evaluateAll((els) =>
    els.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean)
  )
  const mutating = controls.filter(
    (t) => /\b(resolve|dismiss|submit|file a claim|uphold|reset demo data)\b/i.test(t)
  )
  check('citizen portal exposes no mutating control', mutating.length === 0, mutating.join(' | '))
  check('citizen portal renders no form', (await page.locator('form').count()) === 0)

  // === 7. Console cleanliness ==============================================
  check(
    'no console errors across the walkthrough',
    consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(' | ')
  )
} catch (err) {
  check('verification run completed without throwing', false, err.message)
  await page.screenshot({ path: resolve(OUT, 'failure.png'), fullPage: true }).catch(() => {})
} finally {
  await browser.close()
}

writeFileSync(
  resolve(OUT, 'verification-report.json'),
  JSON.stringify({ base: BASE, failures, results, consoleErrors }, null, 2)
)

console.log(`\n${results.length - failures}/${results.length} checks passed`)
console.log(`screenshots -> ${OUT}`)
process.exit(failures > 0 ? 1 : 0)
