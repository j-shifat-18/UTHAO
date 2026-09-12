import React from 'react'
import { Link } from 'react-router-dom'
import { Truck, ShieldCheck, MapPin, Zap } from 'lucide-react'
import BackButton from '../components/common/BackButton.jsx'
import { LogoIcon } from '../components/common/Logo.jsx'
import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <BackButton fallback="/" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="flex items-center gap-4 p-8 border-b border-gray-100 bg-white">
            <LogoIcon className="w-12 h-12" />
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">About UTHAO</h1>
          </div>

          {/* Content */}
          <div className="p-8 lg:p-12">
            <div className="prose prose-lg prose-red max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Redefining Logistics in Bangladesh
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg mb-10">
                UTHAO is a premier logistics and courier platform designed to bring 
                unprecedented speed, transparency, and reliability to parcel delivery. 
                Whether you're a burgeoning e-commerce business or an individual sending 
                a gift to a loved one, we ensure your packages arrive safely and on time.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 my-12">
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                    <Zap size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Lightning Fast</h3>
                    <p className="text-gray-500 mt-2 leading-relaxed">Same-day and next-day delivery options across major cities to keep your business moving.</p>
                  </div>
                </div>
                
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Secure & Safe</h3>
                    <p className="text-gray-500 mt-2 leading-relaxed">Full insurance coverage and highly secure handling procedures for all your valuable parcels.</p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                    <MapPin size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Live Tracking</h3>
                    <p className="text-gray-500 mt-2 leading-relaxed">Real-time GPS tracking from the moment of pickup all the way to successful delivery.</p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                    <Truck size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Wide Coverage</h3>
                    <p className="text-gray-500 mt-2 leading-relaxed">An extensive logistical network reaching even the most remote and challenging locations.</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-8 rounded-3xl border border-red-100 mt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To empower businesses and connect communities through an efficient, 
                  technology-driven logistics ecosystem that prioritizes customer satisfaction,
                  transparency, and speed above all else. We're not just delivering parcels; 
                  we're delivering promises.
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer CTA */}
          <div className="p-8 border-t border-gray-100 bg-white flex justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-red-200"
            >
              Start Shipping with UTHAO
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
