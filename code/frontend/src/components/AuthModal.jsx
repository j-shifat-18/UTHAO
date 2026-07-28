import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export function AuthModal({ isOpen, onClose, onAuthSuccess, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const res = await api.login(formData.email, formData.password);
        showToast('Login successful!', 'success');
        onAuthSuccess(res.data?.user || { email: formData.email });
        onClose();
      } else {
        const res = await api.register(formData);
        showToast('Account registered successfully!', 'success');
        onAuthSuccess(res.data?.user || { email: formData.email, first_name: formData.first_name });
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 300,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--bg-secondary)',
        padding: '36px',
        position: 'relative'
      }}>
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

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--accent-blue-light)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <ShieldCheck size={26} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
            {mode === 'login' ? 'Sign In to UTHAO' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {mode === 'login' ? 'Access your dashboard & active shipments' : 'Register to manage courier orders'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 59, 48, 0.1)', color: 'var(--accent-red)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '18px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  className="apple-input"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  className="apple-input"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <input
                type="text"
                name="phone"
                placeholder="Phone (+88017...)"
                className="apple-input"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email address"
            className="apple-input"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="apple-input"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', marginTop: '6px' }}>
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: '700', cursor: 'pointer' }}>
                Register Now
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: '700', cursor: 'pointer' }}>
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
