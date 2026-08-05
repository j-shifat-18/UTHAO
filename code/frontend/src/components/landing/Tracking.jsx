import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function Tracking() {
  const [trackingId, setTrackingId] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!trackingId) return;
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      alert(`Tracking functionality for ID: ${trackingId} will be integrated with the backend.`);
    }, 1500);
  };

  return (
    <section id="tracking" className="tracking-section">
      <div className="container">
        <motion.div 
          className="tracking-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Track Your Parcel</h2>
            <p style={{ color: '#6B7280' }}>Enter your tracking ID to get real-time updates</p>
          </div>
          
          <form className="tracking-form" onSubmit={handleTrack}>
            <div className="tracking-input-group">
              <Search className="tracking-icon" size={20} />
              <input 
                type="text" 
                className="tracking-input" 
                placeholder="Enter Tracking ID (e.g. UTH-12345678)" 
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary tracking-btn" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Track Now'}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
