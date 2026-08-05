import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { PageHeader, EmptyState, Pagination, TrackingTag } from '../../components/Bits.jsx'

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
      setCustomers(res.data || [])
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

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Customers" sub="Everyone who has booked a delivery with UTHAO." />

      <form onSubmit={onSearchSubmit} className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-ghost btn-sm" type="submit">Search</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-line">Fetching customers…</div>
      ) : customers.length === 0 ? (
        <div className="table-wrap"><EmptyState title="No customers found" message="Try a different search term." /></div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.first_name} {c.last_name}</div>
                      <TrackingTag id={c.id} label="CUS" />
                    </td>
                    <td>
                      <div style={{ fontSize: 13.5 }}>{c.email}</div>
                      <div style={{ color: 'var(--ink-muted)', fontSize: 12.5 }}>{c.phone}</div>
                    </td>
                    <td></td>
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
