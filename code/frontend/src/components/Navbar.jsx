import React from 'react';
import { Package, Search, Calculator, MapPin, User, Sun, Moon, Shield, Truck, LogOut, CheckCircle2 } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, theme, toggleTheme, user, onOpenAuth, onLogout, isBackendConnected, demoRole, setDemoRole }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
      transition: 'var(--transition-apple)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('hero')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, #58a6ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
          }}>
            <Package size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              UTHAO
              <span style={{ fontSize: '10px', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                PRO
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Smart Logistics
            </div>
          </div>
        </div>

        {/* Center Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '999px' }}>
          <button
            onClick={() => setActiveTab('hero')}
            className={`segmented-option ${activeTab === 'hero' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Search size={15} /> Track
          </button>
          
          <button
            onClick={() => setActiveTab('calculator')}
            className={`segmented-option ${activeTab === 'calculator' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Calculator size={15} /> Calculator
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`segmented-option ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Package size={15} /> Shipments
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`segmented-option ${activeTab === 'network' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MapPin size={15} /> Hubs
          </button>

          {demoRole === 'agent' && (
            <button
              onClick={() => setActiveTab('agent')}
              className={`segmented-option ${activeTab === 'agent' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)' }}
            >
              <Truck size={15} /> Agent Portal
            </button>
          )}
        </nav>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Backend Connection Indicator */}
          <div 
            title={isBackendConnected ? "Connected to Backend API (http://localhost:5000/api/v1)" : "Backend offline - Mock active"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: isBackendConnected ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 149, 0, 0.12)',
              fontSize: '12px',
              fontWeight: '600',
              color: isBackendConnected ? 'var(--accent-green)' : 'var(--accent-orange)'
            }}
          >
            <div className="pulse-dot" style={{ background: isBackendConnected ? 'var(--accent-green)' : 'var(--accent-orange)', boxShadow: isBackendConnected ? '0 0 8px var(--accent-green)' : '0 0 8px var(--accent-orange)' }} />
            {isBackendConnected ? 'API Live' : 'Demo Mode'}
          </div>

          {/* Role Switcher Demo Dropdown */}
          <select
            value={demoRole}
            onChange={(e) => setDemoRole(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="customer">👤 Customer View</option>
            <option value="agent">🚚 Delivery Agent View</option>
            <option value="admin">🛡️ System Admin View</option>
          </select>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-apple)'
            }}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Profile / Auth Button */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'var(--bg-tertiary)',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <User size={14} />
                {user.first_name || user.email.split('@')[0]}
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-red)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary" style={{ padding: '8px 18px', fontSize: '14px' }}>
              <User size={15} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
