import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/customer/Profile.jsx'
import Addresses from './pages/customer/Addresses.jsx'
import Users from './pages/admin/Users.jsx'
import Customers from './pages/admin/Customers.jsx'
import Branches from './pages/admin/Branches.jsx'
import Warehouses from './pages/admin/Warehouses.jsx'
import NotFound from './pages/NotFound.jsx'
import LandingPage from './pages/LandingPage.jsx'
import { useAuth } from './context/AuthContext.jsx'

export default function App() {
  const { user, booting } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      <Route
        path="/login"
        element={!booting && user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={!booting && user ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="addresses" element={<Addresses />} />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute adminOnly>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/customers"
          element={
            <ProtectedRoute adminOnly>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/branches"
          element={
            <ProtectedRoute adminOnly>
              <Branches />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/warehouses"
          element={
            <ProtectedRoute adminOnly>
              <Warehouses />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
