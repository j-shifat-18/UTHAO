export function PageHeader({ eyebrow, title, sub, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <div className="page-sub">{sub}</div>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )
}

export function TrackingTag({ id, label = 'ID' }) {
  const short = String(id || '').slice(0, 8)
  return (
    <span className="tracking-tag" title={id}>
      <span className="dot" />
      {label}-{short}
    </span>
  )
}

export function StatusBadge({ active }) {
  return (
    <span className={`badge ${active ? 'badge-success' : 'badge-muted'}`}>
      {active ? 'active' : 'inactive'}
    </span>
  )
}

export function RoleBadge({ role }) {
  const cls = role === 'admin' || role === 'manager' ? 'badge-amber' : 'badge-teal'
  return <span className={`badge ${cls}`}>{role}</span>
}

export function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}

export function Pagination({ page, totalPages, hasNextPage, hasPrevPage, onChange }) {
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className="pagination">
      <span>Page {page} of {totalPages}</span>
      <div className="controls">
        <button className="btn btn-ghost btn-sm" disabled={!hasPrevPage} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <button className="btn btn-ghost btn-sm" disabled={!hasNextPage} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}
