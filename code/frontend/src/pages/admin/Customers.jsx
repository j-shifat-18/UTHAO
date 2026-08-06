import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../../api/client'
import { PageHeader, EmptyState, Pagination, TrackingTag } from '../../components/Bits.jsx'

const inputClass = 'flex-1 min-w-[180px] px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(page = 1) {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (search) params.set('search', search)
    try {
      const res = await api.get(`/customers?${params.toString()}`)
      // Axios: res.data = { data: [...], meta: {...} }
      const body = res.data
      setCustomers(body.data || [])
      setMeta(body.meta || { page: 1, totalPages: 1 })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function onSearchSubmit(e) {
    e.preventDefault()
    load(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Customers" sub="Everyone who has booked a delivery with UTHAO." />

      <form onSubmit={onSearchSubmit} className="flex flex-wrap gap-3 items-center">
        <input
          className={inputClass}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition-all"
        >
          Search
        </motion.button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 font-mono">Fetching customers…</p>
      ) : customers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <EmptyState title="No customers found" message="Try a different search term." />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Contact</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{c.first_name} {c.last_name}</p>
                      <TrackingTag id={c.id} label="CUS" />
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700">{c.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.phone}</p>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            hasNextPage={meta.hasNextPage}
            hasPrevPage={meta.hasPrevPage}
            onChange={load}
          />
        </>
      )}
    </div>
  )
}
