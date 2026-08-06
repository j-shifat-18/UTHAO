import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../api/client';

const PRIORITY_MULTIPLIERS = {
  standard: 1.0,
  express: 1.5,
  overnight: 2.0,
};

export default function CostCalculator() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [weight, setWeight] = useState('1.5');
  const [priority, setPriority] = useState('standard');
  const [cost, setCost] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/parcels/categories');
        const cats = res.data?.data || [];
        setCategories(cats);
        if (cats.length > 0) setCategoryId(String(cats[0].id));
      } catch {
        // Fallback default category
        setCategories([{ id: 1, name: 'Standard Package', base_price: '80.00', price_per_kg: '25.00' }]);
        setCategoryId('1');
      }
    }
    loadCategories();
  }, []);

  const handleCalculate = (e) => {
    e.preventDefault();
    const cat = categories.find((c) => String(c.id) === String(categoryId)) || categories[0];
    const base = cat ? parseFloat(cat.base_price || 0) : 80;
    const perKg = cat ? parseFloat(cat.price_per_kg || 0) : 25;
    const w = parseFloat(weight) || 1.0;
    const mult = PRIORITY_MULTIPLIERS[priority] || 1.0;

    const total = ((base + perKg * w) * mult).toFixed(2);
    setCost(total);
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
                <label>Parcel Category</label>
                <select className="calc-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="calc-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  className="calc-input"
                  placeholder="e.g. 1.5"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div className="calc-group">
                <label>Priority Speed</label>
                <select className="calc-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="standard">Standard (1.0x)</option>
                  <option value="express">Express (1.5x)</option>
                  <option value="overnight">Overnight (2.0x)</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.125rem', marginTop: '16px' }}>
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
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Calculated based on weight & delivery priority</p>
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
