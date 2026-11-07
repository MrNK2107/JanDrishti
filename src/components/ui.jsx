/**
 * Shared UI primitives.
 *
 * Two rules hold these together:
 *
 *   1. Status color is never chosen at the call site. Components map a status
 *      to a `tone` and the tone owns the color, so the AA-verified palette in
 *      `tailwind.config.cjs` cannot be bypassed by an ad-hoc class.
 *   2. Status is never conveyed by color alone. Every status surface also
 *      carries its label and a distinct glyph — colorblind users and printed
 *      screenshots both have to work.
 */

const TONE_CLASS = {
  verified: 'text-status-text-verified',
  flagged: 'text-status-text-flagged',
  pending: 'text-status-text-pending',
  neutral: 'text-porcelain-200',
}

const TONE_FILL = {
  verified: 'bg-status-verified',
  flagged: 'bg-status-flagged',
  pending: 'bg-status-pending',
  neutral: 'bg-porcelain-200',
}

const TONE_TINT = {
  verified: 'bg-status-tint-verified border-status-verified/40',
  flagged: 'bg-status-tint-flagged border-status-flagged/40',
  pending: 'bg-status-tint-pending border-status-pending/40',
  neutral: 'bg-midnight-700/40 border-midnight-700',
}

const TONE_GLYPH = {
  verified: '✓',
  flagged: '⚠',
  pending: '◔',
  neutral: '○',
}

export function StatusDot({ tone = 'neutral', pulse = false, size = 'md' }) {
  const dims = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'
  return (
    <span
      data-tone={tone}
      aria-hidden="true"
      className={`inline-block rounded-full ${dims} ${TONE_FILL[tone]} ${
        pulse && tone === 'flagged' ? 'animate-flag-pulse' : ''
      }`}
    />
  )
}

export function StatusBadge({ tone = 'neutral', label, glyph = true, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      data-tone={tone}
      className={`inline-flex items-center gap-1.5 rounded border uppercase tracking-wider font-medium ${pad} ${TONE_TINT[tone]} ${TONE_CLASS[tone]}`}
    >
      {glyph && <span aria-hidden="true">{TONE_GLYPH[tone]}</span>}
      {label}
    </span>
  )
}

/** A single-value label/value pair, used heavily in the record detail views. */
export function Field({ label, children, mono = false, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-wider text-porcelain-200">{label}</div>
      <div className={`text-sm mt-0.5 ${mono ? 'font-mono' : ''}`}>{children}</div>
    </div>
  )
}

export function Panel({ title, subtitle, actions, children, className = '', tone }) {
  return (
    <section
      className={`bg-midnight-800 border rounded-lg ${tone ? TONE_TINT[tone] : 'border-midnight-700'} ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-midnight-700">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {subtitle && <p className="text-xs text-porcelain-200 mt-1">{subtitle}</p>}
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
    primary:
      'bg-status-verified text-midnight-950 hover:brightness-110 border-transparent font-semibold',
    secondary:
      'bg-midnight-700 border-midnight-700 text-porcelain-100 hover:bg-midnight-700/70',
    ghost: 'bg-transparent border-transparent text-porcelain-200 hover:text-porcelain-100',
    danger:
      'bg-status-tint-flagged border-status-flagged/40 text-status-text-flagged hover:bg-status-flagged/25',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      className={`px-3.5 py-2 rounded border text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
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
        <span className="block text-[10px] uppercase tracking-wider text-porcelain-200 mb-1.5">
          {label}
        </span>
      )}
      <input
        id={id}
        className={`w-full bg-midnight-950 border border-midnight-700 rounded px-3 py-2 text-sm text-porcelain-100 placeholder:text-porcelain-200/60 focus:outline-none focus:border-status-verified ${className}`}
        {...rest}
      />
      {hint && <span className="block text-xs text-porcelain-200 mt-1.5">{hint}</span>}
    </label>
  )
}

export function Textarea({ label, hint, id, className = '', ...rest }) {
  return (
    <label className="block" htmlFor={id}>
      {label && (
        <span className="block text-[10px] uppercase tracking-wider text-porcelain-200 mb-1.5">
          {label}
        </span>
      )}
      <textarea
        id={id}
        rows={3}
        className={`w-full bg-midnight-950 border border-midnight-700 rounded px-3 py-2 text-sm text-porcelain-100 placeholder:text-porcelain-200/60 focus:outline-none focus:border-status-verified resize-y ${className}`}
        {...rest}
      />
      {hint && <span className="block text-xs text-porcelain-200 mt-1.5">{hint}</span>}
    </label>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="text-center py-10 px-4 border border-dashed border-midnight-700 rounded">
      <p className="text-sm font-medium text-porcelain-100">{title}</p>
      {children && <p className="text-xs text-porcelain-200 mt-2 max-w-sm mx-auto">{children}</p>}
    </div>
  )
}

/** A horizontal share bar used for completion-against-commitment. */
export function ShareBar({ percent, tone = 'verified', label }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs mb-1.5">
        <span className="text-porcelain-200">{label}</span>
        <span className={`font-mono ${TONE_CLASS[tone]}`}>{clamped.toFixed(0)}%</span>
      </div>
      <div
        className="h-2 bg-midnight-950 rounded overflow-hidden border border-midnight-700"
        role="img"
        aria-label={`${label}: ${clamped.toFixed(0)} percent`}
      >
        <div
          className={`h-full ${TONE_FILL[tone]} transition-[width] duration-240`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export { TONE_CLASS, TONE_FILL, TONE_TINT, TONE_GLYPH }
