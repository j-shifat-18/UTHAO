import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar() {
  const { user, logout, isAdminLike } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">UTHAO</div>
        <div className="route-dots" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div className="sidebar-tagline">Track it. Trust it.</div>
      </div>

      <nav className="nav-group">
        <div className="nav-label">Overview</div>
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="nav-dot" /> Dashboard
        </NavLink>
      </nav>

      <nav className="nav-group">
        <div className="nav-label">Your account</div>
        <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="nav-dot" /> Profile
        </NavLink>
        <NavLink to="/addresses" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="nav-dot" /> Addresses
        </NavLink>
      </nav>

      {isAdminLike && (
        <nav className="nav-group">
          <div className="nav-label">Administration</div>
          <NavLink to="/admin/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-dot" /> Users
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-dot" /> Customers
          </NavLink>
        </nav>
      )}

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{user?.email}</strong>
          <span className="sidebar-role">{user?.role}</span>
        </div>
        <button className="logout-btn" onClick={logout}>Sign out</button>
      </div>
    </aside>
  )
}
