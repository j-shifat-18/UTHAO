import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrackingView } from './components/TrackingView';
import { RateCalculator } from './components/RateCalculator';
import { BookingModal } from './components/BookingModal';
import { Dashboard } from './components/Dashboard';
import { AgentPortal } from './components/AgentPortal';
import { BranchNetwork } from './components/BranchNetwork';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'tracking' | 'calculator' | 'dashboard' | 'network' | 'agent'
  const [theme, setTheme] = useState('dark');
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [demoRole, setDemoRole] = useState('customer'); // 'customer' | 'agent' | 'admin'

  // Tracking state
  const [currentParcel, setCurrentParcel] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Modals & Spec
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookSpec, setBookSpec] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // User & Toast
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Health check on mount and interval
  useEffect(() => {
    const checkBackend = async () => {
      const res = await api.checkHealth();
      setIsBackendConnected(res.status === 'ok');
    };
    checkBackend();
    const interval = setInterval(checkBackend, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch logged in profile
  useEffect(() => {
    const savedUser = localStorage.getItem('uthao_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
    api.getProfile().then(profile => {
      if (profile) setUser(profile);
    });
  }, []);

  // Handler for tracking search
  const handleTrackParcel = async (trackingNumber) => {
    setActiveTab('tracking');
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const data = await api.trackParcel(trackingNumber);
      setCurrentParcel(data);
    } catch (err) {
      setTrackingError(err.message || 'Parcel not found');
      setCurrentParcel(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleBookWithSpec = (spec) => {
    setBookSpec(spec);
    setIsBookModalOpen(true);
  };

  const handleBookingSuccess = (newParcel) => {
    showToast(`Parcel ${newParcel.tracking_number} successfully dispatched!`, 'success');
    handleTrackParcel(newParcel.tracking_number);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    showToast('Logged out successfully');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isBackendConnected={isBackendConnected}
        demoRole={demoRole}
        setDemoRole={setDemoRole}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'hero' && (
          <Hero
            onTrack={handleTrackParcel}
            onOpenBookModal={() => setIsBookModalOpen(true)}
            onSelectSample={handleTrackParcel}
          />
        )}

        {activeTab === 'tracking' && (
          <TrackingView
            parcel={currentParcel}
            loading={trackingLoading}
            error={trackingError}
            onBack={() => setActiveTab('hero')}
            onRefresh={() => currentParcel && handleTrackParcel(currentParcel.tracking_number)}
          />
        )}

        {activeTab === 'calculator' && (
          <RateCalculator onBookWithSpec={handleBookWithSpec} />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            onTrackParcel={handleTrackParcel}
            onOpenBookModal={() => setIsBookModalOpen(true)}
            user={user}
          />
        )}

        {activeTab === 'agent' && (
          <AgentPortal
            onTrackParcel={handleTrackParcel}
            showToast={showToast}
          />
        )}

        {activeTab === 'network' && (
          <BranchNetwork />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        padding: '32px 24px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '13px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <strong>UTHAO Smart Logistics</strong> &copy; {new Date().getFullYear()} • Engineered with Precision
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('hero')}>Live Tracking</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('calculator')}>Rate Estimator</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('network')}>Branch Hubs</span>
          </div>
        </div>
      </footer>

      {/* Modals & Toast */}
      <BookingModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        initialSpec={bookSpec}
        onBookingSuccess={handleBookingSuccess}
        currentUser={user}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
        showToast={showToast}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
