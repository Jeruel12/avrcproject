import React, { useState, useEffect } from 'react';
import '../styles/HomePage.css';

import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import AboutPage from './AboutPage';
import ServicesPage from './ServicesPage';
import ContactPage from './ContactPage';

function HomePage() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
  };

  const handleLoginSuccess = () => {
    const role = localStorage.getItem('user_role');
    setUserRole(role);
    setIsLoggedIn(true);
  };

  return (
    <>
      {isLoggedIn ? (
        userRole === 'admin' ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <UserDashboard onLogout={handleLogout} />
        )
      ) : currentPage === 'about' ? (
        <AboutPage onNavigate={setCurrentPage} />
      ) : currentPage === 'services' ? (
        <ServicesPage onNavigate={setCurrentPage} />
      ) : currentPage === 'contact' ? (
        <ContactPage onNavigate={setCurrentPage} />
      ) : (
        <div className="homepage-bg">
          <nav className="homepage-nav">
            <div className="homepage-logo">
              <img src="/logo.png" alt="Audio Visual Resource Center" style={{height: '50px', width: 'auto', objectFit: 'contain'}} />
            </div>

            <ul className="homepage-menu">
              <li className={currentPage === 'home' ? 'active' : ''} onClick={() => setCurrentPage('home')}>Home</li>
              <li className={currentPage === 'about' ? 'active' : ''} onClick={() => setCurrentPage('about')}>About</li>
              <li className={currentPage === 'services' ? 'active' : ''} onClick={() => setCurrentPage('services')}>Services</li>
              <li className={currentPage === 'contact' ? 'active' : ''} onClick={() => setCurrentPage('contact')}>Contact</li>
            </ul>

            <div className="homepage-auth">
              <span className="login" onClick={() => setShowLogin(true)}>
                Login
              </span>
              <span className="register" onClick={() => setShowRegister(true)}>
                Register
              </span>
            </div>
          </nav>

          <section className="homepage-hero">
            <h1>AUDIO VISUAL RESOURCE CENTER</h1>
            <p>
              Where Ideas Come to Life Through Sound and Vision 
            </p>
            <button className="reserve-btn">Reserve Now!</button>
          </section>

          <div className="bubble bubble1"></div>
          <div className="bubble bubble2"></div>

          {showRegister && (
            <RegistrationForm onClose={() => setShowRegister(false)} onOpenLogin={() => { setShowRegister(false); setShowLogin(true); }} />
          )}

          {showLogin && (
            <LoginForm onClose={() => setShowLogin(false)} onRegister={() => { setShowLogin(false); setShowRegister(true); }} onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      )}
    </>
  );
}

export default HomePage;
