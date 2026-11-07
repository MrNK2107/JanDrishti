/**
 * Browser verification for JanDrishti.
 *
 * This is not a unit test suite — that lives in src/. This script exists to
 * answer questions that only a real browser can answer:
 *
 *   1. Does the app actually render, on every route, without console errors?
 *   2. Is the ¥WCAG fix real in the *live DOM*, not just in the config?
 *   3. Does the accountability loop actually close end to end — file a claim,
 *      record a conflicting observation, see the finding appear, resolve it,
 *      and find the disposition in the public record?
 *
 * Run: node tools/verify-browser.mjs
 * Requires the dev server on http://127.0.0.1:3002
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Reuse a browser already installed on this machine rather than downloading
 * another copy of Chromium. The Playwright driver version and the cached
 * browser builds do not necessarily agree, but a system Chrome or Edge works
 * fine and is the faster path.
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

// --- WCAG contrast, applied to real rendered pixels -------------------------

const parseRgb = (s) => {
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const [r, g, b] = m[1].split(',').map((v) => parseFloat(v))
  return [r, g, b]
}
const channel = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Walk up for the nearest non-transparent background. */
const effectiveBg = (el) => {
  let node = el
  while (node) {
    const bg = parseRgb(getComputedStyle(node).backgroundColor)
    const alpha = getComputedStyle(node).backgroundColor.match(/rgba?\([^)]*,\s*([\d.]+)\)/)
    const isTransparent = bg && alpha && parseFloat(alpha[1]) === 0
    if (bg && !isTransparent) return bg
    node = node.parentElement
  }
  return [10, 25, 41]
}

const systemBrowser = findSystemBrowser()
if (systemBrowser) {
  console.log(`Using system browser: ${systemBrowser}\n`)
} else {
  console.log('No system browser found; falling back to the Playwright bundle.\n')
}

