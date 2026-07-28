import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Building2, CheckCircle, Navigation } from 'lucide-react';
import { api } from '../services/api';

export function BranchNetwork() {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    api.getBranches().then(data => setBranches(data));
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto 60px', padding: '0 24px' }} className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontSize: '13px', color: 'var(--accent-blue)', background: 'var(--accent-blue-light)', padding: '4px 14px', borderRadius: '999px', fontWeight: '700' }}>
          NATIONAL LOGISTICS BACKBONE
        </span>
        <h1 style={{ fontSize: '38px', fontWeight: '800', marginTop: '10px' }}>
          UTHAO Hub Network
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '4px' }}>
          Strategically located sorting facilities across all major divisions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {branches.map((branch) => (
          <div key={branch.id} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'var(--accent-blue-light)',
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={20} />
                </div>
                <span style={{ fontSize: '12px', background: 'rgba(52, 199, 89, 0.15)', color: 'var(--accent-green)', padding: '4px 10px', borderRadius: '999px', fontWeight: '700' }}>
                  ● Operational
                </span>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>{branch.name}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} style={{ color: 'var(--accent-blue)' }} /> {branch.address}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> {branch.phone}
              </div>
              <span style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>
                {branch.city} Division
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
