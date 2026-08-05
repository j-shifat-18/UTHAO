import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { PageHeader, TrackingTag, RoleBadge } from '../components/Bits.jsx'

export default function Dashboard() {
  const { user, isAdminLike } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting}${user?.email ? ',' : ''} ${user?.email ? user.email.split('@')[0] : ''}`}
        sub="Here's what's happening with your UTHAO account."
      />

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
              <RoleBadge role={user?.role} />
              <TrackingTag id={user?.id} label="ACC" />
            </div>
            <div style={{ color: 'var(--ink-muted)', fontSize: 13.5 }}>{user?.email}</div>
          </div>
          <Link to="/profile" className="btn btn-ghost btn-sm">View profile</Link>
        </div>
      </div>

      <div className="perforation" />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Account status</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{user?.is_active ? 'Active' : 'Inactive'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verification</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{user?.is_verified ? 'Verified' : 'Pending'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Role</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{user?.role}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 15 }}>Quick links</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/profile" className="btn btn-ghost btn-sm">Update profile</Link>
          <Link to="/addresses" className="btn btn-ghost btn-sm">Manage addresses</Link>
          {isAdminLike && <Link to="/admin/users" className="btn btn-ghost btn-sm">Manage users</Link>}
          {isAdminLike && <Link to="/admin/customers" className="btn btn-ghost btn-sm">View customers</Link>}
        </div>
      </div>
    </div>
  )
}
