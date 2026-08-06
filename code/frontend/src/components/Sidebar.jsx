import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { Package, LayoutDashboard, User, MapPin, Users, UsersRound, Building2, Warehouse, PlusCircle, PackageCheck, Boxes, LogOut } from 'lucide-react'

const NavItem = ({ to, end, icon: Icon, children }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`
    }
  >
    <Icon size={16} />
    {children}
  </NavLink>
)

export default function Sidebar() {
  const { user, logout, isAdminLike } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen px-5 py-7">
      {/* Brand */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xl font-bold text-white mb-1">
          <Package size={22} className="text-red-500" />
          UTHAO
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`rounded-full ${i === 0 ? 'w-2 h-2 bg-yellow-400' : 'w-1.5 h-1.5 bg-red-500 opacity-50'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1.5 tracking-wide">Track it. Trust it.</p>
      </div>

      {/* Overview */}
      <nav className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold px-3 mb-2">Overview</p>
        <NavItem to="/dashboard" end icon={LayoutDashboard}>Dashboard</NavItem>
      </nav>

      {/* Shipments */}
      <nav className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold px-3 mb-2">Shipments</p>
        <div className="flex flex-col gap-1">
          <NavItem to="/dashboard/book-parcel" icon={PlusCircle}>Book Parcel</NavItem>
          <NavItem to="/dashboard/my-parcels" icon={PackageCheck}>My Parcels</NavItem>
        </div>
      </nav>

      {/* Account */}
      <nav className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold px-3 mb-2">Your account</p>
        <div className="flex flex-col gap-1">
          <NavItem to="/dashboard/profile" icon={User}>Profile</NavItem>
          <NavItem to="/dashboard/addresses" icon={MapPin}>Addresses</NavItem>
        </div>
      </nav>

      {/* Admin */}
      {isAdminLike && (
        <nav className="mb-6">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold px-3 mb-2">Administration</p>
          <div className="flex flex-col gap-1">
            <NavItem to="/dashboard/admin/parcels" icon={Boxes}>All Parcels</NavItem>
            <NavItem to="/dashboard/admin/users" icon={Users}>Users</NavItem>
            <NavItem to="/dashboard/admin/customers" icon={UsersRound}>Customers</NavItem>
            <NavItem to="/dashboard/admin/branches" icon={Building2}>Branches</NavItem>
            <NavItem to="/dashboard/admin/warehouses" icon={Warehouse}>Warehouses</NavItem>
          </div>
        </nav>
      )}

      {/* Footer */}
      <div className="mt-auto pt-5 border-t border-white/10">
        <div className="px-3 mb-3">
          <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
          <p className="text-xs uppercase tracking-wide text-red-400 font-medium mt-0.5">{user?.role}</p>
        </div>
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/15 hover:border-white/35 rounded-lg transition-all"
        >
          <LogOut size={14} />
          Sign out
        </motion.button>
      </div>
    </aside>
  )
}
