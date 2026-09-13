import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Smartphone,
  ShieldCheck,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { paymentApi } from '../api/paymentApi'

// Payment method IDs matching backend DB:
// 1 = cash, 2 = bkash, 3 = nagad, 4 = card, 5 = bank_transfer
const METHOD_MAP = {
  bkash: { id: 2, name: 'bKash', code: 'BKH' },
  nagad: { id: 3, name: 'Nagad', code: 'NGD' },
  card: { id: 4, name: 'Card', code: 'CRD' },
}

export default function PaymentModal({
  isOpen,
  onClose,
  parcel,
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('bkash') // 'bkash' | 'nagad' | 'card'
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

  // Form states
  const [bkashData, setBkashData] = useState({
    mobile: '',
    pin: '',
  })
  const [nagadData, setNagadData] = useState({
    mobile: '',
    pin: '',
  })
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
  })

  // Validation errors
  const [errors, setErrors] = useState({})

  if (!isOpen || !parcel) return null

  const deliveryCost = Number(parcel.delivery_cost || parcel.delivery_fee || 0).toFixed(2)
  const trackingNumber = parcel.tracking_number || parcel.id

  // Helpers for formatting & demo fill
  const handleFillDemo = () => {
    setErrors({})
    setGlobalError('')
    if (activeTab === 'bkash') {
      setBkashData({
        mobile: '01712345678',
        pin: '12345',
      })
    } else if (activeTab === 'nagad') {
      setNagadData({
        mobile: '01812345678',
        pin: '1234',
      })
    } else if (activeTab === 'card') {
      setCardData({
        name: 'Rahim Ahmed',
        number: '4242 4242 4242 4242',
        expiry: '12/28',
        cvv: '888',
      })
    }
  }

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardData((prev) => ({ ...prev, number: formatted }))
    if (errors.number) setErrors((prev) => ({ ...prev, number: '' }))
  }

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2)
    }
    setCardData((prev) => ({ ...prev, expiry: raw }))
    if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: '' }))
  }

  // Client Validation
  const validateForm = () => {
    const errs = {}

    if (activeTab === 'bkash') {
      const cleanMobile = bkashData.mobile.replace(/\s+/g, '')
      if (!cleanMobile) {
        errs.bkashMobile = 'bKash mobile number is required'
      } else if (!/^01[3-9]\d{8}$/.test(cleanMobile)) {
        errs.bkashMobile = 'Enter a valid 11-digit Bangladeshi number (e.g. 017XXXXXXXX)'
      }

      if (!bkashData.pin) {
        errs.bkashPin = '5-digit bKash PIN is required'
      } else if (!/^\d{5}$/.test(bkashData.pin)) {
        errs.bkashPin = 'PIN must be exactly 5 digits'
      }
    } else if (activeTab === 'nagad') {
      const cleanMobile = nagadData.mobile.replace(/\s+/g, '')
      if (!cleanMobile) {
        errs.nagadMobile = 'Nagad mobile number is required'
      } else if (!/^01[3-9]\d{8}$/.test(cleanMobile)) {
        errs.nagadMobile = 'Enter a valid 11-digit Bangladeshi number (e.g. 018XXXXXXXX)'
      }

      if (!nagadData.pin) {
        errs.nagadPin = '4-digit Nagad PIN is required'
      } else if (!/^\d{4}$/.test(nagadData.pin)) {
        errs.nagadPin = 'PIN must be exactly 4 digits'
      }
    } else if (activeTab === 'card') {
      if (!cardData.name.trim()) {
        errs.name = 'Cardholder name is required'
      }

      const cleanNum = cardData.number.replace(/\s+/g, '')
      if (!cleanNum) {
        errs.number = '16-digit card number is required'
      } else if (cleanNum.length !== 16) {
        errs.number = 'Card number must be 16 digits'
      }

      if (!cardData.expiry) {
        errs.expiry = 'Expiry date is required'
      } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardData.expiry)) {
        errs.expiry = 'Format must be MM/YY'
      } else {
        const [month, year] = cardData.expiry.split('/')
        const expMonth = parseInt(month, 10)
        const expYear = parseInt('20' + year, 10)
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          errs.expiry = 'Card is expired'
        }
      }

      if (!cardData.cvv) {
        errs.cvv = 'CVV is required'
      } else if (!/^\d{3,4}$/.test(cardData.cvv)) {
        errs.cvv = 'CVV must be 3 or 4 digits'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const generateTxId = (prefix) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${dateStr}-${randomHex}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGlobalError('')

    if (!validateForm()) return

    setLoading(true)
    const methodMeta = METHOD_MAP[activeTab]
    const transactionId = generateTxId(methodMeta.code)

    try {
      const response = await paymentApi.createPayment({
        parcel_id: parcel.id,
        payment_method_id: methodMeta.id,
        transaction_id: transactionId,
        status: 'completed',
        notes: `Customer paid via demo ${methodMeta.name}`,
      })

      const paymentResult = response.data?.data || response.data

      if (onSuccess) {
        onSuccess({
          payment: paymentResult,
          transaction_id: transactionId,
          method: methodMeta.name,
          parcel_id: parcel.id,
        })
      }
      onClose()
    } catch (err) {
      setGlobalError(err.message || 'Payment processing failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 my-8 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Secure Payment Checkout</h3>
              <p className="text-xs text-gray-500 font-medium">Demo Payment Simulation Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-200/60 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount Summary Banner */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
              Parcel Tracking #
            </span>
            <span className="font-mono font-bold text-sm text-red-400">{trackingNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
              Total Payable
            </span>
            <span className="font-mono font-extrabold text-2xl text-emerald-400">৳{deliveryCost}</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Method Selector Tabs */}
        <div className="px-6 pt-5">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Select Payment Method
            </label>
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all"
            >
              <Sparkles size={13} />
              Fill Demo Data
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 p-1 bg-gray-100 rounded-2xl">
            {/* bKash Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('bkash')
                setErrors({})
                setGlobalError('')
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'bkash'
                  ? 'bg-white text-[#D8226B] shadow-sm border border-pink-200 scale-[1.02]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#D8226B] text-white flex items-center justify-center text-[10px] font-black">
                ৳
              </div>
              <span>bKash</span>
            </button>

            {/* Nagad Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('nagad')
                setErrors({})
                setGlobalError('')
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'nagad'
                  ? 'bg-white text-[#F7941D] shadow-sm border border-orange-200 scale-[1.02]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#F7941D] text-white flex items-center justify-center text-[10px] font-black">
                ৳
              </div>
              <span>Nagad</span>
            </button>

            {/* Card Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('card')
                setErrors({})
                setGlobalError('')
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'card'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-300 scale-[1.02]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <CreditCard size={18} />
              <span>Card</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* bKash UI */}
          {activeTab === 'bkash' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="bg-pink-50/70 border border-pink-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D8226B] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-pink-500/20">
                  bKash
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">bKash Mobile Payment</h4>
                  <p className="text-[11px] text-gray-500">
                    Enter your 11-digit bKash account number and 5-digit PIN.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  bKash Account Number *
                </label>
                <div className="relative">
                  <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    maxLength={11}
                    placeholder="017XXXXXXXX"
                    value={bkashData.mobile}
                    onChange={(e) => {
                      setBkashData({ ...bkashData, mobile: e.target.value.replace(/\D/g, '') })
                      if (errors.bkashMobile) setErrors({ ...errors, bkashMobile: '' })
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                      errors.bkashMobile
                        ? 'border-red-500 ring-red-100 bg-red-50/30'
                        : 'border-gray-200 focus:border-[#D8226B] focus:ring-pink-100 bg-white'
                    }`}
                  />
                </div>
                {errors.bkashMobile && (
                  <p className="text-xs text-red-600 mt-1">{errors.bkashMobile}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  bKash PIN (5 digits) *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    maxLength={5}
                    placeholder="•••••"
                    value={bkashData.pin}
                    onChange={(e) => {
                      setBkashData({ ...bkashData, pin: e.target.value.replace(/\D/g, '') })
                      if (errors.bkashPin) setErrors({ ...errors, bkashPin: '' })
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 transition-all ${
                      errors.bkashPin
                        ? 'border-red-500 ring-red-100 bg-red-50/30'
                        : 'border-gray-200 focus:border-[#D8226B] focus:ring-pink-100 bg-white'
                    }`}
                  />
                </div>
                {errors.bkashPin && (
                  <p className="text-xs text-red-600 mt-1">{errors.bkashPin}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Nagad UI */}
          {activeTab === 'nagad' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F7941D] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-orange-500/20">
                  Nagad
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Nagad Mobile Payment</h4>
                  <p className="text-[11px] text-gray-500">
                    Enter your 11-digit Nagad account number and 4-digit PIN.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nagad Account Number *
                </label>
                <div className="relative">
                  <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    maxLength={11}
                    placeholder="018XXXXXXXX"
                    value={nagadData.mobile}
                    onChange={(e) => {
                      setNagadData({ ...nagadData, mobile: e.target.value.replace(/\D/g, '') })
                      if (errors.nagadMobile) setErrors({ ...errors, nagadMobile: '' })
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                      errors.nagadMobile
                        ? 'border-red-500 ring-red-100 bg-red-50/30'
                        : 'border-gray-200 focus:border-[#F7941D] focus:ring-orange-100 bg-white'
                    }`}
                  />
                </div>
                {errors.nagadMobile && (
                  <p className="text-xs text-red-600 mt-1">{errors.nagadMobile}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nagad PIN (4 digits) *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={nagadData.pin}
                    onChange={(e) => {
                      setNagadData({ ...nagadData, pin: e.target.value.replace(/\D/g, '') })
                      if (errors.nagadPin) setErrors({ ...errors, nagadPin: '' })
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 transition-all ${
                      errors.nagadPin
                        ? 'border-red-500 ring-red-100 bg-red-50/30'
                        : 'border-gray-200 focus:border-[#F7941D] focus:ring-orange-100 bg-white'
                    }`}
                  />
                </div>
                {errors.nagadPin && (
                  <p className="text-xs text-red-600 mt-1">{errors.nagadPin}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Card UI */}
          {activeTab === 'card' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Virtual Credit Card Preview */}
              <div className="relative overflow-hidden bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                    Debit / Credit Card
                  </span>
                  <div className="flex gap-1">
                    <span className="w-6 h-4 rounded bg-red-500/80 inline-block" />
                    <span className="w-6 h-4 rounded bg-amber-500/80 -ml-3 inline-block" />
                  </div>
                </div>

                <div className="font-mono text-base tracking-widest my-2 text-slate-100 font-bold">
                  {cardData.number || '•••• •••• •••• ••••'}
                </div>

                <div className="flex justify-between items-end text-xs mt-3 pt-2 border-t border-slate-700/60">
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block">Cardholder</span>
                    <span className="font-semibold text-slate-200 uppercase truncate max-w-[180px] block">
                      {cardData.name || 'YOUR NAME'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block text-right">Expires</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {cardData.expiry || 'MM/YY'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Inputs */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cardholder Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahim Ahmed"
                  value={cardData.name}
                  onChange={(e) => {
                    setCardData({ ...cardData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: '' })
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-red-500 ring-red-100 bg-red-50/30'
                      : 'border-gray-200 focus:border-slate-800 focus:ring-slate-100 bg-white'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Card Number (16 digits) *
                </label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={cardData.number}
                    onChange={handleCardNumberChange}
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                      errors.number
                        ? 'border-red-500 ring-red-100 bg-red-50/30'
                        : 'border-gray-200 focus:border-slate-800 focus:ring-slate-100 bg-white'
                    }`}
                  />
                </div>
                {errors.number && <p className="text-xs text-red-600 mt-1">{errors.number}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expiry (MM/YY) *
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="12/28"
                    value={cardData.expiry}
                    onChange={handleExpiryChange}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-center focus:outline-none focus:ring-2 transition-all ${
                      errors.expiry
                        ? 'border-red-500 ring-red-100 bg-red-50/30'
                        : 'border-gray-200 focus:border-slate-800 focus:ring-slate-100 bg-white'
                    }`}
                  />
                  {errors.expiry && <p className="text-xs text-red-600 mt-1">{errors.expiry}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    CVV / CVC *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    value={cardData.cvv}
                    onChange={(e) => {
                      setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })
                      if (errors.cvv) setErrors({ ...errors, cvv: '' })
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 transition-all ${
                      errors.cvv
                        ? 'border-red-500 ring-red-100 bg-red-50/30'
                        : 'border-gray-200 focus:border-slate-800 focus:ring-slate-100 bg-white'
                    }`}
                  />
                  {errors.cvv && <p className="text-xs text-red-600 mt-1">{errors.cvv}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Trust badge note */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 justify-center pt-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>256-bit encrypted simulation. Demo credentials are safe.</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              className={`flex-1 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                activeTab === 'bkash'
                  ? 'bg-[#D8226B] hover:bg-[#c2185b] shadow-pink-900/20'
                  : activeTab === 'nagad'
                  ? 'bg-[#F7941D] hover:bg-[#e07f10] shadow-orange-900/20'
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
              }`}
            >
              {loading ? (
                'Processing Payment…'
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Pay ৳{deliveryCost}
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
