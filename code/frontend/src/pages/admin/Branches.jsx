import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'
import { PageHeader, StatusBadge, EmptyState, Pagination, TrackingTag } from '../../components/Bits.jsx'
import { Plus, Edit2, X, Building2, MapPin, Phone, Mail, Clock } from 'lucide-react'

const inputClass = 'w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white text-gray-800'
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider'

export default function Branches() {
  const [branches, setBranches] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  // Managers list for dropdown
  const [managers, setManagers] = useState([])

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    address: '',
    phone: '',
    email: '',
    manager_id: '',
    opening_time: '',
    closing_time: '',
    is_active: true,
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadBranches(page = 1) {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (search) params.set('search', search)
    if (cityFilter) params.set('city', cityFilter)
    if (statusFilter !== '') params.set('is_active', statusFilter)

    try {
      const res = await api.get(`/branches?${params.toString()}`)
      const body = res.data
      setBranches(body.data || [])
      setMeta(body.meta || { page: 1, totalPages: 1 })
    } catch (err) {
      setError(err.message || 'Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  async function loadManagers() {
    try {
      const res = await api.get('/users?limit=100')
      const body = res.data
      // Filter manager/admin roles
      const list = (body.data || []).filter((u) => u.role === 'manager' || u.role === 'admin')
      setManagers(list)
    } catch {
      // Ignore if user endpoint fails
    }
  }

  useEffect(() => {
    loadBranches(1)
    loadManagers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e) {
    e.preventDefault()
    loadBranches(1)
  }

  function openCreateModal() {
    setEditingBranch(null)
    setFormData({
      name: '',
      code: '',
      city: '',
      state: '',
      address: '',
      phone: '',
      email: '',
      manager_id: '',
      opening_time: '',
      closing_time: '',
      is_active: true,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditModal(branch) {
    setEditingBranch(branch)
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      city: branch.city || '',
      state: branch.state || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager_id: branch.manager_id ? String(branch.manager_id) : '',
      opening_time: branch.opening_time || '',
      closing_time: branch.closing_time || '',
      is_active: branch.is_active ?? true,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingBranch(null)
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    // Validation
    if (!formData.name.trim()) {
      setFormError('Branch name is required')
      setSubmitting(false)
      return
    }
    if (!formData.code.trim()) {
      setFormError('Branch code is required')
      setSubmitting(false)
      return
    }
    if (!formData.city.trim()) {
      setFormError('City is required')
      setSubmitting(false)
      return
    }
    if (!formData.state.trim()) {
      setFormError('State is required')
      setSubmitting(false)
      return
    }
    if (!formData.address.trim()) {
      setFormError('Address is required')
      setSubmitting(false)
      return
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      manager_id: formData.manager_id ? parseInt(formData.manager_id, 10) : null,
      opening_time: formData.opening_time || null,
      closing_time: formData.closing_time || null,
      is_active: formData.is_active,
    }

    try {
      if (editingBranch) {
        await api.patch(`/branches/${editingBranch.id}`, payload)
      } else {
        await api.post('/branches', payload)
      }
      closeModal()
      loadBranches(meta.page)
    } catch (err) {
      setFormError(err.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(branch) {
    setBusyId(branch.id)
    try {
      if (branch.is_active) {
        await api.delete(`/branches/${branch.id}`)
      } else {
        await api.patch(`/branches/${branch.id}`, { is_active: true })
      }
      setBranches((list) =>
        list.map((b) => (b.id === branch.id ? { ...b, is_active: !b.is_active } : b))
      )
    } catch (err) {
      setError(err.message || 'Failed to update branch status')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Branches"
        sub="Manage company hubs, regional centers, and branch locations."
        actions={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-900/10 transition-all"
          >
            <Plus size={16} />
            Add Branch
          </motion.button>
        }
      />

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-[200px] px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="w-[160px] px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
          placeholder="Filter city…"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
        <select
          className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-700"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
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

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400 font-mono">Fetching branches…</p>
      ) : branches.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <EmptyState title="No branches found" message="Try adjusting your filters or add a new branch." />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Branch Details</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Location</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Contact</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Hours</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-red-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">{b.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                              {b.code}
                            </span>
                            <TrackingTag id={b.id} label="BR" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-1.5 text-xs text-gray-600">
                        <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800">{b.city}, {b.state}</p>
                          <p className="text-gray-400 text-[11px] truncate max-w-[180px]">{b.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {b.phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={12} className="text-gray-400" />
                            <span>{b.phone}</span>
                          </div>
                        )}
                        {b.email && (
                          <div className="flex items-center gap-1">
                            <Mail size={12} className="text-gray-400" />
                            <span className="truncate max-w-[140px]">{b.email}</span>
                          </div>
                        )}
                        {!b.phone && !b.email && <span className="text-gray-400 italic">No contact info</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {b.opening_time || b.closing_time ? (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock size={12} className="text-gray-400" />
                          <span>{b.opening_time || '?'} - {b.closing_time || '?'}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">24/7 or unspecified</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge active={b.is_active} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditModal(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-900 transition-all"
                      >
                        <Edit2 size={12} />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={busyId === b.id}
                        onClick={() => toggleStatus(b)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 ${
                          b.is_active
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'text-gray-600 border-gray-200 hover:border-gray-900'
                        }`}
                      >
                        {busyId === b.id ? '...' : b.is_active ? 'Deactivate' : 'Activate'}
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
            onChange={loadBranches}
          />
        </>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-red-600" />
                  <h3 className="font-bold text-gray-900 text-lg">
                    {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {formError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Branch Name *</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Dhaka Central Hub"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Branch Code *</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. BR-DHK-01"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>City *</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Dhaka"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>State / Region *</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Dhaka Division"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Full Address *</label>
                  <textarea
                    rows={2}
                    className={inputClass}
                    placeholder="Street, area, building details…"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. +8801700000000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="e.g. dhaka@uthao.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Opening Time</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={formData.opening_time}
                      onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Closing Time</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={formData.closing_time}
                      onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Branch Manager (Optional)</label>
                  <select
                    className={inputClass}
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  >
                    <option value="">-- Select Manager --</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.email} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                {editingBranch && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Active Branch
                    </label>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-900/10 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Saving…' : editingBranch ? 'Update Branch' : 'Create Branch'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
