import React, { useState } from 'react';
import '../styles/ServicesPage.css';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';

function ServicesPage({ onNavigate }) {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="services-bg">
      <nav className="services-nav">
        <div className="services-logo">
          <img src="/logo.png" alt="Audio Visual Resource Center" style={{height: '50px', width: 'auto', objectFit: 'contain'}} />
        </div>

        <ul className="services-menu">
          <li className={onNavigate ? 'clickable' : ''} onClick={() => onNavigate && onNavigate('home')}>Home</li>
          <li className={onNavigate ? 'clickable' : ''} onClick={() => onNavigate && onNavigate('about')}>About</li>
          <li className="active">Services</li>
          <li className={onNavigate ? 'clickable' : ''} onClick={() => onNavigate && onNavigate('contact')}>Contact</li>
        </ul>

        <div className="services-auth">
          <span className="login" onClick={() => setShowLogin(true)}>
            Login
          </span>
          <span className="register" onClick={() => setShowRegister(true)}>
            Register
          </span>
        </div>
      </nav>

      <section className="services-content">
        <h1>Our Services</h1>
        <p className="services-subtitle">
          Equipment rental and room availability for meetings, events, and presentations
        </p>

        

        
      </section>

      <div className="bubble bubble1"></div>
      <div className="bubble bubble2"></div>

      {showRegister && (
        <RegistrationForm onClose={() => setShowRegister(false)} onOpenLogin={() => { setShowRegister(false); setShowLogin(true); }} />
      )}

      {showLogin && (
        <LoginForm onClose={() => setShowLogin(false)} onRegister={() => { setShowLogin(false); setShowRegister(true); }} />
      )}
    </div>
  );
}

export default ServicesPage;
