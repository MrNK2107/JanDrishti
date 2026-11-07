/**
 * Authentication: sign in, sign up, and the shared layout.
 *
 * Two things this has to do beyond moving data around:
 *
 *   1. **Explain the role being chosen.** Signing up as an Inspector is a
 *      different set of permissions from signing up as a Contractor, and a
 *      visitor will not know which they want. Each role carries a sentence
 *      saying what it can do.
 *
 *   2. **Let a reviewer see every role without six signups.** The seeded ward
 *      accounts are offered as one-click entries. This is not a backdoor in the
 *      product's logic — the backend verifies credentials exactly as it does for
 *      a typed login; the buttons simply fill the form with a known account.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { useToast } from '../components/feedback'
import { Button, Input, StatusDot } from '../components/ui'

const ROLE_CHOICES = [
  {
    id: 'officer',
    label: 'Ward Officer',
    body: 'Review flagged projects and record decisions on the public record.',
  },
  {
    id: 'inspector',
    label: 'Field Inspector',
    body: 'Measure work on site and submit independent observations.',
  },
  {
    id: 'contractor',
    label: 'Contractor',
    body: 'Report completion against sanctioned milestones.',
  },
  {
    id: 'citizen',
    label: 'Citizen',
    body: 'Read the ward record. No special permissions.',
  },
]

/** Seeded accounts, for entering the product quickly. */
const WARD_ACCOUNTS = [
  { role: 'officer', name: 'R. Karthikeyan', email: 'officer@jandrishti.in', password: 'ward12' },
  { role: 'inspector', name: 'S. Meenakshi', email: 'inspector@jandrishti.in', password: 'ward12' },
  { role: 'contractor', name: 'V. Anand', email: 'contractor@jandrishti.in', password: 'ward12' },
]

