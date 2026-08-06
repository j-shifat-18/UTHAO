import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Globe, Map, PackageSearch, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const servicesData = [
  {
    icon: <Zap size={32} />,
    title: 'Express Delivery',
    description: 'Get your parcels delivered within 24 hours across major cities with our premium express service.'
  },
  {
    icon: <Clock size={32} />,
    title: 'Same Day Delivery',
    description: 'Urgent delivery? We ensure your package reaches its destination on the very same day.'
  },
  {
    icon: <Map size={32} />,
    title: 'Nationwide Delivery',
    description: 'We cover all 64 districts in Bangladesh, ensuring no destination is out of reach.'
  },
  {
    icon: <Globe size={32} />,
    title: 'International Shipping',
    description: 'Send parcels globally with our reliable international logistics partners.'
  },
  {
    icon: <PackageSearch size={32} />,
    title: 'Warehousing',
    description: 'Secure storage facilities with real-time inventory management for your business.'
  },
  {
    icon: <CreditCard size={32} />,
    title: 'Cash on Delivery',
    description: 'Collect payments securely from your customers upon successful delivery.'
  }
];

export default function Services() {
  return (
    <section id="services" className="section bg-white">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Our Premium Services</h2>
          <p className="section-subtitle">
            We provide comprehensive logistics solutions tailored to meet your personal and business needs with unmatched reliability.
          </p>
        </div>

        <div className="services-grid">
          {servicesData.map((service, index) => (
            <motion.div 
              key={index}
              className="service-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="service-icon-wrap">
                {service.icon}
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <Link to="/register" className="service-link">
                Learn More <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
