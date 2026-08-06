import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { Package, CheckCircle, UserCircle, MapPin, Users, UsersRound, PlusCircle, PackageCheck, Boxes } from 'lucide-react'

const StatCard = ({ label, value, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
  >
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
    <p className={`text-xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
  </motion.div>
)

const QuickLink = ({ to, icon: Icon, children }) => (
  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
    <Link
      to={to}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-red-500 hover:text-red-600 transition-all shadow-sm"
    >
      <Icon size={15} />
      {children}
    </Link>
  </motion.div>
)

export default function Dashboard() {
  const { user, isAdminLike } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's what's happening with your UTHAO account.</p>
      </motion.div>

      {/* Account card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 capitalize">
              {user?.role}
            </span>
            <span className="font-mono text-xs text-gray-400 border border-dashed border-gray-300 rounded px-2 py-0.5">
              ACC-{user?.id}
            </span>
          </div>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <Link
          to="/dashboard/profile"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition-all"
        >
          View profile
        </Link>
      </motion.div>

      {/* Divider */}
      <div
        className="h-px"
        style={{
          backgroundImage: 'repeating-linear-gradient(to right, #D1D5DB 0 6px, transparent 6px 12px)',
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Account status" value={user?.is_active ? 'Active' : 'Inactive'} accent={user?.is_active ? 'text-green-600' : 'text-red-600'} />
        <StatCard label="Verification" value={user?.is_verified ? 'Verified' : 'Pending'} accent={user?.is_verified ? 'text-green-600' : 'text-yellow-600'} />
        <StatCard label="Role" value={user?.role} />
      </div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick links</h3>
        <div className="flex flex-wrap gap-3">
          <QuickLink to="/dashboard/book-parcel" icon={PlusCircle}>Book new parcel</QuickLink>
          <QuickLink to="/dashboard/my-parcels" icon={PackageCheck}>My parcels</QuickLink>
          <QuickLink to="/dashboard/profile" icon={UserCircle}>Update profile</QuickLink>
          <QuickLink to="/dashboard/addresses" icon={MapPin}>Manage addresses</QuickLink>
          {isAdminLike && <QuickLink to="/dashboard/admin/parcels" icon={Boxes}>Manage all parcels</QuickLink>}
          {isAdminLike && <QuickLink to="/dashboard/admin/users" icon={Users}>Manage users</QuickLink>}
          {isAdminLike && <QuickLink to="/dashboard/admin/customers" icon={UsersRound}>View customers</QuickLink>}
        </div>
      </motion.div>
    </div>
  )
}
