import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Navigation, Lock, Headphones } from 'lucide-react';

const featuresData = [
  {
    icon: <Truck size={28} />,
    title: 'Fast Delivery',
    description: 'Lightning fast logistics network ensuring quick drop-offs.'
  },
  {
    icon: <Navigation size={28} />,
    title: 'Live Tracking',
    description: 'Monitor your package in real-time on our interactive map.'
  },
  {
    icon: <Lock size={28} />,
    title: 'Secure Handling',
    description: 'Utmost care taken for every parcel, large or small.'
  },
  {
    icon: <Headphones size={28} />,
    title: '24/7 Support',
    description: 'Our dedicated customer service team is always here for you.'
  }
];

export default function Features() {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="text-center" style={{ marginBottom: '64px' }}>
          <h2 className="section-title">Why Choose Us</h2>
          <p className="section-subtitle">
            We go above and beyond to provide the best delivery experience.
          </p>
        </div>

        <div className="features-grid">
          {featuresData.map((feature, index) => (
            <motion.div 
              key={index}
              className="feature-item"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#111827' }}>{feature.title}</h3>
              <p style={{ color: '#6B7280', lineHeight: 1.6 }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
