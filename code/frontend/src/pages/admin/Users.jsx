import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../../api/client'
import { PageHeader, StatusBadge, RoleBadge, EmptyState, Pagination, TrackingTag } from '../../components/Bits.jsx'

const inputClass = 'flex-1 min-w-[180px] px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white'
const selectClass = 'px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-700'

export default function Users() {
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function load(page = 1) {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    try {
      const res = await api.get(`/users?${params.toString()}`)
      // Axios: res.data = { data: [...], meta: {...} }
      const body = res.data
      setUsers(body.data || [])
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

  async function toggleActive(user) {
    setBusyId(user.id)
    const action = user.is_active ? 'deactivate' : 'activate'
    try {
      await api.patch(`/users/${user.id}/${action}`)
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Users" sub="All accounts registered on the platform." />

      <form onSubmit={onSearchSubmit} className="flex flex-wrap gap-3 items-center">
        <input
          className={inputClass}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition-all"
        >
          Filter
        </motion.button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 font-mono">Fetching users…</p>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <EmptyState title="No users found" message="Try a different search term or role filter." />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Role</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{u.email}</p>
                      <TrackingTag id={u.id} label="USR" />
                    </td>
                    <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3.5"><StatusBadge active={u.is_active} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={busyId === u.id}
                        onClick={() => toggleActive(u)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 ${
                          u.is_active
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'text-gray-600 border-gray-200 hover:border-gray-900'
                        }`}
                      >
                        {busyId === u.id ? 'Working…' : u.is_active ? 'Deactivate' : 'Activate'}
                      </motion.button>
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
