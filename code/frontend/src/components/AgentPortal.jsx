import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, MapPin, Clock, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export function AgentPortal({ onTrackParcel, showToast }) {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadParcels = () => {
    setLoading(true);
    api.getMyParcels().then(data => {
      setParcels(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadParcels();
  }, []);

  const handleUpdateStatus = async (trackingNumber, nextStatus) => {
    setUpdatingId(trackingNumber);
    try {
      await api.updateStatus(
        trackingNumber,
        nextStatus,
        nextStatus === 'out_for_delivery' ? 'Local Courier Hub' : 'Destination Hub',
        `Agent updated status to ${nextStatus.replace(/_/g, ' ')}`
      );
      showToast(`Parcel ${trackingNumber} updated to ${nextStatus.replace(/_/g, ' ')}!`, 'success');
      setUpdatingId(null);
      loadParcels();
    } catch (e) {
      showToast('Failed to update status', 'error');
      setUpdatingId(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'booked': return 'picked_up';
      case 'picked_up': return 'in_transit';
      case 'in_transit': return 'out_for_delivery';
      case 'out_for_delivery': return 'delivered';
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto 60px', padding: '0 24px' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', background: 'rgba(175, 82, 222, 0.15)', color: 'var(--accent-purple)', padding: '4px 12px', borderRadius: '999px', fontWeight: '700' }}>
              🚚 Delivery Agent Control Console
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px' }}>
              Assigned Dispatch Tasks
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Scan and update parcel state machine in real-time.
            </p>
          </div>

          <button onClick={loadParcels} className="btn-secondary">
            <RefreshCw size={16} /> Sync Queue
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading agent tasks...</div>
        ) : parcels.map(parcel => {
          const next = getNextStatus(parcel.status);

          return (
            <div key={parcel.tracking_number} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '18px' }}>
                    {parcel.tracking_number}
                  </span>
                  <span className={`status-badge ${parcel.status}`}>
                    {parcel.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '14px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                  Recipient: <strong>{parcel.receiver_name}</strong> • Phone: {parcel.receiver_phone}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Address: {parcel.delivery_address_line1}, {parcel.delivery_city}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => onTrackParcel(parcel.tracking_number)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  View Telemetry
                </button>

                {next ? (
                  <button
                    onClick={() => handleUpdateStatus(parcel.tracking_number, next)}
                    className="btn-primary"
                    disabled={updatingId === parcel.tracking_number}
                    style={{ padding: '8px 18px', fontSize: '13px', background: 'var(--accent-purple)' }}
                  >
                    Advance to "{next.replace(/_/g, ' ')}" <ArrowRight size={14} />
                  </button>
                ) : (
                  <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={16} /> Completed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
