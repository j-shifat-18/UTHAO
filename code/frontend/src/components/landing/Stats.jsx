import React from 'react';
import { motion } from 'framer-motion';

const statsData = [
  { value: '10M+', label: 'Deliveries' },
  { value: '64', label: 'Districts' },
  { value: '500+', label: 'Employees' },
  { value: '98%', label: 'Success Rate' },
];

export default function Stats() {
  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {statsData.map((stat, index) => (
            <motion.div 
              key={index}
              className="stat-item"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h4>{stat.value}</h4>
              <p>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
