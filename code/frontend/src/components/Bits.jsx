import { motion } from 'framer-motion'

export function PageHeader({ eyebrow, title, sub, actions }) {
  return (
    <div className="flex items-end justify-between gap-5 mb-7 flex-wrap">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )
}

export function TrackingTag({ id, label = 'ID' }) {
  const short = String(id || '').slice(0, 8)
  return (
    <span
      title={id}
      className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-300 rounded px-2 py-0.5"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      {label}-{short}
    </span>
  )
}

export function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
        active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {active ? 'active' : 'inactive'}
    </span>
  )
}

export function RoleBadge({ role }) {
  const isAdmin = role === 'admin' || role === 'manager'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
        isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-600'
      }`}
    >
      {role}
    </span>
  )
}

export function EmptyState({ title, message }) {
  return (
    <div className="text-center py-14 px-6">
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}

export function Pagination({ page, totalPages, hasNextPage, hasPrevPage, onChange }) {
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
      <span>Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:border-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!hasPrevPage}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:border-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!hasNextPage}
          onClick={() => onChange(page + 1)}
        >
          Next
        </motion.button>
      </div>
    </div>
  )
}
