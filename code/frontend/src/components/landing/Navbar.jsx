import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package color="#E53935" size={28} />
          UTHAO
        </Link>
        <div className="nav-links">
          <a href="#services" className="nav-link">Services</a>
          <a href="#coverage" className="nav-link">Coverage</a>
          <a href="#tracking" className="nav-link">Track Parcel</a>
          <a href="#about" className="nav-link">About</a>
          <Link to="/login" className="btn btn-outline" style={{ padding: '8px 20px', borderRadius: '8px' }}>
            Login
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px' }}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
