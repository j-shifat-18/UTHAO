import React from 'react';
import { CheckCircle2, Clock, MapPin, Truck, User, Phone, Package, Shield, Calendar, CreditCard, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export function TrackingView({ parcel, loading, error, onBack, onRefresh }) {
  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '60px' }}>
          <RefreshCw size={40} className="spin" style={{ color: 'var(--accent-blue)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Locating Parcel Status...</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Fetching real-time telemetry from UTHAO hub nodes.</p>
        </div>
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px' }}>
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255, 59, 48, 0.1)',
            color: 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Parcel Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>
            {error || "We couldn't find a parcel matching that tracking number. Please verify the code or select a sample parcel."}
          </p>
          <button onClick={onBack} className="btn-primary">
            <ArrowLeft size={16} /> Back to Search
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'booked', label: 'Booked', icon: Package },
    { key: 'picked_up', label: 'Picked Up', icon: Clock },
    { key: 'in_transit', label: 'In Transit', icon: MapPin },
    { key: 'out_for_delivery', label: 'Out For Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 }
  ];

  const statusOrder = ['booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(parcel.status);

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto 60px', padding: '0 24px' }} className="animate-fade-in">
      {/* Top Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <ArrowLeft size={15} /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tracking Code:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '18px', letterSpacing: '0.5px' }}>
            {parcel.tracking_number}
          </span>
          <button onClick={onRefresh} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex' }} title="Refresh Status">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div className="glass-panel" style={{ padding: '36px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '36px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className={`status-badge ${parcel.status}`}>
                <div className="pulse-dot" />
                {parcel.status.replace(/_/g, ' ')}
              </span>
              {parcel.priority && (
                <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px', background: 'var(--bg-tertiary)', textTransform: 'uppercase' }}>
                  {parcel.priority} Priority
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800' }}>
              Destination: {parcel.delivery_city || 'Bangladesh'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Estimated Delivery: <strong>{new Date(parcel.estimated_delivery || Date.now() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </p>
          </div>

          {/* QR Code Graphic Simulation */}
          <div style={{
            background: '#ffffff',
            padding: '12px',
            borderRadius: '16px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}>
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <div style={{ fontSize: '10px', color: '#6e6e73', fontWeight: '600', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              SCAN PASSPORT
            </div>
          </div>
        </div>

        {/* Progress Nodes Bar */}
        <div style={{ position: 'relative', margin: '40px 0 20px' }}>
          {/* Progress Bar Background */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '30px',
            right: '30px',
            height: '4px',
            background: 'var(--bg-tertiary)',
            zIndex: 1
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-green) 100%)',
              width: `${(currentIndex / (statusOrder.length - 1)) * 100}%`,
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>

          {/* Step Nodes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const StepIcon = step.icon;

              return (
                <div key={step.key} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: isCompleted ? (isCurrent ? 'var(--accent-blue)' : 'var(--accent-green)') : 'var(--bg-secondary)',
                    color: isCompleted ? '#ffffff' : 'var(--text-tertiary)',
                    border: `3px solid ${isCompleted ? 'transparent' : 'var(--glass-border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    boxShadow: isCurrent ? '0 0 20px rgba(0, 113, 227, 0.4)' : 'none',
                    transition: 'var(--transition-apple)'
                  }}>
                    <StepIcon size={20} />
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: isCurrent ? '700' : '500',
                    color: isCompleted ? 'var(--text-primary)' : 'var(--text-tertiary)'
                  }}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Timeline Log */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--accent-blue)' }} /> Activity Timeline
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(parcel.history || []).slice().reverse().map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: idx === 0 ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                  marginTop: '6px'
                }} />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', textTransform: 'capitalize' }}>
                    {item.status.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    📍 {item.location} • {new Date(item.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '8px' }}>
                      {item.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Courier & Delivery Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Agent Card */}
          {parcel.agent && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '12px' }}>
                Assigned Delivery Agent
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #af52de 0%, #0071e3 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '18px'
                }}>
                  {parcel.agent.name ? parcel.agent.name[0] : 'A'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{parcel.agent.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    🏍️ {parcel.agent.vehicle} • ⭐ {parcel.agent.rating}
                  </div>
                </div>
                <a
                  href={`tel:${parcel.agent.phone}`}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(52, 199, 89, 0.15)',
                    color: 'var(--accent-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none'
                  }}
                  title="Call Agent"
                >
                  <Phone size={18} />
                </a>
              </div>
            </div>
          )}

          {/* Parcel Specifications */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '14px' }}>
              Shipment Specifications
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', display: 'block' }}>Category</span>
                <strong style={{ textTransform: 'capitalize' }}>{parcel.category.replace(/_/g, ' ')}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', display: 'block' }}>Weight</span>
                <strong>{parcel.weight_kg} kg</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', display: 'block' }}>Sender</span>
                <strong>{parcel.sender_name || 'Customer'}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', display: 'block' }}>Recipient</span>
                <strong>{parcel.receiver_name}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', display: 'block' }}>Payment</span>
                <span style={{ fontWeight: '600', color: parcel.is_paid ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                  {parcel.payment_method.toUpperCase()} ({parcel.is_paid ? 'Paid' : 'Unpaid'})
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', display: 'block' }}>Total Fee</span>
                <strong style={{ color: 'var(--accent-blue)', fontSize: '16px' }}>৳ {parcel.delivery_cost} BDT</strong>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', fontSize: '13px', color: 'var(--text-secondary)' }}>
              📍 <strong>Delivery Address:</strong> {parcel.delivery_address_line1}, {parcel.delivery_city}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
