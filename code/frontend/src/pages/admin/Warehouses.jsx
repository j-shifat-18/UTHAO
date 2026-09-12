import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'
import { PageHeader, StatusBadge, EmptyState, Pagination } from '../../components/Bits.jsx'
import { Plus, Edit2, X, Warehouse as WarehouseIcon, MapPin, Building, Package } from 'lucide-react'

const inputClass = 'w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white text-gray-800'
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider'

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([])
  const [branches, setBranches] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    branch_id: '',
    city: '',
    address: '',
    total_capacity: '',
    is_active: true,
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadWarehouses(page = 1) {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (search) params.set('search', search)
    if (cityFilter) params.set('city', cityFilter)
    if (branchFilter) params.set('branch_id', branchFilter)
    if (statusFilter !== '') params.set('is_active', statusFilter)

    try {
      const res = await api.get(`/warehouses?${params.toString()}`)
      const body = res.data
      setWarehouses(body.data || [])
      setMeta(body.meta || { page: 1, totalPages: 1 })
    } catch (err) {
      setError(err.message || 'Failed to load warehouses')
    } finally {
      setLoading(false)
    }
  }

  async function loadBranchesList() {
    try {
      const res = await api.get('/branches?limit=100')
      const body = res.data
      setBranches(body.data || [])
    } catch {
      // Ignore if branches fetch fails
    }
  }

  useEffect(() => {
    loadWarehouses(1)
    loadBranchesList()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e) {
    e.preventDefault()
    loadWarehouses(1)
  }

  function openCreateModal() {
    setEditingWarehouse(null)
    setFormData({
      name: '',
      code: '',
      branch_id: '',
      city: '',
      address: '',
      total_capacity: '1000',
      is_active: true,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditModal(wh) {
    setEditingWarehouse(wh)
    setFormData({
      name: wh.name || '',
      code: wh.code || '',
      branch_id: wh.branch_id ? String(wh.branch_id) : '',
      city: wh.city || '',
      address: wh.address || '',
      total_capacity: wh.total_capacity ? String(wh.total_capacity) : '',
      is_active: wh.is_active ?? true,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingWarehouse(null)
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    // Validation
    if (!formData.name.trim()) {
      setFormError('Warehouse name is required')
      setSubmitting(false)
      return
    }
    if (!formData.code.trim()) {
      setFormError('Warehouse code is required')
      setSubmitting(false)
      return
    }
    if (!formData.city.trim()) {
      setFormError('City is required')
      setSubmitting(false)
      return
    }
    if (!formData.address.trim()) {
      setFormError('Address is required')
      setSubmitting(false)
      return
    }
    const capacityNum = parseInt(formData.total_capacity, 10)
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setFormError('Total capacity must be a positive number')
      setSubmitting(false)
      return
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      branch_id: formData.branch_id ? parseInt(formData.branch_id, 10) : null,
      city: formData.city.trim(),
      address: formData.address.trim(),
      total_capacity: capacityNum,
      is_active: formData.is_active,
    }

    try {
      if (editingWarehouse) {
        await api.patch(`/warehouses/${editingWarehouse.id}`, payload)
      } else {
        await api.post('/warehouses', payload)
      }
      closeModal()
      loadWarehouses(meta.page)
    } catch (err) {
      setFormError(err.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(wh) {
    setBusyId(wh.id)
    try {
      if (wh.is_active) {
        await api.delete(`/warehouses/${wh.id}`)
      } else {
        await api.patch(`/warehouses/${wh.id}`, { is_active: true })
      }
      setWarehouses((list) =>
        list.map((w) => (w.id === wh.id ? { ...w, is_active: !w.is_active } : w))
      )
    } catch (err) {
      setError(err.message || 'Failed to update warehouse status')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Warehouses"
        sub="Manage storage facilities, sorting hubs, and capacity allocations."
        actions={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-900/10 transition-all"
          >
            <Plus size={16} />
            Add Warehouse
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
          className="w-[150px] px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
          placeholder="Filter city…"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
        <select
          className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-700"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </select>
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
        <p className="text-sm text-gray-400 font-mono">Fetching warehouses…</p>
      ) : warehouses.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <EmptyState title="No warehouses found" message="Try adjusting your filters or add a new warehouse." />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Warehouse</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Branch</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Location</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Capacity & Occupancy</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w, i) => {
                  const capacity = w.total_capacity || 1
                  const occupancy = w.current_occupancy || 0
                  const percentage = Math.min(100, Math.round((occupancy / capacity) * 100))

                  return (
                    <motion.tr
                      key={w.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <WarehouseIcon size={18} className="text-red-500 shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">{w.name}</p>
                            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {w.code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {w.branch_name ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                            <Building size={14} className="text-gray-400" />
                            <span>{w.branch_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-1.5 text-xs text-gray-600">
                          <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-800">{w.city}</p>
                            <p className="text-gray-400 text-[11px] truncate max-w-[160px]">{w.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-xs font-mono text-gray-600">
                            <span className="flex items-center gap-1">
                              <Package size={11} className="text-gray-400" />
                              {occupancy} / {capacity}
                            </span>
                            <span className="font-semibold text-gray-700">{percentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentage > 85
                                  ? 'bg-red-500'
                                  : percentage > 60
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge active={w.is_active} />
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openEditModal(w)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-900 transition-all"
                        >
                          <Edit2 size={12} />
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={busyId === w.id}
                          onClick={() => toggleStatus(w)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 ${
                            w.is_active
                              ? 'text-red-600 border-red-200 hover:bg-red-50'
                              : 'text-gray-600 border-gray-200 hover:border-gray-900'
                          }`}
                        >
                          {busyId === w.id ? '...' : w.is_active ? 'Deactivate' : 'Activate'}
                        </motion.button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            hasNextPage={meta.hasNextPage}
            hasPrevPage={meta.hasPrevPage}
            onChange={loadWarehouses}
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
                  <WarehouseIcon size={18} className="text-red-600" />
                  <h3 className="font-bold text-gray-900 text-lg">
                    {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
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
                    <label className={labelClass}>Warehouse Name *</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Uttara Storage Facility"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Warehouse Code *</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. WH-UTR-01"
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
                    <label className={labelClass}>Associated Branch</label>
                    <select
                      className={inputClass}
                      value={formData.branch_id}
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    >
                      <option value="">-- Select Branch --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Full Address *</label>
                  <textarea
                    rows={2}
                    className={inputClass}
                    placeholder="Street address, area details…"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>Total Parcel Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    className={inputClass}
                    placeholder="e.g. 5000"
                    value={formData.total_capacity}
                    onChange={(e) => setFormData({ ...formData, total_capacity: e.target.value })}
                  />
                </div>

                {editingWarehouse && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_active_wh"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="is_active_wh" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Active Warehouse
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
                    {submitting ? 'Saving…' : editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
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
