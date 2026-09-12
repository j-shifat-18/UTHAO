import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BackButton({ fallback = '/', label = 'Back', className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }

  return (
    <motion.button
      onClick={handleBack}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors ${className}`}
    >
      <ArrowLeft size={18} />
      {label}
    </motion.button>
  )
}
