import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/landing.css';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Tracking from '../components/landing/Tracking';
import Services from '../components/landing/Services';
import Stats from '../components/landing/Stats';
import CostCalculator from '../components/landing/CostCalculator';
import Features from '../components/landing/Features';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Only show splash screen once per session
    const hasSeenSplash = sessionStorage.getItem('uthao_splash_seen');
    if (hasSeenSplash) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('uthao_splash_seen', 'true');
      }, 1500); // 1.5s total to allow for animations
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="landing-page">
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            className="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <img src="/delivery-guy.png" alt="UTHAO Delivery" className="splash-image" />
              <div className="splash-text">UTHAO</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Navbar />
          <Hero />
          <Tracking />
          <Services />
          <Stats />
          <CostCalculator />
          <Features />
          <Footer />
        </motion.div>
      )}
    </div>
  );
}
