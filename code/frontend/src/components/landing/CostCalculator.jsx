import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function CostCalculator() {
  const [cost, setCost] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    // Dummy logic
    setCost('150.00');
  };

  return (
    <section className="section calculator-section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Shipping Cost Calculator</h2>
          <p className="section-subtitle">
            Estimate your delivery charges instantly before you ship with us.
          </p>
        </div>

        <motion.div 
          className="calc-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <form onSubmit={handleCalculate}>
            <div className="calc-grid">
              <div className="calc-group">
                <label>Pickup Location</label>
                <select className="calc-input">
                  <option>Dhaka</option>
                  <option>Chittagong</option>
                  <option>Sylhet</option>
                  <option>Rajshahi</option>
                </select>
              </div>
              <div className="calc-group">
                <label>Destination</label>
                <select className="calc-input">
                  <option>Chittagong</option>
                  <option>Dhaka</option>
                  <option>Sylhet</option>
                  <option>Rajshahi</option>
                </select>
              </div>
              <div className="calc-group">
                <label>Weight (kg)</label>
                <input type="number" className="calc-input" placeholder="e.g. 2" min="0.1" step="0.1" />
              </div>
              <div className="calc-group">
                <label>Parcel Type</label>
                <select className="calc-input">
                  <option>Standard</option>
                  <option>Document</option>
                  <option>Fragile</option>
                  <option>Liquid</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.125rem' }}>
              Calculate Cost
            </button>
          </form>

          {cost && (
            <motion.div 
              className="calc-result"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div>
                <h4 style={{ color: '#111827', marginBottom: '4px' }}>Estimated Delivery Cost</h4>
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Standard Delivery (1-2 days)</p>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#E53935' }}>
                ৳{cost}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
