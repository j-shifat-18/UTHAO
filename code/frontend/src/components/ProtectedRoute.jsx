import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, adminOnly, staffOnly, agentOrStaffOnly }) {
  const { user, booting, isAdminLike, isStaff, isAgent } = useAuth()

  if (booting) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-mono text-sm tracking-widest animate-pulse">BOOTING SYSTEM...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdminLike) {
    return <Navigate to="/dashboard" replace />
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/dashboard" replace />
  }

  if (agentOrStaffOnly && !isStaff && !isAgent) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