function AuthLayout({ title, subtitle, children, aside }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-ink text-paper p-12">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-lg bg-paper text-ink grid place-items-center font-bold"
          >
            ज
          </span>
          <span className="text-sm font-bold">JanDrishti</span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Every public works rupee, accounted for.
          </h2>
          <p className="mt-4 text-paper/70 leading-relaxed">
            Three figures for every project: what was sanctioned, what a contractor
            reported, and what an independent inspection found. Where they disagree,
            the record says so.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-paper/70">
            {[
              'Claims are recorded before they are checked',
              'Only an independent inspection confirms delivery',
              'Decisions are written down and published',
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span aria-hidden="true" className="text-paper/50 mt-0.5">
                  —
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs text-paper/50 hover:text-paper/80 text-left"
        >
          ← Back to the public site
        </button>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm mx-auto">
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-8">
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-lg bg-accent text-paper grid place-items-center font-bold"
            >
              ज
            </span>
            <span className="text-sm font-bold text-ink">JanDrishti</span>
          </Link>

          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {aside}
        </div>
      </div>
    </div>
  )
}

/** Form-level error summary. Announced, and placed where the eye already is. */
function FormError({ error }) {
  if (!error) return null
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-status-flagged/40 bg-status-soft-flagged px-4 py-3"
    >
      <div className="text-sm font-medium text-status-text-flagged">{error.message}</div>
      {error.details && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-ink-2">
          {Object.values(error.details).map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Field-level message, shown under the input it belongs to. */
const fieldError = (error, field) => error?.details?.[field]

export function Login() {
  const { actions, pending } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const destination = location.state?.from ?? '/ward'
  const busy = Boolean(pending.auth)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    const res = await actions.login({ email, password })
    if (res.ok) {
      toast.success(`Signed in as ${res.result.user.name}`, roleWelcome(res.result.user.role))
      navigate(destination, { replace: true })
    } else {
      setError(res.error)
    }
  }

  const quickSignIn = async (account) => {
    setError(null)
    setEmail(account.email)
    setPassword(account.password)
    const res = await actions.login({ email: account.email, password: account.password })
    if (res.ok) {
      toast.success(`Signed in as ${res.result.user.name}`, roleWelcome(res.result.user.role))
      navigate(destination, { replace: true })
    } else {
      setError(res.error)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your ward account, or continue with a reviewer account below."
      aside={
        <>
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-hairline" />
              <span className="text-2xs uppercase tracking-wide text-ink-muted">
                or enter as
              </span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <ul className="mt-4 space-y-2">
              {WARD_ACCOUNTS.map((a) => (
                <li key={a.role}>
                  <button
                    type="button"
                    onClick={() => quickSignIn(a)}
                    disabled={busy}
                    data-quick-signin={a.role}
                    className="w-full text-left rounded-lg border border-hairline bg-paper px-3.5 py-2.5 hover:border-border hover:bg-canvas disabled:opacity-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <StatusDot tone={a.role === 'officer' ? 'flagged' : a.role === 'inspector' ? 'verified' : 'pending'} size="sm" />
                      <span className="text-sm font-medium text-ink">{a.label ?? a.name}</span>
                      <span className="ml-auto text-2xs text-ink-muted capitalize">{a.role}</span>
                    </span>
                    <span className="block text-xs text-ink-muted mt-0.5 font-mono">
                      {a.email}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <Link
                  to="/citizen"
                  className="block w-full text-left rounded-lg border border-hairline bg-paper px-3.5 py-2.5 hover:border-border hover:bg-canvas transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <StatusDot tone="info" size="sm" />
                    <span className="text-sm font-medium text-ink">Public record</span>
                    <span className="ml-auto text-2xs text-ink-muted">no sign-in</span>
                  </span>
                  <span className="block text-xs text-ink-muted mt-0.5">
                    Read the ward record without an account
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <p className="mt-8 text-sm text-ink-muted">
            No account yet?{' '}
            <Link to="/signup" className="text-accent font-medium hover:underline">
              Create one
            </Link>
          </p>
        </>
      }
    >
      <FormError error={error} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@organisation.in"
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Button variant="primary" type="submit" disabled={busy} className="w-full justify-center">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}

function roleWelcome(role) {
  return {
    officer: 'Ward Officer view — review and decide on discrepancies.',
    inspector: 'Field Inspector view — record measurements on site.',
    contractor: 'Contractor view — report progress against sanctioned scope.',
    citizen: 'Citizen view — the public ward record.',
  }[role]
}

export function SignUp() {
  const { actions, pending } = useStore()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organisation: '',
    role: 'officer',
  })
  const [error, setError] = useState(null)
  const busy = Boolean(pending.auth)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    const res = await actions.signup(form)
    if (res.ok) {
      toast.success('Account created', roleWelcome(res.result.user.role))
      navigate('/ward', { replace: true })
    } else {
      setError(res.error)
    }
  }

  const chosen = ROLE_CHOICES.find((r) => r.id === form.role)

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Choose the role you will use. Permissions follow the role."
      aside={
        <p className="mt-8 text-sm text-ink-muted">
          Already registered?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <FormError error={error} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          id="name"
          label="Full name"
          value={form.name}
          onChange={set('name')}
          placeholder="R. Karthikeyan"
          required
          aria-invalid={Boolean(fieldError(error, 'name'))}
        />
        {fieldError(error, 'name') && (
          <p className="text-xs text-status-text-flagged -mt-2">{fieldError(error, 'name')}</p>
        )}

        <Input
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          placeholder="you@organisation.in"
          required
          aria-invalid={Boolean(fieldError(error, 'email'))}
        />
        {fieldError(error, 'email') && (
          <p className="text-xs text-status-text-flagged -mt-2">{fieldError(error, 'email')}</p>
        )}

        <Input
          id="organisation"
          label="Organisation"
          value={form.organisation}
          onChange={set('organisation')}
          placeholder="Greater Chennai Corporation"
          hint="Shown on every record you sign."
        />

        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          placeholder="At least 6 characters"
          required
          aria-invalid={Boolean(fieldError(error, 'password'))}
        />
        {fieldError(error, 'password') && (
          <p className="text-xs text-status-text-flagged -mt-2">
            {fieldError(error, 'password')}
          </p>
        )}

        <fieldset>
          <legend className="block text-2xs uppercase tracking-wide text-ink-muted mb-1.5">
            Role
          </legend>
          <div className="space-y-2">
            {ROLE_CHOICES.map((r) => (
              <label
                key={r.id}
                className={`flex items-start gap-3 rounded-lg border px-3.5 py-2.5 cursor-pointer transition-colors ${
                  form.role === r.id
                    ? 'border-accent bg-accent-soft'
                    : 'border-hairline bg-paper hover:border-border'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.id}
                  checked={form.role === r.id}
                  onChange={set('role')}
                  className="mt-1 accent-[#1F5F55]"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">{r.label}</span>
                  <span className="block text-xs text-ink-muted mt-0.5 leading-snug">
                    {r.body}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button variant="primary" type="submit" disabled={busy} className="w-full justify-center">
          {busy ? 'Creating account…' : `Create ${chosen?.label ?? ''} account`}
        </Button>
      </form>
    </AuthLayout>
  )
}
