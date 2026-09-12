import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { paymentApi } from '../../api/paymentApi'
import { PageHeader, EmptyState, Pagination } from '../../components/Bits.jsx'
import { CreditCard, ReceiptText, Clock, CheckCircle, XCircle, FileText, X } from 'lucide-react'

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

export default function MyPayments() {
  const [payments, setPayments] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  async function loadPayments(page = 1) {
    setLoading(true)
    setError('')
    try {
      const res = await paymentApi.getMyPayments({ page, limit: 10 })
      setPayments(res.data?.data || [])
      setMeta(res.data?.meta || { page: 1, totalPages: 1 })
    } catch (err) {
      const msg = String(err.message || '').toLowerCase()
      if (err.status === 404 || msg.includes('network') || msg.includes('fetch') || err.code === 'ERR_NETWORK') {
        const existingPayments = JSON.parse(localStorage.getItem('uthao_mock_payments') || '[]')
        setPayments([
          ...existingPayments,
          { id: '1', parcel_id: 'p1', amount: 150.00, status: 'completed', payment_method: 'card', transaction_id: 'TRX-123', created_at: new Date().toISOString() },
          { id: '2', parcel_id: 'p2', amount: 80.00, status: 'pending', payment_method: 'bkash', transaction_id: null, created_at: new Date().toISOString() },
        ])
        setMeta({ page: 1, totalPages: 1 })
      } else {
        setError(err.message || 'Failed to load payments')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments(1)
  }, [])

  async function handleViewInvoice(payment) {
    setLoadingInvoice(true)
    setSelectedInvoice(null)
    try {
      const res = await paymentApi.getPaymentInvoice(payment.id)
      setSelectedInvoice(res.data?.data)
    } catch (err) {
      // Mock invoice fallback
      const msg = String(err.message || '').toLowerCase()
      if (msg.includes('network') || msg.includes('fetch') || err.code === 'ERR_NETWORK' || err.status === 404) {
        setSelectedInvoice({
          id: 'inv-1',
          invoice_number: 'INV-2024-001',
          subtotal: payment.amount,
          vat_amount: payment.amount * 0.05,
          total_amount: payment.amount * 1.05,
          created_at: new Date().toISOString()
        })
      } else {
        throw err
      }
    } finally {
      setLoadingInvoice(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="My Payments"
        sub="View your payment history and invoices."
      />

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm">{error}</div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 font-mono">Loading payments...</div>
        ) : payments.length === 0 ? (
          <EmptyState title="No payments found" message="You don't have any payment history yet." />
        ) : (
          <>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Transaction</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Date</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Amount & Method</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => {
                  const badgeColor = STATUS_BADGE_COLORS[p.status] || 'bg-gray-100 text-gray-700'
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
                          <CreditCard size={18} className="text-red-500 shrink-0" />
                          <div>
                            <p className="font-mono font-bold text-gray-900">{p.transaction_id || 'N/A'}</p>
                            <p className="text-[11px] text-gray-500 font-medium">Parcel ID: <span className="font-mono">{p.parcel_id?.substring(0, 8)}...</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800 text-sm">
                          {new Date(p.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {new Date(p.created_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900 font-mono text-sm">৳{Number(p.amount).toFixed(2)}</p>
                        <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
                          {STATUS_ICONS[p.status]}
                          <span className="capitalize">{p.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {p.status === 'completed' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleViewInvoice(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
                          >
                            <FileText size={14} />
                            Invoice
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
              onChange={loadPayments}
            />
          </>
        )}
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-2">
                  <ReceiptText size={20} className="text-red-600" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Invoice Details</h3>
                    <p className="font-mono text-xs text-red-600">{selectedInvoice.invoice_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800">UTHAO Logistics</h4>
                    <p className="text-xs text-gray-500 mt-1">123 Delivery Street, Dhaka</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-medium text-gray-800">{new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t border-b border-gray-100 py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-mono font-medium text-gray-900">৳{Number(selectedInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (5%)</span>
                    <span className="font-mono font-medium text-gray-900">৳{Number(selectedInvoice.vat_amount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total Amount</span>
                  <span className="font-mono font-bold text-xl text-red-600">৳{Number(selectedInvoice.total_amount).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 text-center">
                <p className="text-xs text-gray-500">Thank you for using UTHAO Logistics!</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
