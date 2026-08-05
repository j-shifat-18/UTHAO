import React from 'react';
import { Package } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <a href="#" className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package color="#E53935" size={32} />
              UTHAO
            </a>
            <p style={{ lineHeight: 1.6, marginBottom: '24px', maxWidth: '300px' }}>
              Transforming logistics in Bangladesh with smart, fast, and reliable delivery solutions for businesses and individuals.
            </p>
            <div style={{ display: 'flex', gap: '16px', fontWeight: 'bold' }}>
              <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>FB</a>
              <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>TW</a>
              <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>IG</a>
              <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>IN</a>
            </div>
          </div>
          
          <div>
            <h4 className="footer-heading">Services</h4>
            <ul className="footer-links">
              <li><a href="#">Express Delivery</a></li>
              <li><a href="#">Same Day Delivery</a></li>
              <li><a href="#">Nationwide Shipping</a></li>
              <li><a href="#">Warehousing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Coverage Area</a></li>
              <li><a href="#">Contact Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="footer-links">
              <li style={{ color: '#9CA3AF' }}>123 Logistics Avenue, Dhaka 1205, Bangladesh</li>
              <li><a href="mailto:support@uthao.com">support@uthao.com</a></li>
              <li><a href="tel:+8801700000000">+880 1700-000000</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} UTHAO Logistics. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
