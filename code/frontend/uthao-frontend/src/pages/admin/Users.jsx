import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { PageHeader, StatusBadge, RoleBadge, EmptyState, Pagination, TrackingTag } from '../../components/Bits.jsx'

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
      setUsers(res.data || [])
      setMeta(res.meta || { page: 1, totalPages: 1 })
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
    <div>
      <PageHeader eyebrow="Administration" title="Users" sub="All accounts registered on the platform." />

      <form onSubmit={onSearchSubmit} className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select-input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn btn-ghost btn-sm" type="submit">Filter</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-line">Fetching users…</div>
      ) : users.length === 0 ? (
        <div className="table-wrap"><EmptyState title="No users found" message="Try a different search term or role filter." /></div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{u.email}</div>
                      <TrackingTag id={u.id} label="USR" />
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td><StatusBadge active={u.is_active} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-danger-ghost' : 'btn-ghost'}`}
                        disabled={busyId === u.id}
                        onClick={() => toggleActive(u)}
                      >
                        {busyId === u.id ? 'Working…' : u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
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
