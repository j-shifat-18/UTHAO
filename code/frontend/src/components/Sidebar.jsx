import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Package, LayoutDashboard, User, MapPin, Users, UsersRound,
  Building2, Warehouse, PlusCircle, PackageCheck, Boxes, LogOut, X, Menu,
} from 'lucide-react'
import { useState } from 'react'

const NavItem = ({ to, end, icon: Icon, children, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
        ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`
    }
  >
    <Icon size={16} />
    {children}
  </NavLink>
)

function SidebarContent({ onNavClick }) {
  const { user, logout, isAdminLike } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="mb-8 px-5 pt-7">
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

      <div className="flex-1 overflow-y-auto px-5 space-y-6">
        {/* Overview */}
        <nav>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold px-3 mb-2">Overview</p>
          <NavItem to="/dashboard" end icon={LayoutDashboard} onClick={onNavClick}>Dashboard</NavItem>
        </nav>

        {/* Shipments — customers only */}
        {!isAdminLike && (
          <nav>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold px-3 mb-2">Shipments</p>
            <div className="flex flex-col gap-1">
              <NavItem to="/dashboard/book-parcel" icon={PlusCircle} onClick={onNavClick}>Book Parcel</NavItem>
              <NavItem to="/dashboard/my-parcels" icon={PackageCheck} onClick={onNavClick}>My Parcels</NavItem>
            </div>
          </nav>
        )}

        {/* Account */}
        <nav>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold px-3 mb-2">Account</p>
          <div className="flex flex-col gap-1">
            <NavItem to="/dashboard/profile" icon={User} onClick={onNavClick}>Profile</NavItem>
            <NavItem to="/dashboard/addresses" icon={MapPin} onClick={onNavClick}>Addresses</NavItem>
          </div>
        </nav>

        {/* Admin */}
        {isAdminLike && (
          <nav>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold px-3 mb-2">Administration</p>
            <div className="flex flex-col gap-1">
              <NavItem to="/dashboard/admin/parcels" icon={Boxes} onClick={onNavClick}>All Parcels</NavItem>
              <NavItem to="/dashboard/admin/users" icon={Users} onClick={onNavClick}>Users</NavItem>
              <NavItem to="/dashboard/admin/customers" icon={UsersRound} onClick={onNavClick}>Customers</NavItem>
              <NavItem to="/dashboard/admin/branches" icon={Building2} onClick={onNavClick}>Branches</NavItem>
              <NavItem to="/dashboard/admin/warehouses" icon={Warehouse} onClick={onNavClick}>Warehouses</NavItem>
            </div>
          </nav>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-7 pt-5 border-t border-white/10 mt-4">
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
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-gray-900 px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-bold">
          <Package size={20} className="text-red-500" />
          UTHAO
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 text-white flex-col min-h-screen shrink-0">
        <SidebarContent onNavClick={null} />
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 text-white flex flex-col shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all z-10"
              >
                <X size={20} />
              </button>
              <SidebarContent onNavClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
