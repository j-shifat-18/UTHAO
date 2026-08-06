import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, MapPin, CheckCircle2, Clock, Truck, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

export default function Tracking() {
  const [trackingId, setTrackingId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setIsSearching(true);
    setError('');
    setResult(null);

    try {
      const res = await api.get(`/parcels/track/${encodeURIComponent(trackingId.trim())}`);
      const data = res.data?.data || res.data;
      if (data && (data.parcel || data.history)) {
        setResult(data);
      } else {
        setError('No tracking information found for this tracking number.');
      }
    } catch (err) {
      setError(err.message || 'Tracking number not found. Please check and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section id="tracking" className="tracking-section py-16 bg-gray-50">
      <div className="container max-w-4xl mx-auto px-6">
        <motion.div 
          className="tracking-card bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Track Your Parcel</h2>
            <p style={{ color: '#6B7280' }}>Enter your tracking number to get real-time updates</p>
          </div>
          
          <form className="tracking-form" onSubmit={handleTrack}>
            <div className="tracking-input-group flex-1">
              <Search className="tracking-icon text-gray-400" size={20} />
              <input 
                type="text" 
                className="tracking-input" 
                placeholder="Enter Tracking ID (e.g. DHK-01-20240115-0001)" 
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary tracking-btn" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Track Now'}
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-8 border-t border-gray-100 space-y-6"
            >
              {/* Parcel Header Info */}
              {result.parcel && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400 block">Tracking Number</span>
                    <span className="font-mono font-bold text-red-600 text-sm">{result.parcel.tracking_number}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400 block">Receiver</span>
                    <span className="font-semibold text-gray-800 text-sm">{result.parcel.receiver_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400 block">Current Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 capitalize mt-0.5">
                      {result.parcel.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              {result.history && result.history.length > 0 && (
                <div className="text-left space-y-3">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Tracking Progress History</h4>
                  <div className="relative pl-6 border-l-2 border-red-500 space-y-6">
                    {result.history.map((item, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 capitalize text-sm">
                              {item.status?.replace('_', ' ')}
                            </span>
                            {item.location && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                                {item.location}
                              </span>
                            )}
                          </div>
                          {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                          <p className="text-[11px] font-mono text-gray-400 mt-1">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