const browser = await chromium.launch(
  systemBrowser ? { executablePath: systemBrowser } : {}
)
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`))

const shot = async (name) => {
  await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: true })
}

try {
  // === 1. Every route renders ================================================
  const routes = [
    ['/', 'admin-dashboard', 'Ward Admin'],
    ['/contractor', 'contractor-portal', 'Contractor Portal'],
    ['/inspector', 'inspector-interface', 'Field Inspector'],
    ['/citizen', 'citizen-portal', 'Citizen Record'],
  ]

  for (const [path, shotName, expectText] of routes) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    const body = await page.textContent('body')
    check(`route ${path} renders`, body.includes(expectText), `looking for "${expectText}"`)
    check(`route ${path} shows the ward-12 chrome`, body.includes('JanDrishti'))
    await shot(shotName)
  }

  // === 2. The contrast fix, measured on rendered elements ====================
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })

  // Collect every text node in the app and measure it against its real backdrop.
  const measured = await page.evaluate(() => {
    const out = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim()
      if (!text || text.length < 2) continue
      const el = node.parentElement
      if (!el) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.15) continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      out.push({
        text: text.slice(0, 40),
        color: cs.color,
        fontSize: parseFloat(cs.fontSize),
        fontWeight: cs.fontWeight,
      })
    }
    return out
  })

  // Recompute contrast with a resolve function that walks ancestors in-page.
  const contrastViolations = await page.evaluate(() => {
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
      return [10, 25, 41]
    }

    const bad = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim()
      if (!text || text.length < 2) continue
      const el = node.parentElement
      if (!el) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') continue
      const op = parseFloat(cs.opacity)
      if (op < 0.15) continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue

      const fg = parse(cs.color)
      if (!fg) continue
      const bg = bgOf(el)
      const r = ratio(fg.rgb, bg)
      const size = parseFloat(cs.fontSize)
      const weight = parseInt(cs.fontWeight, 10) || 400
      const isLarge = size >= 24 || (size >= 18.66 && weight >= 700)
      const need = isLarge ? 3 : 4.5
      if (r < need) {
        bad.push({
          text: text.slice(0, 50),
          ratio: Number(r.toFixed(2)),
          need,
          fg: cs.color,
          size,
        })
      }
    }
    return bad
  })

  check(
    'no AA contrast violations in rendered dashboard text',
    contrastViolations.length === 0,
    contrastViolations.length
      ? `${contrastViolations.length} violation(s): ` +
        contrastViolations.slice(0, 4).map((v) => `"${v.text}" ${v.ratio}:1`).join('; ')
      : `${measured.length} text nodes measured`
  )

  // === 3. The loop actually closes ==========================================
  // Start from a clean seed.
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Reset demo data' }).click()
  await page.waitForTimeout(300)

  // Confirm the seeded flagged case is visible on the map.
  const flaggedStations = await page.locator('[data-status="flagged"]').count()
  check('seeded T Nagar case renders as a flagged station', flaggedStations >= 1, `${flaggedStations} flagged station(s)`)

  // Confirm the open queue shows the seeded finding.
  await page.getByRole('button', { name: /^Findings/ }).click()
  await page.waitForTimeout(200)
  const queueHasDsc = await page.getByText('DSC-0001').first().isVisible()
  check('seeded finding DSC-0001 appears in the review queue', queueHasDsc)
  await shot('admin-findings-queue')

  // --- Contractor files a claim against Saidapet (currently 200m claimed) ---
  await page.goto(BASE + '/contractor', { waitUntil: 'networkidle' })
  // Select the Saidapet milestone.
  await page.getByRole('button', { name: /Saidapet Bridge Pavement Work/ }).click()
  await page.waitForTimeout(200)
  await page.locator('#claimed').fill('200')
  await page.getByRole('button', { name: /Submit claim for inspection/ }).click()
  await page.waitForTimeout(300)
  const claimFiled = await page.getByText(/Claim recorded/).isVisible()
  check('contractor can file a claim', claimFiled)
  await shot('contractor-claim-filed')

  // --- Inspector records a conflicting observation ---------------------------
  await page.goto(BASE + '/inspector', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Saidapet Bridge Pavement Work/ }).click()
  await page.waitForTimeout(200)
  const observedInput = page.locator('input[type="number"]').first()
  await observedInput.fill('90')
  await page.getByRole('button', { name: /Submit observation and reconcile/ }).click()
  await page.waitForTimeout(400)

  const shortfallMsg = await page.getByText(/finding opened/i).first().isVisible()
  check('inspector sees a shortfall verdict immediately', shortfallMsg)
  await shot('inspector-shortfall-result')

  // --- The finding must now exist in the admin queue -------------------------
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)

  // Assert against the store, not against scraped text. An earlier version of
  // this check accepted any occurrence of "Quantity Shortfall", which the
  // seeded DSC-0001 already satisfied — so it passed while the new finding was
  // missing entirely. Read the record itself.
  const storeAfter = await page.evaluate(() => {
    const st = window.__JANDRISHTI__?.getState()
    if (!st) return null
    const said = st.projects.find((p) => p.id === 'JDT-2026-0152')
    return {
      discrepancies: st.discrepancies.map((d) => ({
        id: d.id,
        projectId: d.projectId,
        kind: d.kind,
        status: d.status,
      })),
      observed: said?.milestones?.[0]?.inspection?.observedQuantity ?? null,
    }
  })

  check('store is reachable from the page for assertion', storeAfter !== null)
  check(
    'the observation was persisted against the milestone',
    storeAfter?.observed === 90,
    `observed=${storeAfter?.observed}`
  )

  const newFinding = storeAfter?.discrepancies.find(
    (d) => d.projectId === 'JDT-2026-0152' && d.kind === 'quantity_shortfall'
  )
  check(
    'the shortfall opened a discrepancy record on the correct project',
    Boolean(newFinding),
    newFinding ? `${newFinding.id} on JDT-2026-0152` : 'no such record'
  )

  // And confirm that record is actually rendered, not merely present in state.
  await page.getByRole('button', { name: /^Findings/ }).click()
  await page.waitForTimeout(300)
  const renderedIds = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button[aria-current]'))
      .map((b) => b.textContent)
      .flatMap((t) => t?.match(/DSC-\d+/g) ?? [])
  )
  check(
    'the new finding is rendered in the review queue',
    renderedIds.includes(newFinding?.id),
    `rendered: ${[...new Set(renderedIds)].join(', ')}`
  )
  await shot('admin-findings-after-inspection')

  // --- Resolve it ------------------------------------------------------------
  // Select the new finding explicitly, by its rendered id.
  const findingId = newFinding?.id
  await page
    .locator('button[aria-current]')
    .filter({ hasText: findingId })
    .first()
    .click()
  await page.waitForTimeout(250)

  const RESOLUTION_TEXT =
    'Contractor directed to surface the remaining 110 m within 30 days; re-inspection scheduled.'
  await page.locator('#resolution').fill(RESOLUTION_TEXT)
  await page.getByRole('button', { name: /Resolve — deficiency accepted/ }).click()
  await page.waitForTimeout(400)

  const resolvedState = await page.evaluate(
    (id) => window.__JANDRISHTI__?.getState()?.discrepancies.find((d) => d.id === id),
    findingId
  )
  check(
    'a finding can be resolved with a written disposition',
    resolvedState?.status === 'resolved' && resolvedState?.resolution === RESOLUTION_TEXT,
    `status=${resolvedState?.status}`
  )
  check(
    'the resolution records who decided and when',
    Boolean(resolvedState?.resolvedBy) && Boolean(resolvedState?.resolvedAt)
  )
  await shot('admin-finding-resolved')

  // --- The citizen sees it ---------------------------------------------------
  await page.goto(BASE + '/citizen', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /Saidapet Bridge Pavement Work/ }).click()
  await page.waitForTimeout(300)
  const citizenBody = await page.textContent('body')
  check(
    'the disposition is published in the citizen record',
    citizenBody.includes('remaining 110 m') || citizenBody.includes('Disposition')
  )
  check(
    'the citizen record shows all three numbers',
    citizenBody.includes('Sanctioned') &&
      citizenBody.includes('Contractor reported') &&
      citizenBody.includes('Independently observed')
  )
  await shot('citizen-public-record')

  // --- Read-only claim must hold --------------------------------------------
  // Careful: the public record legitimately contains the word "Resolved" as a
  // status label. An earlier version of this check matched that badge and
  // reported a mutating control that did not exist. Match the imperative
  // controls the officer-facing portals actually render.
  const MUTATING_CONTROL =
    /\b(resolve|dismiss|submit|record observation|file a claim|submit claim|mark under review)\b/i

  const citizenControls = await page.locator('button, input[type="submit"]').evaluateAll((els) =>
    els
      .map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  )
  const mutating = citizenControls.filter((t) => MUTATING_CONTROL.test(t))
  check(
    'citizen portal exposes no mutating control',
    mutating.length === 0,
    mutating.join(' | ')
  )

  // And structurally: nothing on the page can submit a form.
  const formCount = await page.locator('form').count()
  check('citizen portal renders no form', formCount === 0, `${formCount} form(s)`)

  // === 4. Console cleanliness ==============================================
  check(
    'no console errors across the whole walkthrough',
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
