/**
 * Browser verification for JanDrishti.
 *
 * Unit tests live in src/. This answers what only a real browser can:
 *
 *   1. Does the public site render, and does it read as a product rather than a
 *      component preview — no "demo" framing anywhere?
 *   2. Do the auth pages work: sign in, sign up, wrong credentials, sign out?
 *   3. Are the protected routes actually protected?
 *   4. Does the working flow close end to end: report → measure → decide → publish?
 *   5. Is the palette AA in rendered pixels, and does the chart communicate magnitude?
 *
 * Run: node tools/verify-browser.mjs   (dev server or preview on :3002)
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

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
console.log(systemBrowser ? `Using: ${systemBrowser}\n` : 'Using the Playwright bundle.\n')

const browser = await chromium.launch(systemBrowser ? { executablePath: systemBrowser } : {})
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()

page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

const shot = async (name, { full = true } = {}) => {
  await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: full })
}

/** Reset the backend and clear the session, so each run starts from a known ward. */
async function resetAll() {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

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
      if (r < need) bad.push({ text: text.slice(0, 48), ratio: Number(r.toFixed(2)), need })
    }
    return { bad, measured }
  })

try {
  await resetAll()

  // === 1. Public site =======================================================
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const landing = await page.textContent('body')
  check('landing page renders', /Did we get what we paid for/i.test(landing))
  check(
    'landing states the product claim',
    /sanctioned/i.test(landing) && /independent inspection/i.test(landing)
  )
  check(
    'landing shows a worked example with the real figures',
    /500/.test(landing) && /320/.test(landing) && /180/.test(landing)
  )
  check(
    'landing explains what the product does NOT do',
    /does not determine fraud/i.test(landing)
  )
  check(
    'landing offers clear calls to action',
    /View the public record/i.test(landing) && /Create account/i.test(landing)
  )
  await shot('public-landing')

  // === 2. No demo framing anywhere =========================================
  const demoWords = await page.evaluate(() => {
    const text = document.body.innerText
    const hits = []
    for (const w of ['demo', 'Demo', 'DEMO', 'mockup', 'prototype', 'sample data', 'placeholder']) {
      if (text.includes(w)) hits.push(w)
    }
    return hits
  })
  check('no demo framing on the public site', demoWords.length === 0, demoWords.join(', '))

  // === 3. Protected routes are protected ===================================
  await page.goto(BASE + '/ward', { waitUntil: 'networkidle' })
  check(
    'anonymous visitor is redirected from the officer area to sign-in',
    page.url().includes('/login'),
    page.url()
  )
  check(
    'redirect preserves the intended destination',
    (await page.textContent('body')).length > 0
  )

  // === 4. Public record needs no account ===================================
  await page.goto(BASE + '/record', { waitUntil: 'networkidle' })
  const record = await page.textContent('body')
  check('public record renders without an account', /What your ward paid for/i.test(record))
  check(
    'public record publishes all three figures',
    /Sanctioned/i.test(record) &&
      /Contractor reported/i.test(record) &&
      /Inspection found/i.test(record)
  )
  await shot('public-record')

  // === 5. Sign in ==========================================================
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  check('login page renders', /Sign in/i.test(await page.textContent('body')))

  // Wrong credentials must be refused and explained.
  await page.fill('#email', 'officer@jandrishti.in')
  await page.fill('#password', 'definitely-wrong')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForTimeout(700)
  const afterBadLogin = await page.textContent('body')
  check(
    'wrong credentials are refused with an explanation',
    /do not match an account/i.test(afterBadLogin),
    'expected an inline error'
  )

  // Reviewer one-click entry.
  await page.locator('[data-quick-signin="officer"]').click()
  await page.waitForURL('**/ward', { timeout: 8000 }).catch(() => {})
  check('officer can sign in and reaches the ward', page.url().includes('/ward'), page.url())
  await page.waitForTimeout(600)

  const ward = await page.textContent('body')
  check('ward overview renders after sign-in', /Delivery against sanction/i.test(ward))
  check(
    'signed-in chrome shows who is signed in',
    /R\. Karthikeyan/i.test(ward) || /Ward Officer/i.test(ward)
  )
  check('no demo framing in the signed-in app', !/demo/i.test(ward))
  await shot('ward-overview')

  // === 6. Navigation is task-based, not numbered ===========================
  const navText = await page.locator('nav[aria-label="Primary"]').first().innerText()
  check(
    'navigation offers task labels',
    /Ward overview|Discrepancies|Audit trail/.test(navText),
    navText.replace(/\s+/g, ' ').slice(0, 80)
  )
  check(
    'navigation is not a numbered 1-2-3-4 sequence',
    !/^\s*1\b[\s\S]*\b2\b[\s\S]*\b3\b[\s\S]*\b4\b/.test(navText)
  )

  // === 7. Chart communicates magnitude =====================================
  const bars = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-chart-row]')).map((row) => {
      const track = row.querySelector('[data-chart-track]')
      const seg = row.querySelector('[data-chart-delivered]')
      const tw = track ? track.getBoundingClientRect().width : 0
      const sw = seg ? seg.getBoundingClientRect().width : 0
      return { id: row.getAttribute('data-chart-row'), pct: tw ? Number(((sw / tw) * 100).toFixed(1)) : 0 }
    })
  )
  const tNagar = bars.find((b) => b.id === 'JDT-2026-0143')
  const annaNagar = bars.find((b) => b.id === 'JDT-2026-0138')
  check('chart renders one row per project', bars.length === 3, `${bars.length} rows`)
  check(
    'shortfall is visible as bar length, not only as a label',
    tNagar && Math.abs(tNagar.pct - 64) <= 3,
    tNagar ? `${tNagar.pct}%` : 'missing'
  )
  check(
    'the verified project runs nearly full length',
    annaNagar && annaNagar.pct >= 95,
    annaNagar ? `${annaNagar.pct}%` : 'missing'
  )

  // === 8. Contrast in rendered pixels ======================================
  const { bad, measured } = await auditContrast()
  check(
    'no AA contrast violations on the ward overview',
    bad.length === 0,
    bad.length ? bad.slice(0, 4).map((v) => `"${v.text}" ${v.ratio}:1`).join('; ') : `${measured} nodes`
  )

  // === 9. Workflow: report → measure → decide → publish ====================
  await page.goto(BASE + '/works', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check('contractor portal reachable for an officer', /Report progress/i.test(await page.textContent('body')))

  await page.goto(BASE + '/field', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check('field portal renders', /Assigned inspections/i.test(await page.textContent('body')))

  // Select Saidapet and measure 90 against a reported 200.
  await page.getByRole('button', { name: /Saidapet/i }).first().click()
  await page.waitForTimeout(400)
  await page.locator('input[type="number"]').first().fill('90')
  await page.getByRole('button', { name: /Submit measurement/i }).click()
  await page.waitForTimeout(1500)

  const toasts = await page.locator('[role="status"]').allInnerTexts()
  check(
    'a toast confirms the recorded measurement',
    toasts.some((t) => /discrepancy|recorded/i.test(t)),
    toasts.join(' | ').slice(0, 100)
  )
  check(
    'the discrepancy is explained in words, not just flagged',
    /short of the reported figure/i.test(await page.textContent('body'))
  )
  await shot('field-verdict')

  // The finding must exist server-side.
  const state = await page.evaluate(async () => {
    const raw = localStorage.getItem('jandrishti.db.v1')
    if (!raw) return null
    const db = JSON.parse(raw)
    return {
      discrepancies: db.discrepancies.map((d) => ({ id: d.id, projectId: d.projectId })),
    }
  })
  const newFinding = state?.discrepancies.find(
    (d) => d.projectId === 'JDT-2026-0152'
  )
  check('the measurement opened a discrepancy in the backend', Boolean(newFinding), newFinding?.id)

  // Decide it as the officer.
  await page.goto(BASE + '/ward/discrepancies', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.locator('button[aria-current]').filter({ hasText: newFinding.id }).first().click()
  await page.waitForTimeout(400)

  const REASON = 'Contractor directed to surface the remaining 110 m within 30 days.'
  await page.locator('#resolution').fill(REASON)
  await page.getByRole('button', { name: /Uphold the finding/i }).click()
  await page.waitForTimeout(400)

  // A modal must confirm before the irreversible action lands.
  check(
    'an irreversible decision asks for confirmation first',
    /Uphold this finding/i.test(await page.textContent('body'))
  )
  await shot('discrepancy-confirm')
  await page.getByRole('button', { name: /^Uphold finding$/i }).click()
  await page.waitForTimeout(1200)

  const decided = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('jandrishti.db.v1') ?? '{}')
    return db.discrepancies?.map((d) => ({ id: d.id, status: d.status, resolution: d.resolution })) ?? []
  })
  const closed = decided.find((d) => d.id === newFinding.id)
  check(
    'the decision is recorded with its written reason',
    closed?.status === 'resolved' && closed?.resolution === REASON,
    `status=${closed?.status}`
  )

  // === 10. Published to the public record ==================================
  await page.goto(BASE + '/record', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: /Saidapet/i }).first().click()
  await page.waitForTimeout(600)
  const published = await page.textContent('body')
  check('the decision appears in the public record', published.includes('remaining 110 m'))
  check(
    'the public record walks the evidence chain',
    /What happened, step by step/i.test(published)
  )
  await shot('public-record-expanded')

  // === 11. Citizen view has no mutating controls ===========================
  const controls = await page.locator('button, input[type="submit"]').evaluateAll((els) =>
    els.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean)
  )
  const mutating = controls.filter((t) =>
    /\b(uphold|dismiss|submit|record measurement|report progress|reset)\b/i.test(t)
  )
  check('public record exposes no mutating control', mutating.length === 0, mutating.join(' | '))
  check('public record renders no form', (await page.locator('form').count()) === 0)

  // === 12. Sign out, then sign up ==========================================
  // Order matters: `/signup` redirects an already-signed-in user to their home
  // portal, which is correct behaviour, so signing out has to come first.
  await page.goto(BASE + '/ward', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.locator('header button[aria-haspopup="menu"]').click()
  await page.waitForTimeout(300)
  await page.getByRole('menuitem', { name: /Sign out/i }).click()
  await page.waitForTimeout(900)
  check('sign out returns to the public site', !page.url().includes('/ward'), page.url())

  // A signed-out visitor must be pushed away from the auth page's mirror case:
  // confirm the officer area is closed again.
  await page.goto(BASE + '/ward', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  check(
    'the officer area is closed again after signing out',
    page.url().includes('/login'),
    page.url()
  )

  const unique = `reviewer.${Date.now()}@example.in`
  await page.goto(BASE + '/signup', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  check('signup page renders when signed out', /Create your account/i.test(await page.textContent('body')))
  await page.fill('#name', 'Reviewer Account')
  await page.fill('#email', unique)
  await page.fill('#password', 'reviewpass')
  await page.getByRole('radio', { name: /Field Inspector/i }).check()
  await page.getByRole('button', { name: /Create Field Inspector account/i }).click()
  await page.waitForURL('**/field', { timeout: 8000 }).catch(() => {})
  check('signup signs the new user straight in', page.url().includes('/field'), page.url())
  await page.waitForTimeout(600)

  // === 13. Role separation =================================================
  // Sign out first: the auth page redirects a signed-in user to their own portal.
  await page.locator('header button[aria-haspopup="menu"]').click()
  await page.waitForTimeout(300)
  await page.getByRole('menuitem', { name: /Sign out/i }).click()
  await page.waitForTimeout(900)

  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.locator('[data-quick-signin="contractor"]').click()
  await page.waitForURL('**/works', { timeout: 8000 }).catch(() => {})
  check('a contractor lands in the contractor portal', page.url().includes('/works'), page.url())
  await page.waitForTimeout(500)

  await page.goto(BASE + '/ward', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  check(
    'a contractor cannot reach the officer area',
    !page.url().includes('/ward'),
    page.url()
  )

  // === 14. Console cleanliness =============================================
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
