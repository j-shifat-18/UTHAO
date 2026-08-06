import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="flex-1 px-10 py-8 max-w-5xl overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
