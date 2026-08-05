import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Fast & Reliable <span>Parcel Delivery</span> Across Bangladesh</h1>
          <p>
            Experience premium logistics with UTHAO. We deliver your packages safely and on time, with real-time tracking and 24/7 support.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.125rem' }}>
              Send Parcel Now <ArrowRight size={20} />
            </Link>
          </div>
          <div className="trust-badges">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={18} color="#10B981" /> 100% Secure
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
              <MapPin size={18} color="#E53935" /> 64 Districts Covered
            </span>
          </div>
        </motion.div>
        
        <motion.div 
          className="hero-image-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Floating Card 1 */}
          <div className="floating-card floating-card-1">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>Delivered</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Just now</div>
            </div>
          </div>

          <img src="/delivery-guy.png" alt="UTHAO Delivery" className="hero-image" />

          {/* Floating Card 2 */}
          <div className="floating-card floating-card-2">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>Live Tracking</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>On the way</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
