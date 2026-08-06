import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6 bg-gray-50 font-sans">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-2">404</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">This parcel took a wrong turn.</h1>
        <p className="text-gray-500 mb-6">We couldn't find the page you're looking for.</p>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
          >
            Back to home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
