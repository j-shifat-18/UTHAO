import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Zap, Shield, Check, Info } from 'lucide-react';
import { api } from '../services/api';

export function RateCalculator({ onBookWithSpec }) {
  const [category, setCategory] = useState('small_package');
  const [weight, setWeight] = useState(1.5);
  const [priority, setPriority] = useState('standard');
  const [isFragile, setIsFragile] = useState(false);
  const [origin, setOrigin] = useState('Dhaka');
  const [destination, setDestination] = useState('Chittagong');
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    // Instant real-time calculation call
    api.estimatePrice({
      category,
      weight_kg: weight,
      priority,
      is_fragile: isFragile
    }).then(res => {
      setEstimatedCost(res.estimated_cost);
    }).catch(() => {
      // client-side calculation fallback
      const baseMap = { document: 50, small_package: 80, medium_package: 120, large_package: 200, fragile: 150, perishable: 180, electronics: 160 };
      const perKgMap = { document: 10, small_package: 25, medium_package: 20, large_package: 15, fragile: 35, perishable: 30, electronics: 30 };
      let mult = priority === 'express' ? 1.5 : (priority === 'overnight' ? 2.2 : 1.0);
      let cost = (baseMap[category] + weight * perKgMap[category]) * mult + (isFragile ? 40 : 0);
      setEstimatedCost(Math.round(cost));
    });
  }, [category, weight, priority, isFragile]);

  const categories = [
    { id: 'document', name: 'Document', desc: 'Letters, Papers & Contracts' },
    { id: 'small_package', name: 'Small Parcel', desc: 'Up to 2kg (Gadgets, Clothes)' },
    { id: 'medium_package', name: 'Medium Box', desc: '2kg - 10kg (Appliances)' },
    { id: 'large_package', name: 'Large Cargo', desc: '10kg - 30kg (Heavy Items)' },
    { id: 'fragile', name: 'Fragile Glassware', desc: 'Special cushion handling' },
    { id: 'electronics', name: 'High-Tech Electronics', desc: 'Shielded box packing' }
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '40px auto 60px', padding: '0 24px' }} className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>
          Instant Rate Estimator
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '17px', marginTop: '8px' }}>
          Transparent pricing with zero hidden handling fees.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
        {/* Left Controls */}
        <div>
          {/* Category Picker */}
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
            1. Select Parcel Category
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: `2px solid ${category === cat.id ? 'var(--accent-blue)' : 'var(--glass-border)'}`,
                  background: category === cat.id ? 'var(--accent-blue-light)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition-apple)'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '15px', color: category === cat.id ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {cat.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Weight Slider */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700' }}>2. Weight (Kilograms)</label>
              <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                {weight} KG
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="25"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--accent-blue)',
                cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              <span>0.5 kg</span>
              <span>10 kg</span>
              <span>25 kg</span>
            </div>
          </div>

          {/* Speed & Priority Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
              3. Delivery Speed Tier
            </label>
            <div className="segmented-control">
              <button
                onClick={() => setPriority('standard')}
                className={`segmented-option ${priority === 'standard' ? 'active' : ''}`}
              >
                Standard (2-3 Days)
              </button>
              <button
                onClick={() => setPriority('express')}
                className={`segmented-option ${priority === 'express' ? 'active' : ''}`}
              >
                ⚡ Express (Next Day)
              </button>
              <button
                onClick={() => setPriority('overnight')}
                className={`segmented-option ${priority === 'overnight' ? 'active' : ''}`}
              >
                🚀 Overnight Priority
              </button>
            </div>
          </div>

          {/* Fragile Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={isFragile}
              onChange={(e) => setIsFragile(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              Add Fragile Cushioning & Insurance Cover (+৳ 40 BDT)
            </span>
          </label>
        </div>

        {/* Right Summary Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: '700', letterSpacing: '1px' }}>
              Estimated Total
            </div>
            
            <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--accent-blue)', margin: '12px 0 20px', letterSpacing: '-1px' }}>
              ৳ {estimatedCost} <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>BDT</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                <strong style={{ textTransform: 'capitalize' }}>{category.replace('_', ' ')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Package Weight:</span>
                <strong>{weight} kg</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Speed Priority:</span>
                <strong style={{ textTransform: 'capitalize' }}>{priority}</strong>
              </div>

              {isFragile && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-orange)' }}>
                  <span>Fragile Shield:</span>
                  <strong>+ ৳40 BDT</strong>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <button
              onClick={() => onBookWithSpec({ category, weight_kg: weight, priority, is_fragile: isFragile, delivery_cost: estimatedCost })}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              Book Parcel Now <ArrowRight size={16} />
            </button>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '10px' }}>
              Includes 15% Govt VAT & Fuel Surcharge
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
