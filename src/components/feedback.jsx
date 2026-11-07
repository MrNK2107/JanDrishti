/**
 * Toasts, modals, and the confirmation dialog.
 *
 * These exist because the app previously gave no feedback: a write either worked
 * silently or appeared to do nothing. A product that performs an action without
 * acknowledging it reads as broken, however correct the action was.
 *
 * Toasts stack, auto-dismiss, and carry a status tone. Modals trap focus, close
 * on Escape, and confirm destructive or irreversible actions.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button, STATUS_MEANING, TONE_TEXT } from './ui'

/* --------------------------------------------------------------- toasts */

const ToastContext = createContext(null)

const TOAST_TONE = {
  success: { border: 'border-status-verified/40', bg: 'bg-status-soft-verified', glyph: '✓' },
  error: { border: 'border-status-flagged/40', bg: 'bg-status-soft-flagged', glyph: '!' },
  info: { border: 'border-status-info/40', bg: 'bg-status-soft-info', glyph: 'i' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    ({ title, description, tone = 'info', duration = 5000 }) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      setToasts((t) => [...t, { id, title, description, tone }])
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        )
      }
      return id
    },
    [dismiss]
  )

  // Clear timers on unmount so a dismissed toast cannot fire into a dead tree.
  useEffect(() => {
    const map = timers.current
    return () => {
      for (const t of map.values()) clearTimeout(t)
      map.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      toast,
      dismiss,
      success: (title, description) => toast({ title, description, tone: 'success' }),
      error: (title, description) => toast({ title, description, tone: 'error', duration: 8000 }),
      info: (title, description) => toast({ title, description, tone: 'info' }),
    }),
    [toast, dismiss]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Announce politely: a toast is information, not an interruption. */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-[min(360px,calc(100vw-2.5rem))]"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const tone = TOAST_TONE[t.tone] ?? TOAST_TONE.info
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`animate-rise bg-paper border rounded-lg shadow-raised px-4 py-3 flex gap-3 items-start ${tone.border}`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 w-5 h-5 rounded-full grid place-items-center text-2xs font-bold shrink-0 ${tone.bg} ${TONE_TEXT[t.tone === 'error' ? 'flagged' : t.tone === 'success' ? 'verified' : 'info']}`}
              >
                {tone.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-ink-muted mt-0.5 leading-snug">
                    {t.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-ink-muted hover:text-ink text-lg leading-none shrink-0 -mt-0.5"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

/* --------------------------------------------------------------- modal */

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Tab') {
        // Keep focus inside the dialog.
        const focusables = panelRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.activeElement
    panelRef.current?.querySelector('input, textarea, button')?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative bg-paper rounded-xl shadow-raised border border-hairline w-full ${widths[size]} animate-rise max-h-[calc(100vh-2rem)] flex flex-col`}
      >
        <header className="px-5 py-4 border-b border-hairline">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description && (
            <p className="text-sm text-ink-muted mt-1 leading-relaxed">{description}</p>
          )}
        </header>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && (
          <footer className="px-5 py-4 border-t border-hairline flex justify-end gap-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

/**
 * Confirmation for actions that cannot be undone. Requires the user to see the
 * consequence before committing.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, tone = 'danger', busy }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-2 leading-relaxed">
        This becomes part of the permanent audit record. It cannot be edited or removed
        afterwards.
      </p>
    </Modal>
  )
}

/* --------------------------------------------------------- status legend */

/**
 * A small explanatory popover for status vocabulary. Used wherever a reader
 * might not know what a term means.
 */
export function StatusHelp({ status, className = '' }) {
  const [open, setOpen] = useState(false)
  const meaning = STATUS_MEANING[status]
  if (!meaning) return null
  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-label={`What does ${status} mean?`}
        aria-expanded={open}
        className="w-4 h-4 rounded-full border border-border text-ink-muted text-[9px] font-bold grid place-items-center hover:border-ink hover:text-ink"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-paper border border-border rounded-lg shadow-raised px-3 py-2 text-xs text-ink-2 leading-relaxed z-30 animate-rise"
        >
          {meaning}
        </span>
      )}
    </span>
  )
}
