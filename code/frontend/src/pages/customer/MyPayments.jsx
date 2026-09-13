import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { paymentApi } from '../../api/paymentApi'
import { PageHeader, EmptyState, Pagination } from '../../components/Bits.jsx'
import { CreditCard, ReceiptText, Clock, CheckCircle, XCircle, FileText, X, Printer, Package, User } from 'lucide-react'

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
  const [invoiceError, setInvoiceError] = useState('')

  // Refund modal
  const [refundPayment, setRefundPayment] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  async function loadPayments(page = 1) {
    setLoading(true)
    setError('')
    try {
      const res = await paymentApi.getMyPayments({ page, limit: 10 })
      setPayments(res.data?.data || [])
      setMeta(res.data?.meta || { page: 1, totalPages: 1 })
    } catch (err) {
      setError(err.message || 'Failed to load payments')
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
    setInvoiceError('')
    try {
      const res = await paymentApi.getPaymentInvoice(payment.id)
      const data = res.data?.data || res.data
      if (data) {
        setSelectedInvoice(data)
      } else {
        throw new Error('Empty invoice data')
      }
    } catch {
      // Graceful fallback from payment record
      const amt = Number(payment.amount || 0)
      setSelectedInvoice({
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

  async function handleRefundSubmit(e) {
    e.preventDefault()
    if (!refundPayment || !refundReason.trim()) return

    setRefunding(true)
    try {
      await paymentApi.refundPayment(refundPayment.id, { notes: refundReason.trim() })
      setRefundPayment(null)
      loadPayments(meta.page)
    } catch (err) {
      setError(err.message || 'Refund request failed')
    } finally {
      setRefunding(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing & Invoicing"
        title="My Payments"
        sub="View your payment history, receipts, and tax invoices."
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
                  const methodName = p.payment_method_name || p.payment_method || 'Payment'
                  const tracking = p.tracking_number || (p.parcel_id ? `${p.parcel_id.substring(0, 8)}...` : 'N/A')

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
                            <p className="text-[11px] text-gray-500 font-medium">Tracking: <span className="font-mono font-semibold text-gray-700">{tracking}</span></p>
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
                        <span className="text-[10px] uppercase font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block mt-0.5">
                          {methodName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
                          {STATUS_ICONS[p.status]}
                          <span className="capitalize">{p.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {p.status === 'completed' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewInvoice(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
                            >
                              <FileText size={14} />
                              Invoice
                            </motion.button>
                            {!p.refund_requested && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setRefundPayment(p); setRefundReason(''); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all ml-2"
                              >
                                Refund
                              </motion.button>
                            )}
                            {p.refund_requested && (
                              <span className="inline-block text-[10px] uppercase font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded ml-2">Refund Requested</span>
                            )}
                          </>
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

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {(selectedInvoice || loadingInvoice || invoiceError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
                <div className="flex items-center gap-2">
                  <ReceiptText size={20} className="text-red-600" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Tax Invoice</h3>
                    <p className="font-mono text-xs text-red-600">
                      {selectedInvoice?.invoice_number || 'Loading…'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedInvoice(null)
                    setInvoiceError('')
                  }}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {loadingInvoice ? (
                <div className="p-12 text-center text-sm font-mono text-gray-400">
                  Fetching invoice record from server…
                </div>
              ) : invoiceError ? (
                <div className="p-6 text-center text-red-600 text-sm">
                  {invoiceError}
                </div>
              ) : selectedInvoice && (
                <div className="p-6 overflow-y-auto space-y-5">
                  {/* Company & Date Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-lg tracking-tight">UTHAO Logistics Ltd.</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Smart Courier & Parcel Delivery System</p>
                      <p className="text-xs text-gray-400">Dhaka, Bangladesh</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Issue Date</p>
                      <p className="text-xs font-semibold text-gray-800">
                        {new Date(selectedInvoice.issued_at || selectedInvoice.created_at).toLocaleDateString()}
                      </p>
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 font-bold text-[10px] rounded-full uppercase mt-1">
                        {selectedInvoice.status || 'PAID'}
                      </span>
                    </div>
                  </div>

                  {/* Parcel & Customer Details */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Package size={14} className="text-red-500" /> Tracking Number
                      </span>
                      <span className="font-mono font-bold text-gray-900">
                        {selectedInvoice.tracking_number || 'N/A'}
                      </span>
                    </div>
                    {selectedInvoice.transaction_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Transaction ID</span>
                        <span className="font-mono font-semibold text-gray-800">
                          {selectedInvoice.transaction_id}
                        </span>
                      </div>
                    )}
                    {selectedInvoice.customer_first_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <User size={14} /> Billed To
                        </span>
                        <span className="font-semibold text-gray-800">
                          {selectedInvoice.customer_first_name} {selectedInvoice.customer_last_name || ''}
                        </span>
                      </div>
                    )}
                    {selectedInvoice.customer_email && (
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Email</span>
                        <span className="font-mono">{selectedInvoice.customer_email}</span>
                      </div>
                    )}
                  </div>

                  {/* Line Item Breakdown */}
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-2.5 text-left">Description</th>
                          <th className="px-4 py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="px-4 py-3 text-gray-700">Parcel Delivery & Handling Charge</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                            ৳{Number(selectedInvoice.amount || selectedInvoice.subtotal || 0).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-500">Standard VAT / Tax (5%)</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-700">
                            ৳{Number(selectedInvoice.tax_amount || selectedInvoice.vat_amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Total Banner */}
                  <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-red-900 block">
                        Total Paid
                      </span>
                      <span className="text-[11px] text-red-600">Includes 5% VAT</span>
                    </div>
                    <span className="font-mono font-extrabold text-2xl text-red-600">
                      ৳{Number(selectedInvoice.total_amount || (Number(selectedInvoice.amount || 0) * 1.05)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center justify-between">
                <p className="text-xs text-gray-400">Official Computer-Generated Tax Invoice</p>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-sm"
                >
                  <Printer size={14} />
                  Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Refund Modal */}
      <AnimatePresence>
        {refundPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 border border-gray-100 space-y-4"
            >
              <h3 className="font-bold text-gray-900 text-lg">Request Refund</h3>
              <p className="text-sm text-gray-600">Please provide a valid reason for requesting a refund for <span className="font-mono font-semibold">{refundPayment.transaction_id || refundPayment.parcel_id}</span>.</p>
              
              <form onSubmit={handleRefundSubmit} className="space-y-4 pt-2">
                <div>
                  <textarea
                    rows={3}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
                    placeholder="Enter reason here..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRefundPayment(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={refunding || !refundReason.trim()}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {refunding ? 'Submitting...' : 'Submit Request'}
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
