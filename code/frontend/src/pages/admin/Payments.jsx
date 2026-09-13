import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { paymentApi } from '../../api/paymentApi'
import { PageHeader, EmptyState, Pagination } from '../../components/Bits.jsx'
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  RefreshCcw,
  HandCoins,
  FileText,
  ReceiptText,
  Printer,
  Package,
  User,
  X,
} from 'lucide-react'

const STATUS_BADGE_COLORS = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-gray-100 text-gray-700 border-gray-200',
}

const STATUS_ICONS = {
  pending: <Clock size={14} className="text-amber-500" />,
  completed: <CheckCircle size={14} className="text-green-500" />,
  failed: <XCircle size={14} className="text-red-500" />,
  refunded: <Clock size={14} className="text-gray-500" />,
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [revenueSummary, setRevenueSummary] = useState(null)

  // Action Modals
  const [actionPayment, setActionPayment] = useState(null)
  const [actionType, setActionType] = useState(null) // 'verify', 'refund', 'fail', 'details', 'invoice'
  const [actionNotes, setActionNotes] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  // Invoice Data for modal
  const [invoiceData, setInvoiceData] = useState(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  async function loadData(page = 1) {
    setLoading(true)
    setError('')
    try {
      // Load Payments with plain object query params
      const queryParams = {
        page,
        limit: 10,
        status: statusFilter || undefined,
      }
      
      const res = await paymentApi.getAllPayments(queryParams)
      let list = res.data?.data || []
      
      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(
          (p) =>
            p.transaction_id?.toLowerCase().includes(q) ||
            p.tracking_number?.toLowerCase().includes(q) ||
            p.parcel_id?.toLowerCase().includes(q) ||
            p.customer_first_name?.toLowerCase().includes(q) ||
            p.customer_email?.toLowerCase().includes(q)
        )
      }
      setPayments(list)
      setMeta(res.data?.meta || { page: 1, totalPages: 1 })

      // Load Revenue Summary
      try {
        const revRes = await paymentApi.getPaymentRevenue()
        setRevenueSummary(revRes.data?.data?.summary)
      } catch {
        // Fallback revenue summary if stored function is unavailable
        const totalPaid = list
          .filter((l) => l.status === 'completed')
          .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
        setRevenueSummary({
          net_revenue: totalPaid.toFixed(2),
          total_payments: list.length.toString(),
          total_refunded: '0.00',
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(1)
  }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function openActionModal(payment, type) {
    setActionPayment(payment)
    setActionType(type)
    setActionNotes('')
    setTransactionId('')
    setActionError('')
    setInvoiceData(null)

    if (type === 'invoice') {
      setLoadingInvoice(true)
      try {
        const invRes = await paymentApi.getPaymentInvoice(payment.id)
        const data = invRes.data?.data || invRes.data
        if (data) {
          setInvoiceData(data)
        } else {
          throw new Error('Empty invoice data')
        }
      } catch {
        // Fallback to synthesizing invoice from payment details
        const amt = Number(payment.amount || 0)
        setInvoiceData({
          id: payment.id,
          invoice_number: `INV-${new Date(payment.created_at || Date.now()).toISOString().slice(0, 10).replace(/-/g, '')}-${payment.id.substring(0, 8).toUpperCase()}`,
          payment_id: payment.id,
          customer_id: payment.customer_id,
          amount: amt,
          tax_amount: Number((amt * 0.05).toFixed(2)),
          total_amount: Number((amt * 1.05).toFixed(2)),
          issued_at: payment.paid_at || payment.created_at || new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          status: payment.status === 'completed' ? 'paid' : (payment.status === 'refunded' ? 'cancelled' : 'issued'),
          parcel_id: payment.parcel_id,
          transaction_id: payment.transaction_id,
          tracking_number: payment.tracking_number,
          delivery_cost: payment.delivery_cost,
          customer_first_name: payment.customer_first_name,
          customer_last_name: payment.customer_last_name,
          customer_email: payment.customer_email,
          customer_phone: payment.customer_phone,
        })
      } finally {
        setLoadingInvoice(false)
      }
    }
  }

  async function handleActionSubmit(e) {
    e.preventDefault()
    if (!actionPayment) return
    setActionLoading(true)
    setActionError('')

    try {
      if (actionType === 'verify') {
        await paymentApi.verifyPayment(actionPayment.id, {
          transaction_id: transactionId.trim() || undefined,
        })
      } else if (actionType === 'refund') {
        await paymentApi.refundPayment(actionPayment.id, {
          notes: actionNotes.trim() || 'Refunded by administrator',
        })
      } else if (actionType === 'fail') {
        await paymentApi.failPayment(actionPayment.id, {
          notes: actionNotes.trim() || 'Marked failed by staff',
        })
      }
      setActionPayment(null)
      loadData(meta.page)
    } catch (err) {
      setActionError(err.message || `Failed to ${actionType} payment`)
    } finally {
      setActionLoading(false)
    }
  }

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Failed', value: 'failed' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Payment Operations"
        sub="Manage payments, verify COD collections, inspect tax invoices, and process refunds."
      />

      {/* Revenue Summary Cards */}
      {revenueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <HandCoins size={20} />
              </div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-mono">
              ৳{Number(revenueSummary.net_revenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <CreditCard size={20} />
              </div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Payments</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-mono">{revenueSummary.total_payments || 0}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                <RefreshCcw size={20} />
              </div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Refunded</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-mono">
              ৳{Number(revenueSummary.total_refunded || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-2xl">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                statusFilter === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative w-full sm:w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-9 pr-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white w-full"
              placeholder="Search tracking, user, TRX…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => loadData(1)}
            className="p-2 border border-gray-200 rounded-xl bg-white text-gray-600 hover:text-gray-900 hover:border-gray-900 transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 font-mono">Loading payments…</div>
        ) : payments.length === 0 ? (
          <EmptyState title="No payments found" message="There are no payment records matching this filter." />
        ) : (
          <>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Transaction</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Date</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Amount & Method</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => {
                  const badgeColor = STATUS_BADGE_COLORS[p.status] || 'bg-gray-100 text-gray-700'
                  const tracking = p.tracking_number || (p.parcel_id ? `${p.parcel_id.substring(0, 8)}...` : 'N/A')
                  const methodName = p.payment_method_name || p.payment_method || 'Payment'
                  const customerName = p.customer_first_name ? `${p.customer_first_name} ${p.customer_last_name || ''}` : 'Customer'

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <CreditCard size={18} className="text-gray-400 shrink-0" />
                          <div>
                            <p className="font-mono font-bold text-gray-900">{p.transaction_id || 'N/A'}</p>
                            <p className="text-[11px] text-gray-500 font-medium">Tracking: <span className="font-mono font-semibold text-gray-800">{tracking}</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 text-xs">{customerName}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{p.customer_email || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800 text-xs">
                          {new Date(p.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {new Date(p.created_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900 font-mono text-sm">৳{Number(p.amount).toFixed(2)}</p>
                        <span className="text-[10px] uppercase font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block mt-0.5">
                          {methodName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor} capitalize`}>
                          {STATUS_ICONS[p.status]}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openActionModal(p, 'details')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                        >
                          <Search size={13} /> Details
                        </motion.button>
                        {p.status === 'completed' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openActionModal(p, 'invoice')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
                          >
                            <FileText size={13} /> Invoice
                          </motion.button>
                        )}
                        {p.status === 'pending' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openActionModal(p, 'verify')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
                            >
                              <CheckCircle size={13} /> Verify
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openActionModal(p, 'fail')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
                            >
                              <XCircle size={13} /> Fail
                            </motion.button>
                          </>
                        )}
                        {p.status === 'completed' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openActionModal(p, 'refund')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all"
                          >
                            <RefreshCcw size={13} /> Refund
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              hasNextPage={meta.hasNextPage}
              hasPrevPage={meta.hasPrevPage}
              onChange={loadData}
            />
          </>
        )}
      </div>

      {/* Action / Details / Invoice Modal */}
      <AnimatePresence>
        {actionPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-gray-100 space-y-4 my-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900">
                  <AlertCircle
                    size={22}
                    className={
                      actionType === 'verify'
                        ? 'text-green-600'
                        : actionType === 'refund'
                        ? 'text-amber-600'
                        : actionType === 'invoice'
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                    }
                  />
                  <h3 className="font-bold text-lg capitalize">{actionType} Payment</h3>
                </div>
                <button
                  onClick={() => setActionPayment(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {actionError && (
                <div className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs">
                  {actionError}
                </div>
              )}

              {/* View 1: Details */}
              {actionType === 'details' && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-xl text-xs space-y-2 text-gray-700 border border-gray-100">
                    <p><span className="font-semibold text-gray-900">Payment ID:</span> <span className="font-mono">{actionPayment.id}</span></p>
                    <p><span className="font-semibold text-gray-900">Tracking Number:</span> <span className="font-mono font-bold text-red-600">{actionPayment.tracking_number || actionPayment.parcel_id}</span></p>
                    <p><span className="font-semibold text-gray-900">Customer:</span> {actionPayment.customer_first_name ? `${actionPayment.customer_first_name} ${actionPayment.customer_last_name || ''}` : 'N/A'}</p>
                    <p><span className="font-semibold text-gray-900">Customer Email:</span> {actionPayment.customer_email || 'N/A'}</p>
                    <p><span className="font-semibold text-gray-900">Customer Phone:</span> {actionPayment.customer_phone || 'N/A'}</p>
                    <p><span className="font-semibold text-gray-900">Amount:</span> ৳{Number(actionPayment.amount).toFixed(2)}</p>
                    <p><span className="font-semibold text-gray-900">Method:</span> <span className="uppercase text-xs bg-gray-200 px-1.5 py-0.5 rounded font-semibold">{actionPayment.payment_method_name || actionPayment.payment_method}</span></p>
                    <p><span className="font-semibold text-gray-900">Transaction ID:</span> <span className="font-mono">{actionPayment.transaction_id || 'N/A'}</span></p>
                    <p><span className="font-semibold text-gray-900">Status:</span> <span className={`uppercase text-xs px-2 py-0.5 rounded font-semibold ${actionPayment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{actionPayment.status}</span></p>
                    {actionPayment.notes && <p><span className="font-semibold text-gray-900">Notes:</span> {actionPayment.notes}</p>}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActionPayment(null)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* View 2: Invoice Modal */}
              {actionType === 'invoice' && (
                <div className="space-y-4">
                  {loadingInvoice ? (
                    <div className="p-8 text-center text-sm font-mono text-gray-400">Loading invoice data…</div>
                  ) : invoiceData ? (
                    <div className="space-y-3">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                          <span className="font-bold text-gray-800">Invoice Number</span>
                          <span className="font-mono font-bold text-red-600">{invoiceData.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tracking Number</span>
                          <span className="font-mono font-semibold text-gray-900">{invoiceData.tracking_number || actionPayment.tracking_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Customer</span>
                          <span className="font-medium text-gray-800">{invoiceData.customer_first_name} {invoiceData.customer_last_name || ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subtotal (Delivery Fee)</span>
                          <span className="font-mono font-medium text-gray-900">৳{Number(invoiceData.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">5% Tax / VAT</span>
                          <span className="font-mono font-medium text-gray-900">৳{Number(invoiceData.tax_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold">
                          <span className="text-gray-900">Total Billed</span>
                          <span className="font-mono text-red-600">৳{Number(invoiceData.total_amount || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                        >
                          <Printer size={14} /> Print
                        </button>
                        <button
                          type="button"
                          onClick={() => setActionPayment(null)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">No invoice found for this payment record.</div>
                  )}
                </div>
              )}

              {/* View 3: Actions (Verify, Refund, Fail) */}
              {actionType !== 'details' && actionType !== 'invoice' && (
                <form onSubmit={handleActionSubmit} className="space-y-4">
                  <p className="text-xs text-gray-600">
                    Are you sure you want to <strong>{actionType}</strong> payment for tracking{' '}
                    <strong className="font-mono text-red-600">{actionPayment.tracking_number || actionPayment.parcel_id}</strong> (৳{actionPayment.amount})?
                  </p>

                  {actionType === 'verify' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
                        Transaction ID (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white font-mono"
                        placeholder="e.g. COD-20260913-XXXXX"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>
                  )}

                  {(actionType === 'refund' || actionType === 'fail') && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
                        Notes / Reason *
                      </label>
                      <textarea
                        rows={2}
                        required
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
                        placeholder="Provide a valid reason..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActionPayment(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-all"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={actionLoading}
                      className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 ${
                        actionType === 'verify'
                          ? 'bg-green-600 hover:bg-green-700'
                          : actionType === 'refund'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {actionLoading ? 'Processing…' : `Confirm ${actionType}`}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
