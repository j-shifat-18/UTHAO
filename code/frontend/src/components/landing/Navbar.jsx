import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-red-600 font-extrabold text-2xl tracking-tight no-underline">
          <Package color="#E53935" size={28} />
          UTHAO
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#services" className="text-gray-700 font-medium text-sm hover:text-red-600 transition-colors">Services</a>
          <a href="#coverage" className="text-gray-700 font-medium text-sm hover:text-red-600 transition-colors">Coverage</a>
          <a href="#tracking" className="text-gray-700 font-medium text-sm hover:text-red-600 transition-colors">Track Parcel</a>
          <a href="#about" className="text-gray-700 font-medium text-sm hover:text-red-600 transition-colors">About</a>
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="logged-in"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                >
                  Dashboard
                </Link>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md shadow-red-200"
                >
                  Logout
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="logged-out"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                >
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md shadow-red-200"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
