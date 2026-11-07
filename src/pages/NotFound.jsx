import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas grid place-items-center px-5">
      <div className="text-center max-w-md">
        <span
          aria-hidden="true"
          className="inline-grid place-items-center w-12 h-12 rounded-xl bg-accent text-paper font-bold text-lg"
        >
          ज
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          That address does not correspond to anything in the ward record. It may have
          been moved, or the link may be incomplete.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-ink-2"
          >
            Go to the homepage
          </Link>
          <Link
            to="/record"
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-ink hover:bg-sunken"
          >
            View the public record
          </Link>
        </div>
      </div>
    </div>
  )
}
