/**
 * Shared UI primitives — light theme.
 *
 * Two rules hold these together:
 *
 *   1. **Status colour is never chosen at the call site.** A component maps a
 *      status to a `tone`, and the tone owns every class. The AA-verified token
 *      set in `tailwind.config.cjs` therefore cannot be bypassed by an ad-hoc
 *      class, which is how the original palette drifted into a 1.75:1 failure.
 *
 *   2. **Status is never conveyed by colour alone.** Every status surface
 *      carries a glyph and a written label, so the interface survives
 *      colourblindness, greyscale printing, and a low-quality projector.
 *
 * The palette rule that matters most here: status colours on light ground carry
 * **dark** text. Light text on these fills measures 2.06–4.17:1, below AA.
 */

const TONE_TEXT = {
  verified: 'text-status-text-verified',
  flagged: 'text-status-text-flagged',
  pending: 'text-status-text-pending',
  info: 'text-status-text-info',
  neutral: 'text-ink-muted',
}

const TONE_FILL = {
  verified: 'bg-status-verified',
  flagged: 'bg-status-flagged',
  pending: 'bg-status-pending',
  info: 'bg-status-info',
  neutral: 'bg-ink-subtle',
}

const TONE_SOFT = {
  verified: 'bg-status-soft-verified border-status-verified/30',
  flagged: 'bg-status-soft-flagged border-status-flagged/30',
  pending: 'bg-status-soft-pending border-status-pending/40',
  info: 'bg-status-soft-info border-status-info/30',
  neutral: 'bg-sunken border-border',
}

const TONE_GLYPH = {
  verified: '✓',
  flagged: '!',
  pending: '◔',
  info: 'i',
  neutral: '○',
}

/**
 * Plain-language meaning of each status, surfaced as a tooltip on the badge.
 * The product's whole claim is explainability, so the interface should not rely
 * on the reader already knowing the vocabulary.
 */
export const STATUS_MEANING = {
  verified: 'An independent inspection confirmed the work matches what was sanctioned.',
  resolved:
    'A discrepancy was raised and has since been resolved. The finding and its outcome are on record.',
  flagged: 'A discrepancy between the contractor’s claim and the inspection is open and awaiting a decision.',
  pending_inspection:
    'The contractor has reported the work complete, but no independent inspection has happened yet. The claim is unverified.',
  in_progress: 'Work is underway. No completion claim has been filed yet.',
  registered: 'Registered and sanctioned. Nothing has been reported yet.',
}

export function StatusDot({ tone = 'neutral', size = 'md', pulse = false }) {
  const dims = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'
  return (
    <span
      data-tone={tone}
      aria-hidden="true"
      className={`inline-block rounded-full shrink-0 ${dims} ${TONE_FILL[tone]} ${
        pulse && tone === 'flagged' ? 'animate-pulse' : ''
      }`}
    />
  )
}

export function StatusBadge({ tone = 'neutral', label, meaning, size = 'md' }) {
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-0.5 text-xs'
  return (
    <span
      data-tone={tone}
      title={meaning}
      className={`inline-flex items-center gap-1 rounded border font-medium whitespace-nowrap ${pad} ${TONE_SOFT[tone]} ${TONE_TEXT[tone]}`}
    >
      <span aria-hidden="true" className="font-bold leading-none">
        {TONE_GLYPH[tone]}
      </span>
      {label}
    </span>
  )
}

/** A stat with its label above and an explanatory line below. */
export function Metric({ label, value, detail, tone = 'neutral', emphasis = false }) {
  return (
    <div className="bg-paper border border-hairline rounded-lg px-4 py-3.5">
      <div className="text-xs text-ink-muted">{label}</div>
      <div
        className={`mt-1 font-semibold tabular-nums ${
          emphasis ? 'text-3xl' : 'text-2xl'
        } ${tone === 'neutral' ? 'text-ink' : TONE_TEXT[tone]}`}
      >
        {value}
      </div>
      {detail && <div className="text-xs text-ink-muted mt-1 leading-snug">{detail}</div>}
    </div>
  )
}

