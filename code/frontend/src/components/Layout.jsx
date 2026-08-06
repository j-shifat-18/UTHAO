import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      {/* pt-14 on mobile accounts for the fixed top bar, lg:pt-0 removes it on desktop */}
      <main className="flex-1 pt-20 lg:pt-10 px-4 sm:px-6 lg:px-10 pb-8 min-w-0 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
