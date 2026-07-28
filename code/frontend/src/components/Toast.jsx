import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      zIndex: 1000,
      background: isSuccess ? 'rgba(52, 199, 89, 0.95)' : 'rgba(255, 59, 48, 0.95)',
      color: '#ffffff',
      backdropFilter: 'blur(16px)',
      padding: '14px 22px',
      borderRadius: '999px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
      fontWeight: '600',
      animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {isSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {toast.message}
    </div>
  );
}