export function Field({ label, children, mono = false, className = '', hint }) {
  return (
    <div className={className}>
      <div className="text-2xs uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={`text-sm text-ink mt-0.5 ${mono ? 'font-mono' : ''}`}>{children}</div>
      {hint && <div className="text-xs text-ink-muted mt-1 leading-snug">{hint}</div>}
    </div>
  )
}

export function Panel({ title, subtitle, actions, children, className = '', tone }) {
  const toneBorder = tone
    ? { verified: 'border-status-verified/40', flagged: 'border-status-flagged/40', pending: 'border-status-pending/50', info: 'border-status-info/40' }[tone]
    : 'border-hairline'
  return (
    <section className={`bg-paper border rounded-lg shadow-card ${toneBorder} ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-hairline">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="text-sm text-ink-muted mt-1 leading-snug">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Button({
  children,
  variant = 'secondary',
  type = 'button',
  disabled,
  className = '',
  ...rest
}) {
  const variants = {
    // Dark ink on the fill — never white, which fails AA on every status hue.
    primary: 'bg-status-verified text-ink border-transparent hover:brightness-105 font-semibold',
    secondary: 'bg-paper border-border text-ink hover:bg-sunken',
    ghost: 'bg-transparent border-transparent text-ink-muted hover:text-ink hover:bg-sunken',
    danger:
      'bg-status-soft-flagged border-status-flagged/40 text-status-text-flagged hover:brightness-95',
    success:
      'bg-status-soft-verified border-status-verified/40 text-status-text-verified hover:brightness-95',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      className={`px-3.5 py-2 rounded border text-sm transition-[filter,background-color] disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Input({ label, hint, id, className = '', ...rest }) {
  return (
    <label className="block" htmlFor={id}>
      {label && (
        <span className="block text-2xs uppercase tracking-wide text-ink-muted mb-1.5">
          {label}
        </span>
      )}
      <input
        id={id}
        className={`w-full bg-paper border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-status-verified focus:ring-2 focus:ring-status-verified/20 ${className}`}
        {...rest}
      />
      {hint && <span className="block text-xs text-ink-muted mt-1.5 leading-snug">{hint}</span>}
    </label>
  )
}

export function Textarea({ label, hint, id, className = '', ...rest }) {
  return (
    <label className="block" htmlFor={id}>
      {label && (
        <span className="block text-2xs uppercase tracking-wide text-ink-muted mb-1.5">
          {label}
        </span>
      )}
      <textarea
        id={id}
        rows={3}
        className={`w-full bg-paper border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-status-verified focus:ring-2 focus:ring-status-verified/20 resize-y ${className}`}
        {...rest}
      />
      {hint && <span className="block text-xs text-ink-muted mt-1.5 leading-snug">{hint}</span>}
    </label>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="text-center py-10 px-4 border border-dashed border-border rounded-lg bg-paper">
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && (
        <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto leading-relaxed">{children}</p>
      )}
    </div>
  )
}

/**
 * A labelled callout for the "what this means" explanations. Used wherever the
 * interface needs to say something in words rather than imply it visually.
 */
export function Callout({ tone = 'info', title, children, className = '' }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${TONE_SOFT[tone]} ${className}`}>
      {title && (
        <div className={`text-xs font-semibold mb-1 ${TONE_TEXT[tone]}`}>{title}</div>
      )}
      <div className="text-sm text-ink-2 leading-relaxed">{children}</div>
    </div>
  )
}

export function ShareBar({ percent, tone = 'verified', label }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs mb-1.5">
        <span className="text-ink-muted">{label}</span>
        <span className={`font-mono tabular-nums ${TONE_TEXT[tone]}`}>
          {clamped.toFixed(0)}%
        </span>
      </div>
      <div
        className="h-2 bg-sunken rounded-full overflow-hidden"
        role="img"
        aria-label={`${label}: ${clamped.toFixed(0)} percent`}
      >
        <div className={`h-full rounded-full ${TONE_FILL[tone]}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

export { TONE_TEXT, TONE_FILL, TONE_SOFT, TONE_GLYPH }
