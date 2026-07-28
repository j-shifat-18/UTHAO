import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, Clock, Search, ArrowRight, Download, PlusCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export function Dashboard({ onTrackParcel, onOpenBookModal, user }) {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadParcels = () => {
    setLoading(true);
    api.getMyParcels().then(data => {
      setParcels(data || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadParcels();
  }, []);

  const filteredParcels = parcels.filter(p => {
    if (filter === 'active') return p.status !== 'delivered' && p.status !== 'cancelled';
    if (filter === 'delivered') return p.status === 'delivered';
    return true;
  });

  const totalSpent = parcels.reduce((acc, p) => acc + (p.delivery_cost || 0), 0);
  const activeCount = parcels.filter(p => p.status !== 'delivered').length;
  const deliveredCount = parcels.filter(p => p.status === 'delivered').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto 60px', padding: '0 24px' }} className="animate-fade-in">
      {/* Top Welcome Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>
            Shipment Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>
            Welcome back, {user?.first_name || 'Customer'}. Here is your live logistics overview.
          </p>
        </div>

        <button onClick={onOpenBookModal} className="btn-primary">
          <PlusCircle size={18} /> Send New Parcel
        </button>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '36px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Shipments</div>
          <div style={{ fontSize: '32px', fontWeight: '800', margin: '8px 0 4px' }}>{parcels.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--accent-blue)', fontWeight: '600' }}>Lifetime booked</div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Active in Transit</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-orange)', margin: '8px 0 4px' }}>{activeCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>En route to destination</div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Delivered</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-green)', margin: '8px 0 4px' }}>{deliveredCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--accent-green)' }}>100% On-time guarantee</div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Logistics Spend</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-blue)', margin: '8px 0 4px' }}>৳ {totalSpent}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>BDT including tax</div>
        </div>
      </div>

      {/* Parcels Table & Filters */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div className="segmented-control">
            <button
              onClick={() => setFilter('all')}
              className={`segmented-option ${filter === 'all' ? 'active' : ''}`}
            >
              All ({parcels.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`segmented-option ${filter === 'active' ? 'active' : ''}`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`segmented-option ${filter === 'delivered' ? 'active' : ''}`}
            >
              Delivered ({deliveredCount})
            </button>
          </div>

          <button onClick={loadParcels} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
            <RefreshCw size={15} /> Refresh List
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading shipments...</div>
        ) : filteredParcels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Package size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>No Shipments Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Book your first parcel to start real-time tracking.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredParcels.map(parcel => (
              <div
                key={parcel.id || parcel.tracking_number}
                className="glass-card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'var(--accent-blue-light)',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Package size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '16px' }}>
                        {parcel.tracking_number}
                      </span>
                      <span className={`status-badge ${parcel.status}`}>
                        {parcel.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      To: <strong>{parcel.receiver_name}</strong> ({parcel.delivery_city}) • {parcel.category} ({parcel.weight_kg}kg)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      ৳ {parcel.delivery_cost} BDT
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {new Date(parcel.created_at || Date.now()).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => onTrackParcel(parcel.tracking_number)}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Track Live <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
