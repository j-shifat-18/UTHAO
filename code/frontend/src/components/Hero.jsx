import React, { useState } from 'react';
import { Search, ArrowRight, ShieldCheck, Zap, Clock, Package, PlusCircle } from 'lucide-react';

export function Hero({ onTrack, onOpenBookModal, onSelectSample }) {
  const [trackingId, setTrackingId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      onTrack(trackingId.trim());
    }
  };

  return (
    <section style={{
      padding: '70px 24px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      {/* Pill Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 18px',
        borderRadius: '999px',
        background: 'var(--accent-blue-light)',
        color: 'var(--accent-blue)',
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '24px'
      }}>
        <Zap size={15} /> Ultra-Fast Next Day Delivery Across Bangladesh
      </div>

      {/* Main Headline */}
      <h1 style={{
        fontSize: '56px',
        fontWeight: '800',
        letterSpacing: '-1.5px',
        lineHeight: '1.1',
        marginBottom: '20px',
        color: 'var(--text-primary)',
        background: 'linear-gradient(180deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Logistics Designed with Precision.
      </h1>

      <p style={{
        fontSize: '20px',
        color: 'var(--text-secondary)',
        maxWidth: '680px',
        margin: '0 auto 40px',
        fontWeight: '400',
        lineHeight: '1.5'
      }}>
        Experience seamless parcel shipping, real-time live map tracking, and automated fulfillment engineered for speed and clarity.
      </p>

      {/* Floating Tracking Search Card */}
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '640px',
        margin: '0 auto 40px',
        padding: '10px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.08)'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ paddingLeft: '16px', color: 'var(--text-tertiary)', display: 'flex' }}>
            <Search size={22} />
          </div>
          <input
            type="text"
            placeholder="Enter Tracking Number (e.g. UTH-782910)"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '16px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              outline: 'none',
              padding: '12px 8px'
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>
            Track Now <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {/* Sample Quick Demo Tracking Links & Book Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '60px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '500' }}>Try demo parcels:</span>
        <button
          onClick={() => { setTrackingId('UTH-782910'); onSelectSample('UTH-782910'); }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--accent-blue)',
            cursor: 'pointer'
          }}
        >
          UTH-782910 (Out for Delivery)
        </button>
        
        <button
          onClick={() => { setTrackingId('UTH-941028'); onSelectSample('UTH-941028'); }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--accent-green)',
            cursor: 'pointer'
          }}
        >
          UTH-941028 (Delivered)
        </button>

        <button
          onClick={onOpenBookModal}
          className="btn-secondary"
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          <PlusCircle size={15} /> Send New Parcel
        </button>
      </div>

      {/* Key Feature Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        textAlign: 'left'
      }}>
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'rgba(0, 113, 227, 0.1)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <Clock size={24} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Real-Time Telemetry</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            Instant node updates as your package transitions through origin hubs, sorting facilities, and courier routes.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'rgba(52, 199, 89, 0.1)',
            color: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Insured & Protected</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            Every parcel is tracked with end-to-end checksum verification, fragile protection tags, and digital proof of delivery.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'rgba(175, 82, 222, 0.1)',
            color: 'var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <Package size={24} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Dynamic Rate Engine</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            Transparent pricing calculated by weight, distance, and priority tier with zero hidden surcharges.
          </p>
        </div>
      </div>
    </section>
  );
}
