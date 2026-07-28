import React, { useState } from 'react';
import { X, CheckCircle2, Package, MapPin, User, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { api } from '../services/api';

export function BookingModal({ isOpen, onClose, initialSpec, onBookingSuccess, currentUser }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    sender_name: currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : 'John Doe',
    sender_phone: currentUser?.phone || '+8801712345678',
    receiver_name: '',
    receiver_phone: '',
    receiver_email: '',
    delivery_address_line1: '',
    delivery_city: 'Dhaka',
    origin_branch: 'Dhaka Central Hub',
    category: initialSpec?.category || 'small_package',
    weight_kg: initialSpec?.weight_kg || 1.5,
    priority: initialSpec?.priority || 'standard',
    is_fragile: initialSpec?.is_fragile || false,
    payment_method: 'prepaid'
  });

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleNext = () => {
    if (step === 1 && (!formData.sender_name || !formData.sender_phone)) {
      setError('Please fill in sender information');
      return;
    }
    if (step === 2 && (!formData.receiver_name || !formData.receiver_phone || !formData.delivery_address_line1)) {
      setError('Please provide recipient name, phone, and delivery address');
      return;
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const created = await api.bookParcel(formData);
      setLoading(false);
      onBookingSuccess(created);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to complete booking');
    }
  };

  const cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Comilla'];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 200,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-secondary)',
        padding: '36px',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'var(--bg-tertiary)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          <X size={18} />
        </button>

        {/* Wizard Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-blue)', fontWeight: '700', letterSpacing: '1px' }}>
            STEP {step} OF 3
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px' }}>
            {step === 1 && 'Sender & Origin Details'}
            {step === 2 && 'Recipient & Destination'}
            {step === 3 && 'Review & Dispatch'}
          </h2>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 59, 48, 0.1)', color: 'var(--accent-red)', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Step 1 Form */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Sender Full Name</label>
              <input
                type="text"
                className="apple-input"
                value={formData.sender_name}
                onChange={(e) => handleChange('sender_name', e.target.value)}
                placeholder="Sender Name"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Sender Contact Phone</label>
              <input
                type="text"
                className="apple-input"
                value={formData.sender_phone}
                onChange={(e) => handleChange('sender_phone', e.target.value)}
                placeholder="+8801712345678"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Pickup Origin Branch Hub</label>
              <select
                className="apple-input"
                value={formData.origin_branch}
                onChange={(e) => handleChange('origin_branch', e.target.value)}
              >
                <option value="Dhaka Central Hub">Dhaka Central Hub (Tejgaon)</option>
                <option value="Banani Branch">Banani Express Branch</option>
                <option value="Chittagong Main Hub">Chittagong Agrabad Hub</option>
                <option value="Sylhet Zonal Branch">Sylhet Zindabazar Hub</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2 Form */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Recipient Full Name</label>
              <input
                type="text"
                className="apple-input"
                value={formData.receiver_name}
                onChange={(e) => handleChange('receiver_name', e.target.value)}
                placeholder="Recipient Full Name"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Recipient Phone</label>
                <input
                  type="text"
                  className="apple-input"
                  value={formData.receiver_phone}
                  onChange={(e) => handleChange('receiver_phone', e.target.value)}
                  placeholder="+8801800000000"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Recipient Email (Optional)</label>
                <input
                  type="email"
                  className="apple-input"
                  value={formData.receiver_email}
                  onChange={(e) => handleChange('receiver_email', e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Delivery Street Address</label>
              <input
                type="text"
                className="apple-input"
                value={formData.delivery_address_line1}
                onChange={(e) => handleChange('delivery_address_line1', e.target.value)}
                placeholder="House #, Road #, Area"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Destination City</label>
              <select
                className="apple-input"
                value={formData.delivery_city}
                onChange={(e) => handleChange('delivery_city', e.target.value)}
              >
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 3 Review */}
        {step === 3 && (
          <div>
            <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '12px', color: 'var(--accent-blue)' }}>
                Shipment Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><strong>Sender:</strong> {formData.sender_name} ({formData.sender_phone})</div>
                <div><strong>Recipient:</strong> {formData.receiver_name} ({formData.receiver_phone})</div>
                <div><strong>Delivery Address:</strong> {formData.delivery_address_line1}, {formData.delivery_city}</div>
                <div><strong>Package Weight:</strong> {formData.weight_kg} kg</div>
                <div><strong>Category:</strong> {formData.category}</div>
                <div><strong>Priority:</strong> {formData.priority}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Payment Method</label>
              <div className="segmented-control">
                <button
                  type="button"
                  onClick={() => handleChange('payment_method', 'prepaid')}
                  className={`segmented-option ${formData.payment_method === 'prepaid' ? 'active' : ''}`}
                >
                  💳 Digital Prepaid (bKash / Card)
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('payment_method', 'cod')}
                  className={`segmented-option ${formData.payment_method === 'cod' ? 'active' : ''}`}
                >
                  💵 Cash on Delivery (COD)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          {step > 1 ? (
            <button onClick={() => setStep(prev => prev - 1)} className="btn-secondary">
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button onClick={handleNext} className="btn-primary">
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary" disabled={loading} style={{ padding: '12px 32px' }}>
              {loading ? 'Generating Passport...' : 'Confirm & Dispatch Parcel 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
