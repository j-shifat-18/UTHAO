import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, booting, isAdminLike } = useAuth()

  if (booting) {
    return <div className="loading-line" style={{ padding: 40 }}>Loading your session…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (adminOnly && !isAdminLike) {
    return <Navigate to="/" replace />
  }
  return children
}
